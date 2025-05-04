// src/actions/binanceActions.ts
'use server';

import { getAccountBalances as fetchBalancesFromBinance } from '@/services/binance';
import type { Balance } from '@/services/binance';
import { fetchSecureApiKey, fetchSecureSecretKey } from '@/lib/secure-api'; // Import secure fetch functions

interface ActionResult {
    success: boolean;
    balances?: Balance[];
    error?: string;
    environmentUsed?: 'spot' | 'testnetSpot' | 'futures' | 'testnetFutures'; // Indicate which env was used
}

type ApiEnvironment = 'spot' | 'futures' | 'testnetSpot' | 'testnetFutures';

/**
 * Server Action to securely fetch account balances for a specified environment.
 * Retrieves API keys securely from server-side configuration.
 *
 * @param apiKeyHint A non-sensitive hint (e.g., first 4 chars) to identify the key set - **optional**.
 * @param secretKeyHint A non-sensitive hint (e.g., '****') - **optional**.
 * @param isTestnet Flag indicating if the testnet environment should be used.
 * @returns An ActionResult object containing the success status, balances, or an error message.
 */
export async function fetchAccountBalancesAction(
    apiKeyHint: string, // Use hints instead of actual keys passed from client
    secretKeyHint: string, // Use hints instead of actual keys passed from client
    isTestnet: boolean
): Promise<ActionResult> {
    // Determine the target environment based on the testnet flag
    // For now, assuming Spot environments. Adapt if Futures are needed.
    const environment: ApiEnvironment = isTestnet ? 'testnetSpot' : 'spot';
    console.log(`Server Action: Fetching account balances for ${environment} (Hint: ${apiKeyHint}).`);

    try {
        // Securely retrieve keys based on the determined environment
        const apiKey = await fetchSecureApiKey(environment);
        const secretKey = await fetchSecureSecretKey(environment);

        if (!apiKey || !secretKey) {
            console.error(`Server Action Error: Binance API keys not configured securely for environment: ${environment}.`);
            return { success: false, error: `API anahtarları ${environment} için yapılandırılmamış.`, environmentUsed: environment };
        }

        // Call the Binance service function with securely retrieved keys
        const balances = await fetchBalancesFromBinance(apiKey, secretKey, isTestnet);
        console.log(`Server Action: Successfully fetched ${balances.length} balances for ${environment}.`);
        return { success: true, balances, environmentUsed: environment };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Bakiye alınırken bilinmeyen bir hata oluştu.';
        console.error(`Server Action Error fetching balances for ${environment}:`, errorMessage);
        // Provide a user-friendly error, avoid exposing internal details like "Invalid API Key" directly unless intended
        let userErrorMessage = `Bakiye alınırken bir hata oluştu (${environment}).`;
        if (errorMessage.includes('Invalid API Key') || errorMessage.includes('Signature for this request is not valid') || errorMessage.includes('API-key format invalid')) {
            userErrorMessage = `Geçersiz veya yanlış API Anahtarı/Gizli Anahtar (${environment}). Lütfen kontrol edin.`;
        } else if (errorMessage.includes('Timestamp for this request was 1000ms ahead of the server')) {
             userErrorMessage = `Sistem saatiniz Binance sunucularıyla senkronize değil. Lütfen saatinizi güncelleyin (${environment}).`;
        } else if (errorMessage.includes('Network Error') || errorMessage.includes('fetch failed')) {
            userErrorMessage = `Binance API'sine ulaşılamadı. Ağ bağlantınızı kontrol edin (${environment}).`;
        }
        return { success: false, error: userErrorMessage, environmentUsed: environment };
    }
}
