import type { Metadata } from "next";
import {
  WorkflowEditorPage,
  metadata as pageMetadata,
} from "@/features/workflows/pages/workflow-editor-page";

export const metadata: Metadata = pageMetadata;

export default async function Page({ params }: { params: Promise<{ id: string; wid: string }> }) {
  const { wid } = await params;
  return <WorkflowEditorPage workflowId={wid} />;
}
