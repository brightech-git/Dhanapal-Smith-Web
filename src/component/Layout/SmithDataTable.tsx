// components/Layout/SmithDataTable.tsx
import React, { useState, useMemo, useCallback } from 'react';
import Table from '../ui/table/Table';
import { useRouter } from 'next/navigation';
import { useSmithOperations } from '@/hooks/smith/useSmithOperations';
import { formatCurrency, formatDate } from '@/utils/format';
import { ControlledModal } from '@/component/ui/dropdown/ControlledModal';
import { CompactModalTrigger } from '@/component/ui/dropdown/ModalDropdown'; // Keep the trigger
import { Eye, Edit2, Trash2, Scale, IndianRupee, CreditCard, Smartphone, Wallet, FileText } from 'lucide-react';

interface SmithData {
    SMITHID: number;
    SMITHNAME: string;
    GRWT: number;
    NETWT: number;
    PCS: number;
    UPI: number;
    CARD: number;
    CASH: number;
    CHECK: number;
    RTGS: number;
    DETAILID: number;
    STREET_ADDRESS: string;
    LOCALITY: string;
    MOBILE_NUMBER: string;
    CITY: string;
    STATE: string;
    COUNTRY: string;
    PINCODE: string;
    DATE?: string;
}

interface SmithDataTableProps {
    data: SmithData[];
    onEdit?: (smith: SmithData) => void;
    onDelete?: (smith: SmithData) => void;
    loading?: boolean;
    onDataChange?: () => void;
}

const SmithDataTable: React.FC<SmithDataTableProps> = ({
    data,
    onEdit,
    onDelete,
    loading = false,
    onDataChange
}) => {
    const router = useRouter();
    const { deleteSmith, editSmith, loading: operationLoading } = useSmithOperations();
    const [selectedSmith, setSelectedSmith] = useState<SmithData | null>(null);
    const [modalType, setModalType] = useState<'metal' | 'payment' | null>(null);

    // Metal Details Modal Content
    const MetalDetailsModal: React.FC<{ smith: SmithData }> = ({ smith }) => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Scale size={16} className="text-blue-500" />
                        <span className="font-medium">Net Weight</span>
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                        {smith.NETWT.toFixed(2)} g
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Scale size={16} className="text-green-500" />
                        <span className="font-medium">Gross Weight</span>
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                        {smith.GRWT.toFixed(2)} g
                    </div>
                </div>
            </div>
            <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                    <span className="font-medium">Pieces Count</span>
                    <span className="text-lg font-semibold text-purple-600">
                        {smith.PCS} Pcs
                    </span>
                </div>
            </div>
        </div>
    );

    // Payment Details Modal Content
    const PaymentDetailsModal: React.FC<{ smith: SmithData }> = ({ smith }) => {
        const paymentMethods = [
            { key: 'UPI', label: 'UPI Payment', icon: Smartphone, amount: smith.UPI, color: 'text-purple-600' },
            { key: 'CARD', label: 'Card Payment', icon: CreditCard, amount: smith.CARD, color: 'text-blue-600' },
            { key: 'CASH', label: 'Cash Payment', icon: Wallet, amount: smith.CASH, color: 'text-green-600' },
            { key: 'CHECK', label: 'Check Payment', icon: FileText, amount: smith.CHECK, color: 'text-orange-600' },
            { key: 'RTGS', label: 'RTGS Payment', icon: FileText, amount: smith.RTGS, color: 'text-red-600' },
        ].filter(method => method.amount > 0);

        const totalAmount = smith.UPI + smith.CARD + smith.CASH + smith.CHECK + smith.RTGS;

        return (
            <div className="space-y-4">
                <div className="space-y-3">
                    {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                            <div key={method.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                <div className="flex items-center space-x-3">
                                    <Icon size={18} className={method.color} />
                                    <span className="font-medium text-sm">{method.label}</span>
                                </div>
                                <div className="font-semibold text-sm">
                                    {formatCurrency(method.amount)}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold">Total Amount</span>
                        <span className="text-lg font-bold text-green-600">
                            {formatCurrency(totalAmount)}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const handleViewDetails = useCallback((smith: SmithData) => {
        router.push(`/smiths/${smith.SMITHID}`);
    }, [router]);

    const handleEdit = useCallback(async (smith: SmithData) => {
        if (onEdit) {
            onEdit(smith);
        } else {
            router.push(`/smiths/edit/${smith.SMITHID}`);
        }
    }, [onEdit, router]);

    const handleDelete = useCallback(async (smith: SmithData) => {
        if (confirm(`Are you sure you want to delete ${smith.SMITHNAME}? This action cannot be undone.`)) {
            const success = await deleteSmith(smith.SMITHID);
            if (success) {
                onDataChange?.();
            } else {
                alert('Failed to delete smith. Please try again.');
            }
        }
    }, [deleteSmith, onDataChange]);

    const openModal = useCallback((smith: SmithData, type: 'metal' | 'payment') => {
        setSelectedSmith(smith);
        setModalType(type);
    }, []);

    const closeModal = useCallback(() => {
        setSelectedSmith(null);
        setModalType(null);
    }, []);

    // Check if modal should be open
    const isMetalModalOpen = selectedSmith && modalType === 'metal';
    const isPaymentModalOpen = selectedSmith && modalType === 'payment';

    // Enhanced columns with ultra-compact design
    const smithColumns = useMemo(() => [
        {
            key: 'sno',
            label: '#',
            align: 'left' as const,
            width: '40px',
            responsive: 'always' as const,
            render: (value: any, row: any, index: number) => (
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {index + 1}
                </div>
            ),
        },
        {
            key: 'SMITHID',
            label: 'ID',
            align: 'left' as const,
            width: '50px',
            responsive: 'always' as const,
            sortable: true,
            render: (value: number) => (
                <div className="text-xs font-mono text-gray-600 dark:text-gray-300">
                    {value}
                </div>
            ),
        },
        {
            key: 'SMITHNAME',
            label: 'Name',
            align: 'left' as const,
            width: '100px',
            responsive: 'always' as const,
            sortable: true,
            render: (value: string, row: SmithData) => (
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {value}
                    </span>
                    {row.DATE && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(row.DATE)}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'metalDetails',
            label: 'Metal',
            align: 'center' as const,
            width: '80px',
            responsive: 'always' as const,
            render: (value: any, row: SmithData) => (
                <CompactModalTrigger
                    value={`${row.PCS} Pcs`}
                    onClick={() => openModal(row, 'metal')}
                />
            ),
        },
        {
            key: 'totalAmount',
            label: 'Amount',
            align: 'center' as const,
            width: '90px',
            responsive: 'always' as const,
            sortable: true,
            render: (value: number, row: SmithData) => (
                <CompactModalTrigger
                    value={formatCurrency(value)}
                    onClick={() => openModal(row, 'payment')}
                />
            ),
        },
        {
            key: 'MOBILE_NUMBER',
            label: 'Contact',
            align: 'center' as const,
            width: '90px',
            responsive: 'md' as const,
            render: (value: string) => (
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                    {value}
                </div>
            ),
        },
    ], [openModal]);

    // Mobile columns - ultra compact
    const mobileColumns = useMemo(() => [
        {
            key: 'sno',
            label: '#',
            align: 'left' as const,
            width: '30px',
            responsive: 'always' as const,
            render: (value: any, row: any, index: number) => (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    {index + 1}
                </div>
            ),
        },
        {
            key: 'SMITHNAME',
            label: 'Smith',
            align: 'left' as const,
            width: '80px',
            responsive: 'always' as const,
            render: (value: string, row: SmithData) => (
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {value}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {row.SMITHID}
                    </span>
                </div>
            ),
        },
        {
            key: 'metalDetails',
            label: 'Details',
            align: 'center' as const,
            width: '60px',
            responsive: 'always' as const,
            render: (value: any, row: SmithData) => (
                <div className="flex flex-col items-center space-y-1">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {row.PCS}P
                    </span>
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(row.UPI + row.CARD + row.CASH + row.CHECK + row.RTGS)}
                    </span>
                </div>
            ),
        },
    ], []);

    return (
        <div className="space-y-2">
            {/* Desktop Table */}
            <div className="hidden md:block">
                <Table
                    columns={smithColumns}
                    data={data.map(row => ({
                        ...row,
                        totalAmount: row.UPI + row.CARD + row.CASH + row.CHECK + row.RTGS,
                    }))}
                    onView={handleViewDetails}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    loading={loading || operationLoading}
                    striped={true}
                    hoverable={true}
                    compact={false}
                    className="shadow-sm rounded-lg"
                    showActions={true}
                    actionsHeader="Actions"
                />
            </div>

            {/* Mobile Table */}
            <div className="block md:hidden">
                <Table
                    columns={mobileColumns}
                    data={data}
                    onView={handleViewDetails}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    loading={loading || operationLoading}
                    striped={true}
                    hoverable={true}
                    compact={true}
                    className="shadow-sm rounded-lg"
                    showActions={true}
                    actionsHeader="⋯"
                />
            </div>

            {/* Metal Details Modal */}
            <ControlledModal
                isOpen={!!isMetalModalOpen}
                onClose={closeModal}
                title="Metal Details"
                size="sm"
            >
                {selectedSmith && <MetalDetailsModal smith={selectedSmith} />}
            </ControlledModal>

            {/* Payment Details Modal */}
            <ControlledModal
                isOpen={!!isPaymentModalOpen}
                onClose={closeModal}
                title="Payment Breakdown"
                size="sm"
            >
                {selectedSmith && <PaymentDetailsModal smith={selectedSmith} />}
            </ControlledModal>
        </div>
    );
};

export default SmithDataTable;