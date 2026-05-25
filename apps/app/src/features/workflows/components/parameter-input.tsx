"use client";

import { Code, Cpu, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type StaticValue = string | number | boolean | null | object;

export type ParameterValue =
  | { mode: "static"; value: StaticValue }
  | { mode: "expression"; expr: string }
  | { mode: "from_ai"; name: string; description: string; type: string; required: boolean };

interface ParameterInputProps {
  readonly label: string;
  readonly value: ParameterValue;
  readonly onChange: (next: ParameterValue) => void;
  readonly allowFromAi?: boolean;
  readonly multiline?: boolean;
  readonly placeholder?: string;
}

const MODE_ICONS = {
  static: Type,
  expression: Code,
  from_ai: Cpu,
} as const;

const MODE_LABELS = {
  static: "Static",
  expression: "Expression",
  from_ai: "From AI",
} as const;

export function ParameterInput({
  label,
  value,
  onChange,
  allowFromAi = false,
  multiline = false,
  placeholder,
}: ParameterInputProps) {
  const modes = ["static", "expression", ...(allowFromAi ? ["from_ai" as const] : [])] as const;

  function switchMode(next: ParameterValue["mode"]) {
    if (next === value.mode) return;
    if (next === "static") {
      onChange({ mode: "static", value: "" });
    } else if (next === "expression") {
      onChange({ mode: "expression", expr: "" });
    } else {
      onChange({
        mode: "from_ai",
        name: label.toLowerCase().replace(/\s+/g, "_"),
        description: "",
        type: "string",
        required: false,
      });
    }
  }

  return (
    <div className="gap-1 flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <div className="gap-0.5 flex items-center">
          {modes.map((m) => {
            const Icon = MODE_ICONS[m];
            return (
              <Button
                key={m}
                variant={value.mode === m ? "secondary" : "ghost"}
                size="icon"
                className={cn("size-5 rounded-sm", value.mode === m && "text-foreground")}
                title={MODE_LABELS[m]}
                onClick={() => switchMode(m)}
              >
                <Icon className="size-3" />
              </Button>
            );
          })}
        </div>
      </div>

      {value.mode === "static" &&
        (multiline ? (
          <Textarea
            className="text-xs min-h-[60px] resize-none"
            placeholder={placeholder ?? "Value"}
            value={
              typeof value.value === "string" ? value.value : JSON.stringify(value.value ?? "")
            }
            onChange={(e) => onChange({ mode: "static", value: e.target.value })}
          />
        ) : (
          <Input
            className="h-7 text-xs"
            placeholder={placeholder ?? "Value"}
            value={typeof value.value === "string" ? value.value : String(value.value ?? "")}
            onChange={(e) => onChange({ mode: "static", value: e.target.value })}
          />
        ))}

      {value.mode === "expression" && (
        <Input
          className="h-7 text-xs font-mono"
          placeholder="{{ $json.field }}"
          value={value.expr}
          onChange={(e) => onChange({ mode: "expression", expr: e.target.value })}
        />
      )}

      {value.mode === "from_ai" && (
        <div className="px-2 py-1.5 text-xs rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground">
          <span className="font-medium">AI fills this field</span>
          {value.description && <p className="mt-0.5 text-[10px]">{value.description}</p>}
        </div>
      )}
    </div>
  );
}
