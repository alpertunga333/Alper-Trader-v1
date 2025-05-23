
// src/actions/binanceActions.ts
'use server';

import { getAccountBalances as fetchBalancesFromBinance } from '@/services/binance';
import type { Balance } from '@/services/binance';
import { fetchSecureApiKey, fetchSecureSecretKey } from '@/lib/secure-api'; // Import secure fetch functions
import type { ApiEnvironment } from '@/ai/types/strategy-types'; // Ensure ApiEnvironment is imported

interface ActionResult {
    success: boolean;
    balances?: Balance[];
    error?: string;
}

/**
 * Server Action to securely fetch account balances for a specified environment.
 * Retrieves API keys securely from server-side configuration based on the environment.
 *
 * @param apiKeyHint A non-sensitive hint (e.g., first 4 chars) to identify the key set - **optional**.
 * @param secretKeyHint A non-sensitive hint (e.g., '****') - **optional**.
 * @param environment The API environment ('spot', 'futures', 'testnet_spot', 'testnet_futures').
 * @returns An ActionResult object containing the success status, balances, or an error message.
 */
export async function fetchAccountBalancesAction(
    apiKeyHint: string, // Use hints instead of actual keys passed from client
    secretKeyHint: string, // Use hints instead of actual keys passed from client
    environment: ApiEnvironment // Environment is now required
): Promise<ActionResult> {
    const envLabel = environment.replace('_', ' ').toUpperCase();
    console.log(`Server Action: Fetching account balances for ${envLabel} (Hint: ${apiKeyHint}).`);

    try {
        // Securely retrieve keys for the specified environment
        const apiKey = await fetchSecureApiKey(environment);
        const secretKey = await fetchSecureSecretKey(environment);

        if (!apiKey || !secretKey) {
            console.error(`Server Action Error: Binance API keys not configured securely for environment: ${envLabel}.`);
            return { success: false, error: `API anahtarları ${envLabel} için yapılandırılmamış.` };
        }

        const isTestnet = environment.includes('testnet');
        const isFutures = environment.includes('futures'); // Correctly determine if it's a futures environment

        // Call the Binance service function with securely retrieved keys and both flags
        const balances = await fetchBalancesFromBinance(apiKey, secretKey, isTestnet, isFutures);
        console.log(`Server Action: Successfully fetched ${balances.length} balances for ${envLabel}.`);
        return { success: true, balances };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Bakiye alınırken bilinmeyen bir hata oluştu.';
        console.error(`Server Action Error fetching balances for ${envLabel}:`, errorMessage);
        // Provide a user-friendly error, avoid exposing internal details like "Invalid API Key" directly unless intended
        let userErrorMessage = `Bakiye alınırken bir hata oluştu (${envLabel}).`;
        if (errorMessage.includes('Invalid API Key') || errorMessage.includes('Signature for this request is not valid') || errorMessage.includes('API-key format invalid')) {
            userErrorMessage = `Geçersiz veya yanlış API Anahtarı/Gizli Anahtar (${envLabel}). Lütfen kontrol edin.`;
        } else if (errorMessage.includes('Timestamp for this request was 1000ms ahead of the server')) {
             userErrorMessage = `Sistem saatiniz Binance sunucularıyla senkronize değil. Lütfen saatinizi güncelleyin (${envLabel}).`;
        } else if (errorMessage.includes('Network Error') || errorMessage.includes('fetch failed')) {
            userErrorMessage = `Binance API'sine ulaşılamadı. Ağ bağlantınızı kontrol edin (${envLabel}).`;
        }
        return { success: false, error: userErrorMessage };
    }
}
