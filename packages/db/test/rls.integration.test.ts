/**
 * Cross-tenant isolation tests for the Row-Level Security policies (issue #31).
 *
 * Runs against a real Postgres in a throwaway container, so it only executes
 * when RUN_RLS_IT=1 (set in the dedicated CI job that has Docker). A plain
 * `pnpm test` skips it.
 *
 * The DDL below mirrors the declarative policies in `src/schema/rls.ts` for a
 * representative slice of the schema: a direct workspace_id table (workflows),
 * a transitively-scoped table (messages → chats), and a nullable/global table
 * (mcp_servers). Keep the policy predicates here in sync with the factories.
 */
import type { Sql } from "postgres";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const RUN = process.env.RUN_RLS_IT === "1";
const suite = RUN ? describe : describe.skip;

const WS_A = "ws-a";
const WS_B = "ws-b";

const SETUP_SQL = `
  create table workspaces (id text primary key);
  create table workflows (id text primary key, workspace_id text not null);
  create table chats (id text primary key, workspace_id text not null);
  create table messages (id text primary key, chat_id text not null);
  create table mcp_servers (id text primary key, workspace_id text);

  -- workflows: direct workspace_id (tenantPolicy)
  alter table workflows enable row level security;
  create policy workflows_tenant_isolation on workflows
    using (workspace_id = current_setting('app.current_workspace', true))
    with check (workspace_id = current_setting('app.current_workspace', true));

  -- chats: direct workspace_id (tenantPolicy)
  alter table chats enable row level security;
  create policy chats_tenant_isolation on chats
    using (workspace_id = current_setting('app.current_workspace', true))
    with check (workspace_id = current_setting('app.current_workspace', true));

  -- messages: scoped through parent chat (transitivePolicy)
  alter table messages enable row level security;
  create policy messages_tenant_isolation on messages
    using (exists (select 1 from chats where chats.id = messages.chat_id
      and chats.workspace_id = current_setting('app.current_workspace', true)))
    with check (exists (select 1 from chats where chats.id = messages.chat_id
      and chats.workspace_id = current_setting('app.current_workspace', true)));

  -- mcp_servers: nullable workspace_id, NULL = global (tenantOrGlobalPolicy)
  alter table mcp_servers enable row level security;
  create policy mcp_servers_tenant_isolation on mcp_servers
    using (workspace_id = current_setting('app.current_workspace', true) or workspace_id is null)
    with check (workspace_id = current_setting('app.current_workspace', true));
`;

suite("RLS tenant isolation", () => {
  // Started-container handle; typed loosely since the module is imported
  // dynamically (only when the suite actually runs).
  let container: { getConnectionUri(): string; stop(): Promise<unknown> } | null = null;
  let admin: Sql;
  let app: Sql;

  beforeAll(async () => {
    const { PostgreSqlContainer } = await import("@testcontainers/postgresql");
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
    const adminUrl: string = container.getConnectionUri();

    admin = postgres(adminUrl, { max: 1, onnotice: () => {} });

    // Schema + policies, then a non-privileged role to enforce them against.
    await admin.unsafe(SETUP_SQL);
    await admin.unsafe(`
      create role app_user login password 'apptest' nobypassrls nosuperuser;
      grant usage on schema public to app_user;
      grant select, insert, update, delete on all tables in schema public to app_user;
    `);

    // Seed two tenants. Done as the (RLS-bypassing) owner.
    await admin`insert into workspaces (id) values (${WS_A}), (${WS_B})`;
    await admin`insert into workflows (id, workspace_id) values ('wf-a', ${WS_A}), ('wf-b', ${WS_B})`;
    await admin`insert into chats (id, workspace_id) values ('chat-a', ${WS_A}), ('chat-b', ${WS_B})`;
    await admin`insert into messages (id, chat_id) values ('msg-a', 'chat-a'), ('msg-b', 'chat-b')`;
    await admin`insert into mcp_servers (id, workspace_id) values ('srv-global', null), ('srv-a', ${WS_A}), ('srv-b', ${WS_B})`;

    const appUrl = adminUrl.replace(/\/\/[^@]+@/, "//app_user:apptest@");
    app = postgres(appUrl, { max: 1, onnotice: () => {} });
  });

  afterAll(async () => {
    await app?.end({ timeout: 5 });
    await admin?.end({ timeout: 5 });
    await container?.stop();
  });

  /** Run `fn` as app_user inside a tx with the tenant GUC set (mirrors withTenantContext). */
  function asWorkspace<T>(workspaceId: string, fn: (sql: Sql) => Promise<T>): Promise<T> {
    return app.begin(async (sql) => {
      await sql`select set_config('app.current_workspace', ${workspaceId}, true)`;
      return fn(sql as unknown as Sql);
    }) as Promise<T>;
  }

  describe("SELECT", () => {
    it("returns only the active tenant's rows", async () => {
      const a = await asWorkspace(WS_A, (sql) => sql`select id from workflows`);
      expect(a.map((r) => r.id)).toEqual(["wf-a"]);

      const b = await asWorkspace(WS_B, (sql) => sql`select id from workflows`);
      expect(b.map((r) => r.id)).toEqual(["wf-b"]);
    });

    it("cannot see another tenant's row even by id", async () => {
      const rows = await asWorkspace(
        WS_A,
        (sql) => sql`select id from workflows where id = 'wf-b'`,
      );
      expect(rows).toHaveLength(0);
    });

    it("fails closed when no workspace GUC is set", async () => {
      const rows = await app`select id from workflows`;
      expect(rows).toHaveLength(0);
    });
  });

  describe("INSERT (WITH CHECK)", () => {
    it("rejects writing a row into another tenant", async () => {
      await expect(
        asWorkspace(
          WS_A,
          (sql) => sql`insert into workflows (id, workspace_id) values ('wf-x', ${WS_B})`,
        ),
      ).rejects.toThrow();
    });
  });

  describe("UPDATE / DELETE", () => {
    it("cannot update another tenant's row", async () => {
      const updated = await asWorkspace(
        WS_A,
        (sql) => sql`update workflows set workspace_id = ${WS_A} where id = 'wf-b' returning id`,
      );
      expect(updated).toHaveLength(0);
    });

    it("cannot delete another tenant's row", async () => {
      const deleted = await asWorkspace(
        WS_A,
        (sql) => sql`delete from workflows where id = 'wf-b' returning id`,
      );
      expect(deleted).toHaveLength(0);
      // Confirm it still exists (as owner).
      const still = await admin`select id from workflows where id = 'wf-b'`;
      expect(still).toHaveLength(1);
    });
  });

  describe("global rows (nullable workspace_id)", () => {
    it("global rows are readable by every tenant, foreign tenant rows are not", async () => {
      const rows = await asWorkspace(WS_A, (sql) => sql`select id from mcp_servers order by id`);
      expect(rows.map((r) => r.id)).toEqual(["srv-a", "srv-global"]);
    });

    it("a tenant cannot create a global row", async () => {
      await expect(
        asWorkspace(
          WS_A,
          (sql) => sql`insert into mcp_servers (id, workspace_id) values ('srv-x', null)`,
        ),
      ).rejects.toThrow();
    });
  });

  describe("transitively-scoped table (messages → chats)", () => {
    it("sees only messages whose parent chat is in the active tenant", async () => {
      const a = await asWorkspace(WS_A, (sql) => sql`select id from messages`);
      expect(a.map((r) => r.id)).toEqual(["msg-a"]);

      const b = await asWorkspace(WS_B, (sql) => sql`select id from messages`);
      expect(b.map((r) => r.id)).toEqual(["msg-b"]);
    });
  });

  describe("transaction rollback", () => {
    it("rolls back writes when the callback throws (withTenantContext semantics)", async () => {
      await expect(
        app.begin(async (sql) => {
          await sql`select set_config('app.current_workspace', ${WS_A}, true)`;
          await sql`insert into workflows (id, workspace_id) values ('wf-rollback', ${WS_A})`;
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");

      const rows = await admin`select id from workflows where id = 'wf-rollback'`;
      expect(rows).toHaveLength(0);
    });
  });
});
