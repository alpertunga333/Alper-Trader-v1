'use server';
/**
 * @fileOverview Defines trading strategies and AI flows for backtesting and execution.
 *
 * Exported Functions:
 * - backtestStrategy - Function to initiate a backtest for a strategy.
 * - runStrategy - Function to initiate live trading for a strategy (placeholder).
 * - defineNewStrategy - Function to potentially define a new strategy using AI.
 *
 * Exported Types:
 * - Strategy - Type definition for a trading strategy.
 * - BacktestParams - Input type for the backtestStrategy function.
 * - BacktestResult - Output type for the backtestStrategy function.
 * - RunParams - Input type for the runStrategy function.
 * - RunResult - Output type for the runStrategy function.
 * - DefineStrategyParams - Input type for the defineNewStrategy function.
 * - DefineStrategyResult - Output type for the defineNewStrategy function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { getCandlestickData, Candle } from '@/services/binance'; // Assuming Candles are needed for backtest

// ----- Internal Zod Schemas (Not Exported) -----

const StrategySchema = z.object({
    id: z.string().describe('Unique identifier for the strategy.'),
    name: z.string().describe('User-friendly name of the strategy.'),
    description: z.string().describe('Brief description of the strategy logic.'),
    prompt: z.string().optional().describe('Detailed prompt for AI execution or generation (if applicable).')
});

const BacktestParamsSchema = z.object({
    strategy: StrategySchema.describe('The strategy object to test.'),
    pair: z.string().describe('The trading pair symbol (e.g., BTCUSDT).'),
    interval: z.string().describe('The candlestick interval (e.g., 1h, 1d).'),
    startDate: z.string().describe('Start date for backtesting (YYYY-MM-DD).'),
    endDate: z.string().describe('End date for backtesting (YYYY-MM-DD).'),
    initialBalance: z.number().positive().describe('Initial balance in quote currency (e.g., USDT).'),
});

const BacktestResultSchema = z.object({
    totalTrades: z.number().int().describe('Total number of trades executed.'),
    winningTrades: z.number().int().describe('Number of profitable trades.'),
    losingTrades: z.number().int().describe('Number of losing trades.'),
    winRate: z.number().describe('Percentage of winning trades (0-100).'),
    totalPnl: z.number().describe('Total profit or loss in quote currency.'),
    totalPnlPercent: z.number().describe('Total profit or loss as a percentage of initial balance.'),
    maxDrawdown: z.number().describe('Maximum drawdown percentage experienced during the test.'),
    sharpeRatio: z.number().optional().describe('Sharpe ratio (risk-adjusted return).'),
    errorMessage: z.string().optional().describe('Error message if the backtest failed.'),
});

const RunParamsSchema = z.object({
    strategy: StrategySchema.describe('The strategy object to run.'),
    pair: z.string().describe('The trading pair symbol (e.g., BTCUSDT).'),
    interval: z.string().describe('The candlestick interval to monitor (e.g., 1h, 1d).'),
    // Add other parameters like API keys if needed directly here, or assume they are globally configured/passed securely
});

const RunResultSchema = z.object({
    status: z.string().describe('Current status of the running strategy (e.g., Active, Error, Stopped).'),
    message: z.string().optional().describe('Additional status message or error details.'),
});

const DefineStrategyParamsSchema = z.object({
    name: z.string().describe('Desired name for the new strategy.'),
    description: z.string().describe('Brief description of the strategy goal or idea.'),
    prompt: z.string().describe('Detailed prompt explaining the desired logic, indicators, rules, parameters etc. for the AI to generate the strategy.'),
});

const DefineStrategyResultSchema = z.object({
    strategy: StrategySchema.optional().describe('The newly defined strategy object, if successful.'),
    success: z.boolean().describe('Whether the strategy definition was successful.'),
    message: z.string().optional().describe('Status message or error details.'),
});


// ----- Exported Type Definitions -----

export type Strategy = z.infer<typeof StrategySchema>;
export type BacktestParams = z.infer<typeof BacktestParamsSchema>;
export type BacktestResult = z.infer<typeof BacktestResultSchema>;
export type RunParams = z.infer<typeof RunParamsSchema>;
export type RunResult = z.infer<typeof RunResultSchema>;
export type DefineStrategyParams = z.infer<typeof DefineStrategyParamsSchema>;
export type DefineStrategyResult = z.infer<typeof DefineStrategyResultSchema>;


// ----- Genkit Flows (Internal Implementation) -----

// --- Backtesting Flow ---
const backtestStrategyFlow = ai.defineFlow<typeof BacktestParamsSchema, typeof BacktestResultSchema>(
    {
        name: 'backtestStrategyFlow',
        inputSchema: BacktestParamsSchema,
        outputSchema: BacktestResultSchema,
    },
    async (params) => {
        console.log(`Starting backtest for ${params.strategy.name} on ${params.pair} from ${params.startDate} to ${params.endDate}`);

        // **Placeholder Implementation:**
        // In a real implementation, this flow would:
        // 1. Fetch historical candlestick data for the given pair, interval, and date range using `getCandlestickData`.
        //    - Handle potential pagination if the date range is very long.
        // 2. Simulate the trading strategy logic against the historical data:
        //    - Iterate through candles.
        //    - Apply indicators based on the strategy (e.g., calculate RSI, SMA).
        //    - Generate buy/sell signals based on strategy rules.
        //    - Simulate trades based on signals, considering the initial balance, potential fees, slippage.
        //    - Track portfolio value over time.
        // 3. Calculate performance metrics: PnL, win rate, drawdown, etc.
        // 4. Return the BacktestResult.

        // Fetching data (Example - Needs error handling and might need more data)
        let candles: Candle[] = [];
        try {
             // Estimate limit needed (crude, improve based on interval)
            const start = new Date(params.startDate).getTime();
            const end = new Date(params.endDate).getTime();
            let intervalMs = 60 * 60 * 1000; // 1h default
             if (params.interval.endsWith('m')) intervalMs = parseInt(params.interval) * 60 * 1000;
             else if (params.interval.endsWith('h')) intervalMs = parseInt(params.interval) * 60 * 60 * 1000;
             else if (params.interval.endsWith('d')) intervalMs = parseInt(params.interval) * 24 * 60 * 60 * 1000;
             // Ensure intervalMs is valid
             if (isNaN(intervalMs) || intervalMs <= 0) {
                 throw new Error(`Invalid interval specified: ${params.interval}`);
             }
            const estimatedCandles = Math.ceil((end - start) / intervalMs);
            const limit = Math.min(Math.max(estimatedCandles, 50), 1000); // Fetch at least 50, max 1000 per call

            console.log(`Estimated candles: ${estimatedCandles}, Fetching limit: ${limit}`);
            // Note: A real backtest needs ALL data in the range, often requiring multiple API calls or a dedicated data source.
            // This single call is likely insufficient for a proper backtest.
            candles = await getCandlestickData(params.pair, params.interval, limit);
             console.log(`Fetched ${candles.length} candles for backtest.`);

            if (candles.length === 0) {
                 throw new Error("No historical data fetched for the specified range/pair.");
            }
        } catch (error) {
             console.error("Error fetching data for backtest:", error);
             return {
                 errorMessage: `Failed to fetch historical data: ${error instanceof Error ? error.message : String(error)}`,
                 totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0
             };
        }


        // Simulate simple random results for now
        const totalTrades = Math.floor(Math.random() * 50) + 5; // 5-54 trades
        const winningTrades = Math.floor(Math.random() * totalTrades);
        const losingTrades = totalTrades - winningTrades;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        const pnlFactor = (Math.random() - 0.4); // -0.4 to 0.6 range
        const totalPnl = params.initialBalance * pnlFactor * (Math.random() * 0.5 + 0.1); // Pnl up to 30% loss or 60% gain
        const totalPnlPercent = totalTrades > 0 ? (totalPnl / params.initialBalance) * 100 : 0;
        const maxDrawdown = Math.random() * 30; // Random drawdown up to 30%

        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));


        return {
            totalTrades,
            winningTrades,
            losingTrades,
            winRate: parseFloat(winRate.toFixed(2)),
            totalPnl: parseFloat(totalPnl.toFixed(2)),
            totalPnlPercent: parseFloat(totalPnlPercent.toFixed(2)),
            maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
            // sharpeRatio: // Calculation requires risk-free rate and return stddev
        };
    }
);

// --- Live Strategy Execution Flow ---
const runStrategyFlow = ai.defineFlow<typeof RunParamsSchema, typeof RunResultSchema>(
    {
        name: 'runStrategyFlow',
        inputSchema: RunParamsSchema,
        outputSchema: RunResultSchema,
    },
    async (params) => {
        console.log(`Executing live strategy flow (Placeholder) for ${params.strategy.name} on ${params.pair}`);

        // **Placeholder Implementation:**
        // In a real application, this flow would likely:
        // 1. Validate API keys and permissions.
        // 2. Set up a persistent monitoring mechanism (e.g., using setInterval, cron job, or a dedicated task queue).
        // 3. Inside the monitor:
        //    - Fetch latest market data (candles, order book, etc.).
        //    - Apply strategy logic (indicators, signal generation).
        //    - If a buy/sell signal is generated:
        //        - Check current position/balance.
        //        - Place orders using `placeOrder` service.
        //        - Send notifications (Telegram).
        //        - Log actions.
        //    - Handle errors gracefully.
        // 4. This initial flow call might just return a status indicating the bot has started.
        //    The actual execution would happen in the background.

        // Simulate immediate success status for placeholder
        return {
            status: 'Active',
            message: `Strategy ${params.strategy.name} started successfully on ${params.pair}. (Placeholder)`,
        };
    }
);

// --- Define New Strategy Flow ---
const defineNewStrategyFlow = ai.defineFlow<typeof DefineStrategyParamsSchema, typeof DefineStrategyResultSchema>(
    {
        name: 'defineNewStrategyFlow',
        inputSchema: DefineStrategyParamsSchema,
        outputSchema: DefineStrategyResultSchema,
    },
    async (params) => {
        console.log(`AI attempting to define strategy: ${params.name}`);
        // **Placeholder Implementation:**
        // In a real implementation, this flow would:
        // 1. Use an LLM (like Gemini) to interpret the `params.prompt`.
        // 2. Generate structured strategy rules or even executable code based on the prompt.
        // 3. Potentially validate the generated strategy logic.
        // 4. Create a new Strategy object.
        // 5. Return the new strategy or an error message.

        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

        // Simulate success or failure
        if (Math.random() > 0.2) { // 80% chance of success
            const newStrategy: Strategy = {
                id: `ai_${params.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
                name: params.name,
                description: params.description, // Could be enhanced by AI
                prompt: params.prompt, // Store the original prompt
            };
            return {
                success: true,
                strategy: newStrategy,
                message: `AI successfully defined strategy '${params.name}'.`,
            };
        } else {
            return {
                success: false,
                message: `AI failed to define strategy '${params.name}'. The prompt might be unclear or too complex. Please refine the prompt and try again.`,
            };
        }
    }
);


// ----- Exported Async Functions (Wrappers for Flows) -----

export async function backtestStrategy(params: BacktestParams): Promise<BacktestResult> {
    return backtestStrategyFlow(params);
}

export async function runStrategy(params: RunParams): Promise<RunResult> {
    // In a real scenario, this would likely trigger a long-running background process
    // and might return an initial status or job ID.
    console.log("Initiating live strategy run (Placeholder):", params.strategy.name, "on", params.pair);
    return runStrategyFlow(params);
}

export async function defineNewStrategy(params: DefineStrategyParams): Promise<DefineStrategyResult> {
    console.log("Initiating new strategy definition with AI:", params.name);
    return defineNewStrategyFlow(params);
}

// Ensure flows are registered if needed by importing this file in dev.ts
// This is handled by the import in src/ai/dev.ts
