"use client";

import { KeyRound, Monitor } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function SecuritySettingsShell() {
  const handleCreateKey = () => {
    toast.info("API key management — coming soon");
  };

  return (
    <div className="gap-6 max-w-2xl flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Security</h1>
        <p className="text-sm text-muted-foreground">Manage API keys and active sessions.</p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>API keys</CardTitle>
          <CardDescription>API keys grant programmatic access to your workspace.</CardDescription>
          <CardAction>
            <Button size="sm" onClick={handleCreateKey}>
              Create API key
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="gap-3 py-6 flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-muted">
              <KeyRound className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No API keys yet.</p>
            <p className="text-xs max-w-[260px] text-muted-foreground">
              Use API keys to connect external tools and automate workflows.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>Devices currently signed in to your account.</CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Session management — coming soon")}
            >
              Sign out all devices
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="gap-3 py-6 flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-muted">
              <Monitor className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Session management coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
