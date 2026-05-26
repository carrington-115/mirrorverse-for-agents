"use client";

import { X } from "lucide-react";
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
import { NodeIcon } from "@/features/workflows/lib/node-icon";
import type { WorkflowNodeInput } from "@mirrorverse/agent/schemas";

interface NodeInspectorProps {
  readonly node: WorkflowNodeInput;
  readonly validationErrors?: readonly string[];
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

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Input
        className="h-7 text-xs"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function TextareaInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Textarea
        className="text-xs min-h-[80px] resize-none"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
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
  options: readonly { value: string; label: string }[];
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
              {o.label}
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

// Returns an updater that patches a single params key
function useParamUpdater(node: WorkflowNodeInput, onUpdate: NodeInspectorProps["onUpdate"]) {
  return (key: string, value: unknown) => onUpdate({ params: { ...node.params, [key]: value } });
}

// --- Per-kind forms ---

function ManualTriggerForm() {
  return (
    <p className="text-xs text-muted-foreground">
      Triggered manually from the editor or an API call. No configuration needed.
    </p>
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
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
  return (
    <>
      <TextInput
        label="Endpoint slug"
        value={str(node.params, "endpointSlug")}
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
    </>
  );
}

function AgentForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  const p = useParamUpdater(node, onUpdate);
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
        value={str(node.params, "userPromptTemplate")}
        onChange={(v) => p("userPromptTemplate", v)}
        placeholder="Process the input: {{ $json }}"
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
          { value: "claude-opus-4-7", label: "Claude Opus 4.7" },
          { value: "gpt-4o-mini", label: "GPT-4o mini" },
          { value: "gpt-4o", label: "GPT-4o" },
          { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
        ]}
        onChange={(v) => p("modelConnection", { ...mc, model: v })}
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
  const opts = asObj(node.params.options);
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
        options={[
          { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
          { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
          { value: "claude-opus-4-7", label: "Claude Opus 4.7" },
          { value: "gpt-4o-mini", label: "GPT-4o mini" },
          { value: "gpt-4o", label: "GPT-4o" },
          { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
        ]}
        onChange={(v) => p("model", v)}
      />
      <Field label="Temperature">
        <Input
          className="h-7 text-xs"
          type="number"
          min={0}
          max={2}
          step={0.1}
          value={num(opts, "temperature", 0.7)}
          onChange={(e) =>
            p("options", { ...opts, temperature: parseFloat(e.target.value) || 0.7 })
          }
        />
      </Field>
      <Field label="Max tokens">
        <Input
          className="h-7 text-xs"
          type="number"
          min={1}
          value={num(opts, "maxTokens", 1024)}
          onChange={(e) =>
            p("options", { ...opts, maxTokens: parseInt(e.target.value, 10) || 1024 })
          }
        />
      </Field>
    </>
  );
}

function MemoryForm({
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
    </>
  );
}

function HttpRequestForm({
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
        label="Method"
        value={str(node.params, "method", "GET")}
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
    ? (node.params.conditions as Params[])
    : [];
  const first = conditions[0];
  return (
    <>
      <SelectInput
        label="Combinator"
        value={str(node.params, "combinator", "and")}
        options={[
          { value: "and", label: "All conditions (AND)" },
          { value: "or", label: "Any condition (OR)" },
        ]}
        onChange={(v) => p("combinator", v)}
      />
      {first && (
        <TextInput
          label="Left value"
          value={str(first, "leftValue")}
          onChange={(v) =>
            p(
              "conditions",
              conditions.map((c, i) => (i === 0 ? { ...c, leftValue: v } : c)),
            )
          }
          placeholder="{{ $json.field }}"
        />
      )}
      {first && (
        <SelectInput
          label="Operator"
          value={str(first, "operator", "equals")}
          options={[
            { value: "equals", label: "Equals" },
            { value: "not_equals", label: "Not equals" },
            { value: "contains", label: "Contains" },
            { value: "greater_than", label: "Greater than" },
            { value: "less_than", label: "Less than" },
            { value: "is_empty", label: "Is empty" },
            { value: "is_not_empty", label: "Is not empty" },
          ]}
          onChange={(v) =>
            p(
              "conditions",
              conditions.map((c, i) => (i === 0 ? { ...c, operator: v } : c)),
            )
          }
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
    </>
  );
}

function FallbackForm({ node }: { node: WorkflowNodeInput }) {
  return (
    <p className="text-xs text-muted-foreground">
      Configuration panel for <span className="font-mono">{node.type}</span> is coming soon.
    </p>
  );
}

function KindForm({
  node,
  onUpdate,
}: {
  node: WorkflowNodeInput;
  onUpdate: NodeInspectorProps["onUpdate"];
}) {
  switch (node.type) {
    case "trigger.manual":
      return <ManualTriggerForm />;
    case "trigger.cron":
      return <CronTriggerForm node={node} onUpdate={onUpdate} />;
    case "trigger.webhook":
      return <WebhookTriggerForm node={node} onUpdate={onUpdate} />;
    case "ai.agent":
      return <AgentForm node={node} onUpdate={onUpdate} />;
    case "ai.voice_agent":
      return <VoiceAgentForm node={node} onUpdate={onUpdate} />;
    case "ai.language_model":
      return <LanguageModelForm node={node} onUpdate={onUpdate} />;
    case "ai.memory":
      return <MemoryForm node={node} onUpdate={onUpdate} />;
    case "ai.retriever":
      return <RetrieverForm node={node} onUpdate={onUpdate} />;
    case "core.http_request":
      return <HttpRequestForm node={node} onUpdate={onUpdate} />;
    case "core.code":
      return <CodeForm node={node} onUpdate={onUpdate} />;
    case "flow.if":
      return <IfForm node={node} onUpdate={onUpdate} />;
    case "editor.sticky_note":
      return <StickyNoteForm node={node} onUpdate={onUpdate} />;
    default:
      return <FallbackForm node={node} />;
  }
}

export function NodeInspector({ node, validationErrors, onUpdate, onClose }: NodeInspectorProps) {
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
          <KindForm node={node} onUpdate={onUpdate} />
        </div>
      </div>
    </div>
  );
}
