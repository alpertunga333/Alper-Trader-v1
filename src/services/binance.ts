import crypto from 'crypto'; // Required for HMAC signing

/**
 * Represents the parameters for placing an order.
 */
export interface OrderParams {
  /**
   * The trading symbol (e.g., BTCUSDT).
   */
  symbol: string;
  /**
   * The side of the order (e.g., BUY, SELL).
   */
  side: 'BUY' | 'SELL';
  /**
   * The type of the order (e.g., MARKET, LIMIT).
   */
  type: 'MARKET' | 'LIMIT';
  /**
   * The quantity to buy or sell.
   */
  quantity: number;
  /**
   * The price at which to buy or sell (required for LIMIT orders).
   */
  price?: number;
  /**
   * Optional Stop Loss price.
   */
  stopLoss?: number;
   /**
   * Optional Take Profit price.
   */
  takeProfit?: number;
}

/**
 * Represents the response from placing an order.
 */
export interface OrderResponse {
  /**
   * The order ID.
   */
  orderId: number; // Binance uses numeric order IDs
  /**
   * The order status.
   */
  status: string;
   /**
   * The symbol of the order.
   */
  symbol: string;
  /**
   * The client order ID.
   */
  clientOrderId: string;
  /**
   * The price of the order.
   */
  price: string;
   /**
   * The original quantity of the order.
   */
  origQty: string;
  /**
   * The executed quantity of the order.
   */
  executedQty: string;
  /**
   * The cumulative quote quantity.
   */
  cummulativeQuoteQty: string;
  /**
   * The time in force.
   */
  timeInForce: string;
   /**
   * The type of the order.
   */
  type: string;
  /**
   * The side of the order.
   */
  side: string;
  // Add other relevant fields from Binance response
  transactTime?: number;
}


/**
 * Represents the account balance for a specific asset.
 * Note: Binance API returns these as strings.
 */
export interface Balance {
  /**
   * The asset symbol (e.g., BTC, USDT).
   */
  asset: string;
  /**
   * The free balance of the asset (as a string).
   */
  free: string;
  /**
   * The locked balance of the asset (in orders, as a string).
   */
  locked: string;
}


/**
 * Represents a candlestick (OHLCV) data point.
 */
export interface Candle {
  /**
   * The open time of the candle (in milliseconds).
   */
  openTime: number;
  /**
   * The opening price.
   */
  open: number;
  /**
   * The highest price during the candle.
   */
  high: number;
  /**
   * The lowest price during the candle.
   */
  low: number;
  /**
   * The closing price.
   */
  close: number;
  /**
   * The volume traded during the candle.
   */
  volume: number;
  /**
   * The close time of the candle (in milliseconds).
   */
  closeTime: number;
  /**
   * The quote asset volume.
   */
  quoteAssetVolume: number;
  /**
   * The number of trades during the candle.
   */
  numberOfTrades: number;
  /**
   * The taker buy base asset volume.
   */
  takerBuyBaseAssetVolume: number;
  /**
   * The taker buy quote asset volume.
   */
  takerBuyQuoteAssetVolume: number;
  /**
   * Ignore.
   */
  ignore: number; // Binance API includes this field, often ignored
}

/**
 * Represents a single trading pair symbol information from Binance.
 */
export interface SymbolInfo {
  symbol: string;
  status: string; // e.g., TRADING
  baseAsset: string;
  quoteAsset: string;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed?: boolean; // Relevant for Spot
  contractType?: string; // Relevant for Futures
  deliveryDate?: number; // Relevant for Futures
  // Add other relevant fields from the API response if needed
}

/**
 * Represents the overall exchange information from Binance.
 */
export interface ExchangeInfo {
  timezone: string;
  serverTime: number;
  symbols: SymbolInfo[];
  // Add other relevant fields like rateLimits if needed
}


// --- Configuration ---
const BINANCE_SPOT_API_URL = 'https://api.binance.com';
const BINANCE_FUTURES_API_URL = 'https://fapi.binance.com'; // USD-M Futures
const BINANCE_TESTNET_SPOT_API_URL = 'https://testnet.binance.vision';
const BINANCE_TESTNET_FUTURES_API_URL = 'https://testnet.binancefuture.com';


// Helper function to get API URL based on environment
const getApiUrl = (isTestnet: boolean, isFutures: boolean = false): string => {
    if (isTestnet) {
        return isFutures ? BINANCE_TESTNET_FUTURES_API_URL : BINANCE_TESTNET_SPOT_API_URL;
    } else {
        return isFutures ? BINANCE_FUTURES_API_URL : BINANCE_SPOT_API_URL;
    }
}

// Helper function to create HMAC SHA256 signature
const createSignature = (queryString: string, secretKey: string): string => {
    return crypto
        .createHmac('sha256', secretKey)
        .update(queryString)
        .digest('hex');
}

// Helper function for making authenticated API requests
const makeAuthenticatedRequest = async (
    endpoint: string,
    params: Record<string, string | number | undefined | boolean>,
    apiKey: string,
    secretKey: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    isTestnet: boolean,
    isFutures: boolean = false
): Promise<any> => {
    const apiUrl = getApiUrl(isTestnet, isFutures);
    const timestamp = Date.now();
    const queryStringParams = { ...params, timestamp };

    // Filter out undefined values before creating query string
    const definedParams: Record<string, string | number | boolean> = {};
    Object.entries(queryStringParams).forEach(([key, value]) => {
        if (value !== undefined) {
            definedParams[key] = value;
        }
    });

    const queryString = new URLSearchParams(definedParams as Record<string, string>).toString();
    const signature = createSignature(queryString, secretKey);
    const url = `${apiUrl}${endpoint}?${queryString}&signature=${signature}`;

    const headers = {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(url, { method, headers });
        const data = await response.json();

        if (!response.ok) {
            // Log Binance specific error
            console.error(`Binance API Error (${endpoint}, Status: ${response.status}): ${data.msg || 'Unknown error'} (Code: ${data.code || 'N/A'})`);
            throw new Error(`Binance API Error: ${data.msg || `HTTP ${response.status}`} (Code: ${data.code || 'N/A'})`);
        }
        return data;
    } catch (error) {
        console.error(`Error during authenticated Binance request (${endpoint}):`, error);
        throw error; // Re-throw the caught error or a new one
    }
};


/**
 * Asynchronously places an order on the specified Binance environment.
 * Requires secure handling on the server-side.
 *
 * @param orderParams The parameters for the order.
 * @param apiKey The Binance API key.
 * @param secretKey The Binance API secret key.
 * @param isTestnet Whether to use the testnet environment.
 * @param isFutures Whether to use the futures environment (default: false, meaning Spot).
 * @returns A promise that resolves to an OrderResponse object.
 * @throws Error if the API call fails.
 */
export async function placeOrder(
  orderParams: OrderParams,
  apiKey: string,
  secretKey: string,
  isTestnet: boolean,
  isFutures: boolean = false
): Promise<OrderResponse> {
  const envLabel = `${isTestnet ? 'Testnet ' : ''}${isFutures ? 'Futures' : 'Spot'}`;
  console.log(`Placing Order on ${envLabel}:`, orderParams);

  const endpoint = isFutures ? '/fapi/v1/order' : '/api/v3/order';
  const params: Record<string, string | number | undefined> = {
    symbol: orderParams.symbol,
    side: orderParams.side,
    type: orderParams.type,
    quantity: orderParams.quantity,
    // Add price only for LIMIT orders
    ...(orderParams.type === 'LIMIT' && { price: orderParams.price, timeInForce: 'GTC' }), // Good Till Cancelled for limit
    // Add stopLoss/takeProfit if needed (requires different order types like STOP_MARKET, TAKE_PROFIT_MARKET)
    // This basic example only handles MARKET and LIMIT
     recvWindow: 5000, // Optional: Increase if timestamp errors occur
  };

  try {
     // **SECURITY:** Ensure this function is ONLY called from a secure server context (Server Action, API Route)
     const response = await makeAuthenticatedRequest(endpoint, params, apiKey, secretKey, 'POST', isTestnet, isFutures);

     // Map the response to your OrderResponse interface
     // Note: Binance response structure might vary slightly between Spot and Futures. Adjust mapping if needed.
     return {
         orderId: response.orderId,
         status: response.status,
         symbol: response.symbol,
         clientOrderId: response.clientOrderId,
         price: response.price,
         origQty: response.origQty,
         executedQty: response.executedQty,
         cummulativeQuoteQty: response.cummulativeQuoteQty,
         timeInForce: response.timeInForce,
         type: response.type,
         side: response.side,
         transactTime: response.transactTime,
     };
  } catch (error) {
      console.error(`Error placing order on ${envLabel}:`, error);
      throw error; // Re-throw to be handled by caller
  }
}


/**
 * Asynchronously retrieves account balances from the specified Binance environment.
 * Requires secure handling on the server-side.
 *
 * @param apiKey The Binance API key.
 * @param secretKey The Binance API secret key.
 * @param isTestnet Whether to use the testnet environment.
 * @param isFutures Whether to use the futures environment (default: false, meaning Spot).
 * @returns A promise that resolves to an array of Balance objects.
 * @throws Error if the API call fails.
 */
export async function getAccountBalances(
  apiKey: string,
  secretKey: string,
  isTestnet: boolean,
  isFutures: boolean = false
): Promise<Balance[]> {
   const envLabel = `${isTestnet ? 'Testnet ' : ''}${isFutures ? 'Futures' : 'Spot'}`;
   console.log(`Getting Account Balances from ${envLabel}`);

   // Choose the correct endpoint based on futures or spot
   const endpoint = isFutures ? '/fapi/v2/balance' : '/api/v3/account'; // Futures uses v2 balance, Spot uses v3 account

   try {
     // **SECURITY:** Ensure this function is ONLY called from a secure server context (Server Action, API Route)
     // OR by another server action that passes user-provided keys for validation.
     const response = await makeAuthenticatedRequest(endpoint, { recvWindow: 5000 }, apiKey, secretKey, 'GET', isTestnet, isFutures);

     if (isFutures) {
       // Futures balance response is an array of balance objects directly
       if (!Array.isArray(response)) {
           throw new Error(`Unexpected response format for Futures balance: ${JSON.stringify(response)}`);
       }
       // Map Futures balance format (adjust field names if needed based on Binance docs)
       return response.map((b: any) => ({
         asset: b.asset,
         free: b.availableBalance || b.balance, // Use availableBalance if present, otherwise balance
         locked: (parseFloat(b.balance) - parseFloat(b.availableBalance || b.balance)).toFixed(8), // Calculate locked
       }));
     } else {
       // Spot account response has a 'balances' array
       if (!response || !Array.isArray(response.balances)) {
           throw new Error(`Unexpected response format for Spot account: ${JSON.stringify(response)}`);
       }
       return response.balances.map((b: any) => ({
         asset: b.asset,
         free: b.free,
         locked: b.locked,
       }));
     }
   } catch (error) {
     console.error(`Error fetching account balances from ${envLabel}:`, error);
     throw error; // Re-throw for the caller (e.g., Server Action) to handle
   }
}


/**
 * Asynchronously retrieves candlestick data from the specified Binance environment using the public API.
 *
 * @param symbol The trading symbol (e.g., BTCUSDT).
 * @param interval The candlestick interval (e.g., '1m', '5m', '1h', '1d').
 * @param isTestnet Whether to use the testnet endpoint.
 * @param isFutures Whether to use the futures endpoint (default: false, meaning Spot).
 * @param limit The number of candlesticks to retrieve (max 1500 for Futures, 1000 for Spot).
 * @returns A promise that resolves to an array of Candle objects.
 * @throws Error if the API call fails or the symbol is invalid.
 */
export async function getCandlestickData(
  symbol: string,
  interval: string,
  isTestnet: boolean,
  isFutures: boolean = false,
  limit: number = 100 // Default limit
): Promise<Candle[]> {
  const envLabel = `${isTestnet ? 'Testnet ' : ''}${isFutures ? 'Futures' : 'Spot'}`;
  console.log(`Getting Candlestick Data from ${envLabel}: ${symbol}, ${interval}, Limit: ${limit}`);
  if (!symbol) {
    console.warn("getCandlestickData called without a symbol.");
    return []; // Return empty array if no symbol is provided
  }

  const maxLimit = isFutures ? 1500 : 1000;
  const actualLimit = Math.min(limit, maxLimit);

  const apiUrl = getApiUrl(isTestnet, isFutures);
  // Use different klines endpoint for Futures
  const endpoint = isFutures ? `${apiUrl}/fapi/v1/klines` : `${apiUrl}/api/v3/klines`;
  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(), // Ensure symbol is uppercase
    interval: interval,
    limit: actualLimit.toString(),
  });

  try {
    const response = await fetch(`${endpoint}?${params.toString()}`);
    if (!response.ok) {
        // Try parsing error response from Binance
        let errorMsg = `HTTP error! status: ${response.status}`;
        let errorCode = null;
        try {
            const errorData = await response.json();
            errorCode = errorData.code;
            errorMsg = `Binance API Error (klines, ${envLabel}): ${errorData.msg || errorMsg} (Code: ${errorCode || 'N/A'})`;
             // Handle invalid symbol specifically (-1121 for spot/futures)
             if (errorCode === -1121) {
                console.warn(`Invalid symbol: ${symbol} on ${envLabel}. Returning empty data.`);
                return [];
             }
        } catch (parseError) {
            // Ignore if error response is not JSON
        }
      throw new Error(errorMsg);
    }

    const data: any[][] = await response.json(); // Response is array of arrays

    if (!Array.isArray(data)) {
       console.error(`Unexpected response format from Binance klines API (${envLabel}):`, data);
       throw new Error(`Invalid data received from Binance API (klines, ${envLabel}).`);
    }

    // Map the raw array data to Candle objects
    return data.map((k: any[]): Candle => ({
      openTime: Number(k[0]),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: Number(k[6]),
      quoteAssetVolume: parseFloat(k[7]),
      numberOfTrades: Number(k[8]),
      takerBuyBaseAssetVolume: parseFloat(k[9]),
      takerBuyQuoteAssetVolume: parseFloat(k[10]),
      ignore: parseFloat(k[11]), // Binance API includes this field
    }));

  } catch (error) {
    console.error(`Error fetching candlestick data for ${symbol} (${interval}) from ${envLabel}:`, error);
    // Re-throw the error or handle it based on application needs
    // If it's a known error like invalid symbol, we might have already returned []
     if (error instanceof Error && error.message.includes('-1121')) { // Check error code in message
        return []; // Ensure empty array is returned for invalid symbols caught here
     }
    throw error; // Re-throw other errors
  }
}


/**
 * Asynchronously retrieves exchange information, including all symbols, from the specified Binance environment.
 *
 * @param isTestnet Whether to use the testnet endpoint.
 * @param isFutures Whether to use the futures endpoint (default: false, meaning Spot).
 * @returns A promise that resolves to an ExchangeInfo object.
 * @throws Error if the API call fails.
 */
export async function getExchangeInfo(isTestnet: boolean, isFutures: boolean = false): Promise<ExchangeInfo> {
  const envLabel = `${isTestnet ? 'Testnet ' : ''}${isFutures ? 'Futures' : 'Spot'}`;
  console.log(`Getting Exchange Info from ${envLabel}`);

  const apiUrl = getApiUrl(isTestnet, isFutures);
  // Use different exchangeInfo endpoint for Futures
  const endpoint = isFutures ? `${apiUrl}/fapi/v1/exchangeInfo` : `${apiUrl}/api/v3/exchangeInfo`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = `Binance API Error (exchangeInfo, ${envLabel}): ${errorData.msg || errorMsg} (Code: ${errorData.code || 'N/A'})`;
      } catch (parseError) { /* Ignore */ }
      throw new Error(errorMsg);
    }

    const info = await response.json();

    // Basic check to ensure symbols array exists
    if (!info || !Array.isArray(info.symbols)) {
       console.error(`Unexpected response format from Binance exchangeInfo API (${envLabel}):`, info);
       throw new Error(`Invalid data received from Binance API for exchange info (${envLabel}).`);
    }

    // Map to our SymbolInfo structure, adapting for Futures/Spot differences
    const symbols: SymbolInfo[] = info.symbols.map((s: any) => ({
        symbol: s.symbol,
        status: s.status,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
        // Spot specific fields (check existence)
        isSpotTradingAllowed: s.isSpotTradingAllowed ?? false, // Default to false if not present
        isMarginTradingAllowed: s.isMarginTradingAllowed,
        // Futures specific fields (check existence)
        contractType: s.contractType,
        deliveryDate: s.deliveryDate,
    }));

    return {
      timezone: info.timezone,
      serverTime: info.serverTime,
      symbols: symbols.sort((a, b) => a.symbol.localeCompare(b.symbol)), // Sort symbols
      // Map other needed fields like rateLimits if necessary
    };

  } catch (error) {
    console.error(`Error fetching exchange info from ${envLabel}:`, error);
    throw new Error(`Failed to get exchange info from ${envLabel}: ${error instanceof Error ? error.message : error}`);
  }
}
