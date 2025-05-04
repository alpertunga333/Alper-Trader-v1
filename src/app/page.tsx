'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Settings,
  Wallet,
  BarChart3,
  History,
  FileText,
  FlaskConical,
  LogIn,
  LogOut,
  Bot,
  Activity,
  CandlestickChart,
  Info,
  Play,
  Pause,
  List,
  PlusCircle,
  ArrowRightLeft,
  X as CloseIcon,
  Check as CheckIcon,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldX,
  HelpCircle,
  KeyRound,
  Send,
} from 'lucide-react';
import { Balance, Candle, SymbolInfo, getCandlestickData, getExchangeInfo, placeOrder, validateApiKey as validateBinanceApiKeys } from '@/services/binance';
import { sendMessage, validateBotToken, validateChatId } from '@/services/telegram'; // Import validation functions
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFormattedNumber, formatNumberClientSide, formatTimestamp } from '@/lib/formatting';
import { BacktestParams, BacktestResult, DefineStrategyParams, DefineStrategyResult, RunParams, RunResult, Strategy, backtestStrategy, runStrategy, defineNewStrategy } from '@/ai/flows/trading-strategy-flow';
import { fetchAccountBalancesAction } from '@/actions/binanceActions'; // Import the Server Action


// Initial empty data for charts before loading
const initialCandleData: Candle[] = [];

// Initial placeholder data (will be replaced by API calls)
const initialPortfolioData: Balance[] = [
  // Removed placeholder, will fetch real data
];

// Placeholder: Replace with actual trade history fetching if implemented
const tradeHistoryData: any[] = [];

// Placeholder: Log entries will be added dynamically
const logData: { timestamp: string; type: string; message: string }[] = [];


// Will be populated by API
let allAvailablePairs: SymbolInfo[] = [];

const availableStrategies: Strategy[] = [
    // Populate with Strategy objects matching the imported type
    // Make sure descriptions are concise and informative for the AI
    { id: 'rsi_simple', name: 'Basit RSI Al/Sat', description: 'RSI 30 altına indiğinde al, 70 üstüne çıktığında sat.' },
    { id: 'sma_crossover', name: 'Basit Hareketli Ortalama Kesişimi', description: 'Kısa vadeli SMA, uzun vadeli SMA\'yı yukarı kestiğinde al, aşağı kestiğinde sat.' },
    { id: 'fibonacci_retracement', name: 'Fibonacci Geri Çekilme', description: 'Fiyatın önemli Fibonacci seviyelerine geri çekilip tepki vermesine göre işlem yap.' },
    { id: 'ichimoku_cloud', name: 'Ichimoku Bulutu', description: 'Fiyatın Ichimoku bulutuna, Tenkan-sen ve Kijun-sen çizgilerine göre pozisyon al.' },
    { id: 'bollinger_bands', name: 'Bollinger Bantları', description: 'Fiyat Bollinger bantlarının dışına çıktığında veya orta banda döndüğünde işlem yap.' },
    { id: 'macd_signal_crossover', name: 'MACD Sinyal Kesişimi', description: 'MACD çizgisi sinyal çizgisini yukarı kestiğinde al, aşağı kestiğinde sat.' },
    // Add more strategies adhering to the Strategy type
    { id: 'volume_spike', name: 'Hacim Artışı', description: 'Belirli bir eşiğin üzerinde hacim artışı görüldüğünde potansiyel kırılımları değerlendir.' },
    { id: 'support_resistance_break', name: 'Destek/Direnç Kırılımı', description: 'Fiyatın önemli destek veya direnç seviyelerini kırmasına göre işlem yap.' },
    { id: 'stochastic_oscillator', name: 'Stokastik Osilatör', description: 'Stokastik osilatör aşırı alım/satım bölgelerine girdiğinde veya kesişim yaptığında işlem yap.' },
    { id: 'on_balance_volume', name: 'On-Balance Volume (OBV)', description: 'OBV trendi ile fiyat trendi arasındaki uyumsuzlukları veya teyitleri değerlendir.' }
];


// ----- API Validation Types -----
type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'not_checked';


// ----- Main Dashboard Component -----
export default function Dashboard() {
  // Existing State...
  const [activeUser, setActiveUser] = React.useState<string | null>(null);
  const [selectedPair, setSelectedPair] = React.useState<string>('');
  const [selectedInterval, setSelectedInterval] = React.useState<string>('1h');
  const [botStatus, setBotStatus] = React.useState<'running' | 'stopped'>('stopped');
  const [activeStrategies, setActiveStrategies] = React.useState<string[]>([]);
  const [stopLoss, setStopLoss] = React.useState<string>('');
  const [takeProfit, setTakeProfit] = React.useState<string>('');
  const [availablePairs, setAvailablePairs] = React.useState<SymbolInfo[]>([]);
  const [candleData, setCandleData] = React.useState<Candle[]>(initialCandleData);
  const [portfolioData, setPortfolioData] = React.useState<Balance[]>(initialPortfolioData);
  const [loadingPairs, setLoadingPairs] = React.useState(true);
  const [loadingCandles, setLoadingCandles] = React.useState(false);
  const [loadingPortfolio, setLoadingPortfolio] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedPairsForBot, setSelectedPairsForBot] = React.useState<string[]>([]);
  const [dynamicLogData, setDynamicLogData] = React.useState<{ timestamp: string; type: string; message: string }[]>([]);


  // New Strategy Dialog State
  const [isDefineStrategyDialogOpen, setIsDefineStrategyDialogOpen] = React.useState(false);
  const [defineStrategyParams, setDefineStrategyParams] = React.useState<DefineStrategyParams>({
      name: '',
      description: '',
      prompt: '',
  });
  const [isDefiningStrategy, setIsDefiningStrategy] = React.useState(false);


  // Backtesting State
  const [backtestParams, setBacktestParams] = React.useState<Omit<BacktestParams, 'strategy'>>({ // Omit strategy object here
    pair: '',
    interval: '1h',
    startDate: '',
    endDate: '',
    initialBalance: 1000,
  });
   const [selectedBacktestStrategyId, setSelectedBacktestStrategyId] = React.useState<string>(''); // Store selected strategy ID for backtest form
  const [backtestResult, setBacktestResult] = React.useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = React.useState(false);

  // API Key and Input State
  const [apiKeys, setApiKeys] = React.useState({
      spot: { key: '', secret: '' },
      futures: { key: '', secret: '' },
      testnetSpot: { key: '', secret: '' },
      testnetFutures: { key: '', secret: '' },
      telegram: { token: '', chatId: '' },
  });

  // Validation Status State
  const [validationStatus, setValidationStatus] = React.useState<{
      spot: ValidationStatus;
      futures: ValidationStatus;
      testnetSpot: ValidationStatus;
      testnetFutures: ValidationStatus;
      telegramToken: ValidationStatus;
      telegramChatId: ValidationStatus;
  }>({
      spot: 'not_checked',
      futures: 'not_checked',
      testnetSpot: 'not_checked',
      testnetFutures: 'not_checked',
      telegramToken: 'not_checked',
      telegramChatId: 'not_checked',
  });


  // Function to add log entries
  const addLog = (type: string, message: string) => {
    const newLog = { timestamp: new Date().toISOString(), type, message };
    setDynamicLogData(prevLogs => [newLog, ...prevLogs].slice(0, 100)); // Keep last 100 logs
  };


  // --- Effects ---

  // Fetch available pairs on mount
  React.useEffect(() => {
    const fetchPairs = async () => {
      setLoadingPairs(true);
      setError(null);
      addLog('INFO', 'Fetching available trading pairs from Binance...');
      try {
        const info = await getExchangeInfo(); // Using actual API call
        const tradingPairs = info.symbols
          .filter(s => s.status === 'TRADING' && s.isSpotTradingAllowed) // Filter only active spot pairs
          .sort((a, b) => a.symbol.localeCompare(b.symbol));
        allAvailablePairs = tradingPairs; // Keep the full list
        setAvailablePairs(tradingPairs);
        if (tradingPairs.length > 0 && !selectedPair) {
           const defaultPair = tradingPairs.find(p => p.symbol === 'BTCUSDT') || tradingPairs[0]; // Prefer BTCUSDT
           setSelectedPair(defaultPair.symbol); // Set default selected pair
           setBacktestParams(prev => ({ ...prev, pair: defaultPair.symbol })); // Also default backtest pair
           addLog('INFO', `Successfully fetched ${tradingPairs.length} pairs. Default pair set to ${defaultPair.symbol}.`);
        } else if (tradingPairs.length === 0) {
            addLog('WARN', 'No trading pairs found or fetched from Binance.');
        }
      } catch (err) {
        console.error("Failed to fetch exchange info:", err);
        const errorMsg = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
        setError(`Piyasa verileri yüklenemedi: ${errorMsg}`);
        addLog('ERROR', `Failed to fetch exchange info: ${errorMsg}`);
        toast({ title: "Hata", description: `Binance pariteleri alınamadı: ${errorMsg}`, variant: "destructive" });
      } finally {
        setLoadingPairs(false);
      }
    };
    fetchPairs();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  // Fetch candlestick data when selected pair or interval changes
  React.useEffect(() => {
    const fetchCandleData = async () => {
      if (!selectedPair) return;
      setLoadingCandles(true);
      setError(null);
      setCandleData([]); // Clear previous data immediately
      addLog('INFO', `Fetching candlestick data for ${selectedPair} (${selectedInterval})...`);
      try {
        // Determine if testnet should be used based on API key validation or future toggle
        const useTestnet = validationStatus.testnetSpot === 'valid'; // Example logic, adjust as needed
        const data = await getCandlestickData(selectedPair, selectedInterval, 100, useTestnet); // Fetch 100 candles
        setCandleData(data);
        if (data.length === 0) {
             addLog('WARN', `No candlestick data returned for ${selectedPair} (${selectedInterval}).`);
        } else {
            addLog('INFO', `Successfully fetched ${data.length} candles for ${selectedPair} (${selectedInterval}).`);
        }
      } catch (err) {
        console.error(`Failed to fetch candlestick data for ${selectedPair}:`, err);
        const errorMsg = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
        setCandleData([]); // Ensure data is cleared on error
        addLog('ERROR', `Failed to fetch candlestick data for ${selectedPair}: ${errorMsg}`);
        toast({ title: "Grafik Hatası", description: `${selectedPair} için grafik verisi yüklenemedi: ${errorMsg}`, variant: "destructive" });
      } finally {
        setLoadingCandles(false);
      }
    };
    fetchCandleData();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPair, selectedInterval]); // Dependencies are correct


  // Fetch portfolio data securely using Server Action when API keys are validated
  React.useEffect(() => {
    const fetchPortfolio = async () => {
        // Determine active environment and keys (assuming Spot for now)
        // **IMPORTANT**: In a real app, you'd need a way for the user to select the active environment (Spot, Testnet Spot, etc.)
        const activeEnv = validationStatus.testnetSpot === 'valid' ? 'testnetSpot' : 'spot'; // Example: Prioritize validated testnet
        const keys = apiKeys[activeEnv];
        const status = validationStatus[activeEnv];
        const isTestnetEnv = activeEnv === 'testnetSpot' || activeEnv === 'testnetFutures';

        if (!activeUser || status !== 'valid' || !keys.key || !keys.secret) {
            setPortfolioData([]); // Clear portfolio if not logged in or keys invalid/missing
            return;
        }

        setLoadingPortfolio(true);
        addLog('INFO', `Fetching portfolio data for ${activeEnv}...`);
        try {
             // **SECURITY**: Call the Server Action, passing only necessary info (like which env)
             // The Server Action will securely retrieve keys from environment variables or a secure store.
             // For demonstration, we pass the keys here, but THIS IS NOT SECURE FOR PRODUCTION.
            const result = await fetchAccountBalancesAction(keys.key, keys.secret, isTestnetEnv);

             if (result.success && result.balances) {
                // Filter out zero balances for a cleaner view
                const filteredBalances = result.balances.filter(b => b.free > 0 || b.locked > 0);
                setPortfolioData(filteredBalances);
                 addLog('INFO', `Successfully fetched portfolio. Found ${filteredBalances.length} assets with non-zero balance.`);
                 if (filteredBalances.length === 0) {
                     addLog('INFO', 'Portfolio is empty or all balances are zero.');
                 }
             } else {
                 throw new Error(result.error || 'Failed to fetch balances via server action.');
             }
        } catch (err) {
            console.error("Failed to fetch portfolio:", err);
             const errorMsg = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
             addLog('ERROR', `Failed to fetch portfolio: ${errorMsg}`);
            toast({ title: "Portföy Hatası", description: `Hesap bakiyeleri yüklenemedi: ${errorMsg}`, variant: "destructive" });
            setPortfolioData([]); // Reset on error
        } finally {
            setLoadingPortfolio(false);
        }
    };

    // Check if activeUser exists before calling fetchPortfolio
     if (activeUser) {
        fetchPortfolio();
     } else {
       setPortfolioData([]); // Reset portfolio if logged out
       setLoadingPortfolio(false);
     }
     // Re-fetch if active user changes OR if the validation status of the potentially active environment changes to 'valid'
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser, validationStatus.spot, validationStatus.testnetSpot]); // Removed apiKeys from deps as they shouldn't be direct triggers here


  // --- Handlers ---

  const handleLogin = (username: string) => {
    setActiveUser(username);
    addLog('INFO', `User '${username}' logged in.`);
    toast({ title: `${username} olarak giriş yapıldı.` });
  };

  const handleLogout = () => {
    setActiveUser(null);
    setPortfolioData([]); // Clear portfolio on logout
     // Reset validation statuses on logout
    setValidationStatus({
        spot: 'not_checked',
        futures: 'not_checked',
        testnetSpot: 'not_checked',
        testnetFutures: 'not_checked',
        telegramToken: 'not_checked',
        telegramChatId: 'not_checked',
    });
     addLog('INFO', 'User logged out.');
     // Optionally clear API keys state - consider if they should persist locally or not
     // setApiKeys({ spot: { key: '', secret: '' }, ... });
    toast({ title: 'Çıkış yapıldı.' });
  };

  const toggleBotStatus = async () => {
     if (botStatus === 'stopped' && selectedPairsForBot.length === 0) {
        toast({ title: "Başlatma Hatası", description: "Lütfen botun çalışacağı en az bir parite seçin.", variant: "destructive" });
         addLog('WARN', 'Bot start prevented: No pairs selected.');
        return;
    }
    if (botStatus === 'stopped' && activeStrategies.length === 0) {
        toast({ title: "Başlatma Hatası", description: "Lütfen en az bir aktif strateji seçin.", variant: "destructive" });
        addLog('WARN', 'Bot start prevented: No strategies selected.');
        return;
    }
     // Determine active environment for trading (e.g., prioritize testnet if validated)
     const activeTradingEnv = validationStatus.testnetSpot === 'valid' ? 'testnetSpot' : 'spot';
     const activeValidationStatus = validationStatus[activeTradingEnv];

     if (botStatus === 'stopped' && activeValidationStatus !== 'valid') {
         toast({ title: "Başlatma Hatası", description: `Lütfen geçerli ${activeTradingEnv.toUpperCase()} API anahtarlarını kaydedin ve doğrulayın.`, variant: "destructive" });
          addLog('WARN', `Bot start prevented: API keys for ${activeTradingEnv} not validated.`);
         return;
     }
    // Basic check for Telegram validation
     if (botStatus === 'stopped' && (validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId !== 'valid')) {
         toast({ title: "Başlatma Hatası", description: "Lütfen geçerli Telegram bot token ve chat ID'sini kaydedin ve doğrulayın.", variant: "destructive" });
         addLog('WARN', 'Bot start prevented: Telegram not validated.');
         return;
     }


    const newStatus = botStatus === 'running' ? 'stopped' : 'running';
    setBotStatus(newStatus);
    const statusMessage = newStatus === 'running' ? 'başlatıldı' : 'durduruldu';
    const pairsMessage = newStatus === 'running' ? ` (${selectedPairsForBot.join(', ')})` : '';
    const strategies = activeStrategies.map(id => availableStrategies.find(s=>s.id===id)?.name).filter(Boolean); // Get strategy names
    const strategiesMessage = newStatus === 'running' ? `Stratejiler: ${strategies.join(', ')}` : '';
    toast({ title: `Bot ${statusMessage}${pairsMessage}.`, description: strategiesMessage });
    addLog('INFO', `Bot ${statusMessage}. Pairs: ${selectedPairsForBot.join(', ') || 'None'}. Strategies: ${strategies.join(', ') || 'None'}.`);


    if (newStatus === 'running') {
        console.log("Starting bot for pairs:", selectedPairsForBot, "with strategies:", activeStrategies);
        addLog('INFO', `Bot starting process initiated for pairs: ${selectedPairsForBot.join(', ')}`);


        // Placeholder: Iterate and attempt to start each strategy on each pair
        let strategyStartSuccessCount = 0;
        let strategyStartFailCount = 0;
        for (const pair of selectedPairsForBot) {
            for (const strategyId of activeStrategies) {
                const strategy = availableStrategies.find(s => s.id === strategyId);
                 if (strategy) {
                     try {
                         console.log(`Attempting to run strategy ${strategy.name} on ${pair}`);
                         addLog('INFO', `Attempting to start strategy '${strategy.name}' on ${pair}...`);
                         // Call the AI flow to run the strategy
                         // Note: Real implementation needs robust background execution/monitoring
                         const runParams: RunParams = { strategy, pair, interval: selectedInterval /* Use the globally selected interval or strategy-specific one */};
                         // **SECURITY NOTE**: The `runStrategy` flow currently lacks logic to securely handle API keys.
                         // This needs modification if live trading is intended. It might need to accept keys securely or assume server-side configuration.
                         const result: RunResult = await runStrategy(runParams); // Assuming runStrategy is async
                         addLog('STRATEGY_START', `Strategy '${strategy.name}' on ${pair} status: ${result.status}. ${result.message || ''}`);
                         strategyStartSuccessCount++;
                         // Consider sending Telegram notification per strategy/pair start
                         // await sendMessage(`📈 Strategy ${strategy.name} started on ${pair}. Status: ${result.status}`, apiKeys.telegram.token, apiKeys.telegram.chatId);
                    } catch (error) {
                        strategyStartFailCount++;
                         console.error(`Error starting strategy ${strategy.name} on ${pair}:`, error);
                         const message = error instanceof Error ? error.message : "Bilinmeyen hata";
                         toast({ title: "Bot Strateji Hatası", description: `${strategy.name} - ${pair}: Başlatılamadı: ${message}`, variant: "destructive" });
                         addLog('ERROR', `Failed to start strategy '${strategy.name}' on ${pair}: ${message}`);
                         // Optionally stop the entire bot if one strategy fails to start? Or just log?
                         // setBotStatus('stopped');
                         // return; // Stop trying to start more strategies
                     }
                 } else {
                     strategyStartFailCount++;
                     addLog('ERROR', `Strategy not found: ${strategyId} (Pair: ${pair})`);
                 }
             }
        }
        addLog('INFO', `Strategy start attempt complete. Success: ${strategyStartSuccessCount}, Failed: ${strategyStartFailCount}.`);


         // Send a single summary Telegram notification after attempting all starts
         try {
             await sendMessage(`🤖 KriptoPilot bot ${selectedPairsForBot.join(', ')} paritelerinde ${strategyStartSuccessCount} strateji ile başlatıldı (${strategyStartFailCount} hata).`, apiKeys.telegram.token, apiKeys.telegram.chatId);
              addLog('TELEGRAM', 'Bot start notification sent.');
         } catch (error) {
              const errorMsg = error instanceof Error ? error.message : "Bilinmeyen hata";
              console.error("Error sending Telegram start message:", error);
             addLog('TELEGRAM_ERROR', `Bot start notification failed: ${errorMsg}`);
         }

    } else {
        console.log("Stopping bot...");
        // TODO: Implement actual bot stop logic (e.g., signal background processes)
         addLog('INFO', `Bot stopping process initiated.`);
        // Send Telegram notification
         try {
             await sendMessage(`🛑 KriptoPilot bot durduruldu.`, apiKeys.telegram.token, apiKeys.telegram.chatId);
             addLog('TELEGRAM', 'Bot stop notification sent.');
         } catch (error) {
              const errorMsg = error instanceof Error ? error.message : "Bilinmeyen hata";
             console.error("Error sending Telegram stop message:", error);
             // Don't necessarily revert bot status, just log the notification error
             addLog('TELEGRAM_ERROR', `Bot stop notification failed: ${errorMsg}`);
         }
    }
  };

   const handleStrategyToggle = (strategyId: string) => {
    setActiveStrategies((prev) => {
        const isAdding = !prev.includes(strategyId);
        const strategyName = availableStrategies.find(s => s.id === strategyId)?.name || strategyId;
        const newStrategies = isAdding ? [...prev, strategyId] : prev.filter((id) => id !== strategyId);
        addLog('CONFIG', `Strategy ${isAdding ? 'activated' : 'deactivated'}: ${strategyName}`);
        return newStrategies;
    });
};


  const handleBotPairToggle = (pairSymbol: string) => {
      setSelectedPairsForBot((prev) => {
          const isAdding = !prev.includes(pairSymbol);
          const newPairs = isAdding ? [...prev, pairSymbol] : prev.filter((symbol) => symbol !== pairSymbol);
          addLog('CONFIG', `Bot pair ${isAdding ? 'added' : 'removed'}: ${pairSymbol}`);
          return newPairs;
      });
  };

    const handleApiKeyChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        env: 'spot' | 'futures' | 'testnetSpot' | 'testnetFutures' | 'telegram',
        field: 'key' | 'secret' | 'token' | 'chatId'
    ) => {
        const value = e.target.value;
        setApiKeys(prev => ({
            ...prev,
            [env]: { ...prev[env], [field]: value },
        }));
        // Reset validation status when keys change
        if (env !== 'telegram') {
            setValidationStatus(prev => ({ ...prev, [env]: 'not_checked' }));
             addLog('CONFIG', `${env} API key/secret changed, validation status reset.`);
        } else if (field === 'token') {
            setValidationStatus(prev => ({ ...prev, telegramToken: 'not_checked', telegramChatId: 'not_checked' })); // Reset both if token changes
            addLog('CONFIG', 'Telegram token changed, validation status reset.');
        } else if (field === 'chatId') {
             setValidationStatus(prev => ({ ...prev, telegramChatId: 'not_checked' }));
             addLog('CONFIG', 'Telegram chat ID changed, validation status reset.');
        }
    };

   const handleValidateApiKey = async (env: 'spot' | 'futures' | 'testnetSpot' | 'testnetFutures') => {
      setValidationStatus(prev => ({ ...prev, [env]: 'pending' }));
      addLog('INFO', `Validating ${env} API keys...`);
      // Determine if the environment is testnet
      const isTestnetEnv = env === 'testnetSpot' || env === 'testnetFutures';
      try {
           // Use the dedicated validation function
          const isValid = await validateBinanceApiKeys(apiKeys[env].key, apiKeys[env].secret, isTestnetEnv);
          setValidationStatus(prev => ({ ...prev, [env]: isValid ? 'valid' : 'invalid' }));
          const message = isValid ? `${env.toUpperCase()} API anahtarı başarıyla doğrulandı.` : `${env.toUpperCase()} API anahtarı geçersiz veya doğrulanamadı.`;
           addLog(isValid ? 'INFO' : 'ERROR', `API Key Validation (${env}): ${message}`);
          toast({
              title: isValid ? "API Anahtarı Doğrulandı" : "API Anahtarı Geçersiz",
              description: message,
              variant: isValid ? "default" : "destructive",
          });
      } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
          console.error(`Error validating ${env} API keys:`, error);
          setValidationStatus(prev => ({ ...prev, [env]: 'invalid' }));
          addLog('ERROR', `API Key Validation Error (${env}): ${errorMsg}`);
          toast({
              title: "Doğrulama Hatası",
              description: `${env.toUpperCase()} API anahtarları doğrulanırken bir hata oluştu: ${errorMsg}`,
              variant: "destructive",
          });
      }
  };

  const handleValidateTelegramToken = async () => {
      setValidationStatus(prev => ({ ...prev, telegramToken: 'pending', telegramChatId: 'not_checked' })); // Reset chat ID too
      addLog('INFO', 'Validating Telegram bot token...');
      try {
          const isValid = await validateBotToken(apiKeys.telegram.token);
          setValidationStatus(prev => ({ ...prev, telegramToken: isValid ? 'valid' : 'invalid' }));
          const message = isValid ? "Bot token geçerli." : "Bot token geçersiz veya Telegram API'ye ulaşılamadı.";
           addLog(isValid ? 'INFO' : 'ERROR', `Telegram Token Validation: ${message}`);
          toast({
              title: isValid ? "Telegram Token Doğrulandı" : "Telegram Token Geçersiz",
              description: message,
              variant: isValid ? "default" : "destructive",
          });
           if (!isValid) {
              addLog('WARN', 'Telegram token invalid, chat ID validation cannot proceed.');
           }
      } catch (error) {
           const errorMsg = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
           console.error("Error validating Telegram token:", error);
          setValidationStatus(prev => ({ ...prev, telegramToken: 'invalid', telegramChatId: 'not_checked' }));
          addLog('ERROR', `Telegram Token Validation Error: ${errorMsg}`);
          toast({ title: "Doğrulama Hatası", description: `Telegram token doğrulanırken bir hata oluştu: ${errorMsg}`, variant: "destructive" });
      }
  };

  const handleValidateTelegramChatId = async () => {
      if (validationStatus.telegramToken !== 'valid') {
          toast({ title: "Önce Token'ı Doğrulayın", description: "Chat ID'yi test etmek için önce geçerli bir bot token girip doğrulayın.", variant: "destructive" });
          addLog('WARN', 'Telegram chat ID validation prevented: Token not valid.');
          return;
      }
      setValidationStatus(prev => ({ ...prev, telegramChatId: 'pending' }));
      addLog('INFO', `Validating Telegram chat ID ${apiKeys.telegram.chatId}...`);
      try {
          const isValid = await validateChatId(apiKeys.telegram.token, apiKeys.telegram.chatId);
          setValidationStatus(prev => ({ ...prev, telegramChatId: isValid ? 'valid' : 'invalid' }));

           if (isValid) {
               addLog('INFO', `Telegram Chat ID ${apiKeys.telegram.chatId} validation successful. Sending test message...`);
               await sendMessage("✅ KriptoPilot Telegram bağlantısı başarıyla doğrulandı!", apiKeys.telegram.token, apiKeys.telegram.chatId);
                addLog('TELEGRAM', `Test message sent to chat ID ${apiKeys.telegram.chatId}.`);
                toast({
                  title: "Telegram Chat ID Doğrulandı",
                  description: `Chat ID geçerli. Test mesajı gönderildi: ${apiKeys.telegram.chatId}`,
                  variant: "default",
              });
           } else {
                // If validateChatId returns false but didn't throw 'chat not found', it's likely another issue (permissions?)
                 const message = "Chat ID geçersiz, bulunamadı veya botun bu sohbete erişim izni yok.";
                 addLog('ERROR', `Telegram Chat ID Validation: ${message} (ID: ${apiKeys.telegram.chatId})`);
                 toast({ title: "Telegram Chat ID Geçersiz", description: message, variant: "destructive" });
           }
      } catch (error) {
           const errorMsg = error instanceof Error ? error.message : "Bilinmeyen Telegram Hatası";
           console.error("Error validating/sending test message to Telegram chat ID:", error);
           setValidationStatus(prev => ({ ...prev, telegramChatId: 'invalid' }));
           addLog('ERROR', `Telegram Chat ID Validation Error: ${errorMsg} (ID: ${apiKeys.telegram.chatId})`);

           // Check for the specific "chat not found" error message we throw from validateChatId
            if (errorMsg.toLowerCase().includes('chat not found')) {
                 toast({ title: "Doğrulama Hatası", description: `Chat ID (${apiKeys.telegram.chatId}) bulunamadı. Lütfen ID'yi kontrol edin ve botun sohbete eklendiğinden/başlatıldığından emin olun.`, variant: "destructive" });
             } else {
                  toast({ title: "Doğrulama Hatası", description: `Telegram Chat ID doğrulanırken/test mesajı gönderilirken hata: ${errorMsg}`, variant: "destructive" });
            }
      }
  };


   const handleDefineStrategyParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof DefineStrategyParams) => {
       setDefineStrategyParams(prev => ({ ...prev, [field]: e.target.value }));
   };

   const handleDefineNewStrategy = async () => {
       if (!defineStrategyParams.name.trim() || !defineStrategyParams.description.trim() || !defineStrategyParams.prompt.trim()) {
           toast({ title: "Hata", description: "Strateji adı, açıklaması ve istemi boş olamaz.", variant: "destructive" });
           addLog('WARN', 'Define new strategy prevented: Missing required fields.');
           return;
       }

       setIsDefiningStrategy(true);
        addLog('AI_TASK', `Attempting to define new strategy '${defineStrategyParams.name}' with AI...`);
       try {
           const result: DefineStrategyResult = await defineNewStrategy(defineStrategyParams);

           if (result.success && result.strategy) {
               // Add the newly defined strategy to the available list
               availableStrategies.push(result.strategy);
               toast({ title: "Strateji Tanımlandı", description: result.message || `"${result.strategy.name}" başarıyla tanımlandı.` });
               addLog('AI_TASK', `AI successfully defined strategy '${result.strategy.name}'.`);
                setIsDefineStrategyDialogOpen(false); // Close dialog on success
                // Reset form
               setDefineStrategyParams({ name: '', description: '', prompt: '' });
           } else {
               const message = result.message || "AI stratejiyi tanımlayamadı.";
               toast({ title: "Strateji Tanımlama Başarısız", description: message, variant: "destructive" });
                addLog('AI_ERROR', `AI failed to define strategy: ${message}`);
           }
       } catch (error) {
           console.error("Error defining new strategy:", error);
           const message = error instanceof Error ? error.message : "Bilinmeyen bir AI hatası oluştu.";
            addLog('AI_ERROR', `Error defining new strategy: ${message}`);
           toast({ title: "AI Hatası", description: `Strateji tanımlanırken hata: ${message}`, variant: "destructive" });
       } finally {
           setIsDefiningStrategy(false);
       }
   };


  // Backtesting Handlers
  const handleBacktestParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof Omit<BacktestParams, 'strategy'>) => {
      const value = e.target.value;
       setBacktestParams(prev => ({
           ...prev,
           [field]: field === 'initialBalance' ? (value ? parseFloat(value) : 0) : value // Ensure balance is number
       }));
  };

   // Handles Select changes for backtesting (Pair, Interval, Strategy ID)
   const handleBacktestSelectChange = (value: string, field: 'pair' | 'interval' | 'strategyId') => {
       if (field === 'strategyId') {
           setSelectedBacktestStrategyId(value);
       } else {
           setBacktestParams(prev => ({ ...prev, [field]: value }));
       }
   };


  const runBacktestHandler = async () => {
    setIsBacktesting(true);
    setBacktestResult(null); // Clear previous results
    addLog('BACKTEST', 'Backtest initiated...');


    // Find the selected strategy object using the selectedBacktestStrategyId
    const strategy = availableStrategies.find(s => s.id === selectedBacktestStrategyId);

    if (!strategy) {
         toast({ title: "Backtest Hatası", description: "Geçerli bir strateji seçilmedi.", variant: "destructive" });
         addLog('BACKTEST_ERROR', 'Backtest failed: No strategy selected.');
         setIsBacktesting(false);
         return;
    }
     addLog('BACKTEST', `Selected Strategy: ${strategy.name}`);

     // Validate other backtest parameters
    if (!backtestParams.pair || !backtestParams.startDate || !backtestParams.endDate || backtestParams.initialBalance <= 0) {
         const missingParams = [
            !backtestParams.pair && "Parite",
            !backtestParams.startDate && "Başlangıç Tarihi",
            !backtestParams.endDate && "Bitiş Tarihi",
            backtestParams.initialBalance <= 0 && "Başlangıç Bakiyesi"
         ].filter(Boolean).join(', ');
         toast({ title: "Backtest Hatası", description: `Lütfen eksik veya geçersiz alanları doldurun: ${missingParams}.`, variant: "destructive" });
         setBacktestResult({ errorMessage: `Eksik parametreler: ${missingParams}.`, totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0 });
         addLog('BACKTEST_ERROR', `Backtest failed: Missing parameters - ${missingParams}.`);
         setIsBacktesting(false);
         return
    }
     if (new Date(backtestParams.startDate) >= new Date(backtestParams.endDate)) {
        toast({ title: "Backtest Hatası", description: "Başlangıç tarihi bitiş tarihinden önce olmalıdır.", variant: "destructive" });
        setBacktestResult({ errorMessage: "Geçersiz tarih aralığı.", totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0 });
        addLog('BACKTEST_ERROR', 'Backtest failed: Start date must be before end date.');
         setIsBacktesting(false);
        return;
    }
     addLog('BACKTEST', `Parameters: Pair=${backtestParams.pair}, Interval=${backtestParams.interval}, Start=${backtestParams.startDate}, End=${backtestParams.endDate}, Balance=${backtestParams.initialBalance}`);

    // Prepare the full BacktestParams object for the flow
     const fullBacktestParams: BacktestParams = {
       strategy: strategy, // Pass the full strategy object
       pair: backtestParams.pair,
       interval: backtestParams.interval,
       startDate: backtestParams.startDate,
       endDate: backtestParams.endDate,
       initialBalance: backtestParams.initialBalance,
     };


    try {
        addLog('BACKTEST', `Calling backtestStrategy flow for ${strategy.name} on ${backtestParams.pair}...`);
      // Call the Genkit flow for backtesting with the full parameters
      const result: BacktestResult = await backtestStrategy(fullBacktestParams);

      setBacktestResult(result); // Set the result from the flow

      if (result.errorMessage) {
          toast({ title: "Backtest Sonucu", description: result.errorMessage, variant: "destructive" });
          addLog('BACKTEST_ERROR', `Backtest completed with error: ${result.errorMessage}`);
      } else {
          toast({ title: "Backtest Tamamlandı", description: `${strategy.name} stratejisi ${backtestParams.pair} üzerinde başarıyla test edildi.` });
          addLog('BACKTEST', `Backtest completed successfully. PnL: ${result.totalPnlPercent?.toFixed(2)}%`);
      }
    } catch (error) {
      console.error("Backtest flow error:", error);
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir AI veya API hatası oluştu.";
      setBacktestResult({ errorMessage, totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0 });
      addLog('BACKTEST_ERROR', `Backtest flow execution failed: ${errorMessage}`);
      toast({ title: "Backtest Başarısız", description: errorMessage, variant: "destructive" });
    } finally {
      setIsBacktesting(false);
    }
  };


  // --- Sub-Components for Rendering ---

  const PortfolioRow = ({ balance }: { balance: Balance }) => {
       // Use the hook for client-side formatting
      const formattedFree = useFormattedNumber(balance.free, { maximumFractionDigits: 8 });
      const formattedLocked = useFormattedNumber(balance.locked, { maximumFractionDigits: 8 });

      return (
          <TableRow key={balance.asset}>
              <TableCell className="font-medium">{balance.asset}</TableCell>
              <TableCell className="text-right tabular-nums">{formattedFree}</TableCell>
              <TableCell className="text-right tabular-nums">{formattedLocked}</TableCell>
          </TableRow>
      );
  };

   const TradeHistoryRow = ({ trade }: { trade: any }) => { // Use 'any' for placeholder
       // Use the hook for client-side formatting (adjust properties based on actual data structure)
        const formattedPrice = useFormattedNumber(trade.price);
        const formattedAmount = useFormattedNumber(trade.qty, { maximumFractionDigits: 8 }); // Assuming 'qty' for amount
        const formattedTotal = useFormattedNumber(trade.quoteQty); // Assuming 'quoteQty' for total value

       return (
           <TableRow key={trade.id || trade.orderId}>
               <TableCell className="text-xs whitespace-nowrap">{formatTimestamp(trade.time)}</TableCell> {/* Assuming 'time' */}
               <TableCell>{trade.symbol}</TableCell> {/* Assuming 'symbol' */}
               <TableCell className={trade.side === 'BUY' ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--destructive))]'}>{trade.side}</TableCell> {/* Assuming 'side' */}
               <TableCell className="text-right tabular-nums">{formattedPrice}</TableCell>
               <TableCell className="text-right tabular-nums">{formattedAmount}</TableCell>
               <TableCell className="text-right tabular-nums">{formattedTotal}</TableCell>
                <TableCell className="text-right">{trade.status || 'N/A'}</TableCell> {/* Assuming 'status' */}
           </TableRow>
       );
   };

   const ChartTooltipContent = ({ active, payload, label }: any) => {
        if (active && payload && payload.length && payload[0].payload) { // Check payload[0].payload exists
           // Use the direct function here as it's within the client-side chart context
           const formattedValue = formatNumberClientSide(payload[0].value, { maximumFractionDigits: 4 });
           const timeLabel = formatTimestamp(label); // Use the label provided by recharts
           return (
             <div className="custom-tooltip p-2 bg-card border border-border rounded shadow-lg text-card-foreground text-xs">
               <p className="label font-bold">{`${selectedPair} - ${timeLabel}`}</p>
                <p className="intro">{`${payload[0].name}: ${formattedValue}`}</p>
                {/* Optionally add Open, High, Low, Close */}
                <p className="text-muted-foreground">A: {formatNumberClientSide(payload[0].payload.open)} Y: {formatNumberClientSide(payload[0].payload.high)}</p>
                 <p className="text-muted-foreground">D: {formatNumberClientSide(payload[0].payload.low)} K: {formatNumberClientSide(payload[0].payload.close)}</p>
                 <p className="text-muted-foreground">Hacim: {formatNumberClientSide(payload[0].payload.volume)}</p>
             </div>
           );
         }
       return null;
     };

    const ValidationIcon = ({ status }: { status: ValidationStatus }) => {
        switch (status) {
            case 'pending':
                return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
            case 'valid':
                return <ShieldCheck className="h-4 w-4 text-green-600" />;
            case 'invalid':
                return <ShieldX className="h-4 w-4 text-destructive" />;
            case 'not_checked':
            default:
                return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
        }
    };


  // --- JSX ---
  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2 justify-center group-data-[collapsible=icon]:justify-start">
             <Bot className="text-primary h-6 w-6" />
             <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">KriptoPilot</span>
          </div>
          <SidebarSeparator />
           {activeUser ? (
             <div className="flex flex-col items-center group-data-[collapsible=icon]:items-start p-2 gap-2">
                <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">Hoşgeldin, {activeUser}!</span>
                 <Button variant="outline" size="sm" onClick={handleLogout} className="w-full group-data-[collapsible=icon]:w-auto">
                   <LogOut className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0"/>
                   <span className="group-data-[collapsible=icon]:hidden">Çıkış Yap</span>
                 </Button>
             </div>
            ) : (
                <div className="p-2 space-y-2 group-data-[collapsible=icon]:hidden">
                    <Label htmlFor="username">Kullanıcı Adı</Label>
                    <Input id="username" placeholder="Kullanıcı adı girin" defaultValue="Demo Kullanıcı"/> {/* Simplified login */}
                    <Button className="w-full" onClick={() => handleLogin('Demo Kullanıcı')}>
                        <LogIn className="mr-2 h-4 w-4"/> Giriş Yap
                    </Button>
                     <p className="text-xs text-muted-foreground text-center">Demo girişi API erişimi sağlamaz.</p>
                </div>
            )}
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarMenu>
             <SidebarMenuItem>
              <SidebarMenuButton tooltip="API Ayarları" isActive={false}>
                <Settings />
                API Ayarları
              </SidebarMenuButton>
              <SidebarMenuSub>
                 <SidebarMenuSubItem>
                  <SidebarMenuSubButton href="#api-spot">Spot</SidebarMenuSubButton>
                </SidebarMenuSubItem>
                 <SidebarMenuSubItem>
                  <SidebarMenuSubButton href="#api-futures">Futures</SidebarMenuSubButton>
                </SidebarMenuSubItem>
                 <SidebarMenuSubItem>
                  <SidebarMenuSubButton href="#api-testnet-spot">Testnet Spot</SidebarMenuSubButton>
                </SidebarMenuSubItem>
                 <SidebarMenuSubItem>
                  <SidebarMenuSubButton href="#api-testnet-futures">Testnet Futures</SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                   <SidebarMenuSubButton href="#telegram">Telegram</SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#portfolio" tooltip="Portföy" isActive={false}>
                <Wallet />
                Portföy
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
               <SidebarMenuButton tooltip="Stratejiler" isActive={false}>
                 <BarChart3 />
                 Stratejiler
               </SidebarMenuButton>
               <SidebarMenuSub>
                 <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="#strategy-management">Yönetim</SidebarMenuSubButton>
                 </SidebarMenuSubItem>
                 <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="#strategy-backtest">Geriye Dönük Test</SidebarMenuSubButton>
                 </SidebarMenuSubItem>
                 <SidebarMenuSubItem>
                     <SidebarMenuSubButton href="#risk-management">Risk Yönetimi</SidebarMenuSubButton>
                 </SidebarMenuSubItem>
               </SidebarMenuSub>
             </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#trade-history" tooltip="İşlem Geçmişi" isActive={false}>
                <History />
                İşlem Geçmişi
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
               <SidebarMenuButton href="#logs" tooltip="Log Kayıtları" isActive={false}>
                 <FileText />
                 Log Kayıtları
               </SidebarMenuButton>
             </SidebarMenuItem>
              <SidebarMenuItem>
                 <SidebarMenuButton href="#bot-pairs" tooltip="Bot Pariteleri" isActive={false}>
                     <ArrowRightLeft />
                     Bot Pariteleri
                 </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
           <div className="flex items-center justify-between p-2">
                <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">Bot Durumu: {botStatus === 'running' ? 'Çalışıyor' : 'Durdu'}</span>
                 <TooltipProvider>
                  <Tooltip>
                     <TooltipTrigger asChild>
                       {/* Wrap the button in a span to allow Tooltip when disabled */}
                       <span tabIndex={0} className={cn(botStatus === 'stopped' && (!activeUser || validationStatus[validationStatus.testnetSpot === 'valid' ? 'testnetSpot' : 'spot'] !== 'valid' || validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId !== 'valid' || activeStrategies.length === 0 || selectedPairsForBot.length === 0) && "cursor-not-allowed")}>
                          <Button
                              variant={botStatus === 'running' ? 'destructive' : 'default'}
                              size="sm"
                              onClick={toggleBotStatus}
                              className="group-data-[collapsible=icon]:w-full"
                              disabled={
                                  !activeUser ||
                                  (botStatus === 'stopped' && (validationStatus[validationStatus.testnetSpot === 'valid' ? 'testnetSpot' : 'spot'] !== 'valid' || validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId !== 'valid' || activeStrategies.length === 0 || selectedPairsForBot.length === 0))
                              }
                           >
                              {botStatus === 'running' ? <Pause className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0"/> : <Play className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0"/>}
                              <span className="group-data-[collapsible=icon]:hidden">{botStatus === 'running' ? 'Durdur' : 'Başlat'}</span>
                          </Button>
                       </span>
                     </TooltipTrigger>
                      <TooltipContent side="top" align="end">
                         { !activeUser ? "Botu kullanmak için giriş yapın." :
                            botStatus === 'stopped' && validationStatus[validationStatus.testnetSpot === 'valid' ? 'testnetSpot' : 'spot'] !== 'valid' ? `Botu başlatmak için ${validationStatus.testnetSpot === 'valid' ? 'Testnet Spot' : 'Spot'} API anahtarlarını doğrulayın.` :
                           botStatus === 'stopped' && (validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId !== 'valid') ? "Botu başlatmak için Telegram ayarlarını doğrulayın." :
                           botStatus === 'stopped' && activeStrategies.length === 0 ? "Botu başlatmak için en az bir strateji seçin." :
                            botStatus === 'stopped' && selectedPairsForBot.length === 0 ? "Botu başlatmak için en az bir parite seçin." :
                           botStatus === 'running' ? "Botu durdur." : "Botu başlat."
                         }
                       </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
            </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b bg-card">
           <div className="flex items-center gap-4">
             <SidebarTrigger />
              <h1 className="text-xl font-semibold">KriptoPilot Kontrol Paneli</h1>
           </div>
           <div className="flex items-center gap-4">
             <Select value={selectedPair} onValueChange={setSelectedPair} disabled={loadingPairs || availablePairs.length === 0}>
               <SelectTrigger className="w-[180px]">
                 <SelectValue placeholder={loadingPairs ? "Pariteler yükleniyor..." : (availablePairs.length === 0 ? "Parite Yok" : "Parite Seçin")} />
               </SelectTrigger>
               <SelectContent>
                 <ScrollArea className="h-[300px]">
                    {loadingPairs ? (
                        <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                    ) : availablePairs.length > 0 ? (
                        availablePairs.map((pair) => (
                            <SelectItem key={pair.symbol} value={pair.symbol}>
                                {pair.baseAsset}/{pair.quoteAsset}
                            </SelectItem>
                        ))
                    ) : (
                         <SelectItem value="no-pairs" disabled>Parite bulunamadı.</SelectItem>
                    )}
                 </ScrollArea>
               </SelectContent>
             </Select>
             <Select value={selectedInterval} onValueChange={setSelectedInterval}>
                <SelectTrigger className="w-[100px]">
                   <SelectValue placeholder="Zaman Aralığı" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="1m">1m</SelectItem>
                   <SelectItem value="5m">5m</SelectItem>
                   <SelectItem value="15m">15m</SelectItem>
                   <SelectItem value="1h">1h</SelectItem>
                   <SelectItem value="4h">4h</SelectItem>
                   <SelectItem value="1d">1d</SelectItem>
                </SelectContent>
             </Select>
           </div>
        </header>

        <main className="flex-1 p-4 overflow-auto">

         {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Hata</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Chart Area */}
            <Card className="lg:col-span-2 h-[500px]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                        {selectedPair ? `${selectedPair.replace('USDT','/USDT')} - ${selectedInterval} Grafik` : "Grafik (Parite Seçin)"}
                        {loadingCandles && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </div>
                  <CandlestickChart className="text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-4rem)]">
                {loadingCandles ? (
                     <div className="flex items-center justify-center h-full text-muted-foreground">
                         <Loader2 className="h-8 w-8 animate-spin mr-2" /> Yükleniyor...
                     </div>
                ) : candleData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={candleData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                           dataKey="openTime"
                           tickFormatter={(value) => formatTimestamp(value)}
                           stroke="hsl(var(--muted-foreground))"
                           tick={{ fontSize: 10 }}
                           interval="preserveStartEnd" // Adjust interval as needed
                           minTickGap={50} // Adjust gap for readability
                           axisLine={{ stroke: "hsl(var(--border))" }}
                           tickLine={{ stroke: "hsl(var(--border))" }}
                         />
                        <YAxis
                           stroke="hsl(var(--muted-foreground))"
                           domain={['auto', 'auto']}
                           tick={{ fontSize: 10 }}
                           tickFormatter={(value) => formatNumberClientSide(value, { maximumFractionDigits: Math.max(2, Math.min(8, String(value).split('.')[1]?.length || 0)) })} // Dynamic precision
                           orientation="left"
                           axisLine={{ stroke: "hsl(var(--border))" }}
                           tickLine={{ stroke: "hsl(var(--border))" }}
                         />
                       <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1 }}/>
                       <Legend />
                       <Line type="monotone" dataKey="close" name="Kapanış" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                       {/* TODO: Add buy/sell markers based on tradeHistoryData or bot signals */}
                     </LineChart>
                   </ResponsiveContainer>
                ) : (
                   <div className="flex items-center justify-center h-full text-muted-foreground">
                      {selectedPair ? `${selectedPair} için ${selectedInterval} aralığında veri bulunamadı.` : "Lütfen bir parite seçin."}
                   </div>
                )}
              </CardContent>
            </Card>

            {/* Side Panel Tabs */}
            <Card className="lg:col-span-1 h-[500px]">
              <Tabs defaultValue="portfolio" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="portfolio"><Wallet className="inline-block mr-1 h-4 w-4"/>Portföy</TabsTrigger>
                  <TabsTrigger value="history"><History className="inline-block mr-1 h-4 w-4"/>Geçmiş</TabsTrigger>
                  <TabsTrigger value="logs"><FileText className="inline-block mr-1 h-4 w-4"/>Loglar</TabsTrigger>
                </TabsList>
                 <ScrollArea className="flex-1">
                  <TabsContent value="portfolio" className="p-4">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        Anlık Portföy
                        {loadingPortfolio && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </h3>
                     {/* Inform user to login or validate API */}
                     {!activeUser && (
                         <Alert variant="default" className="mb-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
                           <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <AlertTitle className="text-blue-800 dark:text-blue-300">Giriş Gerekli</AlertTitle>
                           <AlertDescription className="text-blue-700 dark:text-blue-400">
                               Portföy verilerini görmek için lütfen giriş yapın. API anahtarları olmadan sadece Demo Kullanıcı modunda çalışabilirsiniz.
                           </AlertDescription>
                       </Alert>
                     )}
                     {activeUser && validationStatus.spot !== 'valid' && validationStatus.testnetSpot !== 'valid' && ( // Check if NEITHER is valid
                        <Alert variant="default" className="mb-4 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700">
                           <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <AlertTitle className="text-yellow-800 dark:text-yellow-300">API Doğrulaması Bekleniyor</AlertTitle>
                           <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                               Portföy verilerini görmek için lütfen Spot veya Testnet Spot API anahtarlarınızı <a href="#api-settings" className="underline">API Ayarları</a> bölümünden girip doğrulayın.
                           </AlertDescription>
                       </Alert>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Varlık</TableHead>
                          <TableHead className="text-right">Kullanılabilir</TableHead>
                          <TableHead className="text-right">Kilitli</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingPortfolio ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                    <Loader2 className="inline-block h-6 w-6 animate-spin text-muted-foreground" /> Yükleniyor...
                                </TableCell>
                            </TableRow>
                        ) : portfolioData.length > 0 && activeUser && (validationStatus.spot === 'valid' || validationStatus.testnetSpot === 'valid') ? (
                           portfolioData.map((balance) => (
                              <PortfolioRow key={balance.asset} balance={balance} />
                           ))
                       ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                    {!activeUser ? "Giriş yapınız." :
                                     (validationStatus.spot !== 'valid' && validationStatus.testnetSpot !== 'valid') ? "Geçerli API anahtarı yok." :
                                      portfolioData.length === 0 && !loadingPortfolio ? "Portföy boş veya yüklenemedi." :
                                     "Portföy verisi bekleniyor..."}
                                </TableCell>
                            </TableRow>
                       )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="history" className="p-4">
                     <h3 className="text-lg font-semibold mb-2">İşlem Geçmişi (Yakında)</h3>
                     <p className="text-sm text-muted-foreground mb-4">Bu özellik yakında eklenecektir. Binance API üzerinden son işlemleriniz burada listelenecektir.</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Zaman</TableHead>
                          <TableHead>Parite</TableHead>
                          <TableHead>Tip</TableHead>
                          <TableHead className="text-right">Fiyat</TableHead>
                          <TableHead className="text-right">Miktar</TableHead>
                           <TableHead className="text-right">Toplam</TableHead>
                          <TableHead className="text-right">Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {tradeHistoryData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Gerçekleşen işlem verisi yok.</TableCell>
                            </TableRow>
                         ) : (
                            tradeHistoryData.map((trade) => (
                               <TradeHistoryRow key={trade.id} trade={trade} />
                             ))
                         )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="logs" className="p-4">
                     <h3 className="text-lg font-semibold mb-2">Log Kayıtları ({dynamicLogData.length})</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                             <TableHead className="w-[150px]">Zaman</TableHead>
                             <TableHead className="w-[100px]">Tip</TableHead>
                             <TableHead>Mesaj</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                           {dynamicLogData.length === 0 ? (
                              <TableRow>
                                  <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">Log kaydı bulunamadı.</TableCell>
                              </TableRow>
                           ) : (
                              dynamicLogData.map((log, index) => ( // Already showing newest first due to prepending
                                 <TableRow key={index}>
                                   <TableCell className="text-xs whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                                   <TableCell>
                                       <span className={cn("px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap",
                                            log.type === 'ERROR' || log.type.includes('ERROR') ? 'bg-destructive/10 text-destructive dark:bg-destructive/30' :
                                            log.type === 'WARN' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                            log.type === 'TRADE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                            log.type === 'TELEGRAM' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                            log.type === 'STRATEGY_START' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                            log.type.startsWith('AI_') ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' :
                                            log.type === 'BACKTEST' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' :
                                            'bg-secondary text-secondary-foreground')}>
                                            {log.type}
                                       </span>
                                   </TableCell>
                                   <TableCell className="text-xs">{log.message}</TableCell>
                                 </TableRow>
                               ))
                            )}
                        </TableBody>
                      </Table>
                  </TabsContent>
                 </ScrollArea>
              </Tabs>
            </Card>

            {/* API Key Management */}
            <Card id="api-settings" className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <KeyRound className="mr-2 text-primary" /> API Anahtar Yönetimi
                </CardTitle>
                  <p className="text-sm text-muted-foreground pt-1">
                     API anahtarlarınızı Binance'den alın ve ilgili bölümlere girin. Anahtarlar yalnızca tarayıcınızda saklanır ve sunucuya gönderilmez (güvenli API çağrıları için sunucu tarafı yapılandırma gereklidir).
                      Testnet anahtarları (<a href="https://testnet.binance.vision/" target="_blank" rel="noopener noreferrer" className="underline">Spot Testnet</a>, <a href="https://testnet.binancefuture.com/" target="_blank" rel="noopener noreferrer" className="underline">Futures Testnet</a>) canlı bakiyenizi etkilemeden test yapmanızı sağlar.
                  </p>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full" defaultValue="api-spot">
                    {/* Binance Spot API */}
                    <AccordionItem value="api-spot" id="api-spot">
                        <AccordionTrigger>Binance Spot API (Canlı)</AccordionTrigger>
                        <AccordionContent className="space-y-4 p-4">
                           <div className="flex flex-col md:flex-row md:items-end gap-2">
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="spot-api-key">API Key</Label>
                                    <Input id="spot-api-key" placeholder="Spot API Key Girin" value={apiKeys.spot.key} onChange={(e) => handleApiKeyChange(e, 'spot', 'key')} />
                                </div>
                               <div className="flex-1 space-y-1">
                                    <Label htmlFor="spot-secret-key">Secret Key</Label>
                                    <Input id="spot-secret-key" type="password" placeholder="Spot Secret Key Girin" value={apiKeys.spot.secret} onChange={(e) => handleApiKeyChange(e, 'spot', 'secret')} />
                                </div>
                                <TooltipProvider>
                                     <Tooltip>
                                         <TooltipTrigger asChild>
                                             <Button size="sm" onClick={() => handleValidateApiKey('spot')} disabled={!apiKeys.spot.key || !apiKeys.spot.secret || validationStatus.spot === 'pending'}>
                                                 <ValidationIcon status={validationStatus.spot} />
                                                  <span className="ml-2 hidden sm:inline">Doğrula (Spot)</span>
                                                  <span className="ml-2 sm:hidden">Doğrula</span>
                                              </Button>
                                         </TooltipTrigger>
                                         <TooltipContent>
                                             <p>{ validationStatus.spot === 'valid' ? 'Spot API anahtarı geçerli.' : validationStatus.spot === 'invalid' ? 'Spot API anahtarı geçersiz veya doğrulanamadı.' : validationStatus.spot === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}</p>
                                         </TooltipContent>
                                     </Tooltip>
                                </TooltipProvider>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                     {/* Binance Futures API */}
                     <AccordionItem value="api-futures" id="api-futures">
                         <AccordionTrigger>Binance Futures API (Canlı - Yapılandırılmadı)</AccordionTrigger>
                         <AccordionContent className="space-y-4 p-4">
                            <Alert variant="default" className="bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700">
                               <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                               <AlertTitle className="text-orange-800 dark:text-orange-300">Geliştirme Aşamasında</AlertTitle>
                               <AlertDescription className="text-orange-700 dark:text-orange-400">
                                  Futures işlemleri için destek şu anda aktif değildir. API anahtarı girişi etkinleştirilmemiştir.
                               </AlertDescription>
                           </Alert>
                             {/* <div className="flex items-end gap-2"> ... Input fields ... </div> */}
                             <p className="text-xs text-muted-foreground">Futures API anahtarları ayrı olarak oluşturulmalıdır ve gelecekteki güncellemelerde desteklenecektir.</p>
                         </AccordionContent>
                     </AccordionItem>

                      {/* Binance Testnet Spot API */}
                      <AccordionItem value="api-testnet-spot" id="api-testnet-spot">
                          <AccordionTrigger>Binance Testnet Spot API</AccordionTrigger>
                          <AccordionContent className="space-y-4 p-4">
                               <div className="flex flex-col md:flex-row md:items-end gap-2">
                                  <div className="flex-1 space-y-1">
                                      <Label htmlFor="testnet-spot-api-key">API Key</Label>
                                      <Input id="testnet-spot-api-key" placeholder="Testnet Spot API Key Girin" value={apiKeys.testnetSpot.key} onChange={(e) => handleApiKeyChange(e, 'testnetSpot', 'key')}/>
                                  </div>
                                   <div className="flex-1 space-y-1">
                                      <Label htmlFor="testnet-spot-secret-key">Secret Key</Label>
                                      <Input id="testnet-spot-secret-key" type="password" placeholder="Testnet Spot Secret Key Girin" value={apiKeys.testnetSpot.secret} onChange={(e) => handleApiKeyChange(e, 'testnetSpot', 'secret')}/>
                                  </div>
                                   <TooltipProvider>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                          <Button size="sm" onClick={() => handleValidateApiKey('testnetSpot')} disabled={!apiKeys.testnetSpot.key || !apiKeys.testnetSpot.secret || validationStatus.testnetSpot === 'pending'}>
                                              <ValidationIcon status={validationStatus.testnetSpot} />
                                               <span className="ml-2 hidden sm:inline">Doğrula (Testnet Spot)</span>
                                               <span className="ml-2 sm:hidden">Doğrula</span>
                                           </Button>
                                        </TooltipTrigger>
                                         <TooltipContent>
                                             <p>{ validationStatus.testnetSpot === 'valid' ? 'Testnet Spot API anahtarı geçerli.' : validationStatus.testnetSpot === 'invalid' ? 'Testnet Spot API anahtarı geçersiz veya doğrulanamadı.' : validationStatus.testnetSpot === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}</p>
                                          </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                               </div>
                               <p className="text-xs text-muted-foreground">Testnet üzerinde test yapmak için kullanılır. Canlı bakiyenizi etkilemez.</p>
                          </AccordionContent>
                      </AccordionItem>

                      {/* Binance Testnet Futures API */}
                     <AccordionItem value="api-testnet-futures" id="api-testnet-futures">
                          <AccordionTrigger>Binance Testnet Futures API (Yapılandırılmadı)</AccordionTrigger>
                         <AccordionContent className="space-y-4 p-4">
                              <Alert variant="default" className="bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700">
                               <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                               <AlertTitle className="text-orange-800 dark:text-orange-300">Geliştirme Aşamasında</AlertTitle>
                               <AlertDescription className="text-orange-700 dark:text-orange-400">
                                  Testnet Futures işlemleri için destek şu anda aktif değildir. API anahtarı girişi etkinleştirilmemiştir.
                               </AlertDescription>
                           </Alert>
                             {/* <div className="flex items-end gap-2"> ... Input fields ... </div> */}
                             <p className="text-xs text-muted-foreground">Testnet Futures API anahtarları ayrı olarak oluşturulmalıdır ve gelecekteki güncellemelerde desteklenecektir.</p>
                         </AccordionContent>
                     </AccordionItem>

                    {/* Telegram Bot Integration */}
                   <AccordionItem value="telegram" id="telegram">
                      <AccordionTrigger>Telegram Bot Entegrasyonu</AccordionTrigger>
                      <AccordionContent className="space-y-4 p-4">
                          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                              <div className="flex-1 space-y-1">
                                  <Label htmlFor="telegram-token">Bot Token</Label>
                                  <Input id="telegram-token" type="password" placeholder="Telegram Bot Token Girin" value={apiKeys.telegram.token} onChange={(e) => handleApiKeyChange(e, 'telegram', 'token')} />
                              </div>
                               <TooltipProvider>
                                   <Tooltip>
                                       <TooltipTrigger asChild>
                                            <Button size="sm" onClick={handleValidateTelegramToken} disabled={!apiKeys.telegram.token || validationStatus.telegramToken === 'pending'}>
                                                <ValidationIcon status={validationStatus.telegramToken} />
                                                 <span className="ml-2 hidden sm:inline">Token'ı Doğrula</span>
                                                 <span className="ml-2 sm:hidden">Doğrula</span>
                                            </Button>
                                       </TooltipTrigger>
                                       <TooltipContent>
                                            <p>{ validationStatus.telegramToken === 'valid' ? 'Token geçerli.' : validationStatus.telegramToken === 'invalid' ? 'Token geçersiz veya doğrulanamadı.' : validationStatus.telegramToken === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}</p>
                                        </TooltipContent>
                                   </Tooltip>
                               </TooltipProvider>
                          </div>
                           <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                               <div className="flex-1 space-y-1">
                                   <Label htmlFor="telegram-chat-id">Chat ID</Label>
                                   <Input id="telegram-chat-id" placeholder="Telegram Grup/Kullanıcı ID Girin" value={apiKeys.telegram.chatId} onChange={(e) => handleApiKeyChange(e, 'telegram', 'chatId')} />
                               </div>
                                <TooltipProvider>
                                    <Tooltip>
                                       <TooltipTrigger asChild>
                                           <Button size="sm" onClick={handleValidateTelegramChatId} disabled={!apiKeys.telegram.chatId || validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId === 'pending'}>
                                               <ValidationIcon status={validationStatus.telegramChatId} />
                                               <span className="ml-2 hidden sm:inline">Test Mesajı Gönder</span>
                                                <span className="ml-2 sm:hidden">Test Et</span>
                                           </Button>
                                       </TooltipTrigger>
                                        <TooltipContent>
                                             <p>
                                                 {validationStatus.telegramToken !== 'valid' ? 'Önce geçerli bir token girin.' :
                                                  validationStatus.telegramChatId === 'valid' ? 'Chat ID geçerli, test mesajı gönderildi.' :
                                                  validationStatus.telegramChatId === 'invalid' ? 'Chat ID geçersiz veya bulunamadı.' :
                                                   validationStatus.telegramChatId === 'pending' ? 'Doğrulanıyor...' :
                                                  'Chat ID doğrulaması ve test mesajı için tıklayın.'}
                                            </p>
                                        </TooltipContent>
                                   </Tooltip>
                               </TooltipProvider>
                           </div>
                           <p className="text-xs text-muted-foreground">BotFather'dan token alın. Chat ID için <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="underline">@userinfobot</a> (kendi ID'niz) veya grup ID'si (-100... ile başlar) kullanın. Botun gruba ekli olması veya kullanıcı tarafından başlatılmış olması gerekir.</p>
                       </AccordionContent>
                    </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

             {/* Strategy Management */}
            <Card id="strategy-management" className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                     <div className="flex items-center">
                        <List className="mr-2 text-primary" /> Strateji Yönetimi
                     </div>
                      {/* Dialog for Defining New Strategy with AI */}
                     <Dialog open={isDefineStrategyDialogOpen} onOpenChange={setIsDefineStrategyDialogOpen}>
                         <DialogTrigger asChild>
                              <Button size="sm"><PlusCircle className="mr-2 h-4 w-4"/> Yeni Strateji (AI)</Button>
                          </DialogTrigger>
                         <DialogContent className="sm:max-w-lg"> {/* Wider dialog for prompt */}
                             <DialogHeader>
                                 <DialogTitle>Yeni Ticaret Stratejisi Tanımla (AI)</DialogTitle>
                                 <DialogDescription>
                                      AI'nın sizin için bir ticaret stratejisi tanımlamasını sağlayın. İstem alanına net kurallar girin. AI tarafından oluşturulan stratejiler deneyseldir ve dikkatli kullanılmalıdır.
                                 </DialogDescription>
                             </DialogHeader>
                             <div className="grid gap-4 py-4">
                                 <div className="space-y-1">
                                    <Label htmlFor="define-strategy-name">Strateji Adı</Label>
                                     <Input
                                         id="define-strategy-name"
                                         value={defineStrategyParams.name}
                                         onChange={(e) => handleDefineStrategyParamChange(e, 'name')}
                                         placeholder="Örn: Gelişmiş RSI + Hacim Teyidi"
                                     />
                                 </div>
                                  <div className="space-y-1">
                                      <Label htmlFor="define-strategy-desc">Kısa Açıklama</Label>
                                      <Input
                                          id="define-strategy-desc"
                                          value={defineStrategyParams.description}
                                          onChange={(e) => handleDefineStrategyParamChange(e, 'description')}
                                           placeholder="Stratejinin ana fikrini özetleyin."
                                      />
                                  </div>
                                 <div className="space-y-1">
                                     <Label htmlFor="define-strategy-prompt">Detaylı Strateji İstemi (Prompt)</Label>
                                     <Textarea
                                          id="define-strategy-prompt"
                                          value={defineStrategyParams.prompt}
                                          onChange={(e) => handleDefineStrategyParamChange(e, 'prompt')}
                                          className="min-h-[150px]" // Increased height
                                          placeholder="AI için detaylı alım/satım kurallarını, kullanılacak indikatörleri ve parametreleri açıklayın. Örneğin: 'RSI(14) 35 altına düştüğünde VE Hacim son 10 mumun ortalamasının 1.5 katından fazlaysa AL. RSI(14) 70 üzerine çıktığında veya %3 Stop-Loss tetiklendiğinde SAT.'"
                                      />
                                        <p className="text-xs text-muted-foreground">AI'nın anlayabileceği net ve spesifik kurallar yazın.</p>
                                 </div>
                             </div>
                             <DialogFooter>
                                 <DialogClose asChild>
                                     <Button type="button" variant="secondary" disabled={isDefiningStrategy}>İptal</Button>
                                 </DialogClose>
                                 <Button type="button" onClick={handleDefineNewStrategy} disabled={isDefiningStrategy || !defineStrategyParams.name || !defineStrategyParams.description || !defineStrategyParams.prompt}>
                                     {isDefiningStrategy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                     {isDefiningStrategy ? 'Tanımlanıyor...' : 'AI ile Strateji Tanımla'}
                                 </Button>
                             </DialogFooter>
                         </DialogContent>
                     </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <h4 className="font-semibold mb-2">Aktif Stratejiler ({activeStrategies.length})</h4>
                 <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                    {activeStrategies.length === 0 && <span className="text-muted-foreground text-sm italic">Aktif strateji yok. Bot çalışmayacaktır.</span>}
                    {activeStrategies.map((stratId) => {
                        const strategy = availableStrategies.find(s => s.id === stratId);
                        return (
                            <TooltipProvider key={stratId}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                         <Button variant="secondary" size="sm" onClick={() => handleStrategyToggle(stratId)}>
                                            {strategy?.name ?? stratId} <CloseIcon className="ml-2 h-4 w-4" />
                                         </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{strategy?.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )
                    })}
                 </div>
                <h4 className="font-semibold mb-2">Mevcut Stratejiler ({availableStrategies.length})</h4>
                 <ScrollArea className="h-[200px] border rounded-md p-2">
                    <div className="space-y-1">
                       {availableStrategies.map((strategy) => (
                        <div key={strategy.id} className="flex items-center justify-between p-1.5 hover:bg-accent rounded-md group">
                          <Label htmlFor={`strat-${strategy.id}`} className="flex items-center gap-2 cursor-pointer text-sm flex-1">
                            <Checkbox
                              id={`strat-${strategy.id}`}
                              checked={activeStrategies.includes(strategy.id)}
                              onCheckedChange={() => handleStrategyToggle(strategy.id)}
                            />
                            {strategy.name}
                             {strategy.id.startsWith('ai_') && <Bot className="h-3 w-3 text-blue-500" title="AI Tarafından Tanımlandı"/>}
                          </Label>
                           <TooltipProvider>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 group-hover:opacity-100">
                                        <Info className="h-4 w-4"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                    <p className="font-medium">{strategy.name}</p>
                                    <p className="text-xs text-muted-foreground">{strategy.description}</p>
                                    {strategy.prompt && <p className="text-xs mt-1 pt-1 border-t border-border text-muted-foreground italic">AI İstem: {strategy.prompt.substring(0, 100)}...</p> }
                                </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                        </div>
                      ))}
                    </div>
                 </ScrollArea>

              </CardContent>
            </Card>

            {/* Bot Pair Selection */}
             <Card id="bot-pairs" className="lg:col-span-3">
               <CardHeader>
                 <CardTitle className="flex items-center">
                   <ArrowRightLeft className="mr-2 text-primary" /> Bot İçin Parite Seçimi
                 </CardTitle>
               </CardHeader>
               <CardContent>
                  <h4 className="font-semibold mb-2">Seçili Pariteler ({selectedPairsForBot.length})</h4>
                  <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                      {selectedPairsForBot.length === 0 && <span className="text-muted-foreground text-sm italic">Bot için parite seçilmedi. Bot çalışmayacaktır.</span>}
                      {selectedPairsForBot.map((pairSymbol) => (
                         <Button key={pairSymbol} variant="secondary" size="sm" onClick={() => handleBotPairToggle(pairSymbol)}>
                              {pairSymbol} <CloseIcon className="ml-2 h-4 w-4" />
                         </Button>
                      ))}
                  </div>

                 <h4 className="font-semibold mb-2">Mevcut Pariteler ({availablePairs.length})</h4>
                  {loadingPairs ? (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Pariteler yükleniyor...
                      </div>
                  ) : availablePairs.length > 0 ? (
                      <ScrollArea className="h-[200px] border rounded-md p-2">
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
                            {availablePairs.map((pair) => (
                               <Label key={pair.symbol} htmlFor={`pair-${pair.symbol}`} className="flex items-center gap-1.5 cursor-pointer text-xs p-1.5 hover:bg-accent rounded-md">
                                 <Checkbox
                                   id={`pair-${pair.symbol}`}
                                   checked={selectedPairsForBot.includes(pair.symbol)}
                                   onCheckedChange={() => handleBotPairToggle(pair.symbol)}
                                 />
                                 {pair.symbol}
                               </Label>
                             ))}
                         </div>
                      </ScrollArea>
                  ) : (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                           Parite bulunamadı veya yüklenemedi. Binance API bağlantısını kontrol edin.
                      </div>
                  )}
                   <div className="mt-4 flex gap-2">
                       <Button size="sm" variant="outline" onClick={() => {
                           const allSymbols = availablePairs.map(p => p.symbol);
                           setSelectedPairsForBot(allSymbols);
                           addLog('CONFIG', `Selected all ${allSymbols.length} available pairs for bot.`);
                       }} disabled={loadingPairs || availablePairs.length === 0}>
                           Tümünü Seç
                       </Button>
                       <Button size="sm" variant="outline" onClick={() => {
                           setSelectedPairsForBot([]);
                           addLog('CONFIG', 'Cleared all selected bot pairs.');
                       }} disabled={selectedPairsForBot.length === 0}>
                           Seçimi Temizle
                       </Button>
                   </div>
               </CardContent>
             </Card>

            {/* Risk Management */}
            <Card id="risk-management" className="lg:col-span-3">
               <CardHeader>
                  <CardTitle className="flex items-center">
                     <Activity className="mr-2 text-primary" /> Risk Yönetimi (Zarar Durdur / Kar Al - Yakında)
                  </CardTitle>
                    <p className="text-sm text-muted-foreground pt-1">
                       Bu özellik yakında eklenecektir. Her bir işlem için otomatik Zarar Durdur (Stop-Loss) ve Kar Al (Take-Profit) seviyeleri belirlemenizi sağlayacaktır.
                   </p>
               </CardHeader>
               <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stop-loss" className="text-muted-foreground">Zarar Durdur (%)</Label>
                    <Input id="stop-loss" type="number" placeholder="Örn: 2" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} disabled/>
                    <p className="text-xs text-muted-foreground mt-1">Pozisyon açılış fiyatının yüzdesi.</p>
                  </div>
                  <div>
                     <Label htmlFor="take-profit" className="text-muted-foreground">Kar Al (%)</Label>
                     <Input id="take-profit" type="number" placeholder="Örn: 5" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} disabled/>
                     <p className="text-xs text-muted-foreground mt-1">Pozisyon açılış fiyatının yüzdesi.</p>
                  </div>
                   <div className="md:col-span-2">
                       <Button size="sm" disabled>Risk Ayarlarını Kaydet (Yakında)</Button> {/* TODO: Implement save logic */}
                   </div>
               </CardContent>
            </Card>

            {/* Backtesting */}
            <Card id="strategy-backtest" className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FlaskConical className="mr-2 text-primary" /> Geriye Dönük Strateji Testi
                </CardTitle>
                 <p className="text-sm text-muted-foreground pt-1">
                     Seçtiğiniz stratejiyi geçmiş veriler üzerinde test ederek potansiyel performansını değerlendirin. Bu testler, stratejinin geçmişte nasıl çalışmış olabileceğine dair bir fikir verir ancak gelecekteki sonuçları garanti etmez. Testler AI tarafından simüle edilir ve Binance'ten alınan geçmiş mum verilerini kullanır.
                 </p>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                     <div>
                         <Label htmlFor="backtest-strategy">Test Edilecek Strateji</Label>
                         <Select value={selectedBacktestStrategyId} onValueChange={(value) => handleBacktestSelectChange(value, 'strategyId')}>
                            <SelectTrigger id="backtest-strategy">
                                <SelectValue placeholder="Strateji Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableStrategies.map(strategy => (
                                    <SelectItem key={strategy.id} value={strategy.id}>{strategy.name}</SelectItem>
                                ))}
                            </SelectContent>
                         </Select>
                     </div>
                     <div>
                          <Label htmlFor="backtest-pair">Parite</Label>
                         <Select value={backtestParams.pair} onValueChange={(value) => handleBacktestSelectChange(value, 'pair')} disabled={loadingPairs || availablePairs.length === 0}>
                            <SelectTrigger id="backtest-pair">
                                <SelectValue placeholder={loadingPairs ? "Yükleniyor..." : (availablePairs.length === 0 ? "Parite Yok" : "Parite Seçin")} />
                            </SelectTrigger>
                           <SelectContent>
                              <ScrollArea className="h-[300px]">
                                  {loadingPairs ? (
                                       <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                                   ) : availablePairs.length > 0 ? (
                                       availablePairs.map((pair) => (
                                           <SelectItem key={pair.symbol} value={pair.symbol}>
                                               {pair.symbol}
                                           </SelectItem>
                                       ))
                                   ) : (
                                        <SelectItem value="no-pairs" disabled>Parite bulunamadı.</SelectItem>
                                   )}
                              </ScrollArea>
                           </SelectContent>
                          </Select>
                      </div>
                       <div>
                          <Label htmlFor="backtest-interval">Zaman Aralığı</Label>
                          <Select value={backtestParams.interval} onValueChange={(value) => handleBacktestSelectChange(value, 'interval')}>
                            <SelectTrigger id="backtest-interval">
                               <SelectValue placeholder="Aralık Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                               {/* <SelectItem value="1m">1m</SelectItem>  Removed 1m as it might cause too many data points */}
                               <SelectItem value="5m">5m</SelectItem>
                               <SelectItem value="15m">15m</SelectItem>
                               <SelectItem value="1h">1h</SelectItem>
                               <SelectItem value="4h">4h</SelectItem>
                               <SelectItem value="1d">1d</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                      <div>
                         <Label htmlFor="backtest-start-date">Başlangıç Tarihi</Label>
                         <Input id="backtest-start-date" type="date" value={backtestParams.startDate} onChange={(e) => handleBacktestParamChange(e, 'startDate')} />
                      </div>
                      <div>
                         <Label htmlFor="backtest-end-date">Bitiş Tarihi</Label>
                         <Input id="backtest-end-date" type="date" value={backtestParams.endDate} onChange={(e) => handleBacktestParamChange(e, 'endDate')} />
                      </div>
                      <div>
                          <Label htmlFor="initial-balance">Başlangıç Bakiyesi (USDT)</Label>
                           <Input
                               id="initial-balance"
                               type="number"
                               placeholder="1000"
                               value={backtestParams.initialBalance}
                               onChange={(e) => handleBacktestParamChange(e, 'initialBalance')}
                               min="1" // Ensure positive balance
                           />
                      </div>
                 </div>
                 <Button onClick={runBacktestHandler} disabled={isBacktesting || !selectedBacktestStrategyId || !backtestParams.pair || !backtestParams.startDate || !backtestParams.endDate || backtestParams.initialBalance <= 0}>
                    {isBacktesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4"/>}
                    {isBacktesting ? 'Test Çalışıyor...' : 'Testi Başlat'}
                </Button>

                {/* Backtest Results Area */}
                <div className="mt-4 border p-4 rounded-md bg-muted/50 min-h-[100px]">
                    <h4 className="font-semibold mb-2">Test Sonuçları</h4>
                    {isBacktesting && (
                         <div className="flex items-center justify-center h-full text-muted-foreground">
                             <Loader2 className="h-6 w-6 animate-spin mr-2" /> Test ediliyor, bu işlem biraz zaman alabilir...
                         </div>
                    )}
                    {!isBacktesting && backtestResult && !backtestResult.errorMessage && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                             <div><span className="font-medium">Strateji:</span> {availableStrategies.find(s => s.id === selectedBacktestStrategyId)?.name}</div>
                             <div><span className="font-medium">Parite:</span> {backtestParams.pair}</div>
                             <div><span className="font-medium">Aralık:</span> {backtestParams.interval}</div>
                            <div><span className="font-medium">Toplam İşlem:</span> {backtestResult.totalTrades}</div>
                            <div><span className="font-medium">Kazanan İşlem:</span> {backtestResult.winningTrades}</div>
                            <div><span className="font-medium">Kaybeden İşlem:</span> {backtestResult.losingTrades}</div>
                             <div><span className="font-medium">Kazanma Oranı:</span> {formatNumberClientSide(backtestResult.winRate)}%</div>
                             <div><span className="font-medium">Maks. Kayıp Oranı:</span> {formatNumberClientSide(backtestResult.maxDrawdown)}%</div>
                             <div className={cn("font-semibold col-span-2 md:col-span-1", backtestResult.totalPnl >= 0 ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--destructive))]")}>
                                <span className="font-medium text-foreground">Net Kar/Zarar:</span> {formatNumberClientSide(backtestResult.totalPnl, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })} ({formatNumberClientSide(backtestResult.totalPnlPercent)}%)
                            </div>
                            {/* Add Sharpe Ratio if calculated */}
                            {/* <div><span className="font-medium">Sharpe Oranı:</span> {backtestResult.sharpeRatio ? formatNumberClientSide(backtestResult.sharpeRatio) : 'N/A'}</div> */}
                        </div>
                    )}
                    {!isBacktesting && backtestResult && backtestResult.errorMessage && (
                         <Alert variant="destructive" className="mt-2">
                             <AlertCircle className="h-4 w-4" />
                             <AlertTitle>Backtest Hatası</AlertTitle>
                             <AlertDescription>{backtestResult.errorMessage}</AlertDescription>
                         </Alert>
                    )}
                    {!isBacktesting && !backtestResult && (
                        <p className="text-sm text-muted-foreground italic">Test sonuçları burada gösterilecek...</p>
                    )}
                 </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
