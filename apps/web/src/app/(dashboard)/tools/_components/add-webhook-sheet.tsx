"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tool } from "@/lib/types";

interface HeaderEntry {
  id: string;
  type: string;
  name: string;
}

interface ParamEntry {
  id: string;
  type: string;
  identifier: string;
  required: boolean;
  valueType: string;
  description: string;
}

interface AddWebhookSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (tool: Tool) => void;
  editingTool?: Tool;
  onSave?: (tool: Tool) => void;
}

export function AddWebhookSheet({
  open,
  onOpenChange,
  onAdd,
  editingTool,
  onSave,
}: AddWebhookSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [responseTimeout, setResponseTimeout] = useState([50]);
  const [disableInterruptions, setDisableInterruptions] = useState(false);
  const [_preSpeech, setPreSpeech] = useState("auto");
  const [_executionMode, setExecutionMode] = useState("immediate");
  const [authConnector, setAuthConnector] = useState("none");
  const [headers, setHeaders] = useState<HeaderEntry[]>([]);
  const [params, setParams] = useState<ParamEntry[]>([]);

  useEffect(() => {
    if (editingTool) {
      setName(editingTool.name);
      setDescription(editingTool.description);
      setMethod(editingTool.method ?? "GET");
      setUrl(editingTool.url ?? "");
      setResponseTimeout([50]);
      setDisableInterruptions(false);
      setAuthConnector("none");
      setHeaders([]);
      setParams([]);
    }
  }, [editingTool]);

  function addHeader() {
    setHeaders((prev) => [...prev, { id: crypto.randomUUID(), type: "secret", name: "" }]);
  }

  function updateHeader(id: string, field: keyof Omit<HeaderEntry, "id">, value: string) {
    setHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  }

  function removeHeader(id: string) {
    setHeaders((prev) => prev.filter((h) => h.id !== id));
  }

  function addParam() {
    setParams((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "string",
        identifier: "",
        required: false,
        valueType: "llm_prompt",
        description: "",
      },
    ]);
  }

  function updateParam(id: string, field: keyof Omit<ParamEntry, "id">, value: string | boolean) {
    setParams((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function removeParam(id: string) {
    setParams((prev) => prev.filter((p) => p.id !== id));
  }

  function handleSubmit() {
    if (!name.trim()) return;
    // TODO: persist headers/params to backend
    if (editingTool && onSave) {
      onSave({
        ...editingTool,
        name: name.trim(),
        description: description.trim(),
        method,
        url: url.trim(),
      });
    } else {
      onAdd({
        id: crypto.randomUUID(),
        name: name.trim(),
        type: "webhook",
        description: description.trim(),
        method,
        url: url.trim(),
        status: "active",
        createdAt: new Date(),
        iconKey: "webhook",
      });
    }
    onOpenChange(false);
  }

  function resetForm() {
    setName("");
    setDescription("");
    setMethod("GET");
    setUrl("");
    setResponseTimeout([50]);
    setDisableInterruptions(false);
    setPreSpeech("auto");
    setExecutionMode("immediate");
    setAuthConnector("none");
    setHeaders([]);
    setParams([]);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 gap-0 flex max-w-full min-w-[600px] flex-col">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <SheetTitle className="text-xl font-semibold">
            {editingTool ? "Edit WebHook tool" : "Add new WebHook tool"}
          </SheetTitle>
        </SheetHeader>

        <div className="p-2 flex flex-1 flex-col gap-(--md,16px) overflow-y-auto">
          {/* Section 1 — Tool config */}
          <div className="p-5 rounded-2xl border border-border bg-background">
            <div className="p-4 gap-3 flex flex-col rounded-2xl border border-border bg-secondary">
              <div className="gap-1 flex flex-col">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
              </div>

              <div className="gap-1 flex flex-col">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe how and when you want the LLM to call the tool"
                  className="h-[76px] resize-none"
                />
              </div>

              <div className="gap-3 flex items-end">
                <div className="gap-1 flex w-[107px] flex-col">
                  <Label>Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="gap-1 flex flex-1 flex-col">
                  <Label>URL</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/webhook"
                  />
                </div>
              </div>

              <div className="gap-2 flex flex-col">
                <Label>Response timeout</Label>
                <Slider
                  value={responseTimeout}
                  onValueChange={setResponseTimeout}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div className="gap-1 flex flex-col">
                <Label>Disable interruptions</Label>
                <div className="gap-2 flex items-center">
                  <Checkbox
                    checked={disableInterruptions}
                    onCheckedChange={(v) => setDisableInterruptions(!!v)}
                    id="disable-interruptions"
                  />
                  <label
                    htmlFor="disable-interruptions"
                    className="text-sm cursor-pointer text-muted-foreground"
                  >
                    Select this option to disable interruptions while this tool is running
                  </label>
                </div>
              </div>

              <div className="gap-1 flex flex-col">
                <Label>Setup Authentication connectors</Label>
                <Select value={authConnector} onValueChange={setAuthConnector}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2 — Headers */}
          <div className="p-4 gap-3 flex flex-col rounded-2xl border border-border bg-background">
            <div className="flex items-start justify-between">
              <div className="gap-0.5 flex flex-col">
                <p className="text-sm font-medium text-foreground">Headers</p>
                <p className="text-sm text-muted-foreground">
                  Define headers that will be sent with the request
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addHeader}>
                <Plus className="size-3.5" />
                Add headers
              </Button>
            </div>

            {headers.length > 0 && (
              <div className="gap-2 flex flex-col">
                {headers.map((header) => (
                  <div
                    key={header.id}
                    className="p-3 gap-3 flex flex-col rounded-2xl border border-border bg-accent"
                  >
                    <div className="gap-3 flex items-end">
                      <div className="gap-1 flex w-[107px] flex-col">
                        <Label>Type</Label>
                        <Select
                          value={header.type}
                          onValueChange={(v) => updateHeader(header.id, "type", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="secret">Secret</SelectItem>
                            <SelectItem value="static">Static</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="gap-1 flex flex-1 flex-col">
                        <Label>Name</Label>
                        <Input
                          value={header.name}
                          onChange={(e) => updateHeader(header.id, "name", e.target.value)}
                          placeholder="Header name"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeHeader(header.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3 — Query Parameters */}
          <div className="p-4 gap-3 flex flex-col rounded-2xl border border-border bg-background">
            <div className="flex items-start justify-between">
              <div className="gap-0.5 flex flex-col">
                <p className="text-sm font-medium text-foreground">Query parameters</p>
                <p className="text-sm text-muted-foreground">
                  Define parameters that will be collected by the LLM and sent as the query of the
                  request.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addParam}>
                <Plus className="size-3.5" />
                Add param
              </Button>
            </div>

            {params.length > 0 && (
              <div className="gap-2 flex flex-col">
                {params.map((param) => (
                  <div
                    key={param.id}
                    className="p-3 gap-3 flex flex-col rounded-2xl border border-border bg-accent"
                  >
                    <div className="gap-3 flex items-end">
                      <div className="gap-1 flex w-[107px] flex-col">
                        <Label>Type</Label>
                        <Select
                          value={param.type}
                          onValueChange={(v) => updateParam(param.id, "type", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="gap-1 flex flex-1 flex-col">
                        <Label>Identifier</Label>
                        <Input
                          value={param.identifier}
                          onChange={(e) => updateParam(param.id, "identifier", e.target.value)}
                          placeholder="param_name"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeParam(param.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    <div className="gap-2 flex items-center">
                      <Checkbox
                        checked={param.required}
                        onCheckedChange={(v) => updateParam(param.id, "required", !!v)}
                        id={`required-${param.id}`}
                      />
                      <label
                        htmlFor={`required-${param.id}`}
                        className="text-sm cursor-pointer text-muted-foreground"
                      >
                        Required
                      </label>
                    </div>

                    <div className="gap-1 flex flex-col">
                      <Label>Value type</Label>
                      <Select
                        value={param.valueType}
                        onValueChange={(v) => updateParam(param.id, "valueType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="llm_prompt">LLM Prompt</SelectItem>
                          <SelectItem value="static">Static</SelectItem>
                          <SelectItem value="dynamic">Dynamic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="gap-1 flex flex-col">
                      <Label>Description</Label>
                      <Textarea
                        value={param.description}
                        onChange={(e) => updateParam(param.id, "description", e.target.value)}
                        placeholder="This field will be passed to the LLM and should describe in detail how to extract the data from the transcript."
                        className="h-[76px] resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 gap-2 flex border-t border-border">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            {editingTool ? "Save changes" : "Add tool"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
