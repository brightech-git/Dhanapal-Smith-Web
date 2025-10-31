'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Eye, Edit2, MapPin, Phone, IndianRupee, Trash2 } from 'lucide-react';
import { useTheme } from '@/context/theme/ThemeContext';
import { getStatusColor, formatCurrency } from '@/utils/format';

export interface TableColumn {
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    width?: string;
    sortable?: boolean;
    responsive?: 'always' | 'sm' | 'md' | 'lg' | 'xl';
    render?: (value: any, row: any, index: number) => React.ReactNode;
    editable?: boolean;
    headalign?: 'left' | 'center' | 'right';
}

export interface TableProps {
    columns: TableColumn[];
    data: any[];
    onView?: (row: any) => void;
    onEdit?: (row: any) => void;
    onDelete?: (row: any) => void;
    onAddressClick?: (row: any) => void;
    onRowClick?: (row: any) => void;
    onUpdateRow?: (rowIndex: number, updatedRow: any) => void;
    striped?: boolean;
    hoverable?: boolean;
    compact?: boolean | 'auto';
    className?: string;
    headerClassName?: string;
    bodyClassName?: string;
    showActions?: boolean | 'responsive';
    actionsHeader?: string;
    emptyMessage?: string;
    loading?: boolean;
    showSmithFeatures?: boolean;
    onSmithDetailsClick?: (row: any) => void;
    defaultSortKey?: string;
    defaultSortDirection?: 'asc' | 'desc';
    fixedHeight?: string;
    showRows?: number;
    renderFooter?: () => React.ReactElement;
}

const Table: React.FC<TableProps> = ({
    columns,
    data,
    onView,
    onEdit,
    onDelete,
    onAddressClick,
    onRowClick,
    onUpdateRow,
    striped = true,
    hoverable = true,
    compact = 'auto',
    className = '',
    headerClassName = '',
    bodyClassName = '',
    showActions = 'responsive',
    actionsHeader = 'Actions',
    emptyMessage = 'No data available',
    loading = false,
    showSmithFeatures = false,
    onSmithDetailsClick,
    defaultSortKey,
    defaultSortDirection = 'asc',
    fixedHeight,
    showRows = 0,
    renderFooter
}) => {
    const { getTableStyles, responsive } = useTheme();
    const tableStyles = getTableStyles();
    const [sortKey, setSortKey] = useState(defaultSortKey);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
    const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    const isCompact = compact === 'auto' ? responsive.isMobile : compact;

    const getResponsiveWidth = (width: string | undefined) => {
        if (!width) return undefined;

        // For very small screens (< 450px), ensure minimum readable widths
        if (responsive.windowSize.width < 450) {
            if (width.endsWith('px')) {
                const numericWidth = parseInt(width);
                // Ensure minimum width for readability
                return `${Math.max(40, numericWidth * 0.7)}px`;
            }
        }

        if (responsive.isMobile) return `calc(${width} * 0.85)`;
        if (responsive.isTablet) return `calc(${width} * 0.95)`;
        return width;
    };

    const visibleColumns = useMemo(() =>
        columns.filter(column => {
            if (!column.responsive || column.responsive === 'always') return true;
            switch (column.responsive) {

                case 'md': return responsive.windowSize.width >= 1124;
                case 'lg': return responsive.windowSize.width >= 1280;
                default: return true;
            }
        }),
        [columns, responsive.windowSize.width]
    );


    const shouldShowActions = showActions === 'responsive' ? !responsive.isMobile : showActions;

    const getAlignmentClass = (alignment: 'left' | 'center' | 'right' = 'left') => ({
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    }[alignment]);

    const getHeadAlignmentClass = (alignment: 'left' | 'center' | 'right' = 'left') => ({
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    }[alignment]);

    const getPaddingClass = () => isCompact ? 'px-2 py-1.5' : 'px-2 py-1.5';

    const getTextSizeClass = () => {
        if (responsive.isMobile) return 'text-xs';
        if (responsive.isTablet) return 'text-sm';
        return 'text-xs';
    };

    const sortedData = useMemo(() => {
        if (!sortKey) return data;
        return [...data].sort((a, b) => {
            let valA = a[sortKey];
            let valB = b[sortKey];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortKey, sortDirection]);

    const handleSort = useCallback((key: string) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    }, [sortKey]);

    const displayData = useMemo(() => {
        if (showRows > 0) {
            const emptyRows = Array(Math.max(0, showRows - data.length)).fill({});
            return [...sortedData, ...emptyRows];
        }
        return sortedData;
    }, [sortedData, showRows, data.length]);

    const isEmptyRow = useCallback((row: any, index: number) => {
        return index >= data.length && showRows > 0;
    }, [data.length, showRows]);

    const handleDoubleClick = useCallback((rowIndex: number, columnKey: string, value: any) => {
        if (columns.find(col => col.key === columnKey)?.editable && !isEmptyRow(displayData[rowIndex], rowIndex)) {
            setEditingCell({ rowIndex, columnKey });
            setEditValue(value?.toString() || '');
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [columns, isEmptyRow, displayData]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
    }, []);

    const handleSave = useCallback((rowIndex: number, columnKey: string) => {
        if (!editingCell) return;
        const value = parseFloat(editValue);
        if (isNaN(value) || value < 0) {
            alert('Please enter a valid non-negative number');
            return;
        }
        const updatedRow = { ...displayData[rowIndex] };
        updatedRow[columnKey] = value;
        if (['receipts', 'payments'].includes(columnKey)) {
            updatedRow.balance = (updatedRow.receipts || 0) - (updatedRow.payments || 0);
        }
        onUpdateRow?.(rowIndex, updatedRow);
        setEditingCell(null);
        setEditValue('');
    }, [editValue, editingCell, displayData, onUpdateRow]);

    const handleCancel = useCallback(() => {
        setEditingCell(null);
        setEditValue('');
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, columnKey: string) => {
        if (e.key === 'Enter') {
            handleSave(rowIndex, columnKey);
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    }, [handleSave, handleCancel]);

    const renderCell = useCallback((column: TableColumn, row: any, rowIndex: number) => {
        if (isEmptyRow(row, rowIndex)) {
            return <span className="opacity-0">-</span>;
        }
        const value = row[column.key];
        if (column.render && !editingCell) {
            return column.render(value, row, rowIndex);
        }

        if (editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.key && column.editable) {
            return (
                <input
                    ref={inputRef}
                    type="number"
                    value={editValue}
                    onChange={handleInputChange}
                    onBlur={() => handleSave(rowIndex, column.key)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, column.key)}
                    className={`w-full ${getTextSizeClass()} border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800`}
                    aria-label={`Edit ${column.label}`}
                    min="0"
                    step="0.01"
                />
            );
        }

        if (responsive.isMobile && typeof value === 'string' && value.length > 20) {
            return (
                <span title={value} className="truncate block max-w-[100px]" aria-label={value}>
                    {value}
                </span>
            );
        }

        return value;
    }, [isEmptyRow, showSmithFeatures, onAddressClick, responsive.isMobile, getTextSizeClass, editingCell, editValue, handleInputChange, handleSave, handleKeyDown]);

    const hasActions = shouldShowActions && (onView || onEdit || onDelete || (showSmithFeatures && onSmithDetailsClick));

    if (loading) {
        return (
            <div className={`animate-pulse ${tableStyles.bodyBg} rounded-lg border ${tableStyles.border} ${className}`}>
                <div className={`${getPaddingClass()} ${tableStyles.headerBg}`}>
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                </div>
                {[...Array(5)].map((_, index) => (
                    <div key={index} className={`${getPaddingClass()} border-b ${tableStyles.border}`}>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`overflow-hidden rounded-lg border ${tableStyles.border} shadow-sm ${className}`}>
            <div
                className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
                style={fixedHeight ? { maxHeight: fixedHeight } : {}}
            >
                <table className="w-full border-collapse">
                    <thead className={`sticky top-0 z-10 ${tableStyles.headerBg} ${headerClassName}`}>
                        <tr>
                            {visibleColumns.map((column, colIndex) => (
                                <th
                                    key={column.key}
                                    className={`${getPaddingClass()} ${getTextSizeClass()} font-semibold ${tableStyles.headerText} uppercase tracking-wider whitespace-nowrap bg-[var(--primary-background-color)] border-b border-r ${tableStyles.border} ${getHeadAlignmentClass(column.headalign)} ${colIndex < visibleColumns.length - 1 || hasActions ? `border-r ${tableStyles.border}` : ''} cursor-pointer select-none`}
                                    style={getResponsiveWidth(column.width) ? { width: getResponsiveWidth(column.width), minWidth: getResponsiveWidth(column.width) } : {}}
                                    scope="col"
                                >
                                    <div >
                                        <span >{column.label}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`${tableStyles.bodyBg} ${bodyClassName}`}>
                        {displayData.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={`transition-colors duration-200 border-b ${tableStyles.border} ${striped && rowIndex % 2 === 0 ? tableStyles.stripedBg : ''} ${hoverable && !isEmptyRow(row, rowIndex) ? tableStyles.hoverBg : ''} ${onRowClick && !isEmptyRow(row, rowIndex) ? 'cursor-pointer' : ''} ${isEmptyRow(row, rowIndex) ? 'opacity-30' : ''}`}
                                onClick={() => !isEmptyRow(row, rowIndex) && onRowClick?.(row)}
                                role="row"
                            >
                                {visibleColumns.map((column, colIndex) => (
                                    <td
                                        key={column.key}
                                        className={`${getPaddingClass()} whitespace-nowrap truncate ${getTextSizeClass()} ${isEmptyRow(row, rowIndex) ? 'text-transparent' : tableStyles.bodyText} ${getAlignmentClass(column.align)} ${colIndex < visibleColumns.length - 1 || hasActions ? `border-r ${tableStyles.border}` : ''}`}
                                        style={getResponsiveWidth(column.width) ? {
                                            width: getResponsiveWidth(column.width),
                                            minWidth: getResponsiveWidth(column.width)
                                        } : {}}
                                        role="cell"
                                        onDoubleClick={() => handleDoubleClick(rowIndex, column.key, row[column.key])}
                                    >
                                        {renderCell(column, row, rowIndex)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {/* Footer - Always visible but NOT sticky to avoid alignment issues */}
                      
                    </tbody>
                        {renderFooter && renderFooter()}
                
                   
                </table>

                {displayData.length === 0 && !loading && (
                    <div className={`text-center py-4 ${tableStyles.bodyBg} border-t ${tableStyles.border}`}>
                        <div className={`${tableStyles.bodyText} ${responsive.isMobile ? 'text-sm' : 'text-base'} font-medium`}>
                            {emptyMessage}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            There are no records to display
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Table;