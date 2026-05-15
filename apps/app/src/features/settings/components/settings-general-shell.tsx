"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Field, FieldLabel } from "@/components/ui/field";

export function GeneralSettingsShell() {
  const [workspaceName, setWorkspaceName] = useState("");
  const [website, setWebsite] = useState("");

  const handleSave = () => {
    toast.info("Workspace settings — coming soon");
  };

  return (
    <div className="gap-6 max-w-2xl flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">General</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace name, slug, and other general settings.
        </p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Workspace name</CardTitle>
          <CardDescription>The display name for your workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="workspace-name">Name</FieldLabel>
            <Input
              id="workspace-name"
              placeholder="My Workspace"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </Field>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} size="sm" disabled={workspaceName.trim() === ""}>
            Save
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace slug</CardTitle>
          <CardDescription>
            Your workspace URL identifier. Contact support to change it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="workspace-slug">Slug</FieldLabel>
            <Input
              id="workspace-slug"
              defaultValue="my-workspace"
              readOnly
              className="cursor-not-allowed opacity-60"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Website</CardTitle>
          <CardDescription>Your company or personal website URL.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="workspace-website">URL</FieldLabel>
            <Input
              id="workspace-website"
              placeholder="https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </Field>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} size="sm" disabled={website.trim() === ""}>
            Save
          </Button>
        </CardFooter>
      </Card>

      <Card className="ring-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Permanently delete your workspace and all its data.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4 text-muted-foreground">
            This action cannot be undone. To delete this workspace, email{" "}
            <a href="mailto:support@mirrorverse.ai" className="underline underline-offset-4">
              support@mirrorverse.ai
            </a>
            .
          </p>
          <Button variant="destructive" disabled size="sm">
            Delete workspace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
