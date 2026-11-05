import type { FlowAttachments } from "../type/smith-dashboard.types";
import { saveTransactionMedia } from "./smith-transactions.api";

/** Backend limits: 1 MiB per file, 10 files per transaction, 12 MiB per request. */
export const MAX_FILE_BYTES = 1024 * 1024;
export const MAX_FILES = 10;
export const MAX_REQUEST_BYTES = 12 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "pdf", "xls", "xlsx"];
export const ACCEPT_ATTR = ".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.xls,.xlsx,image/*,application/pdf";

export const fileExtension = (name: string) => (name.split("?")[0].split(".").pop() || "").toLowerCase();
export const isImageUrl = (url: string) => ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(fileExtension(url)) || url.startsWith("data:image");
export const isPdfUrl = (url: string) => fileExtension(url) === "pdf" || url.startsWith("data:application/pdf");

/**
 * Adds new files to a cash/weight transaction and keeps only `keepUrls`
 * of the existing ones (undefined keeps all). One multipart PUT.
 */
export const uploadFlowAttachments = (id: number, files: File[], keepUrls?: string[]) => saveTransactionMedia(id, files, keepUrls);

export const attachmentCount = (row: FlowAttachments | undefined | null) => row?.media?.length ?? 0;
