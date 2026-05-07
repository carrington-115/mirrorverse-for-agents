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
import { appsList, deployList } from "@/lib/data";
import AppSelect, { MirroPilotOptionComponent } from "./app-select";
import { appStructure, appActiveProps } from "@/lib/types";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useOrgSetup } from "@/store/use-org-setup";
import { Loader2 } from "lucide-react";
import { handleUpdateOrgDeploy } from "../actions";

export default function DeployForm() {
  type appsRegistration = z.infer<typeof appsSetupSchema>;
  const [_appActive, _setAppActive] = useState<appActiveProps[]>([
    ...appsList.map((app) => ({ app, selected: false })),
  ]);
  const [isPending, startTransition] = useTransition();
  const { handleSubmit, control } = useForm<appsRegistration>({
    defaultValues: {
      apps: ["mirrropilot"],
    },
    resolver: zodResolver(appsSetupSchema),
  });
  const router = useRouter();
  const { setApps, setOrgId } = useOrgSetup();
  const orgId = useSearchParams().get("orgId");

  const onSubmit = async (data: appsRegistration) => {
    try {
      console.log("Selected apps: ", data);
      setApps(true);
      startTransition(async () => {
        const res = await handleUpdateOrgDeploy(orgId!, data.apps);
        if (!res.success) {
          throw new Error("Failed to select apps");
        }

        setOrgId(orgId!);
        router.push("/account-setup/user-role/user-status");
        toast.success("You have successfully joined Mirrro");
      });
    } catch (error) {
      console.log(error);
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
          <CardTitle>Choose where and how to deploy accross your company</CardTitle>
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
                    <MirroPilotOptionComponent />
                    {deployList.map((app: appStructure) => (
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
              Complete
            </Button>
            <Button
              type="button"
              className="w-full cursor-pointer"
              variant={"secondary"}
              onClick={onSkip}
            >
              Skip for now
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
