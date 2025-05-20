'use server';
/**
 * @fileOverview Server actions for validating Binance API keys.
 */

import { getAccountBalances } from '@/services/binance';
import type { ApiEnvironment } from '@/ai/types/strategy-types';

/**
 * Validates Binance API keys by attempting to fetch account balances for the specified environment.
 * This action is called from the client with user-provided keys.
 *
 * @param apiKey The Binance API key.
 * @param secretKey The Binance API secret key.
 * @param environment The API environment ('spot', 'futures', 'testnet_spot', 'testnet_futures').
 * @returns A promise resolving to an object indicating if keys are valid and a message.
 */
export async function validateBinanceKeysAction(
    apiKey: string,
    secretKey: string,
    environment: ApiEnvironment
): Promise<{ isValid: boolean; message: string }> {
    const isTestnet = environment.includes('testnet');
    const isFutures = environment.includes('futures');
    const envLabel = environment.replace('_', ' ').toUpperCase();
    console.log(`Server Action: Validating Binance keys for ${envLabel} (API Key Hint: ${apiKey.substring(0,4)}...)`);

    if (!apiKey || !secretKey) {
        return { isValid: false, message: `API Anahtarı ve Gizli Anahtar ${envLabel} için girilmelidir.` };
    }

    try {
        // Use the existing service function to attempt an authenticated call
        await getAccountBalances(apiKey, secretKey, isTestnet, isFutures);
        console.log(`Server Action: Binance key validation successful for ${envLabel}.`);
        return { isValid: true, message: `${envLabel} API anahtarı başarıyla doğrulandı.` };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir doğrulama hatası oluştu.';
        console.warn(`Server Action: Binance key validation failed for ${envLabel}:`, errorMessage);
        if (errorMessage.includes('Invalid API Key') || errorMessage.includes('Signature for this request is not valid') || errorMessage.includes('API-key format invalid')) {
            return { isValid: false, message: `Geçersiz veya yanlış API Anahtarı/Gizli Anahtar (${envLabel}). Lütfen kontrol edin.` };
        }
         if (errorMessage.includes('Timestamp for this request was 1000ms ahead of the server')) {
             return { isValid: false, message: `Sistem saatiniz Binance sunucularıyla senkronize değil. Lütfen saatinizi güncelleyin (${envLabel}).`};
        }
        if (errorMessage.includes('Network Error') || errorMessage.includes('fetch failed')) {
            return { isValid: false, message: `Binance API'sine ulaşılamadı (${envLabel}). Ağ bağlantınızı kontrol edin.`};
        }
        return { isValid: false, message: `${envLabel} API anahtarları doğrulanırken hata: ${errorMessage.substring(0,100)}` }; // Truncate long messages
    }
}
