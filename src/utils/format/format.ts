// Date formatting

// Number formatting
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
    return new Intl.NumberFormat('en-IN', {
        style: "decimal",
        notation: "standard", // ✅ ensures full number, not compact (like 123K)
        useGrouping: true, // ✅ adds Indian commas (e.g. 1,23,456)
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};


export const formatNumber = (number: number): string => {
    return new Intl.NumberFormat('en-US').format(number);
};

// Text formatting
export const capitalize = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

// Status formatting
export const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
        active: 'success',
        inactive: 'error',
        pending: 'warning',
        completed: 'success',
        failed: 'error',
        processing: 'warning',
    };

    return statusColors[status.toLowerCase()] || 'gray';
};