import { Database, FileText, Wrench } from "lucide-react";
import { AgentToolProvider } from "@/lib/types";

export function ToolProviderIcon({
  provider,
  className,
}: {
  provider: AgentToolProvider;
  className?: string;
}) {
  const c = className ?? "size-3";
  switch (provider) {
    case "salesforce":
      return <Database className={`${c} text-sky-500`} aria-hidden />;
    case "zendesk":
      return <FileText className={`${c} text-emerald-600`} aria-hidden />;
    case "slack":
      return (
        <svg
          viewBox="0 0 24 24"
          className={c}
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#E01E5A"
            d="M5 15.5a2.5 2.5 0 1 1-2.5-2.5H5zm1.25 0a2.5 2.5 0 0 1 5 0v6.25a2.5 2.5 0 0 1-5 0z"
          />
          <path
            fill="#36C5F0"
            d="M8.75 5a2.5 2.5 0 1 1 2.5-2.5V5zm0 1.25a2.5 2.5 0 0 1 0 5H2.5a2.5 2.5 0 0 1 0-5z"
          />
          <path
            fill="#2EB67D"
            d="M19 8.75a2.5 2.5 0 1 1 2.5 2.5H19zm-1.25 0a2.5 2.5 0 0 1-5 0V2.5a2.5 2.5 0 0 1 5 0z"
          />
          <path
            fill="#ECB22E"
            d="M15.25 19a2.5 2.5 0 1 1-2.5 2.5V19zm0-1.25a2.5 2.5 0 0 1 0-5h6.25a2.5 2.5 0 0 1 0 5z"
          />
        </svg>
      );
    case "google-sheet":
      return <FileText className={`${c} text-green-600`} aria-hidden />;
    default:
      return <Wrench className={c} aria-hidden />;
  }
}
