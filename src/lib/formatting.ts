import * as React from 'react'; // Added missing import
import { useState, useEffect } from 'react';

/**
 * Formats a timestamp (number or string) into a localized time string (HH:MM).
 * Returns an empty string if the timestamp is invalid.
 * @param timestamp The timestamp in milliseconds (number or numeric string).
 * @returns Formatted time string or empty string.
 */
export const formatTimestamp = (timestamp: number | string | undefined): string => {
    if (timestamp === undefined || timestamp === null) return '';
    const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    if (isNaN(numericTimestamp)) return '';

    const date = new Date(numericTimestamp);
    if (isNaN(date.getTime())) return ''; // Check if date is valid

    // Use try-catch for safety, though modern browsers support these options widely
    try {
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        console.error("Error formatting timestamp:", error);
        // Fallback to a basic format if locale options fail
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
};


/**
 * Formats a number or numeric string into a localized string representation,
 * handling potential comma decimal separators and ensuring client-side execution.
 * Returns 'N/A' for invalid inputs.
 * @param value The number or string to format.
 * @param options Intl.NumberFormat options.
 * @returns Formatted number string or 'N/A'.
 */
export const formatNumberClientSide = (value: number | string | undefined, options?: Intl.NumberFormatOptions): string => {
    // Guard against running this on the server implicitly before hydration
    if (typeof window === 'undefined') {
       // Return a placeholder or basic server-side format if needed,
       // but the hook should prevent this from being the final rendered value client-side.
        const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
        return (typeof numValue === 'number' && !isNaN(numValue))
            ? numValue.toFixed(options?.minimumFractionDigits ?? options?.maximumFractionDigits ?? 2)
            : 'N/A';
    }

    const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;

    if (numValue === undefined || numValue === null || isNaN(numValue)) {
        return 'N/A'; // Return Not Available for invalid numbers
    }
    const defaultOptions: Intl.NumberFormatOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2, // Default to 2 for consistency unless overridden
        ...options,
    };

     // Use try-catch for safety with localization
     try {
        return numValue.toLocaleString('tr-TR', defaultOptions);
     } catch (error) {
        console.error("Error formatting number:", error);
         // Fallback to basic formatting
        return numValue.toFixed(defaultOptions.minimumFractionDigits);
     }
};

/**
 * Hook to format a number client-side, preventing hydration mismatches.
 * @param value The number or string to format.
 * @param options Intl.NumberFormat options.
 * @returns Formatted number string or a placeholder/server value initially.
 */
export const useFormattedNumber = (value: number | string | undefined, options?: Intl.NumberFormatOptions) => {
    const [formatted, setFormatted] = useState<string | null>(null);
    const serverValue = React.useMemo(() => {
        const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
        return (typeof numValue === 'number' && !isNaN(numValue))
            ? numValue.toFixed(options?.minimumFractionDigits ?? options?.maximumFractionDigits ?? 2)
            : 'N/A';
     }, [value, options?.minimumFractionDigits, options?.maximumFractionDigits]);


    useEffect(() => {
        // Only run formatting on the client after mount
        const clientFormatted = formatNumberClientSide(value, options);
        setFormatted(clientFormatted);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, JSON.stringify(options)]); // Use stringified options as dependency

    // Return the client-formatted value once available, otherwise the server-safe value
    return formatted ?? serverValue;
};
