// src/ai/actions/trading-strategy-actions.ts
'use server';

/**
 * @fileOverview Server actions for managing and executing trading strategies.
 * This file adheres to the "use server" directive and exports only async functions.
 */

import { z } from 'zod';
import { ai } from '@/ai/ai-instance'; // Assuming ai-instance is correctly set up
import { getCandlestickData, placeOrder, Candle } from '@/services/binance'; // Assuming Candles are needed for backtest
import type { BacktestParams, BacktestResult, RunParams, RunResult, DefineStrategyParams, DefineStrategyResult, Strategy } from '@/ai/types/strategy-types';
import { BacktestParamsSchema, BacktestResultSchema, RunParamsSchema, RunResultSchema, DefineStrategyParamsSchema, DefineStrategyResultSchema, StrategySchema } from '@/ai/schemas/strategy-schemas';
import { fetchSecureApiKey, fetchSecureSecretKey } from '@/lib/secure-api'; // Placeholder for secure key retrieval

// ----- Backtesting Action -----

/**
 * Server Action to perform a backtest on a given strategy.
 * @param params Backtest parameters including strategy details, pair, interval, dates, and balance. Always uses live 'spot' data.
 * @returns Promise resolving to BacktestResult.
 */
export async function backtestStrategy(params: BacktestParams): Promise<BacktestResult> {
    console.log(`Server Action: Starting backtest for ${params.strategy.name} on ${params.pair} (Spot Data)`);

    // Validate input using Zod schema before proceeding
    const validation = BacktestParamsSchema.safeParse(params);
    if (!validation.success) {
        console.error("Server Action (backtestStrategy) Error: Invalid input parameters.", validation.error.format());
        return {
            errorMessage: `Invalid input parameters: ${validation.error.format()._errors?.join(', ') || 'Validation failed.'}`,
            totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0
        };
    }

    const { strategy, pair, interval, startDate, endDate, initialBalance } = validation.data;

    // ** Placeholder Backtesting Logic **
    // In a real implementation:
    // 1. Fetch historical data using getCandlestickData (potentially multiple calls for long ranges). Always fetch from Spot (isTestnet=false).
    // 2. Simulate the strategy logic against the data.
    // 3. Calculate performance metrics.

    let candles: Candle[] = [];
    try {
        // Crude limit estimation - improve for real backtests needing full range data
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        let intervalMs = 60 * 60 * 1000; // Default 1h
        if (interval.endsWith('m')) intervalMs = parseInt(interval) * 60 * 1000;
        else if (interval.endsWith('h')) intervalMs = parseInt(interval) * 60 * 60 * 1000;
        else if (interval.endsWith('d')) intervalMs = parseInt(interval) * 24 * 60 * 60 * 1000;

        if (isNaN(intervalMs) || intervalMs <= 0) {
           throw new Error(`Invalid interval: ${interval}`);
        }

        const estimatedCandles = Math.ceil((end - start) / intervalMs);
        const limit = Math.min(Math.max(estimatedCandles, 100), 1000); // Fetch decent amount, max 1000
        console.log(`Estimated candles: ${estimatedCandles}, Fetching limit: ${limit} for ${pair} (${interval}) from Spot`);

        // NOTE: Real backtest needs ALL data. This is likely insufficient.
        // Fetch Spot data (isTestnet = false implicitly by service)
        candles = await getCandlestickData(pair, interval, limit);
        console.log(`Fetched ${candles.length} candles for backtest from Spot.`);

        if (candles.length === 0) {
            throw new Error("No historical data fetched.");
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Server Action (backtestStrategy) Error fetching data:", error);
        return {
            errorMessage: `Failed to fetch historical data: ${message}`,
            totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0
        };
    }

    // Simulate simple random results for placeholder
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500)); // Simulate processing time
    const totalTrades = Math.floor(Math.random() * candles.length / 5) + 2; // Simulate trades based on candle count
    const winningTrades = Math.floor(Math.random() * totalTrades);
    const losingTrades = totalTrades - winningTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const pnlFactor = (Math.random() - 0.4); // -0.4 to 0.6
    const totalPnl = initialBalance * pnlFactor * (Math.random() * 0.3 + 0.05); // Pnl between 30% loss and 60% gain range
    const totalPnlPercent = totalTrades > 0 ? (totalPnl / initialBalance) * 100 : 0;
    const maxDrawdown = Math.random() * 40; // Random drawdown up to 40%

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
 * Server Action to initiate live trading for a strategy on the Spot market.
 * **PLACEHOLDER**: This should trigger a robust, persistent background execution mechanism.
 * @param params Parameters including the strategy, pair, interval, risk management.
 * @returns Promise resolving to RunResult indicating initial status.
 */
export async function runStrategy(params: RunParams): Promise<RunResult> {
    const environment = 'spot'; // Always run on spot
    console.log(`Server Action: Initiating live strategy run for ${params.strategy.name} on ${params.pair} (${environment})`);

    // Validate input
    const validation = RunParamsSchema.safeParse(params);
    if (!validation.success) {
        console.error("Server Action (runStrategy) Error: Invalid input parameters.", validation.error.format());
        return { status: 'Error', message: `Invalid input: ${validation.error.format()._errors?.join(', ') || 'Validation failed.'}` };
    }

    const { strategy, pair, interval, stopLossPercent, takeProfitPercent } = validation.data;

    // ** Placeholder Logic **
    // 1. Securely retrieve API keys for the `spot` environment.
    // 2. Validate keys if not already confirmed.
    // 3. Initiate a background task/job/service to:
    //    - Monitor market data (getCandlestickData, potentially WebSockets) from Spot.
    //    - Apply strategy logic (using strategy.prompt or defined rules).
    //    - Place orders securely (placeOrder service action) with risk management (stopLoss, takeProfit) on Spot.
    //    - Log everything.
    //    - Handle errors and state management.

    // Example secure key retrieval
    try {
        const apiKey = await fetchSecureApiKey(environment);
        const secretKey = await fetchSecureSecretKey(environment);
        if (!apiKey || !secretKey) {
             throw new Error(`API keys for environment ${environment} not found or configured securely.`);
        }
        // Keys are available here, pass them securely to the background task runner
        console.log(`Server Action (runStrategy): API keys retrieved for ${environment} (placeholder). Starting background process...`);
        // backgroundTaskRunner.start(strategy, pair, interval, apiKey, secretKey, false, stopLossPercent, takeProfitPercent); // isTestnet is false

    } catch (error) {
         const message = error instanceof Error ? error.message : String(error);
         console.error(`Server Action (runStrategy) Error: Failed to retrieve API keys or start background task for ${environment}: ${message}`);
         return { status: 'Error', message: `Failed to start strategy: ${message}` };
    }


    // Simulate immediate success for placeholder
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        status: 'Active', // Indicates the initiation was successful
        message: `Strategy ${strategy.name} started on ${pair} (${environment}). Monitoring in background.`,
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

     // Validate input
    const validation = DefineStrategyParamsSchema.safeParse(params);
     if (!validation.success) {
        console.error("Server Action (defineNewStrategy) Error: Invalid input parameters.", validation.error.format());
        return { success: false, message: `Invalid input: ${validation.error.format()._errors?.join(', ') || 'Validation failed.'}` };
     }

     const { name, description, prompt } = validation.data;

    // ** Placeholder AI Logic **
    // 1. Use Genkit (ai.generate or a specific flow/prompt) to process the user's prompt.
    // 2. The AI should ideally output a structured representation of the strategy
    //    (e.g., specific indicators, conditions, actions) or even validate the logic.
    // 3. For now, we simulate success/failure and create a basic Strategy object.

    try {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

        // --- Placeholder for potential Genkit call ---
        // const definePrompt = ai.definePrompt(...) // Define a prompt for strategy generation
        // const { output } = await definePrompt({ name, description, userPrompt: prompt });
        // if (!output || !output.isValid) { // Assuming AI returns validation status
        //     throw new Error(output.reason || "AI could not generate a valid strategy from the prompt.");
        // }
        // const generatedLogic = output.logic; // Assuming AI returns structured logic
        // --------------------------------------------

        // Simulate success/failure randomly for now
        if (Math.random() > 0.25) { // 75% chance of success
             // Create a new strategy object - ID generation should be robust
             const newStrategy: Strategy = {
                 id: `ai_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}${Math.random().toString(16).slice(2, 6)}`, // More unique ID
                 name: name,
                 description: description, // Could potentially be enhanced by AI response
                 prompt: prompt, // Store original prompt
                  // generatedLogic: generatedLogic, // Store structured logic if available
             };

             // Validate the generated strategy object itself
             const strategyValidation = StrategySchema.safeParse(newStrategy);
             if (!strategyValidation.success) {
                 console.error("Server Action (defineNewStrategy) Error: Generated strategy object is invalid.", strategyValidation.error.format());
                 throw new Error("Internal error: Generated strategy data is invalid.");
             }

             console.log(`Server Action: AI successfully defined strategy '${name}'. ID: ${newStrategy.id}`);
             return {
                 success: true,
                 strategy: strategyValidation.data, // Return validated data
                 message: `AI successfully defined strategy '${name}'.`,
             };
         } else {
             throw new Error("AI failed to define a valid strategy from the provided prompt. Please try refining the prompt with clearer rules and conditions.");
         }

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Server Action (defineNewStrategy) Error for "${name}":`, error);
        return {
            success: false,
            message: `Error defining strategy: ${message}`,
        };
    }
}
