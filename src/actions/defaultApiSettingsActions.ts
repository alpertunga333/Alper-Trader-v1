'use server';

/**
 * @fileOverview Server actions for fetching default API settings from environment variables.
 */

export interface DefaultApiSettings {
    spot: { key: string; secret: string };
    futures: { key: string; secret: string };
    testnet_spot: { key: string; secret: string };
    testnet_futures: { key: string; secret: string };
    telegram: { token: string; chatId: string };
}

/**
 * Fetches default API keys and Telegram settings from server-side environment variables.
 * @returns A promise resolving to an object containing the default keys and settings.
 *          Empty strings are returned for any environment variable that is not set.
 */
export async function fetchDefaultApiSettingsAction(): Promise<DefaultApiSettings> {
    console.log("Server Action: Fetching default API settings from environment variables.");
    return {
        spot: {
            key: process.env.BINANCE_API_KEY_SPOT || '',
            secret: process.env.BINANCE_SECRET_KEY_SPOT || '',
        },
        futures: {
            key: process.env.BINANCE_API_KEY_FUTURES || '',
            secret: process.env.BINANCE_SECRET_KEY_FUTURES || '',
        },
        testnet_spot: {
            key: process.env.BINANCE_API_KEY_TESTNET_SPOT || '',
            secret: process.env.BINANCE_SECRET_KEY_TESTNET_SPOT || '',
        },
        testnet_futures: {
            key: process.env.BINANCE_API_KEY_TESTNET_FUTURES || '',
            secret: process.env.BINANCE_SECRET_KEY_TESTNET_FUTURES || '',
        },
        telegram: {
            token: process.env.TELEGRAM_BOT_TOKEN || '',
            chatId: process.env.TELEGRAM_CHAT_ID || '',
        }
    };
}
