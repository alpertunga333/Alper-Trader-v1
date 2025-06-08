
import * as React from 'react';
import { useState, useEffect } from 'react';

/**
 * Formats a timestamp (number or string) into a localized time string.
 * Returns an empty string if the timestamp is invalid.
 * The conversion uses the client's local timezone by default when 'toLocaleTimeString' is called.
 * @param timestamp The timestamp in milliseconds (number or numeric string), or an ISO 8601 string.
 * @param format 'full' (default) for HH:MM:SS, 'short' for HH:MM.
 * @returns Formatted time string or empty string.
 */
export const formatTimestamp = (
    timestamp: number | string | undefined,
    format: 'full' | 'short' = 'full' // Default to full format
): string => {
    if (timestamp === undefined || timestamp === null) return '';

    // Create Date object. Handles both ISO strings (like those from toISOString()) and numeric timestamps.
    // new Date(value) will parse ISO strings as UTC and convert numeric values (ms since epoch) correctly.
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) { // Check if date is valid
        // console.warn(`formatTimestamp: Invalid timestamp provided: ${timestamp}`); // Optional: for debugging
        return '';
    }

    try {
        const options: Intl.DateTimeFormatOptions = format === 'short'
            ? { hour: '2-digit', minute: '2-digit' }
            : { hour: '2-digit', minute: '2-digit', second: '2-digit' };

        // 'tr-TR' is for Turkish locale formatting (e.g., separators).
        // toLocaleTimeString() itself defaults to using the client's current timezone
        // unless a 'timeZone' option is explicitly provided.
        return date.toLocaleTimeString('tr-TR', options);
    } catch (error) {
        console.error("Error formatting timestamp:", error, "Raw timestamp:", timestamp);
        // Fallback to a basic format if locale options fail (should be rare)
        // date.getHours(), getMinutes(), getSeconds() also return values in local time.
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return format === 'short' ? `${hours}:${minutes}` : `${hours}:${minutes}:${seconds}`;
    }
};


/**
 * Formats a number or numeric string into a localized string representation,
 * handling potential comma decimal separators and ensuring client-side execution.
 * Returns 'N/A' for invalid inputs. Clamps fraction digits to prevent RangeError.
 *
 * IMPORTANT: This function should primarily be used on the client-side or within
 * `useEffect` hooks to prevent hydration mismatches. For direct rendering in SSR/SSG,
 * use `useFormattedNumber` hook or ensure consistent server/client formatting.
 *
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
    // Set sensible defaults based on style
    let defaultMinDigits: number | undefined;
    let defaultMaxDigits: number | undefined;
    if (options?.style === 'currency') {
        defaultMinDigits = 2;
        defaultMaxDigits = 8; // Allow more precision for crypto
    } else if (options?.style === 'percent') {
        defaultMinDigits = 0;
        defaultMaxDigits = 2;
    } else {
        // Default for plain numbers or other styles
        defaultMinDigits = undefined; // Let it infer usually
        defaultMaxDigits = 3;
    }

    let minDigits = options?.minimumFractionDigits ?? defaultMinDigits;
    let maxDigits = options?.maximumFractionDigits ?? defaultMaxDigits;

    // Clamp values to the typical valid range [0, 20]
    minDigits = minDigits !== undefined ? Math.max(0, Math.min(20, minDigits)) : undefined;
    maxDigits = maxDigits !== undefined ? Math.max(0, Math.min(20, maxDigits)) : undefined;

    // Ensure max is not less than min if both are defined
    if (minDigits !== undefined && maxDigits !== undefined) {
        maxDigits = Math.max(minDigits, maxDigits);
    }
    // --- End: Clamp fraction digits ---

    // Construct safe options, only applying clamped values if they were initially defined or had defaults
    const safeOptions: Intl.NumberFormatOptions = {
        ...options, // Apply original options first
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
 * Returns the client-formatted value once available, otherwise a server-safe placeholder.
 * @param value The number or string to format.
 * @param options Intl.NumberFormat options.
 * @returns Formatted number string or a placeholder/server value initially.
 */
export const useFormattedNumber = (value: number | string | undefined, options?: Intl.NumberFormatOptions): string => {
    const [formatted, setFormatted] = useState<string | null>(null);

    // Calculate server value based on clamped digits (simple toFixed)
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
        // Only run full client-side formatting after mount
        const clientFormatted = formatNumberClientSide(value, options);
        setFormatted(clientFormatted);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, JSON.stringify(options)]); // Use stringified options as dependency

    // Return the client-formatted value once available, otherwise the server-safe value
    return formatted ?? serverValue;
};
