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
  orderId: string;
  /**
   * The order status.
   */
  status: string;
}

/**
 * Represents the account balance for a specific asset.
 */
export interface Balance {
  /**
   * The asset symbol (e.g., BTC, USDT).
   */
  asset: string;
  /**
   * The free balance of the asset.
   */
  free: number;
  /**
   * The locked balance of the asset (in orders).
   */
  locked: number;
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


/**
 * Asynchronously places an order on Binance.
 *
 * **This is a placeholder function.** You need to implement the actual Binance API call.
 * Consider using an official or community-maintained Binance API client library.
 * Remember to handle API keys securely and manage potential errors (rate limits, invalid parameters, etc.).
 *
 * @param orderParams The parameters for the order.
 * @param apiKey The Binance API key for the specific environment (Spot/Futures/Testnet).
 * @param secretKey The Binance API secret key for the specific environment.
 * @returns A promise that resolves to an OrderResponse object.
 * @throws Error if the API call fails.
 */
export async function placeOrder(
  orderParams: OrderParams,
  apiKey: string,
  secretKey: string
): Promise<OrderResponse> {
  console.log('Placing Order (Placeholder):', orderParams);
  // TODO: Implement actual Binance API call here.
  // Example (Conceptual - requires a library like 'binance-api-node'):
  /*
  const Binance = require('binance-api-node').default;
  const client = Binance({ apiKey, apiSecret: secretKey }); // Add sandbox: true for Testnet
  try {
    const order = await client.order({
      symbol: orderParams.symbol,
      side: orderParams.side,
      type: orderParams.type,
      quantity: orderParams.quantity.toString(), // Quantity needs to be string for some libraries
      price: orderParams.price ? orderParams.price.toString() : undefined, // Price needs to be string for LIMIT orders
      // Add stopLoss/takeProfit parameters if supported by the library/endpoint
    });
    console.log('Binance Order Response:', order);
    return {
      orderId: order.orderId.toString(),
      status: order.status,
    };
  } catch (error) {
    console.error("Binance API Error (placeOrder):", error);
    throw new Error(`Failed to place order: ${error.message || error}`);
  }
  */

  // Placeholder response:
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  if (Math.random() < 0.1) { // Simulate occasional error
     throw new Error("Simulated API Error: Insufficient balance");
  }
  return {
    orderId: Math.random().toString(36).substring(2, 15), // Generate random ID
    status: 'NEW',
  };
}

/**
 * Asynchronously retrieves account balances from Binance.
 * Used for general portfolio view and API key validation.
 *
 * **This is a placeholder function.** You need to implement the actual Binance API call.
 * Ensure you call the correct endpoint for the intended environment (Spot/Futures).
 *
 * @param apiKey The Binance API key.
 * @param secretKey The Binance API secret key.
 * @param isTestnet Optional flag for testnet environments (may change the base URL). Defaults to false.
 * @returns A promise that resolves to an array of Balance objects.
 * @throws Error if the API call fails (e.g., invalid keys, network issues).
 */
export async function getAccountBalances(
  apiKey: string,
  secretKey: string,
  isTestnet: boolean = false // Add optional testnet flag
): Promise<Balance[]> {
   console.log(`Getting Account Balances (Placeholder, Testnet: ${isTestnet})`);
   // Basic validation
   if (!apiKey || !secretKey) {
       throw new Error("API Key and Secret Key are required.");
   }

  // TODO: Implement actual Binance API call here.
  // Use the isTestnet flag to potentially change the API base URL.
  // Example (Conceptual - requires 'binance-api-node'):
  /*
  const Binance = require('binance-api-node').default;
  const clientOptions = { apiKey, apiSecret: secretKey };
  if (isTestnet) {
       // Note: binance-api-node might have a specific 'sandbox' or 'testnet' option,
       // or you might need to configure the baseURLs directly. CHECK LIBRARY DOCS.
       // clientOptions.sandbox = true; // Example if library supports it
       // clientOptions.baseURL = 'https://testnet.binance.vision'; // Example manual override
       // clientOptions.futuresBaseURL = 'https://testnet.binancefuture.com'; // Example manual override
  }
  const client = Binance(clientOptions);
  try {
      // For Spot:
      const accountInfo = await client.accountInfo();
       if (!accountInfo || !Array.isArray(accountInfo.balances)) {
           console.error("Invalid response structure from accountInfo:", accountInfo);
           throw new Error("Failed to parse account balance response.");
       }
      const balances = accountInfo.balances.map(b => ({
          asset: b.asset,
          free: parseFloat(b.free),
          locked: parseFloat(b.locked),
      })).filter(b => b.free > 0 || b.locked > 0); // Filter zero balances
      return balances;

      // For Futures (different endpoint, check library):
      // const futuresAccountInfo = await client.futuresAccountInfo();
      // Adapt response structure accordingly
  } catch (error) {
      // Catch specific error codes for invalid API keys if possible (e.g., -2014, -2015)
      // if (error.code === -2015) { // Example code for invalid key
      //   throw new Error("Invalid API Key or Secret Key.");
      // }
      console.error("Binance API Error (getAccountBalances):", error);
      throw new Error(`Failed to get account balances: ${error.message || error}`);
  }
  */

  // Placeholder response:
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400)); // Simulate network delay

  // Simulate API key failure based on simple length check (adjust as needed)
  if (apiKey.length < 10 || secretKey.length < 10) {
     await new Promise(resolve => setTimeout(resolve, 200)); // Extra delay for simulated error
     throw new Error("Simulated API Error: Invalid API Key or Secret Key format.");
  }
   // Simulate other random errors
   if (Math.random() < 0.05) {
     throw new Error("Simulated API Error: Network connection failed.");
   }

  // Return plausible-looking balances if keys seem okay format-wise
  return [
    { asset: 'BTC', free: 0.5 + Math.random() * 0.1, locked: 0.1 + Math.random() * 0.05 },
    { asset: 'ETH', free: 10 + Math.random() * 1, locked: 2 + Math.random() * 0.5 },
    { asset: isTestnet ? 'TEST_USDT' : 'USDT', free: 5000 + Math.random() * 500, locked: 1000 + Math.random() * 100 },
    { asset: 'SOL', free: 15.7 + Math.random() * 2, locked: 0 },
  ].filter(() => Math.random() > 0.1); // Randomly remove some for variety
}

/**
 * Validates Binance API keys by attempting to fetch account balances.
 * @param apiKey The API Key.
 * @param secretKey The Secret Key.
 * @param isTestnet Optional flag for testnet environments. Defaults to false.
 * @returns True if the keys are valid (API call succeeds), false otherwise.
 */
export async function validateApiKey(
    apiKey: string,
    secretKey: string,
    isTestnet: boolean = false
): Promise<boolean> {
    try {
        // Attempt to get balances. If it throws an error (e.g., due to invalid keys),
        // the catch block will handle it. If it succeeds, the keys are considered valid.
        await getAccountBalances(apiKey, secretKey, isTestnet);
        return true;
    } catch (error) {
         console.warn(`API Key validation failed (Testnet: ${isTestnet}):`, error);
        // Check for specific error messages if needed, otherwise assume invalid
        // if (error instanceof Error && error.message.includes("Invalid API Key")) { ... }
        return false;
    }
}


/**
 * Asynchronously retrieves candlestick data from Binance.
 *
 * **This is a placeholder function.** Needs implementation for actual API call.
 *
 * @param symbol The trading symbol (e.g., BTCUSDT).
 * @param interval The candlestick interval (e.g., '1m', '5m', '1h', '1d').
 * @param limit The number of candlesticks to retrieve (max 1000).
 * @returns A promise that resolves to an array of Candle objects.
 * @throws Error if the API call fails or the symbol is invalid.
 */
export async function getCandlestickData(
  symbol: string,
  interval: string,
  limit: number = 100 // Default limit
): Promise<Candle[]> {
  console.log(`Getting Candlestick Data (Placeholder): ${symbol}, ${interval}, Limit: ${limit}`);
  if (!symbol) {
    console.warn("getCandlestickData called without a symbol.");
    return []; // Return empty array if no symbol is provided
  }
  // Basic validation for symbol format (optional, API will likely handle errors too)
  // if (!/^[A-Z0-9]+$/.test(symbol)) {
  //   throw new Error(`Invalid symbol format: ${symbol}`);
  // }

  // TODO: Implement actual Binance API call here using a library or fetch.
  // Endpoint: /api/v3/klines
  // Parameters: symbol, interval, limit
  /*
  const Binance = require('binance-api-node').default;
  const client = Binance(); // Public data doesn't usually need API keys
  try {
      const candles = await client.candles({ symbol, interval, limit });
      if (!Array.isArray(candles)) {
           console.error("Unexpected response format from Binance candles API:", candles);
           throw new Error("Invalid data received from Binance API.");
      }
      return candles.map(c => ({
          openTime: c.openTime,
          open: parseFloat(c.open),
          high: parseFloat(c.high),
          low: parseFloat(c.low),
          close: parseFloat(c.close),
          volume: parseFloat(c.volume),
          closeTime: c.closeTime,
          quoteAssetVolume: parseFloat(c.quoteAssetVolume),
          numberOfTrades: c.trades, // Ensure 'trades' field exists or handle potential undefined
          takerBuyBaseAssetVolume: parseFloat(c.takerBuyBaseAssetVolume),
          takerBuyQuoteAssetVolume: parseFloat(c.takerBuyQuoteAssetVolume),
          ignore: 0, // Or parse c.ignore if needed
      }));
  } catch (error) {
      // Handle specific errors like "Invalid symbol" differently if needed
      if (error.code === -1121) { // Example error code for Invalid symbol
           console.warn(`Binance API Error: Invalid symbol ${symbol}.`);
           return []; // Return empty for invalid symbol
      }
      console.error(`Binance API Error (getCandlestickData for ${symbol}):`, error);
      throw new Error(`Failed to get candlestick data for ${symbol}: ${error.message || error}`);
  }
  */

  // Placeholder response generation:
  await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 250)); // Simulate network delay

  // Simple way to make placeholder data slightly different per symbol
  const symbolSeed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = 100 + (symbolSeed % 50000); // Base price based on symbol name (wider range)

  const generatePlaceholderCandles = (num: number): Candle[] => {
    const candles: Candle[] = [];
    let lastClose = basePrice * (0.95 + Math.random() * 0.1); // Start with some variation
    // Calculate interval duration in milliseconds (crude approximation)
    let intervalMs = 60 * 60 * 1000; // Default to 1h
    if (interval.endsWith('m')) intervalMs = parseInt(interval) * 60 * 1000;
    else if (interval.endsWith('h')) intervalMs = parseInt(interval) * 60 * 60 * 1000;
    else if (interval.endsWith('d')) intervalMs = parseInt(interval) * 24 * 60 * 60 * 1000;

    let currentTime = Date.now() - num * intervalMs;

    for (let i = 0; i < num; i++) {
      const open = lastClose;
      // Make fluctuation potentially larger for more volatile symbols (crude heuristic)
      const volatilityFactor = 1 + (symbolSeed % 5) / 10; // Add 0% to 40% extra volatility
      const priceFluctuation = lastClose * 0.015 * volatilityFactor; // Fluctuate by ~1.5% base
      const high = open + Math.random() * priceFluctuation * 1.2; // Allow higher highs
      const low = open - Math.random() * priceFluctuation;
      const close = low + Math.random() * (high - low); // Close somewhere between low and high
      const volume = (50 + Math.random() * 150) * (1/volatilityFactor); // More volatile might have less volume? Or inverse? Adjust as needed.
      const openTime = currentTime;
      const closeTime = currentTime + intervalMs - 1;

      // Determine appropriate decimal places based on price
      let decimalPlaces = 2;
      if (basePrice < 0.01) decimalPlaces = 8;
      else if (basePrice < 1) decimalPlaces = 4;


      candles.push({
        openTime: openTime,
        open: parseFloat(open.toFixed(decimalPlaces)),
        high: parseFloat(high.toFixed(decimalPlaces)),
        low: parseFloat(low.toFixed(decimalPlaces)),
        close: parseFloat(close.toFixed(decimalPlaces)),
        volume: parseFloat(volume.toFixed(2)),
        closeTime: closeTime,
        quoteAssetVolume: parseFloat((volume * close).toFixed(2)),
        numberOfTrades: Math.floor(100 + Math.random() * 200 * volatilityFactor),
        takerBuyBaseAssetVolume: parseFloat((volume * (0.4 + Math.random() * 0.2)).toFixed(2)), // Simulate taker buy volume
        takerBuyQuoteAssetVolume: parseFloat((volume * close * (0.4 + Math.random() * 0.2)).toFixed(2)),
        ignore: 0,
      });
      lastClose = close;
      currentTime += intervalMs;
    }
    return candles;
  };

  // Simulate API error for specific symbols if needed for testing
  if (symbol === 'ERRORUSDT') {
      await new Promise(resolve => setTimeout(resolve, 150));
      throw new Error(`Simulated API Error: Unknown error for symbol ${symbol}`);
  }
   if (symbol === 'NODATAUSDT') {
       await new Promise(resolve => setTimeout(resolve, 150));
       return []; // Simulate symbol with no data
   }


  return generatePlaceholderCandles(limit);
}


/**
 * Asynchronously retrieves exchange information, including all symbols, from Binance.
 *
 * **This is a placeholder function.** Needs implementation for actual API call.
 *
 * @returns A promise that resolves to an ExchangeInfo object.
 * @throws Error if the API call fails.
 */
export async function getExchangeInfo(): Promise<ExchangeInfo> {
  console.log('Getting Exchange Info (Placeholder)');
  // TODO: Implement actual Binance API call here.
  // Endpoint: /api/v3/exchangeInfo
  /*
  const Binance = require('binance-api-node').default;
  const client = Binance(); // Public data doesn't usually need API keys
  try {
      const info = await client.exchangeInfo();
      // Basic check to ensure symbols array exists
      if (!info || !Array.isArray(info.symbols)) {
         console.error("Unexpected response format from Binance exchangeInfo API:", info);
         throw new Error("Invalid data received from Binance API for exchange info.");
      }
      return {
          timezone: info.timezone,
          serverTime: info.serverTime,
          symbols: info.symbols.map(s => ({
              symbol: s.symbol,
              status: s.status,
              baseAsset: s.baseAsset,
              quoteAsset: s.quoteAsset,
              isSpotTradingAllowed: s.isSpotTradingAllowed,
              // map other needed fields
          })),
          // map other needed fields like rateLimits
      };
  } catch (error) {
      console.error("Binance API Error (getExchangeInfo):", error);
      throw new Error(`Failed to get exchange info: ${error.message || error}`);
  }
  */

  // Placeholder response:
  await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay
  if (Math.random() < 0.02) { // Simulate rare error
      throw new Error("Simulated API Error: Could not reach Binance servers.");
  }

  // Generate a list of approximately 100 popular placeholder symbols
  const baseAssets = [
      'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'LTC', 'MATIC', 'DOT',
      'LINK', 'SHIB', 'AVAX', 'TRX', 'UNI', 'ATOM', 'ETC', 'XLM', 'FIL', 'ICP',
      'HBAR', 'VET', 'APE', 'NEAR', 'ALGO', 'FTM', 'MANA', 'SAND', 'AXS', 'EGLD',
      'THETA', 'XTZ', 'FLOW', 'AAVE', 'GRT', 'MKR', 'ZEC', 'EOS', 'NEO', 'WAVES',
      'KSM', 'SNX', 'CHZ', 'ENJ', 'CRV', 'BAT', 'SUSHI', 'YFI', 'COMP', '1INCH',
      'GALA', 'ANKR', 'IOTX', 'CELO', 'GMT', 'RUNE', 'AUDIO', 'MASK', 'SKL', 'IMX',
      'DYDX', 'ENS', 'LRC', 'REN', 'KNC', 'ZRX', 'STORJ', 'RLC', 'OGN', 'BAND',
      'UMA', 'API3', 'TRB', 'PERP', 'LPT', 'NMR', 'RAD', 'BADGER', 'COTI', 'ARPA',
      'CTSI', 'DUSK', 'KEEP', 'NKN', 'ORN', 'PNT', 'POLY', 'POWR', 'QKC', 'RIF',
      'STMX', 'TFUEL', 'TKO', 'TLM', 'UTK', 'VTHO', 'WRX', 'XVS', 'YGG', 'ZIL'
  ];
  const quoteAssets = ['USDT', 'BUSD', 'BTC', 'ETH', 'TRY']; // Include TRY

  const placeholderSymbols: SymbolInfo[] = [];
  let symbolCount = 0;
  const maxSymbols = 100 + Math.floor(Math.random() * 20); // Generate 100-120 symbols

  for (const base of baseAssets) {
      if (symbolCount >= maxSymbols) break;
      // Prioritize USDT pairs
      if (base !== 'USDT' && base !== 'BUSD' && base !== 'TRY' && base !== 'BTC' && base !== 'ETH') {
           if (Math.random() > 0.1) { // High probability for USDT
             placeholderSymbols.push({ symbol: `${base}USDT`, status: 'TRADING', baseAsset: base, quoteAsset: 'USDT', isSpotTradingAllowed: true });
             symbolCount++;
           }
           // Add some BUSD pairs
           if (Math.random() < 0.4 && symbolCount < maxSymbols) { // Moderate probability for BUSD
              placeholderSymbols.push({ symbol: `${base}BUSD`, status: 'TRADING', baseAsset: base, quoteAsset: 'BUSD', isSpotTradingAllowed: true });
              symbolCount++;
           }
            // Add some TRY pairs
           if (Math.random() < 0.2 && symbolCount < maxSymbols) { // Lower probability for TRY
              placeholderSymbols.push({ symbol: `${base}TRY`, status: 'TRADING', baseAsset: base, quoteAsset: 'TRY', isSpotTradingAllowed: true });
              symbolCount++;
           }
          // Add some BTC pairs
          if (Math.random() < 0.25 && symbolCount < maxSymbols) { // Moderate-low probability for BTC
              placeholderSymbols.push({ symbol: `${base}BTC`, status: 'TRADING', baseAsset: base, quoteAsset: 'BTC', isSpotTradingAllowed: true });
              symbolCount++;
          }
           // Add some ETH pairs
           if (Math.random() < 0.15 && symbolCount < maxSymbols) { // Low probability for ETH
               placeholderSymbols.push({ symbol: `${base}ETH`, status: 'TRADING', baseAsset: base, quoteAsset: 'ETH', isSpotTradingAllowed: true });
               symbolCount++;
           }
       }
       // Ensure BTC, ETH vs USDT/BUSD/TRY are included if not generated randomly
       if (base === 'BTC') {
           if (!placeholderSymbols.some(p => p.symbol === 'BTCUSDT')) placeholderSymbols.push({ symbol: `BTCUSDT`, status: 'TRADING', baseAsset: 'BTC', quoteAsset: 'USDT', isSpotTradingAllowed: true });
           if (!placeholderSymbols.some(p => p.symbol === 'BTCBUSD')) placeholderSymbols.push({ symbol: `BTCBUSD`, status: 'TRADING', baseAsset: 'BTC', quoteAsset: 'BUSD', isSpotTradingAllowed: true });
            if (!placeholderSymbols.some(p => p.symbol === 'BTCTRY')) placeholderSymbols.push({ symbol: `BTCTRY`, status: 'TRADING', baseAsset: 'BTC', quoteAsset: 'TRY', isSpotTradingAllowed: true });
           symbolCount+=3;
       }
        if (base === 'ETH') {
            if (!placeholderSymbols.some(p => p.symbol === 'ETHUSDT')) placeholderSymbols.push({ symbol: `ETHUSDT`, status: 'TRADING', baseAsset: 'ETH', quoteAsset: 'USDT', isSpotTradingAllowed: true });
            if (!placeholderSymbols.some(p => p.symbol === 'ETHBUSD')) placeholderSymbols.push({ symbol: `ETHBUSD`, status: 'TRADING', baseAsset: 'ETH', quoteAsset: 'BUSD', isSpotTradingAllowed: true });
            if (!placeholderSymbols.some(p => p.symbol === 'ETHTRY')) placeholderSymbols.push({ symbol: `ETHTRY`, status: 'TRADING', baseAsset: 'ETH', quoteAsset: 'TRY', isSpotTradingAllowed: true });
            if (!placeholderSymbols.some(p => p.symbol === 'ETHBTC')) placeholderSymbols.push({ symbol: `ETHBTC`, status: 'TRADING', baseAsset: 'ETH', quoteAsset: 'BTC', isSpotTradingAllowed: true });
            symbolCount+=4;
        }

        // Add a few non-trading examples randomly
        if (Math.random() < 0.05 && symbolCount < maxSymbols) {
           const nonTradingBase = baseAssets[Math.floor(Math.random()*baseAssets.length)];
           const nonTradingQuote = quoteAssets[Math.floor(Math.random()*quoteAssets.length)];
            if (nonTradingBase !== nonTradingQuote && !placeholderSymbols.some(p => p.symbol === `${nonTradingBase}${nonTradingQuote}`)) {
                placeholderSymbols.push({ symbol: `${nonTradingBase}${nonTradingQuote}`, status: 'BREAK', baseAsset: nonTradingBase, quoteAsset: nonTradingQuote, isSpotTradingAllowed: false });
                symbolCount++;
            }
        }

  }

  // Ensure SHIBUSDT is present for testing non-trading display if it wasn't added
   if (!placeholderSymbols.find(p => p.symbol === 'SHIBUSDT')) {
        placeholderSymbols.push({ symbol: 'SHIBUSDT', status: 'TRADING', baseAsset: 'SHIB', quoteAsset: 'USDT', isSpotTradingAllowed: true });
   }
    // Add one explicit BREAK example if none were added randomly
   if (!placeholderSymbols.find(p => p.status === 'BREAK')) {
        placeholderSymbols.push({ symbol: 'XYZABC', status: 'BREAK', baseAsset: 'XYZ', quoteAsset: 'ABC', isSpotTradingAllowed: false });
   }


  return {
    timezone: 'UTC',
    serverTime: Date.now(),
    // Sort symbols alphabetically for consistency
    symbols: placeholderSymbols.sort((a, b) => a.symbol.localeCompare(b.symbol)),
  };
}
