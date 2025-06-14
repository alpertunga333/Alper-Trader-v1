// src/ai/types/strategy-types.ts
import type { z } from 'zod';
import type {
    StrategySchema,
    BacktestParamsSchema,
    BacktestResultSchema,
    RunParamsSchema,
    RunResultSchema,
    DefineStrategyParamsSchema,
    DefineStrategyResultSchema,
    OrderResponseSchema // Import the Zod schema for OrderResponse
} from '@/ai/schemas/strategy-schemas';

/**
 * Represents the available API environments.
 */
export type ApiEnvironment = 'spot' | 'futures' | 'testnet_spot' | 'testnet_futures';

/**
 * Represents a trading strategy.
 */
export type Strategy = z.infer<typeof StrategySchema>;

/**
 * Parameters required for running a backtest.
 */
export type BacktestParams = z.infer<typeof BacktestParamsSchema>;

/**
 * The results obtained from running a backtest.
 */
export type BacktestResult = z.infer<typeof BacktestResultSchema>;

/**
 * Represents the details of a placed order, inferred from Zod schema.
 */
export type OrderResponse = z.infer<typeof OrderResponseSchema>;

/**
 * Parameters required for initiating a live strategy run.
 * Includes the target API environment.
 */
export type RunParams = z.infer<typeof RunParamsSchema>;

/**
 * The result obtained after initiating a live strategy run.
 * This will infer the 'order' field type from OrderResponseSchema.
 */
export type RunResult = z.infer<typeof RunResultSchema>;

/**
 * Parameters required for defining a new strategy using AI.
 */
export type DefineStrategyParams = z.infer<typeof DefineStrategyParamsSchema>;

/**
 * The result obtained after attempting to define a new strategy.
 */
export type DefineStrategyResult = z.infer<typeof DefineStrategyResultSchema>;
