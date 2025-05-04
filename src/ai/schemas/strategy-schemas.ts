// src/ai/schemas/strategy-schemas.ts
import { z } from 'zod';

/**
 * Zod schema for validating a trading strategy object.
 */
export const StrategySchema = z.object({
    id: z.string().min(1, "Strategy ID cannot be empty.").describe('Unique identifier for the strategy.'),
    name: z.string().min(1, "Strategy name cannot be empty.").describe('User-friendly name of the strategy.'),
    description: z.string().min(1, "Strategy description cannot be empty.").describe('Brief description of the strategy logic.'),
    prompt: z.string().optional().describe('Detailed prompt for AI execution or generation (if applicable).')
    // Add fields like 'parameters', 'indicators' if needed for more structured strategies
});

/**
 * Zod schema for validating backtest parameters.
 */
export const BacktestParamsSchema = z.object({
    strategy: StrategySchema.describe('The strategy object to test.'),
    pair: z.string().min(3, "Trading pair symbol is required.").describe('The trading pair symbol (e.g., BTCUSDT).'),
    interval: z.string().min(1, "Candlestick interval is required.").describe('The candlestick interval (e.g., 1h, 1d).'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format.").describe('Start date for backtesting (YYYY-MM-DD).'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format.").describe('End date for backtesting (YYYY-MM-DD).'),
    initialBalance: z.number().positive("Initial balance must be positive.").describe('Initial balance in quote currency (e.g., USDT).'),
    // environment and isTestnet removed, assuming Spot market data
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
    message: "End date must be after start date.",
    path: ["endDate"], // Attach error to endDate field
});


/**
 * Zod schema for validating backtest results.
 */
export const BacktestResultSchema = z.object({
    totalTrades: z.number().int().nonnegative("Total trades cannot be negative.").describe('Total number of trades executed.'),
    winningTrades: z.number().int().nonnegative("Winning trades cannot be negative.").describe('Number of profitable trades.'),
    losingTrades: z.number().int().nonnegative("Losing trades cannot be negative.").describe('Number of losing trades.'),
    winRate: z.number().min(0).max(100, "Win rate must be between 0 and 100.").describe('Percentage of winning trades (0-100).'),
    totalPnl: z.number().describe('Total profit or loss in quote currency.'),
    totalPnlPercent: z.number().describe('Total profit or loss as a percentage of initial balance.'),
    maxDrawdown: z.number().nonnegative("Max drawdown cannot be negative.").describe('Maximum drawdown percentage experienced during the test.'),
    sharpeRatio: z.number().optional().describe('Sharpe ratio (risk-adjusted return).'),
    errorMessage: z.string().optional().describe('Error message if the backtest failed.'),
});

/**
 * Zod schema for validating parameters to run a live strategy.
 */
export const RunParamsSchema = z.object({
    strategy: StrategySchema.describe('The strategy object to run.'),
    pair: z.string().min(3, "Trading pair symbol is required.").describe('The trading pair symbol (e.g., BTCUSDT).'),
    interval: z.string().min(1, "Candlestick interval is required.").describe('The candlestick interval to monitor (e.g., 1h, 1d).'),
    stopLossPercent: z.number().positive("Stop loss must be positive.").optional().describe('Optional stop loss percentage.'),
    takeProfitPercent: z.number().positive("Take profit must be positive.").optional().describe('Optional take profit percentage.'),
    // environment and isTestnet removed, assuming Spot market
    // API keys should NOT be part of this schema; they must be handled securely server-side.
});

/**
 * Zod schema for validating the result of initiating a live strategy run.
 */
export const RunResultSchema = z.object({
    status: z.string().describe('Current status of the running strategy (e.g., Active, Error, Stopped).'),
    message: z.string().optional().describe('Additional status message or error details.'),
});

/**
 * Zod schema for validating parameters to define a new strategy.
 */
export const DefineStrategyParamsSchema = z.object({
    name: z.string().min(3, "Strategy name must be at least 3 characters.").describe('Desired name for the new strategy.'),
    description: z.string().min(10, "Description must be at least 10 characters.").describe('Brief description of the strategy goal or idea.'),
    prompt: z.string().min(20, "Prompt must be sufficiently detailed (at least 20 characters).").describe('Detailed prompt explaining the desired logic, indicators, rules, parameters etc. for the AI to generate the strategy.'),
});

/**
 * Zod schema for validating the result of defining a new strategy.
 */
export const DefineStrategyResultSchema = z.object({
    strategy: StrategySchema.optional().describe('The newly defined strategy object, if successful.'),
    success: z.boolean().describe('Whether the strategy definition was successful.'),
    message: z.string().optional().describe('Status message or error details.'),
});
