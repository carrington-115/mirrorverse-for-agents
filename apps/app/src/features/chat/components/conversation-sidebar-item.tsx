"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, MoreVertical, Pin, PinOff, Trash2 } from "lucide-react";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDeleteChatMutation, usePinChatMutation } from "@/features/chat/api/mutations";

interface ConversationSidebarItemProps {
  chatId: string;
  title: string;
  isPinned: boolean;
}

export function ConversationSidebarItem({ chatId, title, isPinned }: ConversationSidebarItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const href = `/mirrorpilot/${chatId}`;
  const isActive = pathname === href;
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const del = useDeleteChatMutation();
  const pin = usePinChatMutation();

  const handleDelete = () => {
    del.mutate(
      { chatId },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          if (isActive) router.push("/mirrorpilot");
        },
      },
    );
  };

  const handlePin = () => {
    setMenuOpen(false);
    pin.mutate({ chatId, isPinned: !isPinned });
  };

  return (
    <div className="group/conv relative flex w-full items-center">
      <SidebarMenuButton asChild isActive={isActive} className="pr-8">
        <Link href={href}>
          <span className="truncate">{title}</span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Conversation options"
            className={cn(
              "right-1 size-6 absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-md",
              "text-muted-foreground hover:bg-muted hover:text-foreground",
              "opacity-0 transition-opacity group-hover/conv:opacity-100 focus:opacity-100",
              menuOpen && "opacity-100",
            )}
            onClick={(e) => e.preventDefault()}
          >
            <MoreVertical className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handlePin();
            }}
          >
            {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
            {isPinned ? "Unpin" : "Pin chat"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault();
              setMenuOpen(false);
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              {title} and all of its messages will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={del.isPending}
            >
              {del.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
