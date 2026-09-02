"use client";

import React, { useMemo, useState } from "react";
import {
    Box,
    Button,
    Typography,
    Grid,
    TextField,
    Autocomplete,
    Paper,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from "@mui/material";
import Table, { TableColumn } from "@/component/ui/table/Table";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useIntroducers } from "@/context/giftVoucher/IntroducerContext";
import { useToast } from "@/context/smith/ToastContext";
import { VoucherService } from "@/service/voucherService";
import { formatDateForAPI } from "@/utils/formatDateForAPI";
import { Introducer, VoucherReportRequest, VoucherReportResponse } from "@/types/giftVoucher";

const VoucherReport: React.FC = () => {
    const today = new Date().toISOString().split("T")[0]
    const { activeIntroducers } = useIntroducers();
    const { addToast } = useToast();

    const [issRec, setIssRec] = useState<string>("");
    const [selectedIntroducer, setSelectedIntroducer] = useState<Introducer | null>(null);
    const [batchNo, setBatchNo] = useState<string>("");
    const [voucherNo, setVoucherNo] = useState<string>("");
    const [mobileNo, setMobileNo] = useState<string>("");
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<VoucherReportResponse[]>([]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const request: VoucherReportRequest = {
                issRec: (issRec as "I" | "R" | "") || undefined,
                introducerId: selectedIntroducer?.introducerId,
                batchNo: batchNo ? Number(batchNo) : undefined,
                voucherNo: voucherNo ? Number(voucherNo) : undefined,
                mobileNo: mobileNo || undefined,
                fromDate: fromDate ? formatDateForAPI(fromDate) : undefined,
                toDate: toDate ? formatDateForAPI(toDate) : undefined,
            };

            const result = await VoucherService.getTallyReport(request);
            setRows(result);
        } catch (error: any) {
            addToast({
                type: "error",
                title: "Error",
                message: error?.response?.data?.message || "Failed to fetch report",
            });
        } finally {
            setLoading(false);
        }
    };

    const columns: TableColumn[] = useMemo(
        () => [
            {
                key: "sno",
                label: "S.No",
                align: "center",
                headalign: "center",
                width: "60px",
                render: (_v: any, _row: any, index: number) => <span className="font-semibold">{index + 1}</span>,
            },
            { key: "batchNo", label: "Batch No", align: "center", headalign: "center", width: "90px" },
            { key: "introducerName", label: "Introducer", align: "left", headalign: "center", width: "160px" },
            { key: "voucherCode", label: "Voucher Code", align: "left", headalign: "center", width: "140px" },
            { key: "issuePiece", label: "Issue Pcs", align: "center", headalign: "center", width: "90px" },
            { key: "returnPiece", label: "Receipt Pcs", align: "center", headalign: "center", width: "90px" },
            { key: "balancePiece", label: "Balance Pcs", align: "center", headalign: "center", width: "100px" },
            {
                key: "issueAmount",
                label: "Issue Amt",
                align: "right",
                headalign: "center",
                width: "110px",
                render: (v: number) => (v ?? 0).toFixed(2),
            },
            {
                key: "returnAmount",
                label: "Receipt Amt",
                align: "right",
                headalign: "center",
                width: "110px",
                render: (v: number) => (v ?? 0).toFixed(2),
            },
            {
                key: "balanceAmount",
                label: "Balance Amt",
                align: "right",
                headalign: "center",
                width: "110px",
                render: (v: number) => (v ?? 0).toFixed(2),
            },
        ],
        []
    );

    return (
        <Box className="p-2">
            <Typography
                variant="h6"
                className="font-semibold mb-3"
                sx={{ fontSize: { xs: "1rem", md: "1.3rem" }, fontWeight: 600 }}
            >
                Voucher Tally Report
            </Typography>

            <Paper elevation={1} className="p-3 mb-3">
                <form onSubmit={handleSearch}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="issrec-label">Type</InputLabel>
                                <Select
                                    labelId="issrec-label"
                                    label="Type"
                                    value={issRec}
                                    onChange={(e) => setIssRec(e.target.value)}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="I">Issue</MenuItem>
                                    <MenuItem value="R">Receipt</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Autocomplete
                                options={activeIntroducers}
                                getOptionLabel={(option) => option.introducerName}
                                value={selectedIntroducer}
                                onChange={(_e, newValue) => setSelectedIntroducer(newValue)}
                                size="small"
                                renderInput={(params) => <TextField {...params} label="Introducer" />}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Batch No"
                                type="number"
                                value={batchNo}
                                onChange={(e) => setBatchNo(e.target.value)}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Voucher No"
                                type="number"
                                value={voucherNo}
                                onChange={(e) => setVoucherNo(e.target.value)}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Mobile No"
                                value={mobileNo}
                                onChange={(e) => setMobileNo(e.target.value)}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date: Date | null) => setFromDate(date)}
                                dateFormat="dd-MM-yyyy"
                                placeholderText="dd-mm-yyyy"
                                isClearable
                                maxDate={new Date()  ?? undefined}

                                customInput={
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="From Date"
                                        InputLabelProps={{ shrink: true }}

                                    />
                                }
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                            <DatePicker
                                selected={toDate}
                                onChange={(date: Date | null) => setToDate(date)}
                                dateFormat="dd-MM-yyyy"
                                placeholderText="dd-mm-yyyy"
                                
                                isClearable
                                minDate={fromDate ?? undefined}
                                maxDate={new Date()}
                                customInput={
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="To Date"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                }
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }} className="flex justify-end">
                            <Button variant="contained" color="primary" type="submit" disabled={loading}>
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            <Table columns={columns} data={rows} showRows={0} fixedHeight="420px" loading={loading} />
        </Box>
    );
};

export default VoucherReport;
