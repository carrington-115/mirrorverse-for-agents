import { Suspense } from "react";
import { ToolsPage } from "./_components/ToolsPage";

export default function Tools() {
  return (
    <Suspense>
      <ToolsPage />
    </Suspense>
  );
}
