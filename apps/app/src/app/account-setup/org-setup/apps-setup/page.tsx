import { Suspense } from "react";
import AppsForm from "@/app/account-setup/_components/apps-form";

export default function AppsSetup() {
  return (
    <div className="flex flex-col items-center">
      <Suspense fallback={null}>
        <AppsForm />
      </Suspense>
    </div>
  );
}
