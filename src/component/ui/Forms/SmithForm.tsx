'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, Loader2, Scale, IndianRupee, MapPin, User } from 'lucide-react';
import { SmithFormData, SmithFormProps } from '@/types/smith';
import { useTheme } from '@/context/theme/ThemeContext';

// Validation schema
const smithFormSchema = z.object({
    SMITHNAME: z.string().min(1, 'Smith name is required').max(100, 'Name too long'),
    GRWT: z.number().min(0.01, 'Gross weight must be greater than 0').max(10000, 'Weight too high'),
    NETWT: z.number().min(0.01, 'Net weight must be greater than 0').max(10000, 'Weight too high'),
    PCS: z.number().int().min(1, 'At least 1 piece required').max(1000, 'Too many pieces'),
    UPI: z.number().min(0, 'Cannot be negative').max(10000000, 'Amount too high'),
    CARD: z.number().min(0, 'Cannot be negative').max(10000000, 'Amount too high'),
    CASH: z.number().min(0, 'Cannot be negative').max(10000000, 'Amount too high'),
    CHECK: z.number().min(0, 'Cannot be negative').max(10000000, 'Amount too high'),
    RTGS: z.number().min(0, 'Cannot be negative').max(10000000, 'Amount too high'),
    STREET_ADDRESS: z.string().min(1, 'Street address is required').max(200, 'Address too long'),
    LOCALITY: z.string().min(1, 'Locality is required').max(100, 'Locality too long'),
    MOBILE_NUMBER: z.string()
        .min(10, 'Mobile number must be 10 digits')
        .max(15, 'Mobile number too long')
        .regex(/^[0-9+\-\s()]*$/, 'Invalid mobile number format'),
    CITY: z.string().min(1, 'City is required').max(50, 'City name too long'),
    STATE: z.string().min(1, 'State is required').max(50, 'State name too long'),
    COUNTRY: z.string().min(1, 'Country is required').max(50, 'Country name too long'),
    PINCODE: z.string()
        .min(4, 'Pincode must be at least 4 digits')
        .max(10, 'Pincode too long')
        .regex(/^[0-9]*$/, 'Pincode must contain only numbers'),
    DATE: z.string().optional(),
});

type FormValues = z.infer<typeof smithFormSchema>;

const SmithForm: React.FC<SmithFormProps> = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
    isEdit = false,
}) => {
    const { theme } = useTheme();
    const [activeSection, setActiveSection] = useState<'personal' | 'metal' | 'payment' | 'address'>('personal');

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        watch,
        setValue,
        reset,
    } = useForm<FormValues>({
        resolver: zodResolver(smithFormSchema),
        defaultValues: {
            SMITHNAME: '',
            GRWT: 0,
            NETWT: 0,
            PCS: 1,
            UPI: 0,
            CARD: 0,
            CASH: 0,
            CHECK: 0,
            RTGS: 0,
            STREET_ADDRESS: '',
            LOCALITY: '',
            MOBILE_NUMBER: '',
            CITY: '',
            STATE: '',
            COUNTRY: 'India',
            PINCODE: '',
            DATE: new Date().toISOString().split('T')[0],
            ...initialData,
        },
    });

    // Watch payment fields to calculate total
    const paymentFields = watch(['UPI', 'CARD', 'CASH', 'CHECK', 'RTGS']);
    const totalAmount = paymentFields.reduce((sum, amount) => sum + (amount || 0), 0);

    // Watch weight fields
    const [grwt, netwt] = watch(['GRWT', 'NETWT']);
    const weightDifference = grwt - netwt;

    useEffect(() => {
        if (initialData) {
            reset(initialData as FormValues);
        }
    }, [initialData, reset]);

    const onFormSubmit = (data: FormValues) => {
        onSubmit(data as SmithFormData);
    };

    const formSections = [
        { id: 'personal' as const, label: 'Personal Info', icon: User },
        { id: 'metal' as const, label: 'Metal Details', icon: Scale },
        { id: 'payment' as const, label: 'Payment', icon: IndianRupee },
        { id: 'address' as const, label: 'Address', icon: MapPin },
    ];

    return (
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <h2 className="text-2xl font-bold text-white">
                    {isEdit ? 'Edit Smith Details' : 'Add New Smith'}
                </h2>
                <p className="text-primary-100 mt-1">
                    {isEdit ? 'Update the smith information' : 'Enter the smith details below'}
                </p>
            </div>

            {/* Progress Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex overflow-x-auto">
                    {formSections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`flex items-center space-x-2 px-6 py-4 min-w-max transition-all duration-300 ${activeSection === section.id
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-b-2 border-primary-600'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="font-medium">{section.label}</span>
                                <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${activeSection === section.id
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {index + 1}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="p-6">
                <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Personal Information Section */}
                    {activeSection === 'personal' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                                <User size={20} />
                                <span>Personal Information</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Smith Name *
                                    </label>
                                    <input
                                        type="text"
                                        {...register('SMITHNAME')}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${errors.SMITHNAME ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        placeholder="Enter smith name"
                                    />
                                    {errors.SMITHNAME && (
                                        <p className="text-error-600 text-sm mt-1">{errors.SMITHNAME.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Mobile Number *
                                    </label>
                                    <input
                                        type="tel"
                                        {...register('MOBILE_NUMBER')}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${errors.MOBILE_NUMBER ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        placeholder="Enter mobile number"
                                    />
                                    {errors.MOBILE_NUMBER && (
                                        <p className="text-error-600 text-sm mt-1">{errors.MOBILE_NUMBER.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        {...register('DATE')}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Metal Details Section */}
                    {activeSection === 'metal' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                                <Scale size={20} />
                                <span>Metal Details</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Gross Weight (g) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('GRWT', { valueAsNumber: true })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${errors.GRWT ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        placeholder="0.00"
                                    />
                                    {errors.GRWT && (
                                        <p className="text-error-600 text-sm mt-1">{errors.GRWT.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Net Weight (g) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('NETWT', { valueAsNumber: true })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${errors.NETWT ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        placeholder="0.00"
                                    />
                                    {errors.NETWT && (
                                        <p className="text-error-600 text-sm mt-1">{errors.NETWT.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Pieces *
                                    </label>
                                    <input
                                        type="number"
                                        {...register('PCS', { valueAsNumber: true })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${errors.PCS ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        placeholder="1"
                                    />
                                    {errors.PCS && (
                                        <p className="text-error-600 text-sm mt-1">{errors.PCS.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Weight Summary */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Weight Summary</h4>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Gross Weight:</span>
                                        <p className="font-semibold">{grwt || 0} g</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Net Weight:</span>
                                        <p className="font-semibold">{netwt || 0} g</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Difference:</span>
                                        <p className={`font-semibold ${weightDifference > 0 ? 'text-warning-600' : 'text-gray-600'}`}>
                                            {weightDifference.toFixed(2)} g
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Section */}
                    {activeSection === 'payment' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                                <IndianRupee size={20} />
                                <span>Payment Details</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    { key: 'UPI', label: 'UPI Payment' },
                                    { key: 'CARD', label: 'Card Payment' },
                                    { key: 'CASH', label: 'Cash Payment' },
                                    { key: 'CHECK', label: 'Check Payment' },
                                    { key: 'RTGS', label: 'RTGS Payment' },
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {label}
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register(key as keyof FormValues, { valueAsNumber: true })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="0.00"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Total Amount Display */}
                            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-primary-900 dark:text-primary-100">
                                        Total Amount:
                                    </span>
                                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                        ₹{totalAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Address Section */}
                    {activeSection === 'address' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                                <MapPin size={20} />
                                <span>Address Information</span>
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Street Address *
                                    </label>
                                    <textarea
                                        rows={3}
                                        {...register('STREET_ADDRESS')}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${errors.STREET_ADDRESS ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        placeholder="Enter street address"
                                    />
                                    {errors.STREET_ADDRESS && (
                                        <p className="text-error-600 text-sm mt-1">{errors.STREET_ADDRESS.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Locality *
                                        </label>
                                        <input
                                            type="text"
                                            {...register('LOCALITY')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${errors.LOCALITY ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            placeholder="Enter locality"
                                        />
                                        {errors.LOCALITY && (
                                            <p className="text-error-600 text-sm mt-1">{errors.LOCALITY.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            {...register('CITY')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${errors.CITY ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            placeholder="Enter city"
                                        />
                                        {errors.CITY && (
                                            <p className="text-error-600 text-sm mt-1">{errors.CITY.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            State *
                                        </label>
                                        <input
                                            type="text"
                                            {...register('STATE')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${errors.STATE ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            placeholder="Enter state"
                                        />
                                        {errors.STATE && (
                                            <p className="text-error-600 text-sm mt-1">{errors.STATE.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Country *
                                        </label>
                                        <input
                                            type="text"
                                            {...register('COUNTRY')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${errors.COUNTRY ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            placeholder="Enter country"
                                        />
                                        {errors.COUNTRY && (
                                            <p className="text-error-600 text-sm mt-1">{errors.COUNTRY.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Pincode *
                                        </label>
                                        <input
                                            type="text"
                                            {...register('PINCODE')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${errors.PINCODE ? 'border-error-500' : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            placeholder="Enter pincode"
                                        />
                                        {errors.PINCODE && (
                                            <p className="text-error-600 text-sm mt-1">{errors.PINCODE.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation and Action Buttons */}
                <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-3">
                        {formSections.findIndex(section => section.id === activeSection) > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const currentIndex = formSections.findIndex(section => section.id === activeSection);
                                    setActiveSection(formSections[currentIndex - 1].id);
                                }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Previous
                            </button>
                        )}

                        {formSections.findIndex(section => section.id === activeSection) < formSections.length - 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const currentIndex = formSections.findIndex(section => section.id === activeSection);
                                    setActiveSection(formSections[currentIndex + 1].id);
                                }}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Next
                            </button>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={isLoading}
                                className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                            >
                                <X size={18} />
                                <span>Cancel</span>
                            </button>
                        )}

                        {activeSection === 'address' && (
                            <button
                                type="submit"
                                disabled={isLoading || !isDirty}
                                className="px-6 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {isLoading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                <span>{isEdit ? 'Update' : 'Create'} Smith</span>
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SmithForm;