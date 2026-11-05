"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    Camera,
    CameraOff,
    Clipboard,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    ImagePlus,
    Loader2,
    RefreshCw,
    RotateCcw,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { useToast } from "@/src/providers/toast-provider";
import { resolveMediaUrl, getApiErrorMessage } from "@/lib/api/envelope";
import { useUploadFlowAttachments } from "../hook/use-smith-dashboard";
import {
    ACCEPT_ATTR,
    ACCEPTED_EXTENSIONS,
    MAX_FILES,
    MAX_FILE_BYTES,
    MAX_REQUEST_BYTES,
    fileExtension,
    isImageUrl,
    isPdfUrl,
} from "../api/smith-attachments.api";
import type { FlowAttachments, FlowKind, MediaFile } from "../type/smith-dashboard.types";

interface FlowAttachmentsDialogProps {
    open: boolean;
    onClose: () => void;
    kind: FlowKind;
    row: (FlowAttachments & { id: number; date?: string; remarks?: string }) | null;
    onUploaded?: (updated: { id: number; media: MediaFile[] }) => void;
}

const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const stamp = () => new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);

// The backend checks the extension, so give every blob a proper file name.
const withName = (blob: Blob, base: string) => {
    const ext = blob.type === "application/pdf" ? "pdf" : blob.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
    return new File([blob], `${base}-${stamp()}.${ext}`, { type: blob.type || "image/png" });
};

const fileName = (url: string) => decodeURIComponent(url.split("/").pop() || url);

function FileIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
    const ext = fileExtension(name);
    if (ext === "pdf") return <FileText className={`${className} text-red-500`} />;
    if (ext === "xls" || ext === "xlsx") return <FileSpreadsheet className={`${className} text-emerald-600`} />;
    return <ImagePlus className={className} />;
}

/**
 * Attachments of one cash or weight transaction: keep or remove the current
 * files and add new ones (paste, drop, browse, camera). Everything is saved
 * in one multipart update of the transaction.
 */
export default function FlowAttachmentsDialog({ open, onClose, kind, row, onUploaded }: FlowAttachmentsDialogProps) {
    const { addToast } = useToast();
    const upload = useUploadFlowAttachments();
    const [added, setAdded] = useState<{ file: File; preview?: string }[]>([]);
    const [removed, setRemoved] = useState<Set<string>>(new Set());
    const [cameraOpen, setCameraOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [over, setOver] = useState(false);
    const browseRef = useRef<HTMLInputElement>(null);

    useEffect(() => setMounted(true), []);

    // Reset whenever the dialog closes or opens for another row.
    useEffect(() => {
        setAdded((prev) => {
            prev.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
            return [];
        });
        setRemoved(new Set());
        setCameraOpen(false);
    }, [open, row?.id]);

    const existing = row?.media ?? [];
    const kept = existing.filter((m) => !removed.has(m.url));
    const totalCount = kept.length + added.length;
    const newBytes = added.reduce((s, a) => s + a.file.size, 0);
    const dirty = added.length > 0 || removed.size > 0;

    const addFiles = useCallback(
        (files: File[]) => {
            const ok: { file: File; preview?: string }[] = [];
            for (const f of files) {
                const ext = fileExtension(f.name);
                if (!ACCEPTED_EXTENSIONS.includes(ext)) {
                    addToast({ type: "warning", title: "Not supported", message: `${f.name}: use an image, PDF or Excel file.` });
                    continue;
                }
                if (f.size === 0) {
                    addToast({ type: "warning", title: "Empty file", message: `${f.name} is empty.` });
                    continue;
                }
                if (f.size > MAX_FILE_BYTES) {
                    addToast({ type: "warning", title: "File too large", message: `${f.name} is ${formatSize(f.size)}. The limit is 1 MB per file.` });
                    continue;
                }
                ok.push({ file: f, preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined });
            }
            if (!ok.length) return;
            setAdded((prev) => {
                const room = MAX_FILES - (kept.length + prev.length);
                if (room <= 0) {
                    addToast({ type: "warning", title: "Limit reached", message: `A transaction can have up to ${MAX_FILES} files.` });
                    ok.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
                    return prev;
                }
                if (ok.length > room) addToast({ type: "warning", title: "Limit reached", message: `Only ${room} more file(s) fit.` });
                ok.slice(room).forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
                return [...prev, ...ok.slice(0, room)];
            });
        },
        [addToast, kept.length]
    );

    // Paste anywhere while the dialog is open.
    useEffect(() => {
        if (!open) return;
        const onPaste = (e: ClipboardEvent) => {
            const blobs = Array.from(e.clipboardData?.items ?? [])
                .filter((i) => i.kind === "file")
                .map((i) => i.getAsFile())
                .filter(Boolean) as File[];
            if (!blobs.length) return;
            e.preventDefault();
            addFiles(blobs.map((b) => (b.name && /\.[a-z0-9]+$/i.test(b.name) ? b : withName(b, "pasted"))));
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && !upload.isPending && !cameraOpen && onClose();
        window.addEventListener("paste", onPaste);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("paste", onPaste);
            window.removeEventListener("keydown", onKey);
        };
    }, [open, addFiles, onClose, upload.isPending, cameraOpen]);

    const handleSave = async () => {
        if (!row?.id || !dirty) return;
        if (newBytes > MAX_REQUEST_BYTES) {
            addToast({ type: "warning", title: "Too large", message: "New files together must be under 12 MB." });
            return;
        }
        try {
            const updated = await upload.mutateAsync({
                id: row.id,
                files: added.map((a) => a.file),
                keepUrls: removed.size ? kept.map((m) => m.url) : undefined,
            });
            addToast({
                type: "success",
                title: "Attachments saved",
                message: `${updated.media.length} file(s) on this ${kind} entry.`,
            });
            onUploaded?.({ id: updated.id, media: updated.media.map((m) => ({ id: m.id, url: m.url })) });
            onClose();
        } catch (error) {
            addToast({ type: "error", title: "Couldn't save attachments", message: getApiErrorMessage(error, "Could not upload the files.") });
        }
    };

    const previews = useMemo(() => added, [added]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && row && (
                <motion.div
                    data-flow-attachments-dialog
                    data-enter-nav="off"
                    className="fixed inset-0 z-[1350] flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onMouseDown={(e) => e.target === e.currentTarget && !upload.isPending && onClose()}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Attachments"
                        initial={{ y: 40, opacity: 0, scale: 0.98 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 40, opacity: 0, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card text-foreground shadow-2xl sm:rounded-3xl"
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold">Attachments</h2>
                                <p className="text-sm text-muted-foreground">
                                    {kind === "cash" ? "Cash" : "Weight"} entry
                                    {row.date ? ` · ${String(row.date).replace(/^(\d{4})-(\d{2})-(\d{2}).*/, "$3-$2-$1")}` : ""}
                                    {row.remarks ? ` · ${row.remarks}` : ""}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={upload.isPending}
                                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                            <div className="flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-xs text-primary-text">
                                <Clipboard className="h-3.5 w-3.5 shrink-0" />
                                Tip: press Ctrl+V (⌘V on Mac) to paste a screenshot or copied image straight in.
                            </div>

                            {/* Add */}
                            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                                <button
                                    type="button"
                                    onClick={() => browseRef.current?.click()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setOver(true);
                                    }}
                                    onDragLeave={() => setOver(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setOver(false);
                                        addFiles(Array.from(e.dataTransfer.files ?? []));
                                    }}
                                    className={`flex h-32 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-3 text-center text-sm transition ${
                                        over
                                            ? "border-primary bg-accent-soft text-primary-text"
                                            : "border-border text-muted-foreground hover:border-primary hover:bg-accent-soft hover:text-primary-text"
                                    }`}
                                >
                                    <Upload className="h-7 w-7" />
                                    <span className="font-medium">Drop files or browse</span>
                                    <span className="text-xs">Images, PDF or Excel · up to 1 MB each</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCameraOpen(true)}
                                    className="flex h-32 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground transition hover:border-primary hover:bg-accent-soft hover:text-primary-text"
                                >
                                    <Camera className="h-7 w-7" />
                                    <span className="font-medium">Take a photo</span>
                                </button>
                                <input
                                    ref={browseRef}
                                    type="file"
                                    multiple
                                    accept={ACCEPT_ATTR}
                                    className="hidden"
                                    onChange={(e) => {
                                        addFiles(Array.from(e.target.files ?? []));
                                        e.target.value = "";
                                    }}
                                />
                            </div>

                            {/* Files */}
                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-semibold">Files on this entry</span>
                                    <span className="text-xs text-muted-foreground">
                                        {totalCount} of {MAX_FILES}
                                    </span>
                                </div>
                                {existing.length === 0 && added.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                                        No files yet.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                        {existing.map((m) => {
                                            const gone = removed.has(m.url);
                                            const src = resolveMediaUrl(m.url);
                                            return (
                                                <div
                                                    key={m.id}
                                                    className={`group relative overflow-hidden rounded-xl border border-border bg-muted transition ${gone ? "opacity-40" : ""}`}
                                                >
                                                    <a href={src} target="_blank" rel="noreferrer" className="block" title={fileName(m.url)}>
                                                        {isImageUrl(m.url) ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={src} alt={fileName(m.url)} className="aspect-square w-full object-cover" />
                                                        ) : (
                                                            <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 p-2">
                                                                <FileIcon name={m.url} className="h-8 w-8" />
                                                                <span className="line-clamp-2 break-all text-center text-[11px] text-muted-foreground">{fileName(m.url)}</span>
                                                            </div>
                                                        )}
                                                    </a>
                                                    <span className="absolute left-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                                        {gone ? "Will be removed" : "Saved"}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setRemoved((prev) => {
                                                                const next = new Set(prev);
                                                                if (next.has(m.url)) next.delete(m.url);
                                                                else next.add(m.url);
                                                                return next;
                                                            })
                                                        }
                                                        className="absolute right-1.5 top-1.5 rounded-lg bg-black/55 p-1.5 text-white transition hover:bg-red-600"
                                                        aria-label={gone ? `Keep ${fileName(m.url)}` : `Remove ${fileName(m.url)}`}
                                                        title={gone ? "Keep" : "Remove"}
                                                    >
                                                        {gone ? <RotateCcw className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {previews.map((a, i) => (
                                            <div key={`${a.file.name}-${i}`} className="relative overflow-hidden rounded-xl border-2 border-primary/60 bg-muted">
                                                {a.preview ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={a.preview} alt={a.file.name} className="aspect-square w-full object-cover" />
                                                ) : (
                                                    <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 p-2">
                                                        <FileIcon name={a.file.name} className="h-8 w-8" />
                                                        <span className="line-clamp-2 break-all text-center text-[11px] text-muted-foreground">{a.file.name}</span>
                                                    </div>
                                                )}
                                                <span className="absolute left-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                                                    New · {formatSize(a.file.size)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAdded((prev) => {
                                                            const next = [...prev];
                                                            const [gone] = next.splice(i, 1);
                                                            if (gone?.preview) URL.revokeObjectURL(gone.preview);
                                                            return next;
                                                        })
                                                    }
                                                    className="absolute right-1.5 top-1.5 rounded-lg bg-black/55 p-1.5 text-white transition hover:bg-red-600"
                                                    aria-label={`Remove ${a.file.name}`}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <footer className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-muted-foreground">
                                {dirty
                                    ? `${added.length} to add${removed.size ? `, ${removed.size} to remove` : ""}${added.length ? ` · ${formatSize(newBytes)}` : ""}`
                                    : `Up to ${MAX_FILES} files, 1 MB each. Images, PDF, XLS or XLSX.`}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={upload.isPending}
                                    className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted sm:flex-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!dirty || upload.isPending}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50 sm:flex-none"
                                >
                                    {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    {upload.isPending ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </footer>

                        <CameraCapture
                            open={cameraOpen}
                            onClose={() => setCameraOpen(false)}
                            onCapture={(file) => {
                                addFiles([file]);
                                setCameraOpen(false);
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

/* ------------------------------------------------------------------ */

function CameraCapture({ open, onClose, onCapture }: { open: boolean; onClose: () => void; onCapture: (f: File) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const fallbackRef = useRef<HTMLInputElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facing, setFacing] = useState<"environment" | "user">("environment");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        let active: MediaStream | null = null;
        let cancelled = false;
        setError(null);
        if (!navigator.mediaDevices?.getUserMedia) {
            setError("Live camera is not available here. Use the device camera instead.");
            return;
        }
        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: facing }, audio: false })
            .then((s) => {
                if (cancelled) {
                    s.getTracks().forEach((t) => t.stop());
                    return;
                }
                active = s;
                setStream(s);
                if (videoRef.current) videoRef.current.srcObject = s;
            })
            .catch(() => setError("Camera permission was blocked or no camera was found."));
        return () => {
            cancelled = true;
            active?.getTracks().forEach((t) => t.stop());
            setStream(null);
        };
    }, [open, facing]);

    const capture = () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) return;
        // Keep photos well under the 1 MB upload limit.
        const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => blob && onCapture(withName(blob, "camera")), "image/jpeg", 0.82);
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="absolute inset-0 z-10 flex flex-col bg-black"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                        {error ? (
                            <div className="flex flex-col items-center gap-3 px-6 text-center text-white/80">
                                <CameraOff className="h-10 w-10" />
                                <p className="text-sm">{error}</p>
                                <button
                                    type="button"
                                    onClick={() => fallbackRef.current?.click()}
                                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                                >
                                    Use device camera
                                </button>
                            </div>
                        ) : (
                            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
                        )}
                        {!stream && !error && <Loader2 className="absolute h-8 w-8 animate-spin text-white/70" />}
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-black/90 px-5 py-4">
                        <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={capture}
                            disabled={!stream}
                            aria-label="Take photo"
                            className="h-16 w-16 rounded-full border-4 border-white bg-white/20 transition hover:bg-white/40 disabled:opacity-40"
                        />
                        <button
                            type="button"
                            onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
                            disabled={!!error}
                            className="rounded-xl p-2 text-white/80 hover:bg-white/10 disabled:opacity-40"
                            aria-label="Switch camera"
                        >
                            <RefreshCw className="h-5 w-5" />
                        </button>
                    </div>
                    <input
                        ref={fallbackRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) onCapture(f);
                            e.target.value = "";
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
