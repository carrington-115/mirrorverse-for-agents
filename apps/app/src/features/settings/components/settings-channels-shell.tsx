"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MOCK_PHONE_NUMBERS, MOCK_WHATSAPP_CHANNELS } from "@/lib/data";

export function ChannelsSettingsShell() {
  return (
    <div className="gap-6 max-w-2xl flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Channels</h1>
        <p className="text-sm text-muted-foreground">
          Configure the channels where your agents are deployed.
        </p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="gap-2 flex items-center">
            <Phone className="size-4" />
            Phone
          </CardTitle>
          <CardDescription>Voice agent phone numbers.</CardDescription>
          <CardAction>
            <Badge variant="secondary">{MOCK_PHONE_NUMBERS.length} numbers</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-border">
            {MOCK_PHONE_NUMBERS.map((num) => (
              <div key={num.id} className="py-2.5 text-sm flex items-center justify-between">
                <div>
                  <p className="font-medium">{num.number}</p>
                  {num.description && (
                    <p className="text-xs text-muted-foreground">{num.description}</p>
                  )}
                </div>
                <Badge
                  variant={num.status === "active" ? "outline" : "secondary"}
                  className="capitalize"
                >
                  {num.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/deploy/phone">
              View in Deploy
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info("Add phone number — coming soon")}
          >
            Add number
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="gap-2 flex items-center">
            <MessageCircle className="size-4" />
            WhatsApp
          </CardTitle>
          <CardDescription>WhatsApp agent numbers.</CardDescription>
          <CardAction>
            <Badge variant="secondary">{MOCK_WHATSAPP_CHANNELS.length} numbers</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-border">
            {MOCK_WHATSAPP_CHANNELS.map((channel) => (
              <div key={channel.id} className="py-2.5 text-sm flex items-center justify-between">
                <div>
                  <p className="font-medium">{channel.phoneNumber}</p>
                  <p className="text-xs text-muted-foreground">{channel.displayName}</p>
                </div>
                <Badge
                  variant={channel.status === "active" ? "outline" : "secondary"}
                  className="capitalize"
                >
                  {channel.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/deploy/whatsapp">
              View in Deploy
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info("Add WhatsApp number — coming soon")}
          >
            Add number
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
