import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/section-header";

type CellValue = true | string | null;

interface CompareRow {
  label: string;
  values: [CellValue, CellValue, CellValue, CellValue];
}

interface CompareGroup {
  label: string;
  rows: CompareRow[];
}

const PLAN_NAMES = ["Free", "Starter", "Pro", "Custom"] as const;

const groups: CompareGroup[] = [
  {
    label: "Usage Limits",
    rows: [
      { label: "Workflow generations / mo", values: ["5", "50", "Unlimited", "Unlimited"] },
      { label: "Workflow runs / mo", values: ["100", "2,000", "20,000", "Unlimited"] },
      { label: "Apps", values: ["1", "5", "Unlimited", "Unlimited"] },
      { label: "Phone numbers", values: [null, "1", "5", "Unlimited"] },
    ],
  },
  {
    label: "Platform Features",
    rows: [
      {
        label: "AI models",
        values: ["Basic", "Standard", "All incl. Opus", "All + fine-tuned"],
      },
      { label: "Knowledge bases", values: [null, null, true, true] },
      { label: "Code nodes", values: [null, null, true, true] },
      { label: "Custom MCP servers", values: [null, null, true, true] },
      { label: "Voice agents", values: [null, null, true, true] },
      { label: "Skills marketplace", values: [null, true, true, true] },
    ],
  },
  {
    label: "Security & Compliance",
    rows: [
      { label: "SSO / SAML", values: [null, null, true, true] },
      { label: "Audit logs", values: [null, null, true, true] },
      { label: "Custom data retention", values: [null, null, null, true] },
      { label: "SLA guarantee", values: [null, null, null, true] },
    ],
  },
  {
    label: "Support",
    rows: [
      {
        label: "Support tier",
        values: ["Community", "Email", "Priority (4h SLA)", "Dedicated manager"],
      },
      { label: "Fine-tuned models", values: [null, null, null, true] },
    ],
  },
];

function Cell({ value, isProCol }: { value: CellValue; isProCol: boolean }) {
  if (value === null) {
    return <span className={cn("text-sm", isProCol ? "text-white/30" : "text-[#d4d4d4]")}>—</span>;
  }
  if (value === true) {
    return (
      <Check
        size={16}
        className={cn("mx-auto shrink-0", isProCol ? "text-white" : "text-(--colors-primary)")}
      />
    );
  }
  return (
    <span className={cn("text-sm font-medium", isProCol ? "text-white" : "text-[#171717]")}>
      {value}
    </span>
  );
}

export function PricingCompare() {
  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="px-5 py-16 lg:px-[120px] lg:py-20 mx-auto max-w-[1188px]">
        <div className="mb-12">
          <SectionHeader
            title="Compare plans"
            subtitle="Everything you get on each plan, side by side."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="border-spacing-0 w-full min-w-[640px] border-separate">
            <thead>
              <tr>
                <th className="pb-4 w-[40%] text-left" />
                {PLAN_NAMES.map((name) => (
                  <th
                    key={name}
                    className={cn(
                      "pb-4 text-sm font-semibold w-[15%] text-center",
                      name === "Pro"
                        ? "px-4 pt-4 text-white rounded-t-2xl bg-[#171717]"
                        : "text-[#171717]",
                    )}
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group, gi) => (
                <Fragment key={group.label}>
                  <tr>
                    <td
                      colSpan={5}
                      className={cn(
                        "px-0 pb-2 pt-6 text-xs font-semibold tracking-widest text-[#737373] uppercase",
                        gi === 0 && "pt-2",
                      )}
                    >
                      {group.label}
                    </td>
                  </tr>
                  {group.rows.map((row, ri) => (
                    <tr key={row.label} className={cn(ri % 2 === 0 ? "bg-[#fafafa]" : "bg-white")}>
                      <td className="py-3 pl-3 pr-4 text-sm rounded-l-lg text-[#404040]">
                        {row.label}
                      </td>
                      {row.values.map((val, ci) => (
                        <td
                          key={ci}
                          className={cn(
                            "py-3 text-center",
                            PLAN_NAMES[ci] === "Pro" && "px-4 bg-[#171717]",
                            PLAN_NAMES[ci] === "Pro" &&
                              ri === group.rows.length - 1 &&
                              gi === groups.length - 1 &&
                              "rounded-b-2xl",
                            ci === row.values.length - 1 && "rounded-r-lg",
                          )}
                        >
                          <Cell value={val} isProCol={PLAN_NAMES[ci] === "Pro"} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
