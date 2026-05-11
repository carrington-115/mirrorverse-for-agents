import type { Metadata } from "next";
import {
  WorkflowEditorPage,
  metadata as pageMetadata,
} from "@/features/workflows/pages/workflow-editor-page";

export const metadata: Metadata = pageMetadata;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkflowEditorPage workflowId={id} />;
}
