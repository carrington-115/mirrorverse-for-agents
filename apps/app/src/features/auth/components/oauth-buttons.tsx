"use client";

import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface OAuthButtonsProps {
  redirectPath?: string;
  disabled?: boolean;
}

export function OAuthButtons({ redirectPath = "/mirropilot", disabled }: OAuthButtonsProps) {
  const [pending, setPending] = useState<"google" | null>(null);

  const handleOAuth = async (provider: "google") => {
    const supabase = createClient();
    setPending(provider);
    try {
      const next = encodeURIComponent(redirectPath);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        },
      });
      if (error) {
        toast.error(error.message);
        setPending(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start OAuth flow");
      setPending(null);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 w-full cursor-pointer"
      onClick={() => handleOAuth("google")}
      disabled={disabled || pending !== null}
    >
      {pending === "google" ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FaGoogle className="mr-2" />
      )}
      Continue with Google
    </Button>
  );
}
