"use client";

import { CHAT_MODELS } from "@/features/chat/config";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  lintParamsObjectExpressions,
  lintTemplateExpressions,
} from "@/features/workflows/lib/lint-template-expressions";
import { NodeIcon } from "@/features/workflows/lib/node-icon";
import { WebhookConfig } from "@/features/webhooks/components/webhook-config";
import { useKbsQuery } from "@/features/knowledge/api/queries";
import { useComposioAppsQuery } from "@/features/workflows/api/queries";
import { APP_EVENT_CATALOG } from "@mirrorverse/agent/schemas";
import type { WorkflowNodeInput } from "@mirrorverse/agent/schemas";

const AGENT_MODEL_OPTIONS = CHAT_MODELS.map((m) => ({
  value: m.id,
  label: m.name,
  pro: "pro" in m ? m.pro : undefined,
}));

interface NodeInspectorProps {
  readonly node: WorkflowNodeInput;
  readonly workflowId?: string;
  readonly validationErrors?: readonly string[];
  readonly nodeTypesById?: ReadonlyMap<string, string>;
  readonly onUpdate: (patch: Partial<WorkflowNodeInput>) => void;
  readonly onClose: () => void;
}

// --- Field helpers ---

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="gap-1 flex flex-col">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function FieldWarnings({ warnings }: { warnings?: string[] }) {
  if (!warnings || warnings.length === 0) return null;
  return (
    <>
      {warnings.map((warning, i) => (
        <p key={i} className="text-amber-600 dark:text-amber-400 text-[10px]">
          {warning}
        </p>
      ))}
    </>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  warnings,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  warnings?: string[];
}) {
  return (
    <Field label={label}>
      <Input
        className="h-7 text-xs"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldWarnings warnings={warnings} />
    </Field>
  );
}

function TextareaInput({
  label,
  value,
  onChange,
  placeholder,
  mono,
  warnings,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  warnings?: string[];
}) {
  return (
    <Field label={label}>
      <Textarea
        className={`text-xs min-h-[80px] resize-none${mono ? "font-mono" : ""}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldWarnings warnings={warnings} />
    </Field>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string; pro?: boolean }[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              <span className="gap-1.5 flex items-center">
                {o.label}
                {o.pro && (
                  <span className="bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-600 dark:text-amber-400 rounded-full text-[10px]">
                    Pro
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function ToggleInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} className="scale-75" />
    </div>
  );
}

function InfoPanel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

// --- Param access helpers ---

type Params = Record<string, unknown>;

function str(params: Params, key: string, fallback = ""): string {
  const v = params[key];
  return typeof v === "string" ? v : fallback;
}

function num(params: Params, key: string, fallback: number): number {
  const v = params[key];
  return typeof v === "number" ? v : fallback;
}

function bool(params: Params, key: string, fallback: boolean): boolean {
  const v = params[key];
  return typeof v === "boolean" ? v : fallback;
}

function asObj(v: unknown): Params {
  return typeof v === "object" && v !== null ? (v as Params) : {};
}

function jsonText(v: unknown): string {
  if (v == null || (typeof v === "object" && Object.keys(v as object).length === 0)) return "";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}

// Returns an updater that patches a single params key
function useParamUpdater(node: WorkflowNodeInput, onUpdate: NodeInspectorProps["onUpdate"]) {
  return (key: string, value: unknown) => onUpdate({ params: { ...node.params, [key]: value } });
}

// --- Shared condition builder ---

const OPERATOR_OPTIONS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not contains" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
  { value: "greater_than_or_equal", label: "≥ Greater or equal" },
  { value: "less_than_or_equal", label: "≤ Less or equal" },
  { value: "is_empty", label: "Is empty" },
  { value: "is_not_empty", label: "Is not empty" },
] as const;

const NO_RIGHT_VALUE_OPS = new Set(["is_empty", "is_not_empty"]);

interface ConditionRow {
  readonly id?: string;
  readonly leftValue?: unknown;
  readonly operator?: string;
  readonly rightValue?: unknown;
}

function ConditionsEditor({
  conditions,
  combinator,
  onChange,
  onCombinatorChange,
}: {
  conditions: ConditionRow[];
  combinator: string;
  onChange: (next: ConditionRow[]) => void;
  onCombinatorChange: (v: string) => void;
}) {
  function updateRow(i: number, patch: Partial<ConditionRow>) {
    onChange(conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function removeRow(i: number) {
    onChange(conditions.filter((_, idx) => idx !== i));
  }

  function addRow() {
    onChange([
      ...conditions,
      { id: `cond_${Date.now()}`, leftValue: "", operator: "equals", rightValue: "" },
    ]);
  }

  return (
    <>
      <SelectInput
        label="Match"
        value={combinator}
        options={[
          { value: "and", label: "All conditions (AND)" },
          { value: "or", label: "Any condition (OR)" },
        ]}
        onChange={onCombinatorChange}
      />
      <Field label="Conditions">
        <div className="gap-2 flex flex-col">
          {conditions.map((cond, i) => {
            const op = typeof cond.operator === "string" ? cond.operator : "equals";
            const noRight = NO_RIGHT_VALUE_OPS.has(op);
            return (
              <div key={i} className="gap-1 p-2 flex flex-col rounded-md border border-border">
                <div className="gap-1 flex items-center">
                  <Input
                    className="h-6 text-xs flex-1 font-mono"
                    placeholder="{{ $json.field }}"
                    value={typeof cond.leftValue === "string" ? cond.leftValue : ""}
                    onChange={(e) => updateRow(i, { leftValue: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0"
                    onClick={() => removeRow(i)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
                <Select value={op} onValueChange={(v) => updateRow(i, { operator: v })}>
                  <SelectTrigger className="h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATOR_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!noRight && (
                  <Input
                    className="h-6 text-xs font-mono"
                    placeholder="value or {{ $json.other }}"
                    value={
                      typeof cond.rightValue === "string"
                        ? cond.rightValue
                        : String(cond.rightValue ?? "")
                    }
                    onChange={(e) => updateRow(i, { rightValue: e.target.value })}
                  />
                )}
              </div>
            );
          })}
          <Button variant="outline" size="sm" className="h-6 text-xs w-full" onClick={addRow}>
            <Plus className="size-3 mr-1" />
            Add condition
          </Button>
        </div>
      </Field>
    </>
  );
}

// --- Key/value pair editor (headers, query params, rename mappings) ---

function KvEditor({
  label,
  pairs,
  keyPlaceholder,
  valuePlaceholder,
  onChange,
}: {
  label: string;
  pairs: [string, string][];
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  onChange: (next: [string, string][]) => void;
}) {
  function updateKey(i: number, newKey: string) {
    onChange(pairs.map((p, idx) => (idx === i ? [newKey, p[1]] : p)));
  }

  function updateValue(i: number, newVal: string) {
    onChange(pairs.map((p, idx) => (idx === i ? [p[0], newVal] : p)));
  }

  function removeRow(i: number) {
    onChange(pairs.filter((_, idx) => idx !== i));
  }

  return (
    <Field label={label}>
      <div className="gap-1 flex flex-col">
        {pairs.map(([k, v], i) => (
          <div key={i} className="gap-1 flex items-center">
            <Input
              className="h-6 text-xs flex-1"
              placeholder={keyPlaceholder ?? "key"}
              value={k}
              onChange={(e) => updateKey(i, e.target.value)}
            />
            <Input
              className="h-6 text-xs flex-1"
              placeholder={valuePlaceholder ?? "value"}
              value={v}
              onChange={(e) => updateValue(i, e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={() => removeRow(i)}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-xs mt-0.5 w-full"
          onClick={() => onChange([...pairs, ["", ""]])}
        >
          <Plus className="size-3 mr-1" />
          Add row
        </Button>
      </div>
    </Field>
  );
}

function objToPairs(o: unknown): [string, string][] {
  if (typeof o !== "object" || o === null) return [];
  return Object.entries(o as Record<string, unknown>).map(([k, v]) => [
    k,
    typeof v === "string" ? v : String(v ?? ""),
  ]);
}

function pairsToObj(pairs: [string, string][]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of pairs) {
    if (k) out[k] = v;
  }
  return out;
}

// --- Per-kind forms ---

function ManualTriggerForm() {
  return (
    <InfoPanel>
      Triggered manually from the editor or an API call. No configuration needed.
    </InfoPanel>
  );
}

function CronTriggerForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  return (
    <>
      <TextInput
        label="Cron expression"
        value={str(node.params, "expression")}
        onChange={(v) => p("expression", v)}
        placeholder="0 9 * * *"
      />
      <TextInput
        label="Timezone"
        value={str(node.params, "timezone")}
        onChange={(v) => p("timezone", v)}
        placeholder="UTC"
      />
    </>
  );
}

function WebhookTriggerForm({
  node,
  workflowId,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  workflowId?: string;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const endpointSlug = str(node.params, "endpointSlug");
  return (
    <>
      <TextInput
        label="Endpoint slug"
        value={endpointSlug}
        onChange={(v) => p("endpointSlug", v)}
        placeholder="my-webhook"
      />
      <SelectInput
        label="Method"
        value={str(node.params, "method", "POST")}
        options={[
          { value: "GET", label: "GET" },
          { value: "POST", label: "POST" },
          { value: "PUT", label: "PUT" },
          { value: "PATCH", label: "PATCH" },
          { value: "DELETE", label: "DELETE" },
        ]}
        onChange={(v) => p("method", v)}
      />
      <ToggleInput
        label="Verify signature"
        value={bool(node.params, "verifySignature", false)}
        onChange={(v) => p("verifySignature", v)}
      />
      {endpointSlug && workflowId && (
        <WebhookConfig
          workflowId={workflowId}
          triggerNodeId={node.id}
          endpointSlug={endpointSlug}
        />
      )}
    </>
  );
}

function AgentForm({
  node,
  nodeTypesById,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  nodeTypesById?: ReadonlyMap<string, string>;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const userPromptTemplate = str(node.params, "userPromptTemplate");
  return (
    <>
      <TextareaInput
        label="System prompt"
        value={str(node.params, "systemPrompt")}
        onChange={(v) => p("systemPrompt", v)}
        placeholder="You are a helpful assistant."
      />
      <TextareaInput
        label="User prompt"
        value={userPromptTemplate}
        onChange={(v) => p("userPromptTemplate", v)}
        placeholder="Process the input: {{ $json }}"
        warnings={lintTemplateExpressions(userPromptTemplate, nodeTypesById ?? new Map())}
      />
      <Field label="Max iterations">
        <Input
          className="h-7 text-xs"
          type="number"
          min={1}
          max={50}
          value={num(node.params, "maxIterations", 10)}
          onChange={(e) => p("maxIterations", parseInt(e.target.value, 10) || 1)}
        />
      </Field>
      <SelectInput
        label="Output mode"
        value={str(node.params, "outputMode", "text")}
        options={[
          { value: "text", label: "Text" },
          { value: "json", label: "JSON" },
        ]}
        onChange={(v) => p("outputMode", v)}
      />
    </>
  );
}

function VoiceAgentForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const mc = asObj(node.params.modelConnection);
  const ve = asObj(node.params.voiceEntry);
  const phrases = Array.isArray(node.params.endCallPhrases)
    ? (node.params.endCallPhrases as string[])
    : [];
  const kbIds = Array.isArray(node.params.knowledgeBaseIds)
    ? (node.params.knowledgeBaseIds as string[])
    : [];
  const te = asObj(node.params.toolsEndpoint);
  const tools = Array.isArray(te.tools)
    ? (te.tools as Array<{ toolName: string; mcpServerName: string }>)
    : [];
  const { data: kbs } = useKbsQuery();

  return (
    <>
      <SelectInput
        label="Direction"
        value={str(node.params, "direction", "inbound")}
        options={[
          { value: "inbound", label: "Inbound" },
          { value: "outbound", label: "Outbound" },
        ]}
        onChange={(v) => p("direction", v)}
      />
      <TextareaInput
        label="First message"
        value={str(node.params, "firstMessage")}
        onChange={(v) => p("firstMessage", v)}
        placeholder="Hello, how can I help you today?"
      />
      <TextareaInput
        label="System prompt"
        value={str(mc, "systemPrompt")}
        onChange={(v) => p("modelConnection", { ...mc, systemPrompt: v })}
        placeholder="You are a helpful voice assistant."
      />
      <SelectInput
        label="Model"
        value={str(mc, "model", "claude-haiku-4-5")}
        options={[
          { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
          { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
          { value: "claude-opus-4-7", label: "Claude Opus 4.7", pro: true },
          { value: "claude-opus-4-8", label: "Claude Opus 4.8", pro: true },
          { value: "gpt-4o-mini", label: "GPT-4o mini" },
          { value: "gpt-4o", label: "GPT-4o" },
          { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
        ]}
        onChange={(v) => p("modelConnection", { ...mc, model: v })}
      />
      <TextInput
        label="Voice ID"
        value={str(ve, "voiceId", "21m00Tcm4TlvDq8ikWAM")}
        onChange={(v) => p("voiceEntry", { ...ve, voiceId: v })}
        placeholder="21m00Tcm4TlvDq8ikWAM"
      />
      <SelectInput
        label="TTS model"
        value={str(ve, "model", "eleven_turbo_v2_5")}
        options={[
          { value: "eleven_turbo_v2_5", label: "Turbo v2.5" },
          { value: "eleven_turbo_v2", label: "Turbo v2" },
        ]}
        onChange={(v) => p("voiceEntry", { ...ve, model: v })}
      />
      <SelectInput
        label="Voice mode"
        value={str(ve, "voiceMode", "conversational")}
        options={[
          { value: "conversational", label: "Conversational" },
          { value: "narrative", label: "Narrative" },
          { value: "emotional", label: "Emotional" },
          { value: "advertisement", label: "Advertisement" },
          { value: "entertainment", label: "Entertainment" },
        ]}
        onChange={(v) => p("voiceEntry", { ...ve, voiceMode: v })}
      />
      <Field label="Max duration (seconds)">
        <Input
          className="h-7 text-xs"
          type="number"
          min={30}
          value={num(node.params, "maxDurationSec", 300)}
          onChange={(e) => p("maxDurationSec", parseInt(e.target.value, 10) || 300)}
        />
      </Field>
      <ToggleInput
        label="Enable recording"
        value={bool(node.params, "recordingEnabled", false)}
        onChange={(v) => p("recordingEnabled", v)}
      />
      <Field label="End call phrases">
        <div className="gap-1 flex flex-col">
          {phrases.map((ph, i) => (
            <div key={i} className="gap-1 flex items-center">
              <Input
                className="h-7 text-xs flex-1"
                value={ph}
                placeholder="e.g. goodbye"
                onChange={(e) =>
                  p(
                    "endCallPhrases",
                    phrases.map((x, idx) => (idx === i ? e.target.value : x)),
                  )
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() =>
                  p(
                    "endCallPhrases",
                    phrases.filter((_, idx) => idx !== i),
                  )
                }
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full"
            onClick={() => p("endCallPhrases", [...phrases, ""])}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add phrase
          </Button>
        </div>
      </Field>
      <Field label="Knowledge bases">
        <div className="gap-1 flex flex-col">
          {kbIds.map((id) => {
            const kb = kbs?.find((k) => k.id === id);
            return (
              <div key={id} className="gap-1 flex items-center">
                <span className="px-2 py-1 text-xs flex-1 truncate rounded-sm bg-muted">
                  {kb?.name ?? id}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() =>
                    p(
                      "knowledgeBaseIds",
                      kbIds.filter((x) => x !== id),
                    )
                  }
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
          <Select
            value=""
            onValueChange={(v) => {
              if (v && !kbIds.includes(v)) {
                p("knowledgeBaseIds", [...kbIds, v]);
              }
            }}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Add knowledge base…" />
            </SelectTrigger>
            <SelectContent>
              {kbs && kbs.length > 0 ? (
                kbs
                  .filter((kb) => !kbIds.includes(kb.id))
                  .map((kb) => (
                    <SelectItem key={kb.id} value={kb.id} className="text-xs">
                      {kb.name}
                    </SelectItem>
                  ))
              ) : (
                <SelectItem value="__none__" disabled className="text-xs">
                  No knowledge bases yet
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </Field>
      <Field label="Tools">
        <div className="gap-1 flex flex-col">
          {tools.map((tool, i) => (
            <div key={i} className="gap-1 flex items-center">
              <Input
                className="h-7 text-xs flex-1"
                value={tool.toolName}
                placeholder="Tool name"
                onChange={(e) =>
                  p("toolsEndpoint", {
                    ...te,
                    tools: tools.map((t, idx) =>
                      idx === i ? { ...t, toolName: e.target.value } : t,
                    ),
                  })
                }
              />
              <Input
                className="h-7 text-xs flex-1"
                value={tool.mcpServerName}
                placeholder="Server"
                onChange={(e) =>
                  p("toolsEndpoint", {
                    ...te,
                    tools: tools.map((t, idx) =>
                      idx === i ? { ...t, mcpServerName: e.target.value } : t,
                    ),
                  })
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() =>
                  p("toolsEndpoint", {
                    ...te,
                    tools: tools.filter((_, idx) => idx !== i),
                  })
                }
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full"
            onClick={() =>
              p("toolsEndpoint", {
                ...te,
                tools: [...tools, { toolName: "", mcpServerName: "" }],
              })
            }
          >
            <Plus className="mr-1 h-3 w-3" />
            Add tool
          </Button>
        </div>
      </Field>
    </>
  );
}

function LanguageModelForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  return (
    <>
      <SelectInput
        label="Provider"
        value={str(node.params, "provider", "anthropic")}
        options={[
          { value: "anthropic", label: "Anthropic" },
          { value: "openai", label: "OpenAI" },
          { value: "google", label: "Google" },
        ]}
        onChange={(v) => p("provider", v)}
      />
      <SelectInput
        label="Model"
        value={str(node.params, "model", "claude-haiku-4-5")}
        options={AGENT_MODEL_OPTIONS}
        onChange={(v) => p("model", v)}
      />
      <Field label="Temperature">
        <Input
          className="h-7 text-xs"
          type="number"
          min={0}
          max={2}
          step={0.1}
          value={num(node.params, "temperature", 0.7)}
          onChange={(e) => p("temperature", parseFloat(e.target.value) || 0.7)}
        />
      </Field>
      <Field label="Max output tokens">
        <Input
          className="h-7 text-xs"
          type="number"
          min={1}
          value={num(node.params, "maxOutputTokens", 1024)}
          onChange={(e) => p("maxOutputTokens", parseInt(e.target.value, 10) || 1024)}
        />
      </Field>
    </>
  );
}

function MemoryForm({
  node,
  nodeTypesById,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  nodeTypesById?: ReadonlyMap<string, string>;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const sessionKeyExpression = str(node.params, "sessionKeyExpression");
  return (
    <>
      <SelectInput
        label="Strategy"
        value={str(node.params, "strategy", "buffer_window")}
        options={[
          { value: "buffer_window", label: "Buffer window" },
          { value: "summary_buffer", label: "Summary buffer" },
          { value: "vector_retrieval", label: "Vector retrieval" },
          { value: "postgres_chat", label: "Postgres chat" },
        ]}
        onChange={(v) => p("strategy", v)}
      />
      <Field label="Context window length">
        <Input
          className="h-7 text-xs"
          type="number"
          min={1}
          value={num(node.params, "contextWindowLength", 5)}
          onChange={(e) => p("contextWindowLength", parseInt(e.target.value, 10) || 5)}
        />
      </Field>
      <TextInput
        label="Session key expression (optional)"
        value={sessionKeyExpression}
        onChange={(v) => p("sessionKeyExpression", v || null)}
        placeholder="{{ $json.userId }}"
        warnings={lintTemplateExpressions(sessionKeyExpression, nodeTypesById ?? new Map())}
      />
    </>
  );
}

function RetrieverForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const rawMinScore = node.params.minScore;
  const minScoreEnabled = typeof rawMinScore === "number";
  return (
    <>
      <TextInput
        label="Knowledge base ID"
        value={str(node.params, "knowledgeBaseId")}
        onChange={(v) => p("knowledgeBaseId", v)}
        placeholder="kb_…"
      />
      <Field label="Top K results">
        <Input
          className="h-7 text-xs"
          type="number"
          min={1}
          max={20}
          value={num(node.params, "topK", 6)}
          onChange={(e) => p("topK", parseInt(e.target.value, 10) || 6)}
        />
      </Field>
      <div className="gap-1 flex flex-col">
        <ToggleInput
          label="Minimum similarity score"
          value={minScoreEnabled}
          onChange={(v) => p("minScore", v ? 0.7 : null)}
        />
        {minScoreEnabled && (
          <Input
            className="h-7 text-xs"
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={num(node.params, "minScore", 0.7)}
            onChange={(e) => p("minScore", parseFloat(e.target.value) || 0)}
          />
        )}
      </div>
    </>
  );
}

function OutputParserForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const schema = node.params.schema;
  return (
    <>
      <SelectInput
        label="Strategy"
        value={str(node.params, "strategy", "auto_fix")}
        options={[
          { value: "auto_fix", label: "Auto-fix (retry on parse error)" },
          { value: "structured", label: "Structured (enforce JSON schema)" },
        ]}
        onChange={(v) => p("strategy", v)}
      />
      <ToggleInput
        label="Auto-fix on error"
        value={bool(node.params, "autoFix", true)}
        onChange={(v) => p("autoFix", v)}
      />
      <TextareaInput
        label="Output schema (JSON, optional)"
        value={jsonText(schema)}
        onChange={(v) => {
          try {
            p("schema", v.trim() ? JSON.parse(v) : null);
          } catch {
            // let user finish typing
          }
        }}
        placeholder='{ "type": "object", "properties": { ... } }'
        mono
      />
    </>
  );
}

function HttpRequestForm({
  node,
  nodeTypesById,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  nodeTypesById?: ReadonlyMap<string, string>;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const method = str(node.params, "method", "GET");
  const hasBody = method !== "GET" && method !== "HEAD";

  return (
    <>
      <SelectInput
        label="Method"
        value={method}
        options={[
          { value: "GET", label: "GET" },
          { value: "POST", label: "POST" },
          { value: "PUT", label: "PUT" },
          { value: "PATCH", label: "PATCH" },
          { value: "DELETE", label: "DELETE" },
        ]}
        onChange={(v) => p("method", v)}
      />
      <TextInput
        label="URL"
        value={str(node.params, "url")}
        onChange={(v) => p("url", v)}
        placeholder="https://api.example.com/endpoint"
      />
      <KvEditor
        label="Headers"
        pairs={objToPairs(node.params.headers)}
        keyPlaceholder="Header-Name"
        valuePlaceholder="value or {{ $json.token }}"
        onChange={(pairs) => p("headers", pairsToObj(pairs))}
      />
      <KvEditor
        label="Query params"
        pairs={objToPairs(node.params.query)}
        keyPlaceholder="param"
        valuePlaceholder="value"
        onChange={(pairs) => p("query", pairsToObj(pairs))}
      />
      {hasBody && (
        <TextareaInput
          label="Body (JSON)"
          value={jsonText(node.params.body)}
          onChange={(v) => {
            try {
              p("body", v.trim() ? JSON.parse(v) : null);
            } catch {
              // let user finish typing
            }
          }}
          placeholder='{ "key": "{{ $json.value }}" }'
          mono
          warnings={
            Array.isArray(node.params.body)
              ? []
              : lintParamsObjectExpressions(asObj(node.params.body), nodeTypesById ?? new Map())
          }
        />
      )}
    </>
  );
}

function CodeForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  return (
    <>
      <SelectInput
        label="Language"
        value={str(node.params, "language", "typescript")}
        options={[
          { value: "typescript", label: "TypeScript" },
          { value: "javascript", label: "JavaScript" },
          { value: "python", label: "Python" },
        ]}
        onChange={(v) => p("language", v)}
      />
      <Field label="Source">
        <Textarea
          className="text-xs min-h-[120px] resize-none font-mono"
          value={str(node.params, "source")}
          onChange={(e) => p("source", e.target.value)}
          placeholder="return { result: $json.value };"
        />
      </Field>
      <Field label="Timeout (seconds)">
        <Input
          className="h-7 text-xs"
          type="number"
          min={1}
          value={num(node.params, "timeoutSec", 10)}
          onChange={(e) => p("timeoutSec", parseInt(e.target.value, 10) || 10)}
        />
      </Field>
    </>
  );
}

function IfForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const conditions = Array.isArray(node.params.conditions)
    ? (node.params.conditions as ConditionRow[])
    : [];
  return (
    <ConditionsEditor
      conditions={conditions}
      combinator={str(node.params, "combinator", "and")}
      onChange={(next) => p("conditions", next)}
      onCombinatorChange={(v) => p("combinator", v)}
    />
  );
}

function FilterForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const conditions = Array.isArray(node.params.conditions)
    ? (node.params.conditions as ConditionRow[])
    : [];
  return (
    <>
      <InfoPanel>
        Keeps only array items that match the conditions. Non-array input is treated as a
        single-element array.
      </InfoPanel>
      <ConditionsEditor
        conditions={conditions}
        combinator={str(node.params, "combinator", "and")}
        onChange={(next) => p("conditions", next)}
        onCombinatorChange={(v) => p("combinator", v)}
      />
    </>
  );
}

interface SwitchCaseRow {
  readonly conditions?: ConditionRow[];
  readonly combinator?: string;
  readonly outputIndex?: number;
}

function SwitchForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const cases = Array.isArray(node.params.cases) ? (node.params.cases as SwitchCaseRow[]) : [];

  function updateCase(i: number, patch: Partial<SwitchCaseRow>) {
    p(
      "cases",
      cases.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    );
  }

  function removeCase(i: number) {
    p(
      "cases",
      cases.filter((_, idx) => idx !== i),
    );
  }

  function addCase() {
    p("cases", [
      ...cases,
      {
        conditions: [
          { id: `cond_${Date.now()}`, leftValue: "", operator: "equals", rightValue: "" },
        ],
        combinator: "and",
        outputIndex: cases.length,
      },
    ]);
  }

  return (
    <>
      <Field label="Cases">
        <div className="gap-3 flex flex-col">
          {cases.map((c, i) => (
            <div key={i} className="gap-2 p-2 flex flex-col rounded-md border border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold tracking-wider text-[10px] text-muted-foreground uppercase">
                  Case {i + 1} → output {c.outputIndex ?? i}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  onClick={() => removeCase(i)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
              <ConditionsEditor
                conditions={(c.conditions ?? []) as ConditionRow[]}
                combinator={c.combinator ?? "and"}
                onChange={(next) => updateCase(i, { conditions: next })}
                onCombinatorChange={(v) => updateCase(i, { combinator: v })}
              />
              <Field label="Output index">
                <Input
                  className="h-6 text-xs"
                  type="number"
                  min={0}
                  value={c.outputIndex ?? i}
                  onChange={(e) =>
                    updateCase(i, { outputIndex: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </Field>
            </div>
          ))}
          <Button variant="outline" size="sm" className="h-6 text-xs w-full" onClick={addCase}>
            <Plus className="size-3 mr-1" />
            Add case
          </Button>
        </div>
      </Field>
      <Field label="Default output index">
        <Input
          className="h-7 text-xs"
          type="number"
          min={0}
          value={num(node.params, "defaultOutputIndex", 0)}
          onChange={(e) => p("defaultOutputIndex", parseInt(e.target.value, 10) || 0)}
        />
      </Field>
    </>
  );
}

function LoopForm({
  node,
  nodeTypesById,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  nodeTypesById?: ReadonlyMap<string, string>;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const iterableExpression = str(node.params, "iterableExpression", "{{ $json.items }}");
  return (
    <>
      <TextInput
        label="Iterable expression"
        value={iterableExpression}
        onChange={(v) => p("iterableExpression", v)}
        placeholder="{{ $json.items }}"
        warnings={lintTemplateExpressions(iterableExpression, nodeTypesById ?? new Map())}
      />
      <Field label="Batch size">
        <Input
          className="h-7 text-xs"
          type="number"
          min={1}
          value={num(node.params, "batchSize", 1)}
          onChange={(e) => p("batchSize", parseInt(e.target.value, 10) || 1)}
        />
      </Field>
    </>
  );
}

function WaitForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const until = asObj(node.params.until);
  const ms = num(until, "ms", 5000);

  // Break ms into hours / minutes / seconds for a friendlier UX.
  const totalSec = Math.round(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  function setDuration(h: number, m: number, s: number) {
    const newMs = (h * 3600 + m * 60 + s) * 1000;
    p("until", { mode: "duration", ms: newMs });
  }

  return (
    <>
      <InfoPanel>Pauses the run for the specified duration before continuing.</InfoPanel>
      <div className="gap-2 flex items-end">
        <Field label="Hours">
          <Input
            className="h-7 text-xs"
            type="number"
            min={0}
            value={hours}
            onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0, minutes, seconds)}
          />
        </Field>
        <Field label="Minutes">
          <Input
            className="h-7 text-xs"
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => setDuration(hours, parseInt(e.target.value, 10) || 0, seconds)}
          />
        </Field>
        <Field label="Seconds">
          <Input
            className="h-7 text-xs"
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => setDuration(hours, minutes, parseInt(e.target.value, 10) || 0)}
          />
        </Field>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Total: {(ms / 1000).toLocaleString()} seconds
      </p>
    </>
  );
}

function TransformForm({
  node,
  nodeTypesById,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  nodeTypesById?: ReadonlyMap<string, string>;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const op = str(node.params, "op", "edit_fields");
  const config = asObj(node.params.config);

  function setConfig(patch: Record<string, unknown>) {
    p("config", { ...config, ...patch });
  }

  return (
    <>
      <SelectInput
        label="Operation"
        value={op}
        options={[
          { value: "edit_fields", label: "Edit fields — set/add keys on the object" },
          { value: "rename_keys", label: "Rename keys — map old key names to new ones" },
          { value: "map", label: "Map — apply field templates to each array item" },
          { value: "aggregate", label: "Aggregate — reduce an array to a single value" },
        ]}
        onChange={(v) => p("op", v)}
      />

      {op === "edit_fields" && (
        <TextareaInput
          label='Fields to set (JSON object: { "key": "value or {{ expr }}" })'
          value={jsonText(config.fields)}
          onChange={(v) => {
            try {
              setConfig({ fields: v.trim() ? JSON.parse(v) : {} });
            } catch {
              // let user finish typing
            }
          }}
          placeholder={'{\n  "status": "active",\n  "label": "{{ $json.name }}"\n}'}
          mono
          warnings={lintParamsObjectExpressions(asObj(config.fields), nodeTypesById ?? new Map())}
        />
      )}

      {op === "rename_keys" && (
        <KvEditor
          label="Key mapping (old → new)"
          pairs={objToPairs(config.mapping)}
          keyPlaceholder="old key"
          valuePlaceholder="new key"
          onChange={(pairs) => setConfig({ mapping: pairsToObj(pairs) })}
        />
      )}

      {op === "map" && (
        <TextareaInput
          label='Output fields per item (JSON object: { "key": "{{ $json.field }}" })'
          value={jsonText(config.fields)}
          onChange={(v) => {
            try {
              setConfig({ fields: v.trim() ? JSON.parse(v) : {} });
            } catch {
              // let user finish typing
            }
          }}
          placeholder={'{\n  "id": "{{ $json.id }}",\n  "title": "{{ $json.name }}"\n}'}
          mono
          warnings={lintParamsObjectExpressions(asObj(config.fields), nodeTypesById ?? new Map())}
        />
      )}

      {op === "aggregate" && (
        <>
          <TextInput
            label="Key (field to aggregate; leave blank to aggregate whole items)"
            value={str(config, "key")}
            onChange={(v) => setConfig({ key: v || undefined })}
            placeholder="score"
          />
          <SelectInput
            label="Aggregation"
            value={str(config, "op", "count")}
            options={[
              { value: "count", label: "Count" },
              { value: "sum", label: "Sum" },
              { value: "min", label: "Min" },
              { value: "max", label: "Max" },
              { value: "first", label: "First" },
              { value: "last", label: "Last" },
            ]}
            onChange={(v) => setConfig({ op: v })}
          />
        </>
      )}
    </>
  );
}

function HumanReviewForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const timeoutSec = num(node.params, "timeoutSec", 3600);
  const timeoutHours = Math.floor(timeoutSec / 3600);
  const timeoutMins = Math.floor((timeoutSec % 3600) / 60);
  const channel = asObj(node.params.channel);
  const channelKind = str(channel, "kind", "email");

  function setTimeoutSec(h: number, m: number) {
    p("timeoutSec", h * 3600 + m * 60);
  }

  function setChannelKind(kind: string) {
    p("channel", { ...channel, kind });
  }

  return (
    <>
      <SelectInput
        label="Notify reviewer via"
        value={channelKind}
        options={[
          { value: "email", label: "Email" },
          { value: "slack", label: "Slack" },
        ]}
        onChange={setChannelKind}
      />
      {channelKind === "email" && (
        <Field label="Reviewer email">
          <Input
            className="h-7 text-xs mt-1"
            type="email"
            placeholder="reviewer@company.com"
            value={str(channel, "email")}
            onChange={(e) => p("channel", { ...channel, email: e.target.value })}
          />
        </Field>
      )}
      {channelKind === "slack" && (
        <>
          <Field label="Slack incoming webhook URL">
            <Input
              className="h-7 text-xs mt-1"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={str(channel, "webhookUrl")}
              onChange={(e) => p("channel", { ...channel, webhookUrl: e.target.value })}
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Create an incoming webhook in your Slack workspace (Apps → Incoming Webhooks) and paste
            the URL above.
          </p>
        </>
      )}
      <TextareaInput
        label="Prompt shown to reviewer"
        value={str(node.params, "promptTemplate")}
        onChange={(v) => p("promptTemplate", v)}
        placeholder="Please review and approve to continue."
      />
      <Field label="Timeout">
        <div className="gap-2 flex items-end">
          <div className="flex-1">
            <Label className="text-xs">Hours</Label>
            <Input
              className="h-7 text-xs mt-1"
              type="number"
              min={0}
              value={timeoutHours}
              onChange={(e) => setTimeoutSec(parseInt(e.target.value, 10) || 0, timeoutMins)}
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs">Minutes</Label>
            <Input
              className="h-7 text-xs mt-1"
              type="number"
              min={0}
              max={59}
              value={timeoutMins}
              onChange={(e) => setTimeoutSec(timeoutHours, parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>
      </Field>
      <SelectInput
        label="On timeout"
        value={str(node.params, "onTimeout", "abort")}
        options={[
          { value: "abort", label: "Abort the run" },
          { value: "continue", label: "Continue with default value" },
        ]}
        onChange={(v) => p("onTimeout", v)}
      />
      {str(node.params, "onTimeout", "abort") === "continue" && (
        <TextareaInput
          label="Default value (JSON)"
          value={jsonText(node.params.defaultValue)}
          onChange={(v) => {
            try {
              p("defaultValue", v.trim() ? JSON.parse(v) : null);
            } catch {
              // let user finish typing
            }
          }}
          placeholder="null"
          mono
        />
      )}
    </>
  );
}

function StickyNoteForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const COLORS = ["Yellow", "Green", "Blue", "Pink", "Purple", "Orange"];
  return (
    <>
      <Field label="Content">
        <Textarea
          className="text-xs min-h-[80px] resize-none"
          value={str(node.params, "content")}
          onChange={(e) => p("content", e.target.value)}
          placeholder="Add a note…"
        />
      </Field>
      <SelectInput
        label="Color"
        value={String(num(node.params, "color", 0))}
        options={COLORS.map((label, i) => ({ value: String(i), label }))}
        onChange={(v) => p("color", parseInt(v, 10))}
      />
      <div className="gap-2 flex items-end">
        <Field label="Width">
          <Input
            className="h-7 text-xs"
            type="number"
            min={100}
            step={40}
            value={num(node.params, "width", 200)}
            onChange={(e) => p("width", parseInt(e.target.value, 10) || 200)}
          />
        </Field>
        <Field label="Height">
          <Input
            className="h-7 text-xs"
            type="number"
            min={60}
            step={20}
            value={num(node.params, "height", 120)}
            onChange={(e) => p("height", parseInt(e.target.value, 10) || 120)}
          />
        </Field>
      </div>
    </>
  );
}

const APP_SLUG_OPTIONS = Object.entries(APP_EVENT_CATALOG).map(([slug, app]) => ({
  value: slug,
  label: app.name,
}));

function AppEventTriggerForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const appSlug = str(node.params, "appSlug", "github");
  const appEntry = APP_EVENT_CATALOG[appSlug];
  const eventOptions = (appEntry?.events ?? []).map((e) => ({
    value: e.slug,
    label: e.name,
  }));
  const eventSlug = str(node.params, "eventSlug", eventOptions[0]?.value ?? "");

  function handleAppChange(newSlug: string) {
    const first = APP_EVENT_CATALOG[newSlug]?.events[0];
    onUpdate({
      params: {
        ...node.params,
        appSlug: newSlug,
        eventSlug: first?.slug ?? "",
      },
    });
  }

  const filters = asObj(node.params.filters);
  const filterEntries = Object.entries(filters);

  function addFilter() {
    p("filters", { ...filters, "": "" });
  }

  function updateFilterKey(oldKey: string, newKey: string) {
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(filters)) {
      next[k === oldKey ? newKey : k] = v;
    }
    p("filters", next);
  }

  function updateFilterValue(key: string, value: string) {
    p("filters", { ...filters, [key]: value });
  }

  function removeFilter(key: string) {
    const next = { ...filters };
    delete next[key];
    p("filters", next);
  }

  return (
    <>
      <SelectInput
        label="App"
        value={appSlug}
        options={APP_SLUG_OPTIONS}
        onChange={handleAppChange}
      />
      <SelectInput
        label="Event"
        value={eventSlug}
        options={eventOptions}
        onChange={(v) => p("eventSlug", v)}
      />
      <Field label="Filters">
        <div className="gap-1 flex flex-col">
          {filterEntries.map(([k, v]) => (
            <div key={k} className="gap-1 flex items-center">
              <Input
                className="h-6 text-xs flex-1"
                placeholder="key"
                value={k}
                onChange={(e) => updateFilterKey(k, e.target.value)}
              />
              <Input
                className="h-6 text-xs flex-1"
                placeholder="value"
                value={typeof v === "string" ? v : String(v)}
                onChange={(e) => updateFilterValue(k, e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={() => removeFilter(k)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs mt-1 w-full"
            onClick={addFilter}
          >
            <Plus className="size-3 mr-1" />
            Add filter
          </Button>
        </div>
      </Field>
    </>
  );
}

function InboundCallTriggerForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const raw = node.params.phoneNumberId;
  const value = typeof raw === "string" ? raw : "";

  return (
    <TextInput
      label="Phone number ID"
      value={value}
      onChange={(v) => p("phoneNumberId", v.length > 0 ? v : null)}
      placeholder="Any number (leave blank)"
    />
  );
}

function deriveComposioApp(toolName: string): string | null {
  if (!toolName) return null;
  const prefix = toolName.split("_")[0]?.toLowerCase();
  return prefix ?? null;
}

function ToolCallForm({
  node,
  nodeTypesById,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  nodeTypesById?: ReadonlyMap<string, string>;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  const { data: integrations } = useComposioAppsQuery();

  const mcpServerId = str(node.params, "mcpServerId", "composio");
  const isComposio = mcpServerId === "composio" || mcpServerId === "";
  const composioApp =
    str(node.params, "composioApp") || deriveComposioApp(str(node.params, "toolName")) || "";
  const toolName = str(node.params, "toolName");

  const selectedIntegration = integrations?.find((i) => i.slug === composioApp) ?? null;
  const toolOptions = (selectedIntegration?.tools ?? []).map((t) => ({
    value: t.slug,
    label: `${t.slug}`,
  }));

  const appOptions = (integrations ?? []).map((i) => ({ value: i.slug, label: i.name }));

  function handleAppChange(newSlug: string) {
    onUpdate({ params: { ...node.params, composioApp: newSlug, toolName: "" } });
  }

  function handleToolChange(newTool: string) {
    onUpdate({ params: { ...node.params, toolName: newTool } });
  }

  return (
    <>
      <SelectInput
        label="Server"
        value={isComposio ? "composio" : "custom"}
        options={[
          { value: "composio", label: "Composio (connected apps)" },
          { value: "custom", label: "Custom MCP server" },
        ]}
        onChange={(v) => p("mcpServerId", v === "composio" ? "composio" : "")}
      />
      {isComposio ? (
        <>
          <Field label="App">
            <Select value={composioApp} onValueChange={handleAppChange}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select an app…" />
              </SelectTrigger>
              <SelectContent>
                {appOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {composioApp && (
            <Field label="Tool">
              {toolOptions.length > 0 ? (
                <Select value={toolName} onValueChange={handleToolChange}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select a tool…" />
                  </SelectTrigger>
                  <SelectContent>
                    {toolOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-7 text-xs"
                  value={toolName}
                  placeholder="e.g. SLACK_CREATE_MESSAGE"
                  onChange={(e) => handleToolChange(e.target.value)}
                />
              )}
            </Field>
          )}
        </>
      ) : (
        <>
          <TextInput
            label="MCP server ID"
            value={mcpServerId}
            onChange={(v) => p("mcpServerId", v)}
            placeholder="e.g. my-server-id"
          />
          <TextInput
            label="Tool name"
            value={toolName}
            onChange={(v) => p("toolName", v)}
            placeholder="e.g. create_issue"
          />
        </>
      )}
      <TextareaInput
        label="Parameters (JSON)"
        value={jsonText(node.params.parameters)}
        onChange={(v) => {
          try {
            p("parameters", v.trim() ? JSON.parse(v) : {});
          } catch {
            // let user finish typing
          }
        }}
        placeholder="{}"
        mono
        warnings={lintParamsObjectExpressions(
          asObj(node.params.parameters),
          nodeTypesById ?? new Map(),
        )}
      />
    </>
  );
}

function KindForm({
  node,
  workflowId,
  nodeTypesById,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  workflowId?: string;
  nodeTypesById?: ReadonlyMap<string, string>;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  switch (node.type) {
    case "trigger.manual":
      return <ManualTriggerForm />;
    case "trigger.cron":
      return <CronTriggerForm node={node} onUpdate={onUpdate} />;
    case "trigger.webhook":
      return <WebhookTriggerForm node={node} workflowId={workflowId} onUpdate={onUpdate} />;
    case "trigger.app_event":
      return <AppEventTriggerForm node={node} onUpdate={onUpdate} />;
    case "trigger.inbound_call":
      return <InboundCallTriggerForm node={node} onUpdate={onUpdate} />;
    case "ai.agent":
      return <AgentForm node={node} nodeTypesById={nodeTypesById} onUpdate={onUpdate} />;
    case "ai.voice_agent":
      return <VoiceAgentForm node={node} onUpdate={onUpdate} />;
    case "ai.language_model":
      return <LanguageModelForm node={node} onUpdate={onUpdate} />;
    case "ai.memory":
      return <MemoryForm node={node} nodeTypesById={nodeTypesById} onUpdate={onUpdate} />;
    case "ai.retriever":
      return <RetrieverForm node={node} onUpdate={onUpdate} />;
    case "ai.output_parser":
      return <OutputParserForm node={node} onUpdate={onUpdate} />;
    case "core.tool_call":
      return <ToolCallForm node={node} nodeTypesById={nodeTypesById} onUpdate={onUpdate} />;
    case "core.http_request":
      return <HttpRequestForm node={node} nodeTypesById={nodeTypesById} onUpdate={onUpdate} />;
    case "core.code":
      return <CodeForm node={node} onUpdate={onUpdate} />;
    case "flow.if":
      return <IfForm node={node} onUpdate={onUpdate} />;
    case "flow.filter":
      return <FilterForm node={node} onUpdate={onUpdate} />;
    case "flow.switch":
      return <SwitchForm node={node} onUpdate={onUpdate} />;
    case "flow.loop":
      return <LoopForm node={node} nodeTypesById={nodeTypesById} onUpdate={onUpdate} />;
    case "flow.wait":
      return <WaitForm node={node} onUpdate={onUpdate} />;
    case "flow.merge":
      return (
        <InfoPanel>Collects all branch outputs and passes them downstream as an array.</InfoPanel>
      );
    case "flow.noop":
      return (
        <InfoPanel>Passes data through unchanged. Use as a placeholder connection point.</InfoPanel>
      );
    case "flow.stop":
      return <InfoPanel>Halts the run at this point. No downstream nodes will execute.</InfoPanel>;
    case "transform":
      return <TransformForm node={node} nodeTypesById={nodeTypesById} onUpdate={onUpdate} />;
    case "human.review":
      return <HumanReviewForm node={node} onUpdate={onUpdate} />;
    case "editor.sticky_note":
      return <StickyNoteForm node={node} onUpdate={onUpdate} />;
    default:
      return (
        <p className="text-xs text-muted-foreground">
          Configuration panel for <span className="font-mono">{node.type}</span> is coming soon.
        </p>
      );
  }
}

export function NodeInspector({
  node,
  workflowId,
  validationErrors,
  nodeTypesById,
  onUpdate,
  onClose,
}: NodeInspectorProps) {
  return (
    <div className="w-72 flex h-full shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-background">
      {/* Header */}
      <div className="gap-2 p-3 flex items-center border-b border-border">
        <NodeIcon kind={node.type} size={14} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold truncate font-mono text-muted-foreground">
            {node.type}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={onClose}>
          <X className="size-3" />
        </Button>
      </div>

      {/* Validation errors */}
      {validationErrors && validationErrors.length > 0 && (
        <div className="mx-3 mt-3 p-2 rounded-md border border-destructive/30 bg-destructive/5">
          {validationErrors.map((err, i) => (
            <p key={i} className="text-[10px] text-destructive">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Kind-specific form */}
      <div className="min-h-0 px-3 py-3 flex-1 overflow-y-auto">
        <div className="gap-3 flex flex-col">
          <KindForm
            node={node}
            workflowId={workflowId}
            nodeTypesById={nodeTypesById}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </div>
  );
}
