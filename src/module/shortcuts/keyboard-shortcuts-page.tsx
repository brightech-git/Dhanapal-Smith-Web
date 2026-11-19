"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Keyboard, Pencil, RotateCcw, Search, X } from "lucide-react";
import ConfirmDialog from "@/src/components/ui/confirm-dialog";
import TextInput from "@/src/components/ui/text-input";
import { CardHeader, card, ghostButton, iconButton, inputClass } from "@/src/module/role/component/ui";
import { useShortcuts } from "@/src/providers/shortcut-provider";
import { comboFromEvent, comboParts, type ShortcutAction, type ShortcutGroup } from "@/src/config/keyboard-shortcuts";

const GROUPS: { id: ShortcutGroup; title: string; hint: string }[] = [
    { id: "General", title: "GENERAL", hint: "Always available" },
    { id: "Actions", title: "ACTIONS ON A PAGE", hint: "Work on the form, row or table the cursor is in" },
    { id: "Navigation", title: "GO TO A PAGE", hint: "Only pages you have access to are listed" },
];

function Keys({ combo }: { combo: string }) {
    return (
        <span className="inline-flex flex-wrap items-center gap-1">
            {comboParts(combo).map((part, index) => (
                <Fragment key={part}>
                    {index > 0 && <span className="text-[10px] text-muted-foreground">+</span>}
                    <kbd className="min-w-7 rounded-md border border-border border-b-2 bg-muted px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold text-foreground">
                        {part}
                    </kbd>
                </Fragment>
            ))}
        </span>
    );
}

/** Lists every shortcut; each can be changed by pressing the new keys, cleared or set back to the recommended key. */
export default function KeyboardShortcutsPage() {
    const { actions, bindings, setBinding, resetBinding, resetAll, setRecording } = useShortcuts();
    const [search, setSearch] = useState("");
    const [recordingId, setRecordingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ id: string; text: string; error: boolean } | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);

    const startRecording = (id: string) => {
        setMessage(null);
        setRecordingId(id);
    };

    // While waiting for a new key, read it here (the app-wide shortcuts are paused).
    useEffect(() => {
        setRecording(recordingId !== null);
        if (!recordingId) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return;
            event.preventDefault();
            event.stopPropagation();
            if (event.key === "Escape") {
                setRecordingId(null);
                return;
            }
            const combo = comboFromEvent(event);
            if (!combo) {
                setMessage({ id: recordingId, error: true, text: "Use a function key (F2 to F10), or Ctrl + a letter or number, or Ctrl + Shift + a letter or number." });
                return;
            }
            const problem = setBinding(recordingId, combo);
            if (problem) {
                setMessage({ id: recordingId, error: true, text: problem });
                return;
            }
            setMessage({ id: recordingId, error: false, text: `Saved: ${combo}` });
            setRecordingId(null);
        };
        window.addEventListener("keydown", onKeyDown, true);
        return () => {
            window.removeEventListener("keydown", onKeyDown, true);
            setRecording(false);
        };
    }, [recordingId, setBinding, setRecording]);

    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        return actions.filter((a) => !q || [a.label, a.description, bindings[a.id]].some((v) => (v ?? "").toLowerCase().includes(q)));
    }, [actions, bindings, search]);
    const assigned = actions.filter((a) => bindings[a.id]).length;

    const row = (action: ShortcutAction) => {
        const key = bindings[action.id];
        const recordingThis = recordingId === action.id;
        const note = message?.id === action.id ? message : null;
        const changed = !action.locked && (key ?? null) !== (action.defaultKey ?? null);
        return (
            <tr key={action.id} className={`border-t border-border align-middle ${recordingThis ? "bg-accent-soft" : "hover:bg-muted/40"}`}>
                <td className="px-4 py-2.5">
                    <p className="text-xs font-semibold">{action.label}</p>
                    {action.description && <p className="text-[11px] text-muted-foreground">{action.description}</p>}
                </td>
                <td className="px-4 py-2.5">
                    {recordingThis ? (
                        <span role="status" className="inline-flex items-center gap-2 rounded-md border border-dashed border-primary px-2 py-1 text-xs font-medium text-primary-text motion-safe:animate-pulse">
                            Press the new keys… (Esc to cancel)
                        </span>
                    ) : key ? <Keys combo={key} /> : <span className="text-xs text-muted-foreground">Not set</span>}
                    {note && (
                        <p role={note.error ? "alert" : "status"} className={`mt-1 text-[11px] ${note.error ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                            {note.text}
                        </p>
                    )}
                </td>
                <td className="hidden px-4 py-2.5 sm:table-cell">
                    {action.defaultKey ? <Keys combo={action.defaultKey} /> : <span className="text-xs text-muted-foreground">-</span>}
                </td>
                <td className="px-4 py-2.5">
                    {action.locked ? (
                        <span className="text-[11px] text-muted-foreground">Fixed</span>
                    ) : (
                        <div className="flex justify-end gap-1">
                            {recordingThis ? (
                                <button type="button" className={`${ghostButton} h-8 px-3 text-xs`} onClick={() => setRecordingId(null)}>Cancel</button>
                            ) : (
                                <button type="button" className={`${ghostButton} h-8 px-3 text-xs`} onClick={() => startRecording(action.id)}
                                    aria-label={`Change shortcut for ${action.label}`}>
                                    <Pencil className="h-3.5 w-3.5" /> {key ? "Change" : "Set"}
                                </button>
                            )}
                            {key && !recordingThis && (
                                <button type="button" className={iconButton} title="Remove this shortcut" aria-label={`Remove shortcut for ${action.label}`}
                                    onClick={() => { setBinding(action.id, null); setMessage(null); }}>
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                            {changed && !recordingThis && action.defaultKey && (
                                <button type="button" className={iconButton} title={`Back to ${action.defaultKey}`} aria-label={`Reset ${action.label} to ${action.defaultKey}`}
                                    onClick={() => { resetBinding(action.id); setMessage({ id: action.id, error: false, text: `Back to ${action.defaultKey}` }); }}>
                                    <RotateCcw className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}
                </td>
            </tr>
        );
    };

    return (
        <div className="mx-auto grid w-full max-w-5xl gap-4 p-3 sm:p-5">
            <section className={card}>
                <CardHeader icon={Keyboard} title="KEYBOARD SHORTCUTS" subtitle={`${assigned} of ${actions.length} actions have a key. Press F1 anywhere to come back here.`}
                    actions={
                        <button type="button" className={`${ghostButton} h-8 px-3 text-xs`} onClick={() => setConfirmReset(true)}>
                            <RotateCcw className="h-4 w-4" /> Reset all to recommended
                        </button>
                    } />
                <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-start">
                    <ul className="grid gap-1.5 text-xs text-muted-foreground">
                        <li className="flex flex-wrap items-center gap-1.5"><Keys combo="F2" /> A function key on its own (F2 to F10).</li>
                        <li className="flex flex-wrap items-center gap-1.5"><Keys combo="Ctrl+S" /> or <Keys combo="Ctrl+Shift+M" /> Two or three keys must start with Ctrl, or Ctrl + Shift.</li>
                        <li>A key can be used for one action only. Keys the browser keeps (F5, Ctrl+C, Ctrl+V, Ctrl+T, …) cannot be used.</li>
                        <li>Your keys are saved in this browser.</li>
                    </ul>
                    <div className="relative" data-enter-nav="off">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <TextInput unstyled uppercase={false} type="search" aria-label="Search shortcuts" placeholder="Search action or key…"
                            inputClassName={`${inputClass} h-9 pl-9`} value={search} onChange={setSearch} />
                    </div>
                </div>
            </section>

            {GROUPS.map((group) => {
                const list = shown.filter((a) => a.group === group.id);
                if (!list.length) return null;
                return (
                    <section key={group.id} className={`${card} overflow-hidden`}>
                        <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-2.5">
                            <h2 className="text-xs font-semibold tracking-wide">{group.title}</h2>
                            <p className="text-[11px] text-muted-foreground">{group.hint}</p>
                        </header>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th scope="col" className="px-4 py-2 font-medium">ACTION</th>
                                        <th scope="col" className="px-4 py-2 font-medium">KEY</th>
                                        <th scope="col" className="hidden px-4 py-2 font-medium sm:table-cell">RECOMMENDED</th>
                                        <th scope="col" className="px-4 py-2 text-right font-medium"><span className="sr-only">CHANGE</span></th>
                                    </tr>
                                </thead>
                                <tbody>{list.map(row)}</tbody>
                            </table>
                        </div>
                    </section>
                );
            })}
            {shown.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No shortcuts match your search.</p>}

            <ConfirmDialog
                open={confirmReset}
                title="Reset all shortcuts?"
                message="Every action goes back to its recommended key, and keys you added yourself are removed."
                confirmLabel="Reset all"
                onConfirm={() => { resetAll(); setMessage(null); setConfirmReset(false); }}
                onCancel={() => setConfirmReset(false)}
            />
        </div>
    );
}
