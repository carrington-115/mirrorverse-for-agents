"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSupabaseUser } from "@/features/auth/hooks/use-supabase-user";
import {
  useRegisterUserMutation,
  useUpdateOwnerMutation,
} from "@/features/onboarding/api/mutations";
import {
  setupSchema,
  type SetupValues,
  HEAR_ABOUT_US_OPTIONS,
  ROLE_OPTIONS,
} from "@/features/onboarding/schemas/setup";

export function SetupForm() {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const registerUser = useRegisterUserMutation();
  const updateOwner = useUpdateOwnerMutation();

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: { name: "", hearAboutUs: "", role: "", otherRole: "" },
  });

  useEffect(() => {
    if (!user) return;
    const googleName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined);
    if (googleName) setValue("name", googleName);
  }, [user, setValue]);

  const selectedRole = watch("role");
  const isPending = isSubmitting || registerUser.isPending || updateOwner.isPending;

  const onSubmit = async (data: SetupValues) => {
    if (!user) {
      toast.error("Session expired. Please sign in again.");
      router.push("/sign-in");
      return;
    }

    try {
      await registerUser.mutateAsync({ userId: user.id, email: user.email ?? "" });

      if (data.name?.trim()) {
        await updateOwner.mutateAsync({ userId: user.id, name: data.name.trim() });
      }

      router.push("/mirropilot");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="gap-8 flex w-full max-w-[480px] flex-col">
      <div className="gap-1 flex flex-col items-center text-center">
        <h1 className="font-semibold text-[24px] leading-(--heading-3-line-height) text-foreground">
          Tell us about yourself
        </h1>
        <p className="text-sm font-normal leading-(--body-1-line-height) text-muted-foreground">
          Help us personalise your experience. You can skip this anytime.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="gap-6 flex flex-col">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Your name
              </label>
              <Input
                {...field}
                id="name"
                placeholder="e.g. Alex Johnson"
                disabled={isPending}
                className="h-10 w-full border-(--border-3)"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="hearAboutUs"
          control={control}
          render={({ field }) => (
            <Field>
              <label htmlFor="hear-about-us" className="text-sm font-medium text-foreground">
                How did you hear about us?
              </label>
              <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                <SelectTrigger id="hear-about-us" className="h-10 w-full border-(--border-3)">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {HEAR_ABOUT_US_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <div className="gap-3 flex flex-col">
          <p className="text-sm font-medium text-foreground">What is your current role?</p>
          <div className="gap-2 flex flex-wrap">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={isPending}
                onClick={() => setValue("role", selectedRole === option.value ? "" : option.value)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-full border transition-colors",
                  selectedRole === option.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {selectedRole === "other" && (
            <Controller
              name="otherRole"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Please describe your role"
                  disabled={isPending}
                  className="h-10 w-full border-(--border-3)"
                />
              )}
            />
          )}
        </div>

        <div className="gap-3 pt-2 flex flex-col items-center">
          <Button type="submit" size="lg" className="w-full cursor-pointer" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>

          <Link
            href="/mirropilot"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip for now &rarr;
          </Link>
        </div>
      </form>
    </div>
  );
}
