"use client";

import { useState } from "react";
import { FileText, Mail, MessageCircle, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  type ContentBodyToolPart,
  type ContentBodyContentType,
  readContentBodyOutput,
} from "@/features/chat/lib/content-body-tools";

const CONTENT_TYPE_META: Record<
  ContentBodyContentType,
  { label: string; icon: React.ElementType; hasSubject: boolean }
> = {
  email: { label: "Email", icon: Mail, hasSubject: true },
  slack: { label: "Slack", icon: MessageCircle, hasSubject: false },
  sms: { label: "SMS", icon: MessageSquare, hasSubject: false },
  generic: { label: "Message", icon: FileText, hasSubject: false },
};

interface ContentBodyCardProps {
  part: ContentBodyToolPart;
  onConfirm?: (contentType: string, subject: string | undefined, body: string) => void;
}

export function ContentBodyCard({ part, onConfirm }: ContentBodyCardProps) {
  const output = readContentBodyOutput(part);

  const contentType = output?.contentType ?? "generic";
  const meta = CONTENT_TYPE_META[contentType];
  const Icon = meta.icon;

  const [subject, setSubject] = useState(output?.suggestedSubject ?? "");
  const [body, setBody] = useState(output?.suggestedBody ?? "");

  const interactive = Boolean(onConfirm);
  const canConfirm = body.trim().length > 0;

  const handleConfirm = () => {
    if (!onConfirm || !canConfirm) return;
    onConfirm(contentType, meta.hasSubject ? subject : undefined, body.trim());
  };

  return (
    <div className="my-2 shadow-sm overflow-hidden rounded-xl border border-border bg-background">
      {/* Header */}
      <div className="gap-2 px-4 py-3 flex items-center border-b border-border bg-muted/30">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium min-w-0 flex-1 truncate">
          {output?.description ?? "Compose content"}
        </span>
        <Badge variant="secondary" className="text-xs shrink-0">
          {meta.label}
        </Badge>
      </div>

      {/* Fields */}
      <div className="gap-3 px-4 py-4 flex flex-col">
        {meta.hasSubject && (
          <div className="gap-1.5 flex flex-col">
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject line…"
              readOnly={!interactive}
              className="text-sm"
            />
          </div>
        )}
        <div className="gap-1.5 flex flex-col">
          <Label className="text-xs text-muted-foreground">Body</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message here…"
            readOnly={!interactive}
            rows={6}
            className="text-sm resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      {interactive && (
        <div className="gap-3 px-4 py-3 flex items-center justify-between border-t border-border bg-muted/30">
          <span className="text-xs text-muted-foreground">{body.length} characters</span>
          <Button size="sm" onClick={handleConfirm} disabled={!canConfirm}>
            Use this content
          </Button>
        </div>
      )}
    </div>
  );
}
