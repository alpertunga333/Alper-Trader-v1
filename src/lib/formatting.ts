import * as React from 'react';
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
 * Returns 'N/A' for invalid inputs. Clamps fraction digits to prevent RangeError.
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

    // --- Start: Clamp fraction digits ---
    let minDigits = options?.minimumFractionDigits ?? (options?.style === 'currency' ? 2 : undefined); // Sensible default for currency, else undefined
    let maxDigits = options?.maximumFractionDigits ?? (options?.style === 'currency' ? 8 : 3); // Default max for currency, else 3

    // Clamp values to the typical valid range [0, 20]
    minDigits = minDigits !== undefined ? Math.max(0, Math.min(20, minDigits)) : undefined;
    maxDigits = maxDigits !== undefined ? Math.max(0, Math.min(20, maxDigits)) : undefined;

    // Ensure max is not less than min if both are defined
    if (minDigits !== undefined && maxDigits !== undefined) {
        maxDigits = Math.max(minDigits, maxDigits);
    }
    // --- End: Clamp fraction digits ---

    const safeOptions: Intl.NumberFormatOptions = {
        ...options, // Apply original options first
        // Apply potentially clamped values, only if they were defined initially or had defaults
        ...(minDigits !== undefined && { minimumFractionDigits: minDigits }),
        ...(maxDigits !== undefined && { maximumFractionDigits: maxDigits }),
    };

    // Special handling for compact notation: Let it infer digits if not explicitly set
    if (options?.notation === 'compact') {
         // If fraction digits were NOT explicitly provided in the original options, remove them for compact
         if (options.minimumFractionDigits === undefined && options.maximumFractionDigits === undefined) {
             delete safeOptions.minimumFractionDigits;
             delete safeOptions.maximumFractionDigits;
         }
         // Otherwise, keep the (potentially clamped) explicit values
    }


     // Use try-catch for safety with localization
     try {
        return numValue.toLocaleString('tr-TR', safeOptions);
     } catch (error) {
        console.error("Error formatting number:", error, "Value:", numValue, "Options:", safeOptions);
         // Fallback to basic formatting with clamped digits
         const fallbackMaxDigits = maxDigits !== undefined ? maxDigits : (minDigits !== undefined ? minDigits : 2);
        return numValue.toFixed(fallbackMaxDigits);
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

    // Calculate server value based on clamped digits
    const serverValue = React.useMemo(() => {
        const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
        if (typeof numValue !== 'number' || isNaN(numValue)) return 'N/A';

        let minDigits = options?.minimumFractionDigits ?? (options?.style === 'currency' ? 2 : undefined);
        let maxDigits = options?.maximumFractionDigits ?? (options?.style === 'currency' ? 8 : 3);
        minDigits = minDigits !== undefined ? Math.max(0, Math.min(20, minDigits)) : undefined;
        maxDigits = maxDigits !== undefined ? Math.max(0, Math.min(20, maxDigits)) : undefined;
        if (minDigits !== undefined && maxDigits !== undefined) maxDigits = Math.max(minDigits, maxDigits);
        const fallbackMaxDigits = maxDigits !== undefined ? maxDigits : (minDigits !== undefined ? minDigits : 2);

        return numValue.toFixed(fallbackMaxDigits);
     // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [value, JSON.stringify(options)]); // Stringify options to capture changes


    useEffect(() => {
        // Only run formatting on the client after mount
        const clientFormatted = formatNumberClientSide(value, options);
        setFormatted(clientFormatted);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, JSON.stringify(options)]); // Use stringified options as dependency

    // Return the client-formatted value once available, otherwise the server-safe value
    return formatted ?? serverValue;
};
