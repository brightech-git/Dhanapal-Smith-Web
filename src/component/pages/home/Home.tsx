'use client';

import React, { useMemo, useState } from 'react';
import { useTheme } from '@/context/theme/ThemeContext';
import Table from '@/component/ui/table/Table';
import { IndianRupee, Scale, Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/format';

export default function SmithsPage() {
    const { mode, theme, responsive } = useTheme();

    const getThemeStyles = () => {
        if (mode === 'dark') {
            return {
                background: {
                    primary: theme.colors?.dark?.background?.primary || '#1f2937',
                    secondary: theme.colors?.dark?.background?.secondary || '#374151',
                    card: theme.colors?.dark?.background?.tertiary || '#4b5563',
                },
                text: {
                    primary: theme.colors?.dark?.text?.primary || '#f9fafb',
                    secondary: theme.colors?.dark?.text?.secondary || '#d1d5db',
                    tertiary: theme.colors?.dark?.text?.tertiary || '#9ca3af',
                },
                border: '#4b5563'
            };
        }

        return {
            background: {
                primary: theme.colors?.light?.background?.primary || '#ffffff',
                secondary: theme.colors?.light?.background?.secondary || '#f9fafb',
                card: theme.colors?.light?.background?.tertiary || '#f3f4f6',
            },
            text: {
                primary: theme.colors?.light?.text?.primary || '#111827',
                secondary: theme.colors?.light?.text?.secondary || '#4b5563',
                tertiary: theme.colors?.light?.text?.tertiary || '#6b7280',
            },
            border: '#e5e7eb'
        };
    };

    const styles = getThemeStyles();

    const [mainSmithData, setMainSmithData] = useState([
        { id: 'S001', name: 'Raj Kumar', date: '2024-01-15', weightBalance: 45.50, mcBalance: 25000 },
        { id: 'S002', name: 'Mohan Singh', date: '2024-01-14', weightBalance: 32.75, mcBalance: 18000 },
        { id: 'S003', name: 'Suresh Patel', date: '2024-01-13', weightBalance: 67.25, mcBalance: 42000 },
        { id: 'S004', name: 'Anil Sharma', date: '2024-01-12', weightBalance: 28.90, mcBalance: 15000 },
        { id: 'S005', name: 'Vikram Mehta', date: '2024-01-11', weightBalance: 53.60, mcBalance: 32000 },
        { id: 'S006', name: 'Deepak Jain', date: '2024-01-10', weightBalance: 39.80, mcBalance: 21000 },
    ]);

    const [weightBalanceData, setWeightBalanceData] = useState([
        { id: 1, date: '2024-01-15', receipts: 25.5, payments: 15.2, balance: 10.3 },
        { id: 2, date: '2024-01-14', receipts: 18.7, payments: 12.1, balance: 6.6 },
        { id: 3, date: '2024-01-13', receipts: 32.2, payments: 18.5, balance: 13.7 },
        { id: 4, date: '2024-01-12', receipts: 15.8, payments: 9.3, balance: 6.5 },
        { id: 5, date: '2024-01-11', receipts: 28.9, payments: 16.4, balance: 12.5 },
    ]);

    const [cashBalanceData, setCashBalanceData] = useState([
        { id: 1, date: '2024-01-15', receipts: 25000.50, payments: 15000.75, balance: 10000.25 },
        { id: 2, date: '2024-01-14', receipts: 18000.25, payments: 12000.50, balance: 6000.75 },
        { id: 3, date: '2024-01-13', receipts: 32000.80, payments: 18000.25, balance: 14000.55 },
        { id: 4, date: '2024-01-12', receipts: 15000.90, payments: 9000.45, balance: 6000.45 },
        { id: 5, date: '2024-01-11', receipts: 28000.60, payments: 16000.30, balance: 12000.30 },
    ]);

    const formatIndianCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatIndianDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Convert date to YYYY-MM-DD format for input[type="date"]
    const formatDateForInput = (dateString: string) => {
        return dateString;
    };

    // Parse date from input format to display format
    const parseDateFromInput = (dateString: string) => {
        return dateString;
    };

    const handleMainSmithUpdate = (rowIndex: number, updatedRow: any) => {
        setMainSmithData(prev => {
            const newData = [...prev];
            newData[rowIndex] = updatedRow;
            return newData;
        });
    };

    const handleWeightBalanceUpdate = (rowIndex: number, updatedRow: any) => {
        setWeightBalanceData(prev => {
            const newData = [...prev];
            newData[rowIndex] = updatedRow;
            return newData;
        });
    };

    const handleCashBalanceUpdate = (rowIndex: number, updatedRow: any) => {
        setCashBalanceData(prev => {
            const newData = [...prev];
            newData[rowIndex] = updatedRow;
            return newData;
        });
    };

    const mainTableColumns = useMemo(() => [
        {
            key: 'id',
            label: 'ID',
            align: 'left' as const,
            width: responsive.isMobile ? '70px' : '80px',
            responsive: 'always' as const,
            sortable: true,
        },
        {
            key: 'name',
            label: 'Name',
            align: 'left' as const,
            width: responsive.isMobile ? '100px' : '120px',
            responsive: 'always' as const,
            sortable: true,
            editable: true,
        },
        {
            key: 'date',
            label: 'Date',
            align: 'center' as const,
            width: responsive.isMobile ? '80px' : '90px',
            responsive: 'sm' as const,
            sortable: true,
            editable: true,
            inputType: 'date',
            render: (value: string) => value ? formatIndianDate(value) : '-',
            formatForEdit: (value: string) => formatDateForInput(value),
            parseFromEdit: (value: string) => parseDateFromInput(value),
        },
        {
            key: 'weightBalance',
            label: 'Weight Bal',
            align: 'right' as const,
            width: responsive.isMobile ? '90px' : '100px',
            responsive: 'sm' as const,
            sortable: true,
            editable: true,
            inputType: 'number',
            step: '0.001',
            render: (value: number) => value ? `${value.toFixed(3)}g` : '-',
        },
        {
            key: 'mcBalance',
            label: 'M.C Balance',
            align: 'right' as const,
            width: responsive.isMobile ? '100px' : '110px',
            responsive: 'md' as const,
            sortable: true,
            editable: true,
            inputType: 'number',
            step: '0.01',
            render: (value: number) => value ? (
                <div className="flex items-center justify-end space-x-1">
                    <span className="text-blue-600 dark:text-blue-400">{formatIndianCurrency(value)}</span>
                </div>
            ) : '-',
        },
    ], [responsive.isMobile]);

    const weightBalanceColumns = useMemo(() => [
        {
            key: 'id',
            label: 'ID',
            align: 'center' as const,
            width: responsive.isMobile ? '50px' : '60px',
            responsive: 'always' as const,
            sortable: true,
        },
        {
            key: 'date',
            label: 'Date',
            align: 'center' as const,
            width: responsive.isMobile ? '80px' : '90px',
            responsive: 'always' as const,
            sortable: true,
            editable: true,
            inputType: 'date',
            render: (value: string) => value ? formatIndianDate(value) : '-',
            formatForEdit: (value: string) => formatDateForInput(value),
            parseFromEdit: (value: string) => parseDateFromInput(value),
        },
        {
            key: 'receipts',
            label: 'Receipts',
            align: 'right' as const,
            width: responsive.isMobile ? '80px' : '90px',
            responsive: 'sm' as const,
            sortable: true,
            editable: true,
            inputType: 'number',
            step: '0.001',
            render: (value: number) => value ? (
                <span className="text-green-600 dark:text-green-400">{value.toFixed(3)}g</span>
            ) : '-',
        },
        {
            key: 'payments',
            label: 'Payments',
            align: 'right' as const,
            width: responsive.isMobile ? '80px' : '90px',
            responsive: 'sm' as const,
            sortable: true,
            editable: true,
            inputType: 'number',
            step: '0.001',
            render: (value: number) => value ? (
                <span className="text-red-600 dark:text-red-400">{value.toFixed(3)}g</span>
            ) : '-',
        },
        {
            key: 'balance',
            label: 'Balance',
            align: 'right' as const,
            width: responsive.isMobile ? '80px' : '90px',
            responsive: 'sm' as const,
            sortable: true,
            inputType: 'number',
            step: '0.001',
            render: (value: number) => value ? (
                <span className="text-blue-600 dark:text-blue-400">{value.toFixed(3)}g</span>
            ) : '-',
        },
    ], [responsive.isMobile]);

    const cashBalanceColumns = useMemo(() => [
        {
            key: 'id',
            label: 'ID',
            align: 'center' as const,
            width: responsive.isMobile ? '50px' : '60px',
            responsive: 'always' as const,
            sortable: true,
        },
        {
            key: 'date',
            label: 'Date',
            align: 'center' as const,
            width: responsive.isMobile ? '80px' : '90px',
            responsive: 'always' as const,
            sortable: true,
            editable: true,
            inputType: 'date',
            render: (value: string) => value ? formatIndianDate(value) : '-',
            formatForEdit: (value: string) => formatDateForInput(value),
            parseFromEdit: (value: string) => parseDateFromInput(value),
        },
        {
            key: 'receipts',
            label: 'Receipts',
            align: 'right' as const,
            width: responsive.isMobile ? '90px' : '100px',
            responsive: 'sm' as const,
            sortable: true,
            editable: true,
            inputType: 'number',
            step: '0.01',
            render: (value: number) => value ? (
                <div className="flex items-center justify-end space-x-1 text-green-600 dark:text-green-400">
                    <span>{formatIndianCurrency(value)}</span>
                </div>
            ) : '-',
        },
        {
            key: 'payments',
            label: 'Payments',
            align: 'right' as const,
            width: responsive.isMobile ? '90px' : '100px',
            responsive: 'sm' as const,
            sortable: true,
            editable: true,
            inputType: 'number',
            step: '0.01',
            render: (value: number) => value ? (
                <div className="flex items-center justify-end space-x-1 text-red-600 dark:text-red-400">
                    <span>{formatIndianCurrency(value)}</span>
                </div>
            ) : '-',
        },
        {
            key: 'balance',
            label: 'Balance',
            align: 'right' as const,
            width: responsive.isMobile ? '90px' : '100px',
            responsive: 'sm' as const,
            sortable: true,
            inputType: 'number',
            step: '0.01',
            render: (value: number) => value ? (
                <div className="flex items-center justify-end space-x-1">
                    <span className="text-blue-600 dark:text-blue-400">{formatIndianCurrency(value)}</span>
                </div>
            ) : '-',
        },
    ], [responsive.isMobile]);

    return (
        <div style={{
            background: styles.background.primary,
            color: styles.text.primary,
            minHeight: '100vh'
        }}>
            <main className="p-2 mx-auto ">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Main Smith Transactions Table - Full width on mobile, left on desktop */}
                    <div className="lg:col-span-1">
                        <div
                            className="p-3 border-b-0 border"
                            style={{
                                background: styles.background.card,
                                borderColor: styles.border
                            }}
                        >
                            <h2 className="text-base font-semibold flex items-center justify-center space-x-2">
                                <Wallet size={18} className="text-blue-600 dark:text-blue-400" />
                                <span>Smith Transactions</span>
                            </h2>
                        </div>
                        <Table
                            columns={mainTableColumns}
                            data={mainSmithData}
                            striped={true}
                            hoverable={true}
                            compact="auto"
                            className="border border-t-0 rounded-t-none"
                            headerClassName="border-b bg-blue-600 text-white dark:bg-blue-800"
                            bodyClassName="border-0"
                            showActions={true}
                            fixedHeight={responsive.isMobile ? '400px' : '500px'}
                            showRows={15}
                            onUpdateRow={handleMainSmithUpdate}
                        />
                    </div>

                    {/* Weight Balance and Cash Balance Tables - Stacked on mobile, right side on desktop */}
                    <div className="lg:col-span-1 space-4">
                        <div className="mb-4">
                            <div
                                className=" p-3 border-b-0 border"
                                style={{
                                    background: styles.background.card,
                                    borderColor: styles.border
                                }}
                            >
                                <h2 className="text-base font-semibold flex items-center justify-center space-x-2">
                                    <Scale size={18} className="text-green-600 dark:text-green-400" />
                                    <span>Weight Balance</span>
                                </h2>
                            </div>
                            <Table
                                columns={weightBalanceColumns}
                                data={weightBalanceData}
                                striped={true}
                                hoverable={true}
                                compact="auto"
                                className="border border-t-0 rounded-t-none"
                                headerClassName="border-b bg-blue-600 text-white dark:bg-blue-800"
                                bodyClassName="border-0"
                                showActions={true}
                                fixedHeight={responsive.isMobile ? '250px' : '280px'}
                                showRows={5}
                                onUpdateRow={handleWeightBalanceUpdate}
                            />
                        </div>

                        <div>
                            <div
                                className="p-3 border-b-0 border"
                                style={{
                                    background: styles.background.card,
                                    borderColor: styles.border
                                }}
                            >
                                <h2 className="text-base font-semibold flex items-center justify-center space-x-2">
                                    <IndianRupee size={18} className="text-blue-600 dark:text-blue-400" />
                                    <span>Cash Balance</span>
                                </h2>
                            </div>
                            <Table
                                columns={cashBalanceColumns}
                                data={cashBalanceData}
                                striped={true}
                                hoverable={true}
                                compact="auto"
                                className="border border-t-0 rounded-t-none"
                                headerClassName="border-b bg-blue-600 text-white dark:bg-blue-800"
                                bodyClassName="border-0"
                                showActions={true}
                                fixedHeight={responsive.isMobile ? '250px' : '280px'}
                                showRows={5}
                                onUpdateRow={handleCashBalanceUpdate}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}