"use client";

import { cn } from "@/lib/utils";

interface MirrropilotLoaderProps {
  size?: number;
  className?: string;
}

export function MirrropilotLoader({
  size = 24,
  className,
}: MirrropilotLoaderProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("mirrropilot-loader", className)}
    >
      <style>{`
        .mirrropilot-loader .tri-back-l {
          animation: mp-pulse-bl 1.6s ease-in-out infinite;
        }
        .mirrropilot-loader .tri-back-r {
          animation: mp-pulse-br 1.6s ease-in-out infinite 0.2s;
        }
        .mirrropilot-loader .tri-front {
          animation: mp-pulse-f 1.6s ease-in-out infinite 0.1s;
        }
        @keyframes mp-pulse-bl {
          0%, 100% { opacity: 0.35; }
          40%       { opacity: 0.85; }
        }
        @keyframes mp-pulse-br {
          0%, 100% { opacity: 0.35; }
          40%       { opacity: 0.85; }
        }
        @keyframes mp-pulse-f {
          0%, 100% { opacity: 0.25; }
          50%       { opacity: 0.75; }
        }
        @media (prefers-color-scheme: dark) {
          .mirrropilot-loader .tri-back-l,
          .mirrropilot-loader .tri-back-r {
            fill: #c0c0c0;
          }
          .mirrropilot-loader .tri-front {
            fill: #ffffff;
          }
        }
      `}</style>
      <path
        className="tri-back-l"
        d="M8.48736 4.10608L16.9747 20.1431H0L8.48736 4.10608Z"
        fill="currentColor"
        fillOpacity="0.6"
      />
      <path
        className="tri-back-r"
        d="M15.5127 4.10608L24 20.1431H7.02533L15.5127 4.10608Z"
        fill="currentColor"
        fillOpacity="0.6"
      />
      <path
        className="tri-front"
        d="M12.0352 2.57327L22.0131 21.4267H2.05719L12.0352 2.57327Z"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </svg>
  );
}
