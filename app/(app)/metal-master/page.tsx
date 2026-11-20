"use client";

import { useState } from "react";
import { useIsMutating, useQuery } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api/envelope";
import ProtectedRoute from "@/src/components/app-shell/protected-route";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canMenuAction } from "@/src/features/auth/lib/access";
import MetalForm, { metalQueryKey, metalSaveKey, type Metal  , type ListMetal} from "@/src/module/metal/metal-form";
import { Edit3Icon } from "lucide-react";

function MetalMaster() {
    const { allDetails } = useAuth();
    const canAdd = canMenuAction(allDetails, "metals", "add");
    const canEdit = canMenuAction(allDetails, "metals", "edit");
    const [editing, setEditing] = useState<ListMetal | null>(null);
    const saving = useIsMutating({ mutationKey: metalSaveKey }) > 0;
    const list = useQuery({ queryKey: metalQueryKey, queryFn: () => api.get<ListMetal[]>("metal") });

    return (
        <div className="mx-auto grid w-full  items-start gap-4 p-3 sm:p-5 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
            {/* <h1 className="text-2xl font-semibold tracking-tight xl:col-span-2">Metal Master</h1> */}
            {(canAdd || (canEdit && editing)) && (
                <MetalForm key={editing?.metalId ?? "new"} metal={editing ?? undefined}
                    onSaved={() => setEditing(null)} onCancel={editing ? () => setEditing(null) : undefined} />
            )}
            <div className={`min-w-0 overflow-hidden rounded-xl border border-border bg-card ${canAdd || (canEdit && editing) ? "" : "xl:col-span-2"}`}>
                <h2 className="border-b border-border px-4 py-3 font-semibold">METAL LIST</h2>
                {list.isPending && <p role="status" className="p-4 text-sm text-muted-foreground">Loading metals…</p>}
                {list.isError && <p role="alert" className="p-4 text-sm text-red-600">{getApiErrorMessage(list.error)}</p>}
                {list.isSuccess && (list.data.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th scope="col" className="px-4 py-3">METAL ID</th>
                                    <th scope="col" className="px-4 py-3">METAL NAME</th>
                                    <th scope="col" className="px-4 py-3">DISPLAY ORDER</th>
                                    <th scope="col" className="px-4 py-3">ACTIVE</th>
                                    {canEdit && <th scope="col" className="px-4 py-3">ACTION</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {list.data.map((metal) => (
                                    <tr key={metal.metalId} className={`border-t border-border ${editing?.metalId === metal.metalId ? "bg-accent-soft" : "hover:bg-muted/50"}`}>
                                        <td className="px-4 py-3 font-medium">{metal.metalId}</td>
                                        <td className="px-4 py-3">{metal.metalName}</td>
                                        <td className="px-4 py-3 tabular-nums">{metal.displayOrder}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-md px-2 py-1 text-xs font-medium ${metal.active ? "bg-accent-soft text-primary-text" : "bg-muted text-muted-foreground"}`}>
                                                {metal.active ? "Yes" : "No"}
                                            </span>
                                        </td>
                                        {canEdit && <td className="px-4 py-3"><button type="button" disabled={saving}
                                            aria-label={`Edit ${metal.metalName}`} className="font-medium text-primary-text hover:underline"
                                            onClick={() => setEditing(metal)}>Edit <Edit3Icon size={20}/></button></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="p-4 text-sm text-muted-foreground">No metals have been added.</p>)}
            </div>
        </div>
    );
}

export default function MetalMasterRoute() {
    return <ProtectedRoute><MetalMaster /></ProtectedRoute>;
}

