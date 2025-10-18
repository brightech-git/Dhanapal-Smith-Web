import React from 'react';
import { X, MapPin, Phone, Calendar, IndianRupee, Scale, Package } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/format';

interface SmithDetailsModalProps {
    smith: any;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
}

const SmithDetailsModal: React.FC<SmithDetailsModalProps> = ({
    smith,
    isOpen,
    onClose,
    onEdit,
}) => {
    if (!isOpen) return null;

    const totalAmount = smith.UPI + smith.CARD + smith.CASH + smith.CHECK + smith.RTGS;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Smith Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Basic Information
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Smith ID
                                    </label>
                                    <p className="text-gray-900 dark:text-white">{smith.SMITHID}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Smith Name
                                    </label>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {smith.SMITHNAME}
                                    </p>
                                </div>
                                {smith.DATE && (
                                    <div className="flex items-center space-x-2">
                                        <Calendar size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {formatDate(smith.DATE)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Contact Information
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Phone size={16} className="text-gray-500" />
                                    <span className="text-gray-900 dark:text-white">
                                        {smith.MOBILE_NUMBER}
                                    </span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <MapPin size={16} className="text-gray-500 mt-1" />
                                    <div>
                                        <p className="text-gray-900 dark:text-white">
                                            {smith.STREET_ADDRESS}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {smith.LOCALITY}, {smith.CITY}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {smith.STATE}, {smith.COUNTRY} - {smith.PINCODE}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metal Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Metal Details
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <Scale className="mx-auto mb-2 text-blue-600" size={24} />
                                <p className="text-sm text-gray-600 dark:text-gray-400">Gross Weight</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {smith.GRWT} g
                                </p>
                            </div>
                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <Scale className="mx-auto mb-2 text-green-600" size={24} />
                                <p className="text-sm text-gray-600 dark:text-gray-400">Net Weight</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {smith.NETWT} g
                                </p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <Package className="mx-auto mb-2 text-purple-600" size={24} />
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pieces</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {smith.PCS}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Payment Details
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                {smith.UPI > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">UPI</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(smith.UPI)}
                                        </p>
                                    </div>
                                )}
                                {smith.CARD > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Card</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(smith.CARD)}
                                        </p>
                                    </div>
                                )}
                                {smith.CASH > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Cash</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(smith.CASH)}
                                        </p>
                                    </div>
                                )}
                                {smith.CHECK > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Check</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(smith.CHECK)}
                                        </p>
                                    </div>
                                )}
                                {smith.RTGS > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">RTGS</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(smith.RTGS)}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Total Amount
                                    </span>
                                    <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                        {formatCurrency(totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Edit Details
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmithDetailsModal;