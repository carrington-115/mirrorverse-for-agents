"use client";

import z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companyRegistrationSchema } from "@/lib/schema";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { industries } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useOrgSetup } from "@/store/use-org-setup";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { handleCreateOrganization, handleUpdateOwner } from "../actions";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CompanyRegistrationForm() {
  type CompanyRegistrationFormProps = z.infer<typeof companyRegistrationSchema>;
  const {
    handleSubmit,
    control,
    formState: { errors: _errors, isSubmitting },
    setValue: _setValue,
  } = useForm<CompanyRegistrationFormProps>({
    defaultValues: {
      name: "",
      companyName: "",
      website: "",
      industry: "",
      size: 10,
    },
    resolver: zodResolver(companyRegistrationSchema),
  });
  const { setOrganization } = useOrgSetup();
  const router = useRouter();
  const { user } = useSupabaseUser();

  const onSubmit = async (data: CompanyRegistrationFormProps) => {
    if (!user || !user.id) {
      toast.error("Session expired. Please reload the page.");
      return;
    }
    const userId = user.id;

    try {
      setOrganization(true);

      const organization = await handleCreateOrganization(
        data.companyName,
        data.website,
        data.industry,
        data.size.toString(),
        userId,
        userId,
      );

      if (!organization.success) {
        throw new Error("Failed to create organization");
      }

      const orgId = organization.data.id;

      const updatedOwner = await handleUpdateOwner(userId, data.name);
      if (!updatedOwner.success) {
        throw new Error("Failed to update owner");
      }

      router.push(`/account-setup/org-setup/apps-setup?orgId=${orgId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="items-left mt-(--lg) flex w-[380px] flex-col gap-(--sm)"
      >
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Name</FieldLabel>
              <Input
                {...field}
                type="text"
                placeholder="Name"
                autoComplete="off"
                className="h-10 w-full"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="companyName"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Company Name</FieldLabel>
              <Input
                {...field}
                type="text"
                placeholder="Company Name"
                autoComplete="off"
                className="h-10 w-full"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="website"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Website</FieldLabel>
              <Input
                {...field}
                type="text"
                placeholder="Website"
                autoComplete="off"
                className="h-10 w-full"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="size"
          control={control}
          render={({ field, fieldState }) => (
            <div className="gap-3 flex w-full flex-col">
              <div className="gap-2 flex items-center justify-between">
                <Label htmlFor="size-slider">Company size</Label>
                <span className="text-sm text-muted-foreground">{field.value}+ members</span>
              </div>
              <Slider
                value={[field.value]}
                onValueChange={(val) => field.onChange(val[0])}
                min={0}
                max={100}
                step={10}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </div>
          )}
        />
        <Controller
          name="industry"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="w-full">
              <FieldLabel>Industry</FieldLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry.value} value={industry.value}>
                      {industry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button type="submit" className="w-full cursor-pointer">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </form>
    </div>
  );
}
