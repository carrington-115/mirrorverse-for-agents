import type { InngestFunction, GetStepTools } from "inngest";
import {
  and,
  count,
  desc,
  eq,
  gt,
  lt,
  schema,
  sql,
  type Database,
} from "@mirrorverse/db";

import { inngest } from "../client";
import {
  sendWeeklyDigestEmail,
  sendReengagementEmail,
} from "../../notifications/email";

type StepTools = GetStepTools<typeof inngest>;

const { workflowRuns, workspaces, userProfiles } = schema;

export function makeEmailCronFunctions(
  db: Database,
): readonly InngestFunction.Any[] {
  return [makeWeeklyDigestFunction(db), makeReengagementFunction(db)];
}

// ---------------------------------------------------------------------------
// Weekly digest — Monday 9 am UTC
// ---------------------------------------------------------------------------

function makeWeeklyDigestFunction(db: Database): InngestFunction.Any {
  return inngest.createFunction(
    {
      id: "email.weekly-digest",
      name: "Email: Weekly Workflow Digest",
      triggers: [{ cron: "0 9 * * 1" }],
      retries: 1,
    },
    async ({ step }: { step: StepTools }) => {
      await step.run("send-digests", async () => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get all active workspaces with runs in the last 7 days
        const activeWorkspaces = await db
          .selectDistinct({ workspaceId: workflowRuns.workspaceId })
          .from(workflowRuns)
          .where(gt(workflowRuns.startedAt, weekAgo));

        for (const { workspaceId } of activeWorkspaces) {
          const owner = await getOwner(db, workspaceId);
          if (!owner || owner.emailOptOut) continue;

          const [{ value: totalRuns }] = await db
            .select({ value: count() })
            .from(workflowRuns)
            .where(
              and(
                eq(workflowRuns.workspaceId, workspaceId),
                gt(workflowRuns.startedAt, weekAgo),
              ),
            );

          const [{ value: succeededRuns }] = await db
            .select({ value: count() })
            .from(workflowRuns)
            .where(
              and(
                eq(workflowRuns.workspaceId, workspaceId),
                gt(workflowRuns.startedAt, weekAgo),
                eq(workflowRuns.status, "succeeded"),
              ),
            );

          // Top 3 most-run workflows this week
          const topRows = await db
            .select({
              workflowId: workflowRuns.workflowId,
              runCount: count(),
            })
            .from(workflowRuns)
            .where(
              and(
                eq(workflowRuns.workspaceId, workspaceId),
                gt(workflowRuns.startedAt, weekAgo),
              ),
            )
            .groupBy(workflowRuns.workflowId)
            .orderBy(desc(sql`count(*)`))
            .limit(3);

          const topWorkflowNames: string[] = [];
          for (const row of topRows) {
            const [wf] = await db
              .select({ name: schema.workflows.name })
              .from(schema.workflows)
              .where(eq(schema.workflows.id, row.workflowId))
              .limit(1);
            if (wf) topWorkflowNames.push(wf.name);
          }

          await sendWeeklyDigestEmail(owner.email, owner.id, {
            totalRuns: totalRuns ?? 0,
            successRate: totalRuns ? (succeededRuns ?? 0) / totalRuns : 0,
            topWorkflows: topWorkflowNames,
          }).catch((err) =>
            console.error("[email-crons] digest failed for", workspaceId, err),
          );
        }
      });
    },
  );
}

// ---------------------------------------------------------------------------
// Re-engagement — daily 10 am UTC
// ---------------------------------------------------------------------------

function makeReengagementFunction(db: Database): InngestFunction.Any {
  return inngest.createFunction(
    {
      id: "email.reengagement",
      name: "Email: Re-engagement",
      triggers: [{ cron: "0 10 * * *" }],
      retries: 1,
    },
    async ({ step }: { step: StepTools }) => {
      await step.run("send-reengagement", async () => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );
        // Only send to workspaces whose last run was 7–35 days ago (avoid
        // emailing workspaces that are truly churned or very recent)
        const upperBound = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

        // 30-day inactive workspaces (last run 30–35 days ago)
        const thirtyDayInactive = await db
          .selectDistinct({ workspaceId: workflowRuns.workspaceId })
          .from(workflowRuns)
          .where(
            and(
              gt(
                workflowRuns.startedAt,
                new Date(thirtyDaysAgo.getTime() - 5 * 24 * 60 * 60 * 1000),
              ),
              lt(workflowRuns.startedAt, thirtyDaysAgo),
            ),
          );

        for (const { workspaceId } of thirtyDayInactive) {
          const [latestRun] = await db
            .select({ startedAt: workflowRuns.startedAt })
            .from(workflowRuns)
            .where(eq(workflowRuns.workspaceId, workspaceId))
            .orderBy(desc(workflowRuns.startedAt))
            .limit(1);
          if (!latestRun || latestRun.startedAt > thirtyDaysAgo) continue;

          const owner = await getOwner(db, workspaceId);
          if (!owner || owner.emailOptOut) continue;

          const daysSince = Math.round(
            (now.getTime() - latestRun.startedAt.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          await sendReengagementEmail(
            owner.email,
            owner.name,
            owner.id,
            daysSince,
          ).catch((err) =>
            console.error(
              "[email-crons] reengagement-30 failed for",
              workspaceId,
              err,
            ),
          );
        }

        // 7-day inactive workspaces (last run 7–8 days ago, not in 30-day set)
        const sevenDayInactive = await db
          .selectDistinct({ workspaceId: workflowRuns.workspaceId })
          .from(workflowRuns)
          .where(
            and(
              gt(
                workflowRuns.startedAt,
                new Date(sevenDaysAgo.getTime() - 2 * 24 * 60 * 60 * 1000),
              ),
              lt(workflowRuns.startedAt, upperBound),
            ),
          );

        const thirtyDaySet = new Set(
          thirtyDayInactive.map((r) => r.workspaceId),
        );

        for (const { workspaceId } of sevenDayInactive) {
          if (thirtyDaySet.has(workspaceId)) continue;

          const [latestRun] = await db
            .select({ startedAt: workflowRuns.startedAt })
            .from(workflowRuns)
            .where(eq(workflowRuns.workspaceId, workspaceId))
            .orderBy(desc(workflowRuns.startedAt))
            .limit(1);
          if (!latestRun || latestRun.startedAt > sevenDaysAgo) continue;

          const owner = await getOwner(db, workspaceId);
          if (!owner || owner.emailOptOut) continue;

          const daysSince = Math.round(
            (now.getTime() - latestRun.startedAt.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          await sendReengagementEmail(
            owner.email,
            owner.name,
            owner.id,
            daysSince,
          ).catch((err) =>
            console.error(
              "[email-crons] reengagement-7 failed for",
              workspaceId,
              err,
            ),
          );
        }
      });
    },
  );
}

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------

async function getOwner(
  db: Database,
  workspaceId: string,
): Promise<{
  id: string;
  email: string;
  name: string;
  emailOptOut: boolean;
} | null> {
  const [ws] = await db
    .select({ ownerId: workspaces.ownerId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  if (!ws) return null;

  const [profile] = await db
    .select({
      email: userProfiles.email,
      fullName: userProfiles.fullName,
      emailOptOut: userProfiles.emailOptOut,
    })
    .from(userProfiles)
    .where(eq(userProfiles.id, ws.ownerId))
    .limit(1);
  if (!profile) return null;

  return {
    id: ws.ownerId,
    email: profile.email,
    name: profile.fullName ?? "",
    emailOptOut: profile.emailOptOut,
  };
}
