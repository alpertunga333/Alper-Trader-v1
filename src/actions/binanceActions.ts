// src/actions/binanceActions.ts
'use server';

import { getAccountBalances as fetchBalancesFromBinance } from '@/services/binance';
import type { Balance } from '@/services/binance';

interface ActionResult {
    success: boolean;
    balances?: Balance[];
    error?: string;
}

/**
 * Server Action to securely fetch account balances.
 * In a real application, API keys should be retrieved from secure server-side storage
 * (e.g., environment variables, secrets manager) instead of being passed as arguments.
 *
 * @param apiKey **WARNING: Passing API keys directly like this is INSECURE for production.**
 *               Retrieve keys securely on the server instead.
 * @param secretKey **WARNING: Passing API keys directly like this is INSECURE for production.**
 *                  Retrieve keys securely on the server instead.
 * @param isTestnet Flag indicating if the testnet environment should be used.
 * @returns An ActionResult object containing the success status, balances, or an error message.
 */
export async function fetchAccountBalancesAction(
    apiKey: string, // INSECURE - For demonstration only
    secretKey: string, // INSECURE - For demonstration only
    isTestnet: boolean
): Promise<ActionResult> {
    console.log(`Server Action: Fetching account balances (Testnet: ${isTestnet}).`);

    // **SECURITY ENHANCEMENT (Production):**
    // Instead of receiving keys as arguments, retrieve them securely here:
    // const actualApiKey = process.env.BINANCE_API_KEY_SPOT; // Example for Spot
    // const actualSecretKey = process.env.BINANCE_SECRET_KEY_SPOT;
    // if (!actualApiKey || !actualSecretKey) {
    //     console.error('Server Action Error: Binance API keys not configured on the server.');
    //     return { success: false, error: 'API keys not configured.' };
    // }
    // Use actualApiKey and actualSecretKey below instead of the passed arguments.

    // Using passed keys for current demonstration (INSECURE)
    const actualApiKey = apiKey;
    const actualSecretKey = secretKey;


    if (!actualApiKey || !actualSecretKey) {
         console.error('Server Action Error: Missing API keys.');
         return { success: false, error: 'API Key or Secret Key missing in request (Placeholder Check).' };
    }


    try {
        const balances = await fetchBalancesFromBinance(actualApiKey, actualSecretKey, isTestnet);
        console.log(`Server Action: Successfully fetched ${balances.length} balances.`);
        return { success: true, balances };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching balances.';
        console.error('Server Action Error fetching balances:', errorMessage);
        return { success: false, error: errorMessage };
    }
}
