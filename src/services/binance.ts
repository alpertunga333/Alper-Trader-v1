
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
   * The type of the order (e.g., MARKET, LIMIT, STOP_MARKET, TAKE_PROFIT_MARKET, STOP_LOSS, TAKE_PROFIT).
   */
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'TAKE_PROFIT_MARKET' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT_LIMIT';
  /**
   * The quantity in base asset (e.g., BTC for BTCUSDT).
   * Required for LIMIT orders. Optional for MARKET orders if quoteOrderQty is provided.
   */
  quantity?: number;
  /**
   * The quantity in quote asset (e.g., USDT for BTCUSDT).
   * Optional for MARKET orders if quantity is provided. Not typically used for LIMIT orders.
   */
  quoteOrderQty?: number;
  /**
   * The price at which to buy or sell (required for LIMIT orders, and for _LIMIT variants of SL/TP).
   */
  price?: number;
  /**
   * Trigger price for STOP_MARKET, TAKE_PROFIT_MARKET, STOP_LOSS, TAKE_PROFIT, STOP_LOSS_LIMIT, TAKE_PROFIT_LIMIT orders.
   */
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK'; // Relevant for LIMIT type orders
  // Other potential params like newOrderRespType, recvWindow are handled internally or have defaults.
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
   * The price of the order. For MARKET orders, this is the average filled price.
   */
  price: string; // For MARKET orders, this might be 0 if not filled yet or if newOrderRespType is ACK. For FULL, it's avg filled.
   /**
   * The original quantity of the order (in base asset).
   */
  origQty: string;
  /**
   * The executed quantity of the order (in base asset).
   */
  executedQty: string;
  /**
   * The cumulative quote quantity (total value in quote asset).
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
  transactTime?: number;
  fills?: Array<{ // Array of fill objects for detailed execution info
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
    tradeId: number;
  }>;
  // Fields for STOP_LOSS, TAKE_PROFIT, etc. if different in response
  stopPrice?: string; // Binance response might include the stopPrice for SL/TP orders
  workingType?: string; // For futures SL/TP orders
  origType?: string; // Original order type if it was modified
  positionSide?: string; // For futures
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
  console.log(`Placing Order on ${envLabel}:`, JSON.stringify(orderParams));

  const endpoint = isFutures ? '/fapi/v1/order' : '/api/v3/order';
  
  // Validate order parameters based on type
  if (orderParams.type === 'MARKET') {
      if (orderParams.quantity === undefined && orderParams.quoteOrderQty === undefined) {
        throw new Error('For MARKET orders, either quantity (base asset) or quoteOrderQty (quote asset) must be provided.');
      }
  } else if (orderParams.type === 'LIMIT') {
    if (orderParams.quantity === undefined) {
        throw new Error('For LIMIT orders, quantity (base asset) must be provided.');
    }
    if (orderParams.price === undefined) {
        throw new Error('For LIMIT orders, price must be provided.');
    }
  } else if (['STOP_MARKET', 'TAKE_PROFIT_MARKET', 'STOP_LOSS', 'TAKE_PROFIT'].includes(orderParams.type)) {
    if (orderParams.quantity === undefined) {
        throw new Error(`For ${orderParams.type} orders, quantity must be provided.`);
    }
    if (orderParams.stopPrice === undefined) {
        throw new Error(`For ${orderParams.type} orders, stopPrice must be provided.`);
    }
  } else if (['STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'].includes(orderParams.type)) {
      if (orderParams.quantity === undefined) throw new Error(`For ${orderParams.type} orders, quantity must be provided.`);
      if (orderParams.price === undefined) throw new Error(`For ${orderParams.type} orders, price (limit price) must be provided.`);
      if (orderParams.stopPrice === undefined) throw new Error(`For ${orderParams.type} orders, stopPrice must be provided.`);
  }


  const apiParams: Record<string, string | number | undefined | boolean> = {
    symbol: orderParams.symbol,
    side: orderParams.side,
    type: orderParams.type,
    newOrderRespType: 'FULL', // To get detailed response including fills
    ...(orderParams.quantity !== undefined && { quantity: orderParams.quantity }),
    ...(orderParams.quoteOrderQty !== undefined && { quoteOrderQty: orderParams.quoteOrderQty }),
    ...(orderParams.price !== undefined && { price: orderParams.price }),
    ...(orderParams.stopPrice !== undefined && { stopPrice: orderParams.stopPrice }),
    recvWindow: 5000,
  };

  if (['LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'].includes(orderParams.type)) {
    apiParams.timeInForce = orderParams.timeInForce || 'GTC';
  }
  // For futures, if type is STOP_MARKET or TAKE_PROFIT_MARKET and it's a closing order, one might add `reduceOnly: true`
  // For simplicity, not adding reduceOnly for now, assuming these SL/TP orders are meant to close the specific quantity traded.

  try {
     const response = await makeAuthenticatedRequest(endpoint, apiParams, apiKey, secretKey, 'POST', isTestnet, isFutures);
     // Map response to OrderResponse interface, including potential SL/TP specific fields
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
         fills: response.fills,
         stopPrice: response.stopPrice, // Pass through if API returns it
         workingType: response.workingType, // Pass through for futures
         origType: response.origType,
         positionSide: response.positionSide,
     };
  } catch (error) {
      console.error(`Error placing order on ${envLabel} with params ${JSON.stringify(apiParams)}:`, error);
      throw error; 
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

   const endpoint = isFutures ? '/fapi/v2/balance' : '/api/v3/account'; 

   try {
     const response = await makeAuthenticatedRequest(endpoint, { recvWindow: 5000 }, apiKey, secretKey, 'GET', isTestnet, isFutures);

     if (isFutures) {
       if (!Array.isArray(response)) {
           throw new Error(`Unexpected response format for Futures balance: ${JSON.stringify(response)}`);
       }
       return response.map((b: any) => ({
         asset: b.asset,
         free: b.availableBalance || b.balance, 
         locked: (parseFloat(b.balance) - parseFloat(b.availableBalance || b.balance)).toFixed(8), 
       }));
     } else {
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
     throw error; 
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
  limit: number = 100 
): Promise<Candle[]> {
  const envLabel = `${isTestnet ? 'Testnet ' : ''}${isFutures ? 'Futures' : 'Spot'}`;
  console.log(`Getting Candlestick Data from ${envLabel}: ${symbol}, ${interval}, Limit: ${limit}`);
  if (!symbol) {
    console.warn("getCandlestickData called without a symbol.");
    return []; 
  }

  const maxLimit = isFutures ? 1500 : 1000;
  const actualLimit = Math.min(limit, maxLimit);

  const apiUrl = getApiUrl(isTestnet, isFutures);
  const endpoint = isFutures ? `${apiUrl}/fapi/v1/klines` : `${apiUrl}/api/v3/klines`;
  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(), 
    interval: interval,
    limit: actualLimit.toString(),
  });

  try {
    const response = await fetch(`${endpoint}?${params.toString()}`);
    if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        let errorCode = null;
        try {
            const errorData = await response.json();
            errorCode = errorData.code;
            errorMsg = `Binance API Error (klines, ${envLabel}): ${errorData.msg || errorMsg} (Code: ${errorCode || 'N/A'})`;
             if (errorCode === -1121) {
                console.warn(`Invalid symbol: ${symbol} on ${envLabel}. Returning empty data.`);
                return [];
             }
        } catch (parseError) {
        }
      throw new Error(errorMsg);
    }

    const data: any[][] = await response.json(); 

    if (!Array.isArray(data)) {
       console.error(`Unexpected response format from Binance klines API (${envLabel}):`, data);
       throw new Error(`Invalid data received from Binance API (klines, ${envLabel}).`);
    }

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
      ignore: parseFloat(k[11]), 
    }));

  } catch (error) {
    console.error(`Error fetching candlestick data for ${symbol} (${interval}) from ${envLabel}:`, error);
     if (error instanceof Error && error.message.includes('-1121')) { 
        return []; 
     }
    throw error; 
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

    if (!info || !Array.isArray(info.symbols)) {
       console.error(`Unexpected response format from Binance exchangeInfo API (${envLabel}):`, info);
       throw new Error(`Invalid data received from Binance API for exchange info (${envLabel}).`);
    }

    const symbols: SymbolInfo[] = info.symbols.map((s: any) => ({
        symbol: s.symbol,
        status: s.status,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
        isSpotTradingAllowed: s.isSpotTradingAllowed ?? false, 
        isMarginTradingAllowed: s.isMarginTradingAllowed,
        contractType: s.contractType,
        deliveryDate: s.deliveryDate,
    }));

    return {
      timezone: info.timezone,
      serverTime: info.serverTime,
      symbols: symbols.sort((a, b) => a.symbol.localeCompare(b.symbol)), 
    };

  } catch (error) {
    console.error(`Error fetching exchange info from ${envLabel}:`, error);
    throw new Error(`Failed to get exchange info from ${envLabel}: ${error instanceof Error ? error.message : error}`);
  }
}
