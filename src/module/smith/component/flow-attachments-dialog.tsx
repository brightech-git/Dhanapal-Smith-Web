"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    Camera,
    CameraOff,
    Clipboard,
    ExternalLink,
    FileText,
    ImagePlus,
    Loader2,
    RefreshCw,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { useToast } from "@/src/providers/toast-provider";
import { useUploadFlowAttachments } from "../hook/use-smith-dashboard";
import { MAX_FILE_BYTES, MAX_REQUEST_BYTES } from "../api/smith-attachments.api";
import type { FlowAttachmentUpload, FlowAttachments, FlowKind } from "../type/smith-dashboard.types";

type Slot = keyof FlowAttachmentUpload;

interface FlowAttachmentsDialogProps {
    open: boolean;
    onClose: () => void;
    kind: FlowKind;
    row: (FlowAttachments & { id: number; date?: string; remarks?: string }) | null;
    onUploaded?: (updated: FlowAttachments & { id: number }) => void;
}

const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const stamp = () => new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);

// The backend checks the extension, so give every blob a proper file name.
const withName = (blob: Blob, base: string) => {
    const ext = blob.type === "application/pdf" ? "pdf" : blob.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
    return new File([blob], `${base}-${stamp()}.${ext}`, { type: blob.type || "image/png" });
};

/**
 * Attach an image (paste, drop or browse), a camera photo and a PDF to one
 * cash or weight row. All picked files go up in one multipart request.
 */
export default function FlowAttachmentsDialog({ open, onClose, kind, row, onUploaded }: FlowAttachmentsDialogProps) {
    const { addToast } = useToast();
    const upload = useUploadFlowAttachments();
    const [files, setFiles] = useState<FlowAttachmentUpload>({});
    const [previews, setPreviews] = useState<Partial<Record<Slot, string>>>({});
    const [cameraOpen, setCameraOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Reset whenever the dialog opens for another row.
    useEffect(() => {
        if (!open) {
            setFiles({});
            setCameraOpen(false);
        }
    }, [open, row?.id]);

    // Object URLs for image previews, revoked when replaced.
    useEffect(() => {
        const next: Partial<Record<Slot, string>> = {};
        (["imageFile", "cameraImage"] as const).forEach((slot) => {
            const f = files[slot];
            if (f) next[slot] = URL.createObjectURL(f);
        });
        setPreviews(next);
        return () => Object.values(next).forEach((url) => url && URL.revokeObjectURL(url));
    }, [files]);

    const setSlot = useCallback(
        (slot: Slot, file: File | null) => {
            if (file) {
                const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
                if (slot === "pdfFile" && !isPdf) {
                    addToast({ type: "warning", title: "PDF only", message: "Choose a .pdf file for this slot." });
                    return;
                }
                if (slot !== "pdfFile" && !file.type.startsWith("image/")) {
                    addToast({ type: "warning", title: "Image only", message: "Choose a JPG, PNG or other image." });
                    return;
                }
                if (file.size > MAX_FILE_BYTES) {
                    addToast({ type: "warning", title: "File too large", message: `${file.name} is over 10 MB.` });
                    return;
                }
            }
            setFiles((prev) => ({ ...prev, [slot]: file }));
        },
        [addToast]
    );

    // Paste anywhere in the dialog: images go to the image slot, PDFs to the PDF slot.
    useEffect(() => {
        if (!open) return;
        const onPaste = (e: ClipboardEvent) => {
            const items = Array.from(e.clipboardData?.items ?? []);
            const fileItem = items.find((i) => i.kind === "file");
            const blob = fileItem?.getAsFile();
            if (!blob) return;
            e.preventDefault();
            const isPdf = blob.type === "application/pdf";
            const named = blob.name && /\.[a-z0-9]+$/i.test(blob.name) ? blob : withName(blob, "pasted");
            setSlot(isPdf ? "pdfFile" : "imageFile", named as File);
            addToast({ type: "success", title: "Pasted", message: isPdf ? "PDF added." : "Image added from clipboard." });
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && !upload.isPending && onClose();
        window.addEventListener("paste", onPaste);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("paste", onPaste);
            window.removeEventListener("keydown", onKey);
        };
    }, [open, setSlot, addToast, onClose, upload.isPending]);

    const picked = (Object.values(files).filter(Boolean) as File[]);
    const totalBytes = picked.reduce((sum, f) => sum + f.size, 0);

    const handleUpload = async () => {
        if (!row?.id || picked.length === 0) return;
        if (totalBytes > MAX_REQUEST_BYTES) {
            addToast({ type: "warning", title: "Too large", message: "All files together must be under 30 MB." });
            return;
        }
        try {
            const updated = await upload.mutateAsync({ kind, id: row.id, files });
            addToast({ type: "success", title: "Attachments saved", message: `${picked.length} file(s) uploaded.` });
            onUploaded?.(updated);
            onClose();
        } catch (error: any) {
            addToast({
                type: "error",
                title: "Upload failed",
                message: error?.response?.data?.message || error?.message || "Could not upload the files.",
            });
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && row && (
                <motion.div
                    data-flow-attachments-dialog
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
                                    {row.date ? ` · ${row.date}` : ""}
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

                        <div className="flex-1 overflow-y-auto px-5 py-5">
                            <div className="mb-4 flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-xs text-primary-text">
                                <Clipboard className="h-3.5 w-3.5 shrink-0" />
                                Tip: press Ctrl+V (⌘V on Mac) to paste a screenshot or copied image straight in.
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <ImageSlot
                                    title="Image"
                                    hint="Paste, drop or browse"
                                    icon={ImagePlus}
                                    file={files.imageFile ?? null}
                                    preview={previews.imageFile}
                                    existing={row.imageFile}
                                    onFile={(f) => setSlot("imageFile", f)}
                                />

                                <div className="flex flex-col gap-2">
                                    <SlotHeader title="Camera photo" hint="Take a photo now" icon={Camera} />
                                    {files.cameraImage && previews.cameraImage ? (
                                        <Preview
                                            src={previews.cameraImage}
                                            name={files.cameraImage.name}
                                            size={files.cameraImage.size}
                                            onRemove={() => setSlot("cameraImage", null)}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setCameraOpen(true)}
                                            className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground transition hover:border-primary hover:bg-accent-soft hover:text-primary-text"
                                        >
                                            <Camera className="h-7 w-7" />
                                            Open camera
                                        </button>
                                    )}
                                    <Existing url={row.cameraImage} label="Current photo" />
                                </div>

                                <PdfSlot
                                    file={files.pdfFile ?? null}
                                    existing={row.pdfFile}
                                    onFile={(f) => setSlot("pdfFile", f)}
                                />
                            </div>
                        </div>

                        <footer className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-muted-foreground">
                                {picked.length
                                    ? `${picked.length} file(s) · ${formatSize(totalBytes)} · sent together in one upload`
                                    : "Up to 10 MB per file. A new file replaces the current one."}
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
                                    onClick={handleUpload}
                                    disabled={!picked.length || upload.isPending}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50 sm:flex-none"
                                >
                                    {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    {upload.isPending ? "Uploading…" : "Upload"}
                                </button>
                            </div>
                        </footer>

                        <CameraCapture
                            open={cameraOpen}
                            onClose={() => setCameraOpen(false)}
                            onCapture={(file) => {
                                setSlot("cameraImage", file);
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

function SlotHeader({ title, hint, icon: Icon }: { title: string; hint: string; icon: React.ElementType }) {
    return (
        <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-primary-text">
                <Icon className="h-4 w-4" />
            </span>
            <div>
                <p className="text-sm font-semibold leading-tight">{title}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
        </div>
    );
}

function Existing({ url, label }: { url?: string | null; label: string }) {
    if (!url) return null;
    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-text hover:underline"
        >
            <ExternalLink className="h-3 w-3" />
            {label}
        </a>
    );
}

function Preview({ src, name, size, onRemove }: { src: string; name: string; size: number; onRemove: () => void }) {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={name} className="h-40 w-full bg-muted object-contain" />
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-1.5 text-xs">
                <span className="truncate text-muted-foreground">
                    {name} · {formatSize(size)}
                </span>
                <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-600" aria-label="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </motion.div>
    );
}

function DropZone({
    accept,
    onFile,
    icon: Icon,
    label,
}: {
    accept: string;
    onFile: (f: File) => void;
    icon: React.ElementType;
    label: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [over, setOver] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setOver(true);
                }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setOver(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) onFile(f);
                }}
                className={`flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-3 text-center text-sm transition ${
                    over
                        ? "border-primary bg-accent-soft text-primary-text"
                        : "border-border text-muted-foreground hover:border-primary hover:bg-accent-soft hover:text-primary-text"
                }`}
            >
                <Icon className="h-7 w-7" />
                {label}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                    e.target.value = "";
                }}
            />
        </>
    );
}

function ImageSlot({
    title,
    hint,
    icon,
    file,
    preview,
    existing,
    onFile,
}: {
    title: string;
    hint: string;
    icon: React.ElementType;
    file: File | null;
    preview?: string;
    existing?: string | null;
    onFile: (f: File | null) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <SlotHeader title={title} hint={hint} icon={icon} />
            {file && preview ? (
                <Preview src={preview} name={file.name} size={file.size} onRemove={() => onFile(null)} />
            ) : (
                <DropZone accept="image/*" onFile={onFile} icon={ImagePlus} label="Paste, drop or click to choose an image" />
            )}
            <Existing url={existing} label="Current image" />
        </div>
    );
}

function PdfSlot({ file, existing, onFile }: { file: File | null; existing?: string | null; onFile: (f: File | null) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <SlotHeader title="PDF" hint="Bill or receipt document" icon={FileText} />
            {file ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-muted px-3 text-center"
                >
                    <FileText className="h-9 w-9 text-red-500" />
                    <p className="w-full truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    <button type="button" onClick={() => onFile(null)} className="text-xs font-medium text-red-500 hover:underline">
                        Remove
                    </button>
                </motion.div>
            ) : (
                <DropZone accept="application/pdf,.pdf" onFile={onFile} icon={FileText} label="Drop or click to choose a PDF" />
            )}
            <Existing url={existing} label="Current PDF" />
        </div>
    );
}

/** Live camera with capture; falls back to the device camera picker. */
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
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        canvas.toBlob((blob) => blob && onCapture(withName(blob, "camera")), "image/jpeg", 0.9);
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
