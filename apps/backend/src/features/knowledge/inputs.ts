import { z } from "zod";

export const createKbInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  source: z.enum(["manual", "mirropilot"]).optional().default("manual"),
  chatSessionId: z.string().max(128).optional(),
});

export const getOrCreateSessionKbInput = z.object({
  chatSessionId: z.string().min(1).max(128),
  name: z.string().min(1).max(200),
});

export const listKbsInput = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
  })
  .default({ limit: 50 });

export const getKbInput = z.object({
  kbId: z.string().min(1).max(128),
});

export const deleteKbInput = z.object({
  kbId: z.string().min(1).max(128),
});

export const ingestDocumentInput = z.discriminatedUnion("sourceType", [
  z.object({
    kbId: z.string().min(1).max(128),
    sourceType: z.literal("text"),
    content: z.string().min(1).max(500_000),
    fileName: z.string().max(255).optional(),
  }),
  z.object({
    kbId: z.string().min(1).max(128),
    sourceType: z.literal("url"),
    url: z.string().url().max(2048),
    fileName: z.string().max(255).optional(),
  }),
  z.object({
    kbId: z.string().min(1).max(128),
    sourceType: z.literal("pdf"),
    storageKey: z.string().min(1).max(1024),
    fileName: z.string().max(255).optional(),
  }),
  // Image stored in the knowledge-base bucket; text is extracted via vision OCR.
  z.object({
    kbId: z.string().min(1).max(128),
    sourceType: z.literal("image"),
    storageKey: z.string().min(1).max(1024),
    mediaType: z.string().max(255).optional(),
    fileName: z.string().max(255).optional(),
  }),
  // Any other file stored in the bucket (docx, xlsx, txt, json, csv, …);
  // mediaType drives which parser the ingest worker uses.
  z.object({
    kbId: z.string().min(1).max(128),
    sourceType: z.literal("file"),
    storageKey: z.string().min(1).max(1024),
    mediaType: z.string().min(1).max(255),
    fileName: z.string().max(255).optional(),
  }),
]);

export const listDocumentsInput = z.object({
  kbId: z.string().min(1).max(128),
  limit: z.number().int().min(1).max(200).default(100),
});

export const listChatDocumentsInput = z.object({
  chatSessionId: z.string().min(1).max(128),
  limit: z.number().int().min(1).max(500).default(200),
});

export const deleteDocumentInput = z.object({
  documentId: z.string().min(1).max(128),
});

export const searchKbInput = z.object({
  kbId: z.string().min(1).max(128),
  query: z.string().min(1).max(2000),
  topK: z.number().int().min(1).max(20).default(5),
  minScore: z.number().min(0).max(1).optional(),
});

export const signUploadUrlInput = z.object({
  storageKey: z.string().min(1).max(1024),
});

export type SignUploadUrlInput = z.infer<typeof signUploadUrlInput>;
export type CreateKbInput = z.infer<typeof createKbInput>;
export type GetOrCreateSessionKbInput = z.infer<
  typeof getOrCreateSessionKbInput
>;
export type ListKbsInput = z.infer<typeof listKbsInput>;
export type GetKbInput = z.infer<typeof getKbInput>;
export type DeleteKbInput = z.infer<typeof deleteKbInput>;
export type IngestDocumentInput = z.infer<typeof ingestDocumentInput>;
export type ListDocumentsInput = z.infer<typeof listDocumentsInput>;
export type ListChatDocumentsInput = z.infer<typeof listChatDocumentsInput>;
export type DeleteDocumentInput = z.infer<typeof deleteDocumentInput>;
export type SearchKbInput = z.infer<typeof searchKbInput>;
