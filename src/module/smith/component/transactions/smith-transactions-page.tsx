"use client";

import { Dialog, DialogTitle } from "@mui/material";
import SmithManager from "@/src/module/smith/component/smith-manager";
import SmithFormModal from "@/src/module/smith/component/smith-form-modal";
import FlowAttachmentsDialog from "@/src/module/smith/component/flow-attachments-dialog";
import ItemForm from "@/src/module/item/item-form";
import Register from "@/src/module/user/component/register-form";
import ExportDialog from "@/src/components/export/export-dialog";
import { useSmithLedger } from "./use-smith-ledger";
import { ledgerExportSetup } from "./ledger-export";
import SmithListPanel from "./smith-list-panel";
import LedgerFilterBar from "./ledger-filter-bar";
import WeightLedgerPanel from "./weight-ledger-panel";
import CashLedgerPanel from "./cash-ledger-panel";

// Smith transactions screen. Layout only: state and actions live in useSmithLedger,
// and each panel is its own component in this folder.
//   smith-list-panel     smiths with balances (left)
//   ledger-filter-bar    dates / item / type / search for the open smith
//   weight-ledger-panel  weight rows (columns, totals, add, export)
//   cash-ledger-panel    cash rows
//   ledger-export        what Print / PDF / Excel get

export default function SmithTransactionsPage() {
    const ledger = useSmithLedger();
    const {
        canAddItem, addItemFor, setAddItemFor, metalId, editWeightEntry, setExportTarget, attachTarget, setAttachTarget,
        selectedSmithId, refetchCashFlows, refetchWeightFlows, smithModalOpen, setSmithModalOpen, newSmithName, setNewSmithName,
        openSmith, handleSmithSelect,
    } = ledger;
    const exportSetup = ledgerExportSetup(ledger);

    return (
        <div className="min-h-screen w-full bg-background text-foreground">
            <div className="w-full space-y-2 px-1">
                {/* Ledger workspace */}
                <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
                    <SmithListPanel ledger={ledger} />
                    <div className="flex min-w-0 flex-col gap-1 xl:col-span-9">
                        <LedgerFilterBar ledger={ledger} />
                        <WeightLedgerPanel ledger={ledger} />
                        <CashLedgerPanel ledger={ledger} />
                    </div>
                </div>

                {/* Management */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <SmithManager onSelectSmith={handleSmithSelect} />
                    </section>
                    <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <Register />
                    </section>
                </div>

            </div>

            {canAddItem && (
                <Dialog open={!!addItemFor}  onClose={() => setAddItemFor(null)} aria-labelledby="add-item-title"
                    fullWidth maxWidth="xs" slotProps={{ paper: { sx: { backgroundColor: "var(--card)", color: "var(--foreground)" ,zIndex : 0 } } }}>
                    <DialogTitle id="add-item-title">Add item</DialogTitle>
                    {addItemFor && <ItemForm defaultMetalId={metalId} onCancel={() => setAddItemFor(null)}
                        onSaved={(item) => {
                            const row = addItemFor;
                            setAddItemFor(null);
                            editWeightEntry(row, "itemId", item.itemId);
                        }}
                        metalDisable
                    
                        />
                    }
                </Dialog>
            )}
            {exportSetup && (
                <ExportDialog open onClose={() => setExportTarget("")} storageKey={exportSetup.key}
                    defaultTitle={exportSetup.title} filters={exportSetup.filters} columns={exportSetup.columns}
                    defaultColumns={exportSetup.defaultColumns} rows={exportSetup.rows} />
            )}
            <FlowAttachmentsDialog
                open={!!attachTarget}
                kind={attachTarget?.kind ?? "cash"}
                row={attachTarget?.row ?? null}
                onClose={() => setAttachTarget(null)}
                onUploaded={() => {
                    if (!selectedSmithId || !attachTarget) return;
                    if (attachTarget.kind === "cash") refetchCashFlows(selectedSmithId);
                    else refetchWeightFlows(selectedSmithId);
                }}
            />
            <SmithFormModal
                open={smithModalOpen}
                initialName={newSmithName}
                onClose={() => setSmithModalOpen(false)}
                onSaved={(saved) => {
                    setNewSmithName("");
                    if (saved.smithId) openSmith(saved.smithId, saved.pname || "");
                }}
            />
        </div>
    );
}
