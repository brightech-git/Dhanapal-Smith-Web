// src/components/SmithCreationForm.tsx
"use client";

import React, { useState } from "react";
import { TextField, Button } from "@mui/material";
import { useSmithTransactions } from "@/context/smith/SmithTransactionContext";
import { SmithTransaction } from "@/types/smithcreate";

const SmithCreationForm = () => {
    const { createTransaction } = useSmithTransactions();
    const [formData, setFormData] = useState<SmithTransaction>({
        grwt: 0,
        lesswt: 0,
        netwt: 0,
        touch: 0,
        purity: 0,
        pcs: 0,
        cash: 0,
        upi: 0,
        card: 0,
        rtgs: 0,
        cheque: 0,
        cancel: "",
    });

    const [response, setResponse] = useState<SmithTransaction | null>(null);

    const handleChange = (field: keyof SmithTransaction, value: string) => {
        // Determine if field is a number
        if (
            [
                "grwt",
                "lesswt",
                "netwt",
                "touch",
                "purity",
                "cash",
                "upi",
                "card",
                "rtgs",
                "cheque",
            ].includes(field)
        ) {
            const numericValue = parseFloat(value);
            setFormData((prev) => ({
                ...prev,
                [field]: numericValue,
            }));
        } else if (field === "pcs") {
            setFormData((prev) => ({
                ...prev,
                pcs: parseInt(value),
            }));
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Format decimal fields
        const formattedData: SmithTransaction = {
            ...formData,
            grwt: parseFloat(formData.grwt!.toFixed(3)),
            lesswt: parseFloat(formData.lesswt!.toFixed(3)),
            netwt: parseFloat(formData.netwt!.toFixed(3)),
            touch: parseFloat(formData.touch!.toFixed(3)),
            purity: parseFloat(formData.purity!.toFixed(3)),
            cash: parseFloat(formData.cash!.toFixed(2)),
            upi: parseFloat(formData.upi!.toFixed(2)),
            card: parseFloat(formData.card!.toFixed(2)),
            rtgs: parseFloat(formData.rtgs!.toFixed(2)),
            cheque: parseFloat(formData.cheque!.toFixed(2)),
        };

        const created = await createTransaction(formattedData);
        setResponse(created);
        setFormData({
            grwt: 0,
            lesswt: 0,
            netwt: 0,
            touch: 0,
            purity: 0,
            pcs: 0,
            cash: 0,
            upi: 0,
            card: 0,
            rtgs: 0,
            cheque: 0,
            cancel: "",
        });
    };

    return (
        <div className="max-w-3xl mx-auto p-6  shadow rounded">
            <h2 className="text-2xl font-bold mb-4">Create Smith Transaction</h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
                {/* Weight Fields */}
                <TextField
                    label="Gross Weight (grwt)"
                    type="number"
                    placeholder="Enter Gross Weight"
                    value={formData.grwt === 0 ? "" : formData.grwt}
                    onChange={(e) => handleChange("grwt", e.target.value)}
                    sx={{color:'var(--primary-text-color)'}}
                />
                <TextField
                    label="Less Weight (lesswt)"
                    type="number"
                    placeholder="Enter Less Weight"
                    value={formData.lesswt === 0 ? "" : formData.lesswt}
                    onChange={(e) => handleChange("lesswt", e.target.value)}
                />
                <TextField
                    label="Net Weight (netwt)"
                    type="number"
                    placeholder="Enter Net Weight"
                    value={formData.netwt === 0 ? "" : formData.netwt}
                    onChange={(e) => handleChange("netwt", e.target.value)}
                />
                <TextField
                    label="Touch"
                    type="number"
                    placeholder="Enter Touch"
                    value={formData.touch === 0 ? "" : formData.touch}
                    onChange={(e) => handleChange("touch", e.target.value)}
                />
                <TextField
                    label="Purity"
                    type="number"
                    placeholder="Enter Purity"
                    value={formData.purity === 0 ? "" : formData.purity}
                    onChange={(e) => handleChange("purity", e.target.value)}
                />
                <TextField
                    label="Pieces (pcs)"
                    type="number"
                    placeholder="Enter Pieces"
                    value={formData.pcs === 0 ? "" : formData.pcs}
                    onChange={(e) => handleChange("pcs", e.target.value)}
                />
                <TextField
                    label="Cash"
                    type="number"
                    placeholder="Enter Cash"
                    value={formData.cash === 0 ? "" : formData.cash}
                    onChange={(e) => handleChange("cash", e.target.value)}
                />
                <TextField
                    label="UPI"
                    type="number"
                    placeholder="Enter UPI"
                    value={formData.upi === 0 ? "" : formData.upi}
                    onChange={(e) => handleChange("upi", e.target.value)}
                />
                <TextField
                    label="Card"
                    type="number"
                    
                    placeholder="Enter Card"
                    value={formData.card === 0 ? "" : formData.card}
                    onChange={(e) => handleChange("card", e.target.value)}
                />
                <TextField
                    label="RTGS"
                    type="number"
                    placeholder="Enter RTGS"
                    value={formData.rtgs === 0 ? "" : formData.rtgs}
                    onChange={(e) => handleChange("rtgs", e.target.value)}
                />
                <TextField
                    label="Cheque"
                    type="number"
                    placeholder="Enter Cheque"
                    value={formData.cheque === 0 ? "" : formData.cheque}
                    onChange={(e) => handleChange("cheque", e.target.value)}
                />
                <TextField
                    label="Cancel"
                    type="text"
                    placeholder="Enter Cancel info"
                    value={formData.cancel}
                    onChange={(e) => handleChange("cancel", e.target.value)}
                />


                {/* Submit */}
                <div className="md:col-span-2 flex justify-end mt-4">
                    <Button variant="contained" color="primary" type="submit">
                        Create
                    </Button>
                </div>
            </form>

            {response && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                    <h3 className="font-semibold text-green-800">Transaction Created Successfully!</h3>
                    <pre className="text-sm">{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default SmithCreationForm;
