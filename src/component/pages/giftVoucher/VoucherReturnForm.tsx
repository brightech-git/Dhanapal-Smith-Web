"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Typography,
    Grid,
    TextField,
    Autocomplete,
    Paper,
    CircularProgress,
    IconButton,
    Tooltip,
} from "@mui/material";
import { Trash2 } from "lucide-react";
import { useIntroducers } from "@/context/giftVoucher/IntroducerContext";
import { useVoucherPrefixes } from "@/hooks/giftVoucher/useVoucherPrefixes";
import { useToast } from "@/context/smith/ToastContext";
import { VoucherService, VoucherPrefixService } from "@/service/voucherService";
import { Introducer, ReturnVoucherRequest, VoucherDetails, VoucherPrefix } from "@/types/giftVoucher";
import Table ,{TableColumn} from "@/component/ui/table/Table";



const VoucherReturnForm: React.FC = () => {
    const { activeIntroducers, fetchActive } = useIntroducers();
    const { data: prefixes = [], isLoading: prefixesLoading } = useVoucherPrefixes();
    const { addToast } = useToast();

    const [introducersLoading, setIntroducersLoading] = useState(true);
    const [selectedIntroducer, setSelectedIntroducer] = useState<Introducer | null>(null);
    const [selectedPrefix, setSelectedPrefix] = useState<VoucherPrefix | null>(null);
    const [batchNo, setBatchNo] = useState<string>("");
    const [voucherNo, setVoucherNo] = useState<string>("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const [returnItems ,setReturnItems] = useState<VoucherDetails[] | []>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                await fetchActive();
            } catch (error) {
                addToast({ type: "error", title: "Error", message: "Failed to fetch Introducers" });
            } finally {
                if (mounted) setIntroducersLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if(returnItems.length < 1){
            newErrors.voucherNos = "Atleast One item required to receipt"
        }
        const hasDuplicates = returnItems.some(
            (item, index) =>
                returnItems.findIndex(
                    (x) => x.voucherNo === item.voucherNo
                ) !== index
        );

        if(hasDuplicates) newErrors.voucherNos = "having Duplicates"
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const request: ReturnVoucherRequest = {
                prefix : "GV" ,
                receiptItems : returnItems.map((item)=>({
                    introducerId : item.introducerId ,
                    batchNo : item.batchNo ,
                    voucherNo : item.voucherNo
                    
                })),
            };


            await VoucherService.returnVoucher(request);

            addToast({
                type: "success",
                title: "Vouchers Receipt",
                message: `voucher(s) receipt successfully`,
            });

            setBatchNo("");
            setVoucherNo("");
        } catch (error: any) {
            addToast({
                type: "error",
                title: "Error",
                message: error?.response?.data?.message || "Failed to receipt vouchers",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleClear = () => {
        setReturnItems([]);
        setErrors({});
    };

    const handleRemoveItem = (row: VoucherDetails) => {
        setReturnItems((prev) => prev.filter((item) => item.voucherNo !== row.voucherNo));
    };

    const columns: TableColumn[] = [

        { 
            key: "sno", 
            label: "Sno", 
            align :"center",
            headalign:"center",
            render: (_v:any, _r:any, index:number) => <Typography> {index + 1} </Typography>
        },
        {
            key:"voucherNo" , 
            headalign: "center",
            label:"Voucher No"
        },
        {
            key:"batchNo",
            headalign: "center",
            label:"Batch No"
        },
        {
            key:"introducerName",
            headalign: "center",
            label:"IntroducerName"
        },
        {
            key: "actions",
            label: "Actions",
            align: "center",
            headalign: "center",
            render: (_v: any, row: VoucherDetails) => (
                <Tooltip title="Remove">
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveItem(row)}
                        aria-label="Remove voucher"
                    >
                        <Trash2 size={16} />
                    </IconButton>
                </Tooltip>
            ),
        },
    ]

    return (
        <Box className="p-2">
            <Typography
                variant="h6"
                className="font-semibold mb-3"
                sx={{ fontSize: { xs: "1rem", md: "1.3rem" }, fontWeight: 600 }}
            >
                Receipt Vouchers
            </Typography>

            <Paper elevation={1} className="p-3 mb-3">
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Voucher No"
                                placeholder="Voucher No"
                                value={voucherNo}
                                onChange={(e) => {
                                    setVoucherNo(e.target.value);
                                    if (errors.voucherNos) setErrors((prev) => ({ ...prev, voucherNos: "" }));
                                }}
                                onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (voucherNo.length < 1) {
                                            return addToast(
                                                {
                                                    "type": "info",
                                                    "title": "Required voucher number",
                                                    "message": "Please Enter Voucher Number"
                                                }

                                            )
                                        }
                                        try {
                                            const res = await VoucherPrefixService.getByVoucherNumber(Number(voucherNo) , "I");

                                            if (res) {
                                                setReturnItems((prev) => {
                                                    // Check voucher number already exists
                                                    const exists = returnItems.some(
                                                        (item) => item.voucherNo === res.voucherNo
                                                    );

                                                    if (exists) {
                                                        addToast({title : "Duplicate Entry" , message : "The Voucher already exists in list" , type:"info"})
                                                        return prev;
                                                    }

                                                    // Add new voucher
                                                    return [...prev, res];
                                                });

                                                setVoucherNo("");
                                            }

                                        } catch (error) {
                                            console.error("Failed to get voucher:", error);
                                            addToast({type:"info" , title : "Voucher Not Found" , message : "Voucher Not Found or already voucher was receipt"})
                                        }
                                    }
                                }}
                                error={!!errors.voucherNos}
                                helperText={errors.voucherNos || "Type a voucher number and press Enter to add"}
                                disabled={submitting}
                            />
                        </Grid>

                        {returnItems.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Table
                                    columns={columns}
                                    data={returnItems}
                                    showRows={0}
                                    fixedHeight="420px"
                                />
                            </Grid>
                        )}

                        <Grid size={{ xs: 12 }} className="flex justify-end gap-2">
                            <Button
                                variant="outlined"
                                color="secondary"
                                type="button"
                                onClick={handleClear}
                                disabled={submitting || returnItems.length < 1}
                            >
                                Clear
                            </Button>
                            <Button variant="contained" color="primary" type="submit" disabled={ !returnItems || returnItems.length < 1 || submitting} >
                                {submitting ? "Receipting..." : "Receipt"}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default VoucherReturnForm;
