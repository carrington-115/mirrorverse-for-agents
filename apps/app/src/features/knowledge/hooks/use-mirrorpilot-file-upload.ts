"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { FileUIPart } from "ai";

import { useTRPC } from "@/lib/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetOrCreateSessionKbMutation } from "../api/mutations";

function sessionKbName(): string {
  return `Mirrorpilot – ${new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export interface UploadedFile {
  readonly filename: string;
  readonly kbId: string;
}

export function useMirrorpilotFileUpload(sessionId: string) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const getOrCreateKb = useGetOrCreateSessionKbMutation();
  const [isUploading, setIsUploading] = useState(false);

  const signUploadUrl = useMutation(trpc.knowledge.signUploadUrl.mutationOptions());

  const ingestMutation = useMutation({
    ...trpc.knowledge.ingest.mutationOptions(),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: trpc.knowledge.listDocuments.queryKey({ kbId: vars.kbId, limit: 100 }),
      });
    },
  });

  const upload = useCallback(
    async (files: FileUIPart[]): Promise<UploadedFile[]> => {
      if (files.length === 0) return [];

      setIsUploading(true);
      const uploaded: UploadedFile[] = [];

      try {
        const kb = await getOrCreateKb.mutateAsync({
          chatSessionId: sessionId,
          name: sessionKbName(),
        });

        for (const file of files) {
          const mediaType = file.mediaType ?? "application/octet-stream";
          const filename = file.filename ?? "file";

          try {
            // 1. Upload the raw bytes to the "knowledge-base" bucket. Every
            //    attachment — image or document — is stored, regardless of
            //    whether we can later extract searchable text from it.
            const blob = await fetch(file.url).then((r) => r.blob());
            const storageKey = `knowledge/mirrorpilot/${sessionId}/${Date.now()}-${filename}`;

            const { uploadUrl } = await signUploadUrl.mutateAsync({ storageKey });
            const uploadRes = await fetch(uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": mediaType },
              body: blob,
            });

            if (!uploadRes.ok) {
              toast.error(`Failed to upload ${filename}: ${uploadRes.statusText}`);
              continue;
            }

            // 2. Register it as a knowledge-base document so it ingests and
            //    shows up in the Mirrorpilot section of the knowledge base page.
            //    sourceType drives the ingest worker's text extraction:
            //    pdf -> pdf-parse, image -> vision OCR, file -> docx/xlsx/text.
            if (mediaType === "application/pdf" || mediaType.includes("pdf")) {
              await ingestMutation.mutateAsync({
                kbId: kb.id,
                sourceType: "pdf",
                storageKey,
                fileName: filename,
              });
            } else if (mediaType.startsWith("image/")) {
              await ingestMutation.mutateAsync({
                kbId: kb.id,
                sourceType: "image",
                storageKey,
                mediaType,
                fileName: filename,
              });
            } else {
              await ingestMutation.mutateAsync({
                kbId: kb.id,
                sourceType: "file",
                storageKey,
                mediaType,
                fileName: filename,
              });
            }

            uploaded.push({ filename, kbId: kb.id });
          } catch (err) {
            toast.error(
              `Failed to add ${filename} to knowledge base: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
          }
        }
      } catch (err) {
        toast.error(
          `Failed to prepare knowledge base: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      } finally {
        setIsUploading(false);
      }

      return uploaded;
    },
    [sessionId, signUploadUrl, getOrCreateKb, ingestMutation],
  );

  return { upload, isUploading };
}
