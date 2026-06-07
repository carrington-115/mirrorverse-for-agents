"use client";

import { formatDistanceToNow } from "date-fns";
import { Laptop, Monitor, Smartphone, Tablet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { signOutAllAction } from "@/features/auth/actions/sign-out-all";
import { useActiveSessionQuery } from "../api/queries";

function parseUserAgent(ua: string): {
  browser: string;
  os: string;
  deviceType: "mobile" | "tablet" | "desktop";
} {
  const isMobile = /Mobi|Android(?!.*Tablet)|iPhone/i.test(ua);
  const isTablet = /iPad|Android.*Tablet|Tablet/i.test(ua);

  let browser = "Unknown browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";

  let os = "Unknown OS";
  if (/iPhone/i.test(ua)) os = "iOS";
  else if (/iPad/i.test(ua)) os = "iPadOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
  return { browser, os, deviceType };
}

function DeviceIcon({ deviceType }: { deviceType: "mobile" | "tablet" | "desktop" }) {
  if (deviceType === "mobile") return <Smartphone className="size-5 text-muted-foreground" />;
  if (deviceType === "tablet") return <Tablet className="size-5 text-muted-foreground" />;
  // Distinguish laptop-like user agents
  return typeof navigator !== "undefined" && /Macintosh|MacBook/i.test(navigator.userAgent) ? (
    <Laptop className="size-5 text-muted-foreground" />
  ) : (
    <Monitor className="size-5 text-muted-foreground" />
  );
}

export function SecuritySettingsShell() {
  const { data: session, isLoading } = useActiveSessionQuery();

  const parsed = typeof navigator !== "undefined" ? parseUserAgent(navigator.userAgent) : null;

  const lastActive = session?.user?.last_sign_in_at
    ? formatDistanceToNow(new Date(session.user.last_sign_in_at), { addSuffix: true })
    : null;

  return (
    <div className="gap-6 max-w-2xl flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Security</h1>
        <p className="text-sm text-muted-foreground">
          Manage active sessions and connected devices.
        </p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>Devices currently signed in to your account.</CardDescription>
          <CardAction>
            <form action={signOutAllAction}>
              <Button variant="outline" size="sm" type="submit">
                Sign out all devices
              </Button>
            </form>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="gap-3 py-2 flex flex-col">
              <div className="gap-3 flex items-center">
                <Skeleton className="size-10 rounded-full" />
                <div className="gap-1.5 flex flex-1 flex-col">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </div>
          ) : session && parsed ? (
            <div className="gap-0 flex flex-col divide-y divide-border">
              <div className="gap-3 py-3 flex items-center">
                <div className="p-2.5 shrink-0 rounded-full bg-muted">
                  <DeviceIcon deviceType={parsed.deviceType} />
                </div>
                <div className="gap-0.5 min-w-0 flex flex-1 flex-col">
                  <div className="gap-2 flex items-center">
                    <span className="text-sm font-medium">
                      {parsed.browser} on {parsed.os}
                    </span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">
                      This device
                    </Badge>
                  </div>
                  {lastActive && (
                    <span className="text-xs text-muted-foreground">Last active {lastActive}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="gap-3 py-6 flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-muted">
                <Monitor className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No active sessions found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
