// Public schemas + palette helpers. This subpath is intentionally DB-free so
// that client components in apps/app can import workflow types and the node
// palette without the bundler dragging in @mirrorverse/db (and through it the
// `postgres` driver, which only works in Node).
export {
  jsonObject,
  workflowConnection,
  workflowDocumentSchema,
  workflowNode,
} from "./workflow.js";
export type {
  WorkflowConnectionInput,
  WorkflowDocumentInput,
  WorkflowNodeInput,
} from "./workflow.js";
export { APP_EVENT_CATALOG, PALETTE_ENTRIES, defaultNodeForKind } from "./node-defaults.js";
export type { AppEventApp, AppEventEntry, PaletteCategory, PaletteEntry } from "./node-defaults.js";
