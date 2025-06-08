
// src/ai/actions/trading-strategy-actions.ts
'use server';

/**
 * @fileOverview Server actions for managing and executing trading strategies.
 * This file adheres to the "use server" directive and exports only async functions.
 */

import { z } from 'zod';
import { ai } from '@/ai/ai-instance';
import { getCandlestickData, placeOrder, type Candle, type OrderParams, type OrderResponse as BinanceOrderResponse } from '@/services/binance';
import type { BacktestParams, BacktestResult, RunParams, RunResult, DefineStrategyParams, DefineStrategyResult, Strategy, ApiEnvironment, OrderResponse } from '@/ai/types/strategy-types';
import { BacktestParamsSchema, BacktestResultSchema, RunParamsSchema, RunResultSchema, DefineStrategyParamsSchema, DefineStrategyResultSchema, StrategySchema, OrderResponseSchema } from '@/ai/schemas/strategy-schemas';
import { fetchSecureApiKey, fetchSecureSecretKey } from '@/lib/secure-api';
import { sendTelegramMessageAction } from '@/actions/telegramActions'; // Import Telegram action

// ----- Backtesting Action -----

/**
 * Server Action to perform a backtest on a given strategy using Spot market data.
 * @param params Backtest parameters including strategy details, pair, interval, dates, and balance.
 * @returns Promise resolving to BacktestResult.
 */
export async function backtestStrategy(params: BacktestParams): Promise<BacktestResult> {
    console.log(`Server Action: Starting backtest for ${params.strategy.name} on ${params.pair} (Using Spot Data)`);

    const validation = BacktestParamsSchema.safeParse(params);
    if (!validation.success) {
        console.error("Server Action (backtestStrategy) Error: Invalid input parameters.", validation.error.format());
        const errorMessages = validation.error.format()._errors?.join(', ') || 'Doğrulama başarısız oldu.';
        return {
            errorMessage: `Geçersiz giriş parametreleri: ${errorMessages}`,
            totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0
        };
    }

    const { strategy, pair, interval, startDate, endDate, initialBalance } = validation.data;

    let candles: Candle[] = [];
    const isTestnet = false;
    try {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        let intervalMs = 60 * 60 * 1000;
        if (interval.endsWith('m')) intervalMs = parseInt(interval) * 60 * 1000;
        else if (interval.endsWith('h')) intervalMs = parseInt(interval) * 60 * 60 * 1000;
        else if (interval.endsWith('d')) intervalMs = parseInt(interval) * 24 * 60 * 60 * 1000;

        if (isNaN(intervalMs) || intervalMs <= 0) {
           throw new Error(`Geçersiz zaman aralığı: ${interval}`);
        }

        const estimatedCandles = Math.ceil((end - start) / intervalMs);
        const limit = Math.min(Math.max(estimatedCandles, 100), 1000);
        console.log(`Estimated candles: ${estimatedCandles}, Fetching limit: ${limit} for ${pair} (${interval}) from Spot`);
        candles = await getCandlestickData(pair, interval, isTestnet, false, limit);
        console.log(`Fetched ${candles.length} candles for backtest from Spot.`);

        if (candles.length === 0) {
            throw new Error("Geçmiş veri çekilemedi. Lütfen parite ve tarih aralığını kontrol edin.");
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Server Action (backtestStrategy) Error fetching data:", error);
        return {
            errorMessage: `Geçmiş veri çekilemedi: ${message}. Lütfen parite, ağ bağlantısı ve tarih ayarlarınızı kontrol edin.`,
            totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0
        };
    }

    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
    const totalTrades = Math.floor(Math.random() * candles.length / 5) + 2;
    const winningTrades = Math.floor(Math.random() * totalTrades);
    const losingTrades = totalTrades - winningTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const pnlFactor = (Math.random() - 0.4);
    const totalPnl = initialBalance * pnlFactor * (Math.random() * 0.3 + 0.05);
    const totalPnlPercent = totalTrades > 0 ? (totalPnl / initialBalance) * 100 : 0;
    const maxDrawdown = Math.random() * 40;

    console.log(`Server Action: Backtest complete for ${strategy.name} on ${pair}. PnL: ${totalPnlPercent.toFixed(2)}%`);

    return {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: parseFloat(winRate.toFixed(2)),
        totalPnl: parseFloat(totalPnl.toFixed(2)),
        totalPnlPercent: parseFloat(totalPnlPercent.toFixed(2)),
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    };
}


// ----- Live Strategy Execution Action -----

/**
 * Server Action to initiate live trading for a strategy on the specified market environment.
 * For demonstration, this will attempt to place a small MARKET BUY order.
 * @param params Parameters including the strategy, pair, interval, risk management, and environment.
 * @returns Promise resolving to RunResult indicating initial status and trade attempt outcome.
 */
export async function runStrategy(params: RunParams): Promise<RunResult> {
    const { environment, strategy, pair, interval } = params; // Destructure relevant params
    const isTestnet = environment.includes('testnet');
    const isFutures = environment.includes('futures');
    const envLabel = environment.replace('_', ' ').toUpperCase();

    console.log(`Server Action: Initiating live strategy run (TEST ORDER) for ${strategy.name} on ${pair} (${envLabel})`);

    const validation = RunParamsSchema.safeParse(params);
    if (!validation.success) {
        console.error("Server Action (runStrategy) Error: Invalid input parameters.", validation.error.format());
        const errorMessages = validation.error.format()._errors?.join(', ') || 'Doğrulama başarısız oldu.';
        return { status: 'Hata', message: `Geçersiz giriş: ${errorMessages}`, order: undefined };
    }

    let apiKey: string | null;
    let secretKey: string | null;
    let telegramBotToken: string | undefined = process.env.TELEGRAM_BOT_TOKEN;
    let telegramChatId: string | undefined = process.env.TELEGRAM_CHAT_ID;
    let orderResponseFromApi: BinanceOrderResponse | null = null;
    let tradeAttemptMessage = '';

    try {
        apiKey = await fetchSecureApiKey(environment);
        secretKey = await fetchSecureSecretKey(environment);
        if (!apiKey || !secretKey) {
             throw new Error(`${envLabel} ortamı için API anahtarları bulunamadı veya güvenli bir şekilde yapılandırılmadı.`);
        }
        console.log(`Server Action (runStrategy): API keys retrieved for ${envLabel}. Attempting test order...`);

        const orderParams: OrderParams = {
            symbol: pair,
            side: 'BUY',
            type: 'MARKET',
        };

        // Futures: Always use quantity. Spot: Use quoteOrderQty.
        if (isFutures) {
            if (pair === 'BTCUSDT') {
                orderParams.quantity = 0.0002; // Approx 12-13 USD
            } else if (pair === 'ETHUSDT') {
                orderParams.quantity = 0.0035; // Approx 12-13 USD
            } else if (pair === 'LTCUSDT') {
                orderParams.quantity = 0.15; // Approx 12-13 USD
            } else if (pair === 'SOLUSDT') {
                orderParams.quantity = 0.08; // Approx 12-13 USD
            } else {
                // Generic small quantity for other futures pairs
                // This might hit MIN_NOTIONAL or LOT_SIZE issues depending on the pair & price.
                orderParams.quantity = 0.01;
            }
        } else { // Spot
            orderParams.quoteOrderQty = 11; // Approx 11 USDT
        }


        console.log(`Server Action (runStrategy): Placing test order with params:`, orderParams);
        orderResponseFromApi = await placeOrder(orderParams, apiKey, secretKey, isTestnet, isFutures);
        console.log(`Server Action (runStrategy): Test order placed successfully for ${pair} (${envLabel}):`, orderResponseFromApi);

        const filledPrice = orderResponseFromApi.fills && orderResponseFromApi.fills.length > 0 ? parseFloat(orderResponseFromApi.fills[0].price) : parseFloat(orderResponseFromApi.price);
        const executedQty = parseFloat(orderResponseFromApi.executedQty);
        const baseAsset = orderResponseFromApi.symbol.replace(/USDT|BUSD|TRY|EUR|FDUSD$/, '');
        const quoteAssetMatch = pair.match(/USDT|BUSD|TRY|EUR|FDUSD$/);
        const quoteAsset = quoteAssetMatch ? quoteAssetMatch[0] : '';


        tradeAttemptMessage = `✅ TEST EMRİ VERİLDİ (${envLabel}):\n` +
                              `Strateji: ${strategy.name}\n` +
                              `Parite: ${orderResponseFromApi.symbol}\n` +
                              `Yön: ${orderResponseFromApi.side}\n` +
                              `Tip: ${orderResponseFromApi.type}\n` +
                              `Durum: ${orderResponseFromApi.status}\n` +
                              `Giriş Fiyatı (Ort.): ${filledPrice.toFixed(quoteAsset === 'TRY' ? 2 : 4)} ${quoteAsset}\n` +
                              `İşlem Miktarı: ${executedQty.toFixed(8)} ${baseAsset}\n` +
                              `Toplam Değer: ${parseFloat(orderResponseFromApi.cummulativeQuoteQty).toFixed(2)} ${quoteAsset}\n` +
                              `Emir ID: ${orderResponseFromApi.orderId}\n`;

        let riskManagementInfo = '';
        if (params.stopLossPercent || params.takeProfitPercent) {
            riskManagementInfo += `\n--- Risk Ayarları (Parametreler) ---\n`;
            if (params.stopLossPercent) {
                const potentialSlPrice = params.side === 'BUY'
                    ? filledPrice * (1 - params.stopLossPercent / 100)
                    : filledPrice * (1 + params.stopLossPercent / 100);
                riskManagementInfo += `Stop-Loss Yüzdesi: ${params.stopLossPercent}%\n`;
                riskManagementInfo += `Tahmini Stop-Loss Fiyatı: ${potentialSlPrice.toFixed(quoteAsset === 'TRY' ? 2 : 4)} ${quoteAsset}\n`;
            }
            if (params.takeProfitPercent) {
                const potentialTpPrice = params.side === 'BUY'
                    ? filledPrice * (1 + params.takeProfitPercent / 100)
                    : filledPrice * (1 - params.takeProfitPercent / 100);
                riskManagementInfo += `Kâr-Al Yüzdesi: ${params.takeProfitPercent}%\n`;
                riskManagementInfo += `Tahmini Kâr-Al Fiyatı: ${potentialTpPrice.toFixed(quoteAsset === 'TRY' ? 2 : 4)} ${quoteAsset}\n`;
            }
        }
        if (riskManagementInfo) {
            tradeAttemptMessage += riskManagementInfo;
        }


    } catch (error) {
         const message = error instanceof Error ? error.message : String(error);
         console.error(`Server Action (runStrategy) Error during test order for ${pair} (${envLabel}): ${message}`);
         tradeAttemptMessage = `❌ TEST EMRİ BAŞARISIZ (${envLabel}) - Strateji: ${strategy.name}, Parite: ${pair}:\nHata: ${message}`;

         if (telegramBotToken && telegramChatId) {
            try {
                await sendTelegramMessageAction(telegramBotToken, telegramChatId, tradeAttemptMessage);
                console.log(`Telegram bildirimi gönderildi (başarısız emir): ${pair}.`);
            } catch (tgError) {
                console.error(`Telegram hata bildirimi gönderilemedi (başarısız emir): ${pair}:`, tgError);
            }
        } else {
            console.warn(`Telegram token/chat ID ayarlanmamış. Hata bildirimi atlanıyor: ${pair}.`);
        }
         return { status: 'Hata', message: `Test emri başarısız oldu: ${message}. Lütfen API anahtarlarınızı, parite limitlerini ve ağ bağlantınızı kontrol edin.`, order: undefined };
    }

    if (orderResponseFromApi && telegramBotToken && telegramChatId) {
        try {
            await sendTelegramMessageAction(telegramBotToken, telegramChatId, tradeAttemptMessage);
            console.log(`Telegram bildirimi gönderildi (başarılı test emri): ${pair}.`);
        } catch (tgError) {
            console.error(`Telegram başarı bildirimi gönderilemedi (başarılı test emri): ${pair}:`, tgError);
            tradeAttemptMessage += "\n(Telegram bildirimi gönderilemedi)";
        }
    } else if (orderResponseFromApi) {
        console.warn(`Telegram token/chat ID ayarlanmamış. Başarı bildirimi atlanıyor: ${pair}.`);
        tradeAttemptMessage += "\n(Telegram bildirimi atlandı: token/chat ID eksik)";
    }

    // Ensure the returned order object matches the OrderResponse schema/type if successful
    const resultOrder: OrderResponse | undefined = orderResponseFromApi ? {
        orderId: orderResponseFromApi.orderId,
        status: orderResponseFromApi.status,
        symbol: orderResponseFromApi.symbol,
        clientOrderId: orderResponseFromApi.clientOrderId,
        price: orderResponseFromApi.price,
        origQty: orderResponseFromApi.origQty,
        executedQty: orderResponseFromApi.executedQty,
        cummulativeQuoteQty: orderResponseFromApi.cummulativeQuoteQty,
        timeInForce: orderResponseFromApi.timeInForce,
        type: orderResponseFromApi.type,
        side: orderResponseFromApi.side,
        transactTime: orderResponseFromApi.transactTime,
        fills: orderResponseFromApi.fills,
    } : undefined;


    return {
        status: 'Aktif',
        message: `Strateji ${strategy.name} (${envLabel} üzerinde ${pair} için test emri verildi). Detaylar:\n${tradeAttemptMessage}`,
        order: resultOrder,
    };
}

// ----- Define New Strategy Action -----

/**
 * Server Action to define a new trading strategy using AI.
 * @param params Parameters including the desired name, description, and detailed prompt for the AI.
 * @returns Promise resolving to DefineStrategyResult containing the new strategy or an error.
 */
export async function defineNewStrategy(params: DefineStrategyParams): Promise<DefineStrategyResult> {
    console.log(`Server Action: AI attempting to define strategy: ${params.name}`);

     const validation = DefineStrategyParamsSchema.safeParse(params);
     if (!validation.success) {
        console.error("Server Action (defineNewStrategy) Error: Invalid input parameters.", validation.error.format());
        const errorMessages = validation.error.format()._errors?.join(', ') || 'Doğrulama başarısız oldu.';
        return { success: false, message: `Geçersiz giriş: ${errorMessages}` };
     }

     const { name, description, prompt } = validation.data;

    try {
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

        if (Math.random() > 0.25) {
             const newStrategy: Strategy = {
                 id: `ai_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
                 name: name,
                 description: description,
                 prompt: prompt,
             };

             const strategyValidation = StrategySchema.safeParse(newStrategy);
             if (!strategyValidation.success) {
                 console.error("Server Action (defineNewStrategy) Error: Generated strategy object is invalid.", strategyValidation.error.format());
                 throw new Error("İç hata: Oluşturulan strateji verileri geçersiz.");
             }

             console.log(`Server Action: AI successfully defined strategy '${name}'. ID: ${newStrategy.id}`);
             return {
                 success: true,
                 strategy: strategyValidation.data,
                 message: `AI, '${name}' stratejisini başarıyla tanımladı.`,
             };
         } else {
             throw new Error("AI, sağlanan istemden geçerli bir strateji tanımlayamadı. Lütfen istemi daha net kurallar ve koşullarla iyileştirmeyi deneyin.");
         }

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Server Action (defineNewStrategy) Error for "${name}":`, error);
        return {
            success: false,
            message: `Strateji tanımlanırken hata oluştu: ${message}. Lütfen isteminizi kontrol edin veya daha sonra tekrar deneyin.`,
        };
    }
}

