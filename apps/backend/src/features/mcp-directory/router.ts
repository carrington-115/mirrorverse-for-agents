import { router, TRPCError } from "../../trpc/init";
import { publicProc } from "../../trpc/middleware";

import { byCategoryInput, getBySlugInput, listInput } from "./inputs";
import { mcpDirectoryService } from "./service";

export const mcpDirectoryRouter = router({
  list: publicProc
    .input(listInput)
    .query(({ ctx, input }) => mcpDirectoryService.list(ctx.db, input)),

  getBySlug: publicProc.input(getBySlugInput).query(async ({ ctx, input }) => {
    const entry = await mcpDirectoryService.getBySlug(ctx.db, input);
    if (!entry) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No directory entry with slug "${input.slug}"`,
      });
    }
    return entry;
  }),

  byCategory: publicProc
    .input(byCategoryInput)
    .query(({ ctx, input }) => mcpDirectoryService.byCategory(ctx.db, input)),
});
