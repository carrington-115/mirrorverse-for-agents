"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, X } from "lucide-react";

const emailSchema = z.string().email();

export default function SendInviteForm() {
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const orgId = useSearchParams().get("orgId");

  const addEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    const result = emailSchema.safeParse(trimmed);
    if (!result.success) {
      toast.error(`"${trimmed}" is not a valid email`);
      return;
    }

    if (emails.includes(trimmed)) {
      toast.error(`"${trimmed}" has already been added`);
      return;
    }

    setEmails((prev) => [...prev, trimmed]);
    setInputValue("");
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails((prev) => prev.filter((email) => email !== emailToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addEmail(inputValue);
    }

    if (e.key === "Backspace" && inputValue === "" && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const pastedEmails = pastedText.split(/[\s,;]+/).filter(Boolean);
    pastedEmails.forEach(addEmail);
  };

  const onSubmit = () => {
    if (emails.length === 0) {
      toast.error("Please add at least one email to invite");
      return;
    }

    setIsPending(true);
    try {
      console.log("Inviting emails:", emails);
      toast.success(`${emails.length} invite(s) sent`);
      //   router.push(
      //     orgId
      //       ? `/account-setup/org-setup/apps-setup?orgId=${orgId}`
      //       : "/account-setup/org-setup/apps-setup",
      //   );
    } catch (error) {
      console.log(error);
      toast.error("Failed to send invites");
    } finally {
      setIsPending(false);
    }
  };

  const onSkip = () => {
    try {
      router.push(`/dashboard?orgId=${orgId}`);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <Card className="mt-[20px] w-[648px]">
        <CardHeader>
          <CardTitle>Invite Your Team</CardTitle>
          <CardDescription>
            Bring your teammates into mirrroverse, assign roles, and collaborate seamlessly on
            agents and workflows together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex min-h-[44px] cursor-text flex-wrap content-center items-center gap-(--sm) rounded-(--radius) border border-(--border-3) bg-(--accent-0) p-[10px]"
            onClick={() => inputRef.current?.focus()}
          >
            {emails.map((email) => (
              <Badge
                key={email}
                variant="secondary"
                className="text-xs font-semibold gap-(--2xs) rounded-full bg-(--accent-2) px-(--xs) py-(--3xs)"
              >
                {email}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEmail(email);
                  }}
                  className="ml-0.5 cursor-pointer transition-colors hover:text-destructive"
                  aria-label={`Remove ${email}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            <input
              ref={inputRef}
              type="email"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={() => {
                if (inputValue.trim()) addEmail(inputValue);
              }}
              placeholder={emails.length === 0 ? "Enter email" : ""}
              className="text-sm font-medium min-w-[120px] flex-1 border-none bg-transparent text-muted-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-(--xs) border-none bg-transparent">
          <Button type="button" className="w-full cursor-pointer" onClick={onSubmit}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send invites
          </Button>
          <Button
            type="button"
            variant={"secondary"}
            onClick={onSkip}
            className="w-full cursor-pointer"
          >
            Skip to dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
