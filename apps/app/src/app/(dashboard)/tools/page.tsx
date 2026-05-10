import { Suspense } from "react";
import { ToolsPage } from "./_components/tools-page";

export default function Tools() {
  return (
    <Suspense>
      <ToolsPage />
    </Suspense>
  );
}
