"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { appsSetupSchema } from "@/lib/schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { appsList } from "@/lib/data";
import AppSelect from "./app-select";
import { appStructure, appActiveProps } from "@/lib/types";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useOrgSetup } from "@/store/use-org-setup";
import { Loader2 } from "lucide-react";
import { handleUpdateOrgApps } from "../actions";

export default function AppsForm() {
  type appsRegistration = z.infer<typeof appsSetupSchema>;
  const [_appActive, _setAppActive] = useState<appActiveProps[]>([
    ...appsList.map((app) => ({ app, selected: false })),
  ]);
  const [isPending, startTransition] = useTransition();
  const { handleSubmit, control } = useForm<appsRegistration>({
    defaultValues: {
      apps: [],
    },
    resolver: zodResolver(appsSetupSchema),
  });
  const router = useRouter();
  const { setApps } = useOrgSetup();
  const orgId = useSearchParams().get("orgId");

  const onSubmit = async (data: appsRegistration) => {
    try {
      console.log("Selected apps: ", data);
      setApps(true);
      toast.success(`${data.apps.length} apps selected`);
      startTransition(async () => {
        const res = await handleUpdateOrgApps(orgId!, data.apps);
        if (!res.success) {
          throw new Error("Failed to select apps");
        }
        router.push(`/account-setup/org-setup/org-deploy?orgId=${orgId}`);
      });
    } catch (error) {
      console.log(error);
      toast.error("Failed to select apps");
    }
  };

  const onSkip = () => {
    try {
      setApps(true);
      router.push("/account-setup/org-setup/org-deploy");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <Card className="mt-[20px] w-[648px]">
        <CardHeader>
          <CardTitle>Select your favourite apps</CardTitle>
          <CardDescription>
            Select the apps your organization already uses (Notion, Google Workspace, Cal, Intercom,
            Zendesk, Slack, etc.)
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent>
            <Controller
              name="apps"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <div className="flex flex-wrap gap-[8px]">
                    {appsList.map((app: appStructure) => (
                      <div
                        key={app.name}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <AppSelect
                          key={app.name}
                          {...app}
                          selected={field.value.includes(app.name)}
                          onSelect={(selectedApp) => {
                            const currentApps = field.value || [];
                            if (currentApps.includes(selectedApp.name)) {
                              field.onChange(
                                currentApps.filter((name) => name !== selectedApp.name),
                              );
                            } else {
                              field.onChange([...currentApps, selectedApp.name]);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  {fieldState.invalid && (
                    <p className="text-sm mt-2 text-destructive">{fieldState.error?.message}</p>
                  )}
                </div>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-(--xs) border-none bg-transparent">
            <Button type="submit" className="w-full cursor-pointer">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue
            </Button>
            <Button
              type="button"
              variant={"ghost"}
              onClick={onSkip}
              className="w-full cursor-pointer"
            >
              Skip for now
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
