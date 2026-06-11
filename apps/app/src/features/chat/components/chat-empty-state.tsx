"use client";

import { useState } from "react";
import Image from "next/image";

import mirrorpilotIconLight from "@/assets/mirrorpilot-icon.svg";
import mirrorpilotIconDark from "@/assets/mirrorpilot-icon-dark.svg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { USE_CASE_CATEGORIES, type AutomationApp } from "@/features/chat/config";

interface ChatEmptyStateProps {
  onFillInput: (prompt: string) => void;
  inputSlot: React.ReactNode;
}

export function ChatEmptyState({ onFillInput, inputSlot }: ChatEmptyStateProps) {
  return (
    <div className="px-4 flex h-full w-full justify-center">
      <div className="max-w-3xl gap-6 flex w-full flex-col">
        <BrandHeader />
        {inputSlot}
        <UseCasesTabs onPick={onFillInput} />
        <p className="mt-1.5 text-xs md:text-xs text-center text-muted-foreground/60">
          Mirrorpilot can make mistakes. By using Mirrorpilot, you agree to our{" "}
          <a
            href="https://mirrorverse.ai/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-muted-foreground"
          >
            Terms and Conditions
          </a>
        </p>
      </div>
    </div>
  );
}

function BrandHeader() {
  return (
    <div className="gap-y-6 mt-[100px] mb-[var(--spacing-lg)] flex items-center justify-center">
      <Image
        src={mirrorpilotIconLight}
        alt="Mirrro"
        width={48}
        height={48}
        priority
        className="size-9 sm:size-12 dark:hidden"
      />
      <Image
        src={mirrorpilotIconDark}
        alt="Mirrro"
        width={48}
        height={48}
        priority
        className="size-9 sm:size-12 hidden dark:block"
      />
      <h1 className="font-bold text-3xl ml-2 sm:text-5xl text-foreground">Mirrorpilot</h1>
    </div>
  );
}

function AppIcon({ app }: { app: AutomationApp }) {
  const googleFaviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${app.domain}`;
  const [src, setSrc] = useState(app.logoUrl ?? googleFaviconUrl);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (src !== googleFaviconUrl) {
      setSrc(googleFaviconUrl);
    } else {
      setFailed(true);
    }
  };

  return (
    <span className="size-6 flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-background ring-2 ring-background">
      {failed ? (
        <span className="font-semibold text-[9px] text-muted-foreground">
          {app.name.slice(0, 2)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={app.name}
          className="p-0.5 size-full object-contain"
          onError={handleError}
        />
      )}
    </span>
  );
}

function AppIconStack({ apps }: { apps: readonly AutomationApp[] }) {
  return (
    <div className="-space-x-2 flex shrink-0 opacity-50">
      {apps.map((app) => (
        <AppIcon key={app.domain} app={app} />
      ))}
    </div>
  );
}

function UseCasesTabs({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <Tabs defaultValue="customer-support" className="w-full">
      <div className="md:justify-center flex h-fit w-full justify-start overflow-x-auto overflow-y-hidden">
        <TabsList variant="line" className="flex w-fit">
          {USE_CASE_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {USE_CASE_CATEGORIES.map((cat) => (
        <TabsContent key={cat.value} value={cat.value} className="mt-3">
          <div className="sm:grid-cols-2 lg:grid-cols-3 gap-2 grid grid-cols-1">
            {cat.automations.map((automation) => (
              <button
                key={automation.title}
                type="button"
                onClick={() => onPick(automation.prompt)}
                className="p-4 cursor-pointer rounded-xl text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="gap-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{automation.title}</span>
                  <AppIconStack apps={automation.apps} />
                </div>
                <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {automation.prompt}
                </div>
              </button>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
