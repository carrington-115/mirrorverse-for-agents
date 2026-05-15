"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Field, FieldLabel } from "@/components/ui/field";
import { useSupabaseUser } from "@/features/auth/hooks/use-supabase-user";
import { createClient } from "@/lib/supabase/client";

export function ProfileSettingsShell() {
  const { user } = useSupabaseUser();
  const metadata = user?.user_metadata ?? {};
  const storedFullName = typeof metadata.full_name === "string" ? metadata.full_name : "";
  const storedName = typeof metadata.name === "string" ? metadata.name : "";
  const email = user?.email ?? "";
  const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : "";
  const fallbackAvatar = typeof metadata.picture === "string" ? metadata.picture : "";
  const displayAvatar = avatarUrl || fallbackAvatar;
  const initialName = storedFullName || storedName;

  const [name, setName] = useState("");
  const isDirty = useRef(false);
  const [isSaving, startSave] = useTransition();

  useEffect(() => {
    if (initialName && !isDirty.current) {
      setName(initialName);
    }
  }, [initialName]);

  const handleNameChange = (value: string) => {
    isDirty.current = true;
    setName(value);
  };

  const handleSave = () => {
    startSave(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
      if (error) {
        toast.error("Failed to update profile");
      } else {
        isDirty.current = false;
        toast.success("Profile updated");
      }
    });
  };

  return (
    <div className="gap-6 max-w-2xl flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal profile information.</p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Your profile picture across Mirrorverse.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="gap-4 flex items-center">
            <button
              type="button"
              className="group relative rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => toast.info("Avatar upload — coming soon")}
            >
              <Avatar className="size-16">
                <AvatarImage src={displayAvatar} />
                <AvatarFallback className="text-lg">
                  {(name || email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="inset-0 bg-black/40 absolute flex items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100">
                <Pencil className="size-4 text-white" />
              </span>
            </button>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Avatar upload — coming soon")}
              >
                Change avatar
              </Button>
              <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG or GIF. Max 2 MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display name</CardTitle>
          <CardDescription>How your name appears to others in your workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="display-name">Name</FieldLabel>
            <Input
              id="display-name"
              placeholder="Your name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </Field>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} size="sm" disabled={isSaving || name === initialName}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email address</CardTitle>
          <CardDescription>
            Your email is managed through your authentication provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="profile-email">Email</FieldLabel>
            <Input
              id="profile-email"
              type="email"
              value={email}
              readOnly
              className="cursor-not-allowed opacity-60"
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="ring-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4 text-muted-foreground">
            This action cannot be undone. To delete your account, please{" "}
            <a href="mailto:support@mirrorverse.ai" className="underline underline-offset-4">
              contact support
            </a>
            .
          </p>
          <Button variant="destructive" disabled size="sm">
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
