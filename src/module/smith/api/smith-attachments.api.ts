import { getAxiosInstance } from "@/lib/api/client";
import type { FlowAttachmentUpload, FlowAttachments, FlowKind } from "../type/smith-dashboard.types";

/** Same limits as the backend (spring.servlet.multipart). */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_REQUEST_BYTES = 30 * 1024 * 1024;

/**
 * Sends the image, PDF and camera photo for one cash or weight row in a
 * single multipart request:
 *   POST smith/cash/{id}/files   or   POST smith/weight/{id}/files
 * Parts: imageFile, pdfFile, cameraImage (each optional). The backend
 * keeps any part that is left out and returns the updated row.
 */
export async function uploadFlowAttachments(
    kind: FlowKind,
    id: number,
    files: FlowAttachmentUpload
): Promise<FlowAttachments & { id: number }> {
    const form = new FormData();
    (["imageFile", "pdfFile", "cameraImage"] as const).forEach((part) => {
        const file = files[part];
        if (file) form.append(part, file, file.name);
    });

    // Let the browser set the multipart boundary.
    const { data } = await getAxiosInstance().post(`smith/${kind}/${id}/files`, form, {
        headers: { "Content-Type": undefined as unknown as string },
    });
    return data;
}

export const attachmentCount = (row: FlowAttachments | undefined | null) =>
    row ? [row.imageFile, row.pdfFile, row.cameraImage].filter(Boolean).length : 0;
