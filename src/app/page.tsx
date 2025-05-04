// src/app/page.tsx
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  TableCaption,
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
  AreaChart, // Use AreaChart for smoother look
  Area,     // Use Area for filled line
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip, // Renamed to avoid conflict
  Legend,
  ResponsiveContainer,
  ComposedChart,
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
  CheckCircle2,
  TrendingUp // Icon for chart
} from 'lucide-react';
import type { Balance, Candle, SymbolInfo, OrderParams, OrderResponse } from '@/services/binance';
import { getCandlestickData, getExchangeInfo, placeOrder, validateApiKey as validateBinanceApiKeys, getAccountBalances as fetchBalancesFromBinanceService } from '@/services/binance'; // Direct service import for validation
import { sendMessage, validateBotToken, validateChatId } from '@/services/telegram';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFormattedNumber, formatNumberClientSide, formatTimestamp } from '@/lib/formatting';
// --- Corrected Import Path ---
import type { BacktestParams, BacktestResult, DefineStrategyParams, DefineStrategyResult, RunParams, RunResult, Strategy } from '@/ai/types/strategy-types';
import { backtestStrategy, runStrategy, defineNewStrategy } from '@/ai/actions/trading-strategy-actions'; // Use actions instead of flows directly
// --- End Corrected Import Path ---
import { fetchAccountBalancesAction } from '@/actions/binanceActions'; // Server Action for fetching balances

// Initial empty data for charts before loading
const initialCandleData: Candle[] = [];

// Placeholder: Replace with actual trade history fetching if implemented
const tradeHistoryData: any[] = []; // Keep as any for placeholder

// Placeholder: Log entries will be added dynamically
const logData: { timestamp: string; type: string; message: string }[] = [];

// Will be populated by API
let allAvailablePairs: SymbolInfo[] = [];

// --- Updated Initial Strategies ---
const availableStrategies: Strategy[] = [
    { id: 'rsi_simple', name: 'Basit RSI Al/Sat', description: 'RSI 30 altına indiğinde al, 70 üstüne çıktığında sat.', prompt: 'RSI(14) < 30 iken AL, RSI(14) > 70 iken SAT.' },
    { id: 'sma_crossover', name: 'SMA Kesişimi (50/200)', description: '50 periyotluk SMA, 200 periyotluk SMA\'yı yukarı kestiğinde al, aşağı kestiğinde sat.', prompt: 'SMA(50) > SMA(200) iken ve önceki mumda SMA(50) <= SMA(200) ise AL. SMA(50) < SMA(200) iken ve önceki mumda SMA(50) >= SMA(200) ise SAT.' },
    { id: 'bollinger_bands', name: 'Bollinger Bantları Dokunuş', description: 'Fiyat alt Bollinger bandına dokunduğunda al, üst banda dokunduğunda sat.', prompt: 'Fiyat <= Alt Bollinger Bandı(20, 2) ise AL. Fiyat >= Üst Bollinger Bandı(20, 2) ise SAT.' },
    { id: 'macd_signal_crossover', name: 'MACD Sinyal Kesişimi', description: 'MACD çizgisi sinyal çizgisini yukarı kestiğinde al, aşağı kestiğinde sat.', prompt: 'MACD(12, 26, 9) çizgisi > Sinyal çizgisi iken ve önceki mumda MACD çizgisi <= Sinyal çizgisi ise AL. MACD çizgisi < Sinyal çizgisi iken ve önceki mumda MACD çizgisi >= Sinyal çizgisi ise SAT.' },
    { id: 'volume_spike', name: 'Hacim Patlaması + Fiyat Artışı', description: 'Hacim ortalamanın üzerine çıktığında ve fiyat arttığında al.', prompt: 'Hacim > SMA(Hacim, 20) * 2 VE Kapanış Fiyatı > Açılış Fiyatı ise AL. (Satış koşulu eklenmeli)' },
    { id: 'ichimoku_cloud_breakout', name: 'Ichimoku Bulut Kırılımı', description: 'Fiyat Ichimoku bulutunu yukarı kırdığında al, aşağı kırdığında sat.', prompt: 'Fiyat > Ichimoku Bulutu (Senkou Span A ve B) iken AL. Fiyat < Ichimoku Bulutu iken SAT.' },
    // Add more diverse strategies
     { id: 'stochastic_oversold', name: 'Stokastik Aşırı Satım', description: 'Stokastik %K çizgisi 20 altına düştüğünde ve tekrar yukarı kestiğinde al.', prompt: '%K(14, 3, 3) < 20 iken ve önceki mumda %K >= 20 ise SAT sinyali yoksa AL. %K > 80 iken SAT.' },
     { id: 'fibonacci_support', name: 'Fibonacci Destek Alımı', description: 'Fiyat önemli bir Fibonacci geri çekilme seviyesine (örn. 0.618) düşüp tepki verdiğinde al.', prompt: 'Fiyat son yükselişin 0.618 Fibonacci seviyesine yakınsa ve bir önceki mum yeşil ise AL. (Satış koşulu eklenmeli)' },
     { id: 'ema_crossover_fast', name: 'Hızlı EMA Kesişimi (9/21)', description: '9 periyotluk EMA, 21 periyotluk EMA\'yı yukarı kestiğinde al, aşağı kestiğinde sat.', prompt: 'EMA(9) > EMA(21) iken ve önceki mumda EMA(9) <= EMA(21) ise AL. EMA(9) < EMA(21) iken ve önceki mumda EMA(9) >= EMA(21) ise SAT.' },
     { id: 'support_resistance_bounce', name: 'Destek/Direnç Sekmesi', description: 'Fiyat önemli bir destek seviyesinden sektiğinde al, dirençten döndüğünde sat.', prompt: 'Tanımlanmış Destek seviyesine yakın ve bir önceki mum yeşil ise AL. Tanımlanmış Direnç seviyesine yakın ve bir önceki mum kırmızı ise SAT.' }
];


// ----- API Validation Types -----
type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'not_checked';
type ApiEnvironment = 'spot' | 'futures' | 'testnetSpot' | 'testnetFutures'; // Added futures types


// ----- Main Dashboard Component -----
export default function Dashboard() {
  // --- State Definitions ---
  const [activeUser, setActiveUser] = React.useState<string | null>(null);
  const [selectedPair, setSelectedPair] = React.useState<string>('');
  const [selectedInterval, setSelectedInterval] = React.useState<string>('1h');
  const [botStatus, setBotStatus] = React.useState<'running' | 'stopped'>('stopped');
  const [activeStrategies, setActiveStrategies] = React.useState<string[]>([]);
  const [stopLoss, setStopLoss] = React.useState<string>(''); // Kept as string for input
  const [takeProfit, setTakeProfit] = React.useState<string>(''); // Kept as string for input
  const [availablePairs, setAvailablePairs] = React.useState<SymbolInfo[]>([]);
  const [candleData, setCandleData] = React.useState<Candle[]>(initialCandleData);
  const [portfolioData, setPortfolioData] = React.useState<Balance[]>([]); // Start empty
  const [loadingPairs, setLoadingPairs] = React.useState(true);
  const [loadingCandles, setLoadingCandles] = React.useState(false);
  const [loadingPortfolio, setLoadingPortfolio] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedPairsForBot, setSelectedPairsForBot] = React.useState<string[]>([]);
  const [dynamicLogData, setDynamicLogData] = React.useState<{ timestamp: string; type: string; message: string }[]>([]);

  // New Strategy Dialog State
  const [isDefineStrategyDialogOpen, setIsDefineStrategyDialogOpen] = React.useState(false);
  const [defineStrategyParams, setDefineStrategyParams] = React.useState<DefineStrategyParams>({ name: '', description: '', prompt: '' });
  const [isDefiningStrategy, setIsDefiningStrategy] = React.useState(false);
  const [definedStrategies, setDefinedStrategies] = React.useState<Strategy[]>(availableStrategies); // Holds both default and AI-defined

  // Backtesting State
  const [backtestParams, setBacktestParams] = React.useState<Omit<BacktestParams, 'strategy'>>({ pair: '', interval: '1h', startDate: '', endDate: '', initialBalance: 1000 });
  const [selectedBacktestStrategyId, setSelectedBacktestStrategyId] = React.useState<string>('');
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
      [key in ApiEnvironment | 'telegramToken' | 'telegramChatId']: ValidationStatus
  }>({
      spot: 'not_checked',
      futures: 'not_checked',
      testnetSpot: 'not_checked',
      testnetFutures: 'not_checked',
      telegramToken: 'not_checked',
      telegramChatId: 'not_checked',
  });

   // State to track the currently active (last validated) API environment for portfolio/trading
   const [activeApiEnvironment, setActiveApiEnvironment] = React.useState<ApiEnvironment | null>(null);


  // --- Helper Functions ---

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
        // Prioritize fetching from Testnet if its keys are likely to be used first for testing
        // Check both testnet spot and futures environments
        const useTestnet = !!apiKeys.testnetSpot.key || !!apiKeys.testnetSpot.secret ||
                           !!apiKeys.testnetFutures.key || !!apiKeys.testnetFutures.secret;
        const info = await getExchangeInfo(useTestnet);
        const tradingPairs = info.symbols
          .filter(s => s.status === 'TRADING' && s.isSpotTradingAllowed) // Filter active spot pairs
          .sort((a, b) => a.symbol.localeCompare(b.symbol));

        // Get top 100 USDT pairs (or fewer if less than 100 exist)
        const usdtPairs = tradingPairs.filter(p => p.quoteAsset === 'USDT');
        const popularPairs = usdtPairs.slice(0, 100); // Limit to top 100 USDT pairs initially

        allAvailablePairs = tradingPairs; // Store all for potential future use
        setAvailablePairs(popularPairs); // Display only popular USDT pairs initially

        if (popularPairs.length > 0 && !selectedPair) {
          const defaultPair = popularPairs.find(p => p.symbol === 'BTCUSDT') || popularPairs[0];
          setSelectedPair(defaultPair.symbol);
          setBacktestParams(prev => ({ ...prev, pair: defaultPair.symbol }));
          addLog('INFO', `Successfully fetched ${tradingPairs.length} total pairs. Displaying top ${popularPairs.length} USDT pairs. Default pair set to ${defaultPair.symbol}.`);
        } else if (popularPairs.length === 0) {
          addLog('WARN', 'No popular USDT trading pairs found or fetched from Binance.');
           // Fallback to showing all pairs if no USDT pairs found
           setAvailablePairs(tradingPairs);
           if (tradingPairs.length > 0 && !selectedPair) {
             const defaultPair = tradingPairs.find(p => p.symbol === 'BTCUSDT') || tradingPairs[0];
             setSelectedPair(defaultPair.symbol);
             setBacktestParams(prev => ({ ...prev, pair: defaultPair.symbol }));
             addLog('INFO', `No USDT pairs found. Displaying all ${tradingPairs.length} pairs. Default pair set to ${defaultPair.symbol}.`);
           }
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
  }, []); // Fetch only on mount


  // Fetch candlestick data when selected pair or interval changes
  React.useEffect(() => {
    const fetchCandleData = async () => {
      if (!selectedPair) return;
      setLoadingCandles(true);
      setError(null);
      setCandleData([]); // Clear previous data
      addLog('INFO', `Fetching candlestick data for ${selectedPair} (${selectedInterval})...`);
      try {
          // Use the active environment (if set) to determine testnet status
          const useTestnet = activeApiEnvironment === 'testnetSpot' || activeApiEnvironment === 'testnetFutures';
          const data = await getCandlestickData(selectedPair, selectedInterval, 200, useTestnet); // Fetch more candles (e.g., 200)
          setCandleData(data);
          if (data.length === 0) {
            addLog('WARN', `No candlestick data returned for ${selectedPair} (${selectedInterval}).`);
          } else {
            addLog('INFO', `Successfully fetched ${data.length} candles for ${selectedPair} (${selectedInterval}).`);
          }
      } catch (err) {
        console.error(`Failed to fetch candlestick data for ${selectedPair}:`, err);
        const errorMsg = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
        setCandleData([]); // Clear previous data on error
        addLog('ERROR', `Failed to fetch candlestick data for ${selectedPair}: ${errorMsg}`);
        toast({ title: "Grafik Hatası", description: `${selectedPair} için grafik verisi yüklenemedi: ${errorMsg}`, variant: "destructive" });
      } finally {
        setLoadingCandles(false);
      }
    };
    fetchCandleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPair, selectedInterval, activeApiEnvironment]); // Refetch if active environment changes


  // Fetch portfolio data when active API environment changes or user logs in
  React.useEffect(() => {
    const fetchPortfolio = async () => {
        if (!activeUser || !activeApiEnvironment) {
            setPortfolioData([]); // Clear portfolio if not logged in or no active environment
            return;
        }

        const keys = apiKeys[activeApiEnvironment];
        if (validationStatus[activeApiEnvironment] !== 'valid' || !keys.key || !keys.secret) {
             setPortfolioData([]); // Clear portfolio if keys not valid or missing
             addLog('WARN', `Portfolio fetch skipped: API keys for ${activeApiEnvironment} are not validated or missing.`);
             return;
        }

        setLoadingPortfolio(true);
        addLog('INFO', `Fetching portfolio data for active environment: ${activeApiEnvironment}...`);
        try {
            const isTestnetEnv = activeApiEnvironment === 'testnetSpot' || activeApiEnvironment === 'testnetFutures';
            // **SECURITY**: Use the Server Action for secure fetching
            // Pass minimal hints, not the full keys to the action if possible,
            // though the current action retrieves keys securely server-side.
            // Using a generic hint for this example.
             const apiKeyHint = keys.key.substring(0, 4);
             const secretKeyHint = '****';
            const result = await fetchAccountBalancesAction(apiKeyHint, secretKeyHint, isTestnetEnv);

            if (result.success && result.balances) {
                // Filter out zero balances for a cleaner view
                const filteredBalances = result.balances
                    .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0) // Use parseFloat for comparison
                     .sort((a, b) => {
                        // Sort primarily by whether it's a quote asset (USDT, BUSD etc.)
                        const isAQuote = ['USDT', 'BUSD', 'USDC', 'TRY', 'EUR'].includes(a.asset);
                        const isBQuote = ['USDT', 'BUSD', 'USDC', 'TRY', 'EUR'].includes(b.asset);
                        if (isAQuote && !isBQuote) return -1;
                        if (!isAQuote && isBQuote) return 1;
                        // Then sort by asset name
                        return a.asset.localeCompare(b.asset);
                    });
                setPortfolioData(filteredBalances);
                addLog('INFO', `Successfully fetched portfolio (${result.environmentUsed || activeApiEnvironment}). Found ${filteredBalances.length} assets with non-zero balance.`);
                if (filteredBalances.length === 0) {
                    addLog('INFO', 'Portfolio is empty or all balances are zero.');
                }
            } else {
                throw new Error(result.error || `Failed to fetch balances for ${activeApiEnvironment}.`);
            }
        } catch (err) {
            console.error("Failed to fetch portfolio:", err);
            const errorMsg = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
            addLog('ERROR', `Failed to fetch portfolio (${activeApiEnvironment}): ${errorMsg}`);
            toast({ title: "Portföy Hatası", description: `Hesap bakiyeleri yüklenemedi (${activeApiEnvironment}): ${errorMsg}`, variant: "destructive" });
            setPortfolioData([]); // Reset on error
        } finally {
            setLoadingPortfolio(false);
        }
    };

    fetchPortfolio();
     // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [activeUser, activeApiEnvironment, JSON.stringify(validationStatus)]); // Trigger on user, active env, or validation status changes


  // --- Handlers ---

  const handleLogin = (username: string) => {
    setActiveUser(username);
    addLog('INFO', `User '${username}' logged in.`);
    toast({ title: `${username} olarak giriş yapıldı.` });
     // Attempt to set active environment based on existing validated keys on login
     const preferredOrder: ApiEnvironment[] = ['spot', 'testnetSpot', 'futures', 'testnetFutures'];
     for (const env of preferredOrder) {
         if (validationStatus[env] === 'valid') {
             setActiveApiEnvironment(env);
             addLog('INFO', `Setting active API environment to ${env} based on previous validation.`);
             break; // Set the first valid one found
         }
     }
  };

  const handleLogout = () => {
    setActiveUser(null);
    setPortfolioData([]); // Clear portfolio
    setActiveApiEnvironment(null); // Clear active environment
    // Reset validation statuses
    setValidationStatus({
      spot: 'not_checked', futures: 'not_checked', testnetSpot: 'not_checked',
      testnetFutures: 'not_checked', telegramToken: 'not_checked', telegramChatId: 'not_checked'
    });
    addLog('INFO', 'User logged out.');
    toast({ title: 'Çıkış yapıldı.' });
  };


  const toggleBotStatus = async () => {
     const newStatus = botStatus === 'running' ? 'stopped' : 'running';

     if (newStatus === 'running') {
        // Pre-start checks
        if (!activeUser) {
            toast({ title: "Giriş Gerekli", description: "Botu başlatmak için lütfen giriş yapın.", variant: "destructive" });
            addLog('WARN', 'Bot start prevented: User not logged in.');
            return;
        }
         if (!activeApiEnvironment) {
            toast({ title: "API Ortamı Seçilmedi", description: "Lütfen önce geçerli bir API anahtarını (Spot veya Testnet) doğrulayarak aktif ortamı belirleyin.", variant: "destructive" });
            addLog('WARN', `Bot start prevented: No active API environment set.`);
            return;
         }
         if (validationStatus[activeApiEnvironment] !== 'valid') {
             toast({ title: "API Doğrulaması Gerekli", description: `Lütfen aktif ortam (${activeApiEnvironment}) için API anahtarlarını doğrulayın.`, variant: "destructive" });
              addLog('WARN', `Bot start prevented: Active API environment (${activeApiEnvironment}) not validated.`);
             return;
         }
        if (selectedPairsForBot.length === 0) {
            toast({ title: "Parite Seçilmedi", description: "Lütfen botun çalışacağı en az bir parite seçin.", variant: "destructive" });
            addLog('WARN', 'Bot start prevented: No pairs selected.');
            return;
        }
        if (activeStrategies.length === 0) {
            toast({ title: "Strateji Seçilmedi", description: "Lütfen en az bir aktif strateji seçin.", variant: "destructive" });
            addLog('WARN', 'Bot start prevented: No strategies selected.');
            return;
        }
        if (validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId !== 'valid') {
            toast({ title: "Telegram Doğrulaması Gerekli", description: "Lütfen geçerli Telegram bot token ve chat ID'sini doğrulayın.", variant: "destructive" });
            addLog('WARN', 'Bot start prevented: Telegram not validated.');
            return;
        }

        // If all checks pass, proceed to start
        setBotStatus('running');
        const strategies = activeStrategies.map(id => definedStrategies.find(s=>s.id===id)?.name).filter(Boolean);
        toast({ title: `Bot Başlatılıyor...`, description: `Pariteler: ${selectedPairsForBot.join(', ')}. Stratejiler: ${strategies.join(', ')}.` });
        addLog('INFO', `Bot starting... Env: ${activeApiEnvironment}, Pairs: ${selectedPairsForBot.join(', ') || 'None'}. Strategies: ${strategies.join(', ') || 'None'}.`);

        // --- Start Strategy Execution ---
        let strategyStartSuccessCount = 0;
        let strategyStartFailCount = 0;

        for (const pair of selectedPairsForBot) {
            for (const strategyId of activeStrategies) {
                const strategy = definedStrategies.find(s => s.id === strategyId);
                if (strategy) {
                    try {
                        console.log(`Attempting to run strategy ${strategy.name} on ${pair} in ${activeApiEnvironment}`);
                        addLog('INFO', `Attempting to start strategy '${strategy.name}' on ${pair} (${activeApiEnvironment})...`);

                        // Prepare parameters for the runStrategy action
                        // **SECURITY**: The action needs to handle keys securely based on activeApiEnvironment
                        const runParams: RunParams = {
                            strategy,
                            pair,
                            interval: selectedInterval, // Use global interval for now
                            // Pass environment info, NOT keys directly
                            environment: activeApiEnvironment,
                            isTestnet: activeApiEnvironment === 'testnetSpot' || activeApiEnvironment === 'testnetFutures',
                             // Add risk parameters if implemented
                             stopLossPercent: stopLoss ? parseFloat(stopLoss) : undefined,
                             takeProfitPercent: takeProfit ? parseFloat(takeProfit) : undefined,
                        };

                        // Call the server action (assuming runStrategy is one)
                        const result: RunResult = await runStrategy(runParams); // This should be a server action call

                        addLog('STRATEGY_START', `Strategy '${strategy.name}' on ${pair} (${activeApiEnvironment}) status: ${result.status}. ${result.message || ''}`);
                        strategyStartSuccessCount++;
                    } catch (error) {
                        strategyStartFailCount++;
                        console.error(`Error starting strategy ${strategy.name} on ${pair} (${activeApiEnvironment}):`, error);
                        const message = error instanceof Error ? error.message : "Bilinmeyen hata";
                        toast({ title: "Bot Strateji Hatası", description: `${strategy.name} - ${pair}: Başlatılamadı: ${message}`, variant: "destructive" });
                        addLog('ERROR', `Failed to start strategy '${strategy.name}' on ${pair} (${activeApiEnvironment}): ${message}`);
                        // Decide if bot should stop entirely on one failure
                        // setBotStatus('stopped');
                        // toast({ title: "Bot Durduruldu", description: "Bir strateji başlatılamadığı için bot durduruldu.", variant: "destructive" });
                        // addLog('ERROR', 'Bot stopped due to strategy start failure.');
                        // return; // Stop processing further strategies
                    }
                } else {
                    strategyStartFailCount++;
                    addLog('ERROR', `Strategy not found: ${strategyId} (Pair: ${pair})`);
                }
            }
        }

        addLog('INFO', `Strategy start attempt complete. Success: ${strategyStartSuccessCount}, Failed: ${strategyStartFailCount}.`);

        // Send summary Telegram notification
        try {
            const successMsg = strategyStartSuccessCount > 0 ? `${strategyStartSuccessCount} strateji başarıyla başlatıldı.` : '';
            const failMsg = strategyStartFailCount > 0 ? `${strategyStartFailCount} strateji başlatılamadı.` : '';
            await sendMessage(`✅ KriptoPilot bot (${activeApiEnvironment}) ${selectedPairsForBot.length} paritede aktif. ${successMsg} ${failMsg}`, apiKeys.telegram.token, apiKeys.telegram.chatId);
            addLog('TELEGRAM', 'Bot start notification sent.');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Bilinmeyen hata";
            console.error("Error sending Telegram start message:", error);
            addLog('TELEGRAM_ERROR', `Bot start notification failed: ${errorMsg}`);
        }

    } else { // Stopping the bot
        setBotStatus('stopped');
        toast({ title: 'Bot Durduruldu.' });
        addLog('INFO', `Bot stopping process initiated.`);
        console.log("Stopping bot...");
        // TODO: Implement actual bot stop logic (e.g., signal background processes/server actions)
        // await stopAllStrategiesAction(); // Example server action call

        // Send Telegram notification
        try {
            await sendMessage(`🛑 KriptoPilot bot durduruldu.`, apiKeys.telegram.token, apiKeys.telegram.chatId);
            addLog('TELEGRAM', 'Bot stop notification sent.');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Bilinmeyen hata";
            console.error("Error sending Telegram stop message:", error);
            addLog('TELEGRAM_ERROR', `Bot stop notification failed: ${errorMsg}`);
        }
    }
};

  const handleStrategyToggle = (strategyId: string) => {
    setActiveStrategies((prev) => {
      const isAdding = !prev.includes(strategyId);
      const strategyName = definedStrategies.find(s => s.id === strategyId)?.name || strategyId;
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
    env: ApiEnvironment | 'telegram',
    field: 'key' | 'secret' | 'token' | 'chatId'
  ) => {
    const value = e.target.value;
    setApiKeys(prev => ({
      ...prev,
      [env]: { ...prev[env], [field]: value },
    }));
    // Reset validation status for the specific env/field being changed
    if (env !== 'telegram') {
      setValidationStatus(prev => ({ ...prev, [env]: 'not_checked' }));
       // If keys are cleared, also potentially reset active environment if it was this one
        if (!value && activeApiEnvironment === env) {
             setActiveApiEnvironment(null);
             addLog('INFO', `Active API environment ${env} reset due to key removal.`);
         }
      addLog('CONFIG', `${env} API key/secret changed, validation status reset.`);
    } else if (field === 'token') {
      setValidationStatus(prev => ({ ...prev, telegramToken: 'not_checked', telegramChatId: 'not_checked' }));
      addLog('CONFIG', 'Telegram token changed, validation status reset.');
    } else if (field === 'chatId') {
      setValidationStatus(prev => ({ ...prev, telegramChatId: 'not_checked' }));
      addLog('CONFIG', 'Telegram chat ID changed, validation status reset.');
    }
  };

  const handleValidateApiKey = async (env: ApiEnvironment) => {
    setValidationStatus(prev => ({ ...prev, [env]: 'pending' }));
    addLog('INFO', `Validating ${env} API keys...`);
    const isTestnetEnv = env === 'testnetSpot' || env === 'testnetFutures';
    try {
      // **Use the direct service call ONLY for validation**
      // In a real app, prefer a dedicated validation server action if possible
      const isValid = await validateBinanceApiKeys(apiKeys[env].key, apiKeys[env].secret, isTestnetEnv);
      setValidationStatus(prev => ({ ...prev, [env]: isValid ? 'valid' : 'invalid' }));
      const message = isValid ? `${env.toUpperCase()} API anahtarı başarıyla doğrulandı.` : `${env.toUpperCase()} API anahtarı geçersiz veya doğrulanamadı.`;
      addLog(isValid ? 'INFO' : 'ERROR', `API Key Validation (${env}): ${message}`);
      toast({
        title: isValid ? "API Anahtarı Doğrulandı" : "API Anahtarı Geçersiz",
        description: message,
        variant: isValid ? "default" : "destructive",
      });
       // If valid, set as active environment (overwriting previous if any)
        if (isValid) {
            setActiveApiEnvironment(env);
            addLog('INFO', `Setting active API environment to: ${env}`);
        } else if (activeApiEnvironment === env) {
             // If validation fails for the *currently active* environment, unset it
             setActiveApiEnvironment(null);
             addLog('WARN', `Resetting active API environment because validation failed for ${env}.`);
         }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
      console.error(`Error validating ${env} API keys:`, error);
      setValidationStatus(prev => ({ ...prev, [env]: 'invalid' }));
        // If validation fails for the *currently active* environment, unset it
       if (activeApiEnvironment === env) {
           setActiveApiEnvironment(null);
           addLog('WARN', `Resetting active API environment because validation failed for ${env}.`);
       }
      addLog('ERROR', `API Key Validation Error (${env}): ${errorMsg}`);
      toast({
        title: "Doğrulama Hatası",
        description: `${env.toUpperCase()} API anahtarları doğrulanırken bir hata oluştu: ${errorMsg}`,
        variant: "destructive",
      });
    }
  };

  const handleValidateTelegramToken = async () => {
    setValidationStatus(prev => ({ ...prev, telegramToken: 'pending', telegramChatId: 'not_checked' }));
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
            setValidationStatus(prev => ({ ...prev, telegramChatId: 'not_checked'})); // Ensure chat ID is also not checked
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
         // This case is now less likely due to specific error throwing in validateChatId
        const message = "Chat ID geçersiz, bulunamadı veya botun bu sohbete erişim izni yok.";
        addLog('ERROR', `Telegram Chat ID Validation: ${message} (ID: ${apiKeys.telegram.chatId})`);
        toast({ title: "Telegram Chat ID Geçersiz", description: message, variant: "destructive" });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Bilinmeyen Telegram Hatası";
      console.error("Error validating/sending test message to Telegram chat ID:", error);
      setValidationStatus(prev => ({ ...prev, telegramChatId: 'invalid' }));
      addLog('ERROR', `Telegram Chat ID Validation Error: ${errorMsg} (ID: ${apiKeys.telegram.chatId})`);

      // Check for the specific "chat not found" error message thrown from validateChatId
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
        // Use the server action for defining strategy
      const result: DefineStrategyResult = await defineNewStrategy(defineStrategyParams);

      if (result.success && result.strategy) {
        // Add the newly defined strategy to the state
        setDefinedStrategies(prev => [...prev, result.strategy!]); // Add the new strategy
        toast({ title: "Strateji Tanımlandı", description: result.message || `"${result.strategy.name}" başarıyla tanımlandı.` });
        addLog('AI_TASK', `AI successfully defined strategy '${result.strategy.name}'. ID: ${result.strategy.id}`);
        setIsDefineStrategyDialogOpen(false); // Close dialog
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
      [field]: field === 'initialBalance' ? (value ? parseFloat(value) : 0) : value
    }));
  };

  const handleBacktestSelectChange = (value: string, field: 'pair' | 'interval' | 'strategyId') => {
    if (field === 'strategyId') {
      setSelectedBacktestStrategyId(value);
    } else {
      setBacktestParams(prev => ({ ...prev, [field]: value }));
    }
  };

  const runBacktestHandler = async () => {
    setIsBacktesting(true);
    setBacktestResult(null);
    addLog('BACKTEST', 'Backtest initiated...');

    // Find strategy from the combined list
    const strategy = definedStrategies.find(s => s.id === selectedBacktestStrategyId);

    if (!strategy) {
      toast({ title: "Backtest Hatası", description: "Geçerli bir strateji seçilmedi.", variant: "destructive" });
      addLog('BACKTEST_ERROR', 'Backtest failed: No strategy selected.');
      setIsBacktesting(false);
      return;
    }
    addLog('BACKTEST', `Selected Strategy: ${strategy.name}`);

    // Validate parameters
    const missingParams = [
        !backtestParams.pair && "Parite",
        !backtestParams.interval && "Zaman Aralığı",
        !backtestParams.startDate && "Başlangıç Tarihi",
        !backtestParams.endDate && "Bitiş Tarihi",
        backtestParams.initialBalance <= 0 && "Başlangıç Bakiyesi (>0)"
    ].filter(Boolean).join(', ');

    if (missingParams) {
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

    // Prepare params for the server action
    const fullBacktestParams: BacktestParams = {
      strategy: strategy,
      pair: backtestParams.pair,
      interval: backtestParams.interval,
      startDate: backtestParams.startDate,
      endDate: backtestParams.endDate,
      initialBalance: backtestParams.initialBalance,
       // Pass environment info based on active environment for fetching data if needed by backtest
        environment: activeApiEnvironment || 'spot', // Default to spot if none active
        isTestnet: activeApiEnvironment === 'testnetSpot' || activeApiEnvironment === 'testnetFutures',
    };

    try {
      addLog('BACKTEST', `Calling backtestStrategy action for ${strategy.name} on ${backtestParams.pair}...`);
      // Call the server action for backtesting
      const result: BacktestResult = await backtestStrategy(fullBacktestParams);

      setBacktestResult(result);

      if (result.errorMessage) {
        toast({ title: "Backtest Sonucu", description: result.errorMessage, variant: "destructive" });
        addLog('BACKTEST_ERROR', `Backtest completed with error: ${result.errorMessage}`);
      } else {
        toast({ title: "Backtest Tamamlandı", description: `${strategy.name} stratejisi ${backtestParams.pair} üzerinde başarıyla test edildi.` });
        addLog('BACKTEST', `Backtest completed successfully. PnL: ${result.totalPnlPercent?.toFixed(2)}%`);
      }
    } catch (error) {
      console.error("Backtest action error:", error);
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir AI veya API hatası oluştu.";
      setBacktestResult({ errorMessage, totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0 });
      addLog('BACKTEST_ERROR', `Backtest action execution failed: ${errorMessage}`);
      toast({ title: "Backtest Başarısız", description: errorMessage, variant: "destructive" });
    } finally {
      setIsBacktesting(false);
    }
  };


  // --- Sub-Components for Rendering ---

  const PortfolioRow = ({ balance }: { balance: Balance }) => {
    const formattedFree = useFormattedNumber(balance.free, { maximumFractionDigits: 8 });
    const formattedLocked = useFormattedNumber(balance.locked, { maximumFractionDigits: 8 });
    const total = parseFloat(balance.free) + parseFloat(balance.locked); // Calculate total as number
    const formattedTotal = useFormattedNumber(total, { maximumFractionDigits: 8 });

    return (
      <TableRow key={balance.asset}>
        <TableCell className="font-medium">{balance.asset}</TableCell>
        <TableCell className="text-right tabular-nums">{formattedFree}</TableCell>
        <TableCell className="text-right tabular-nums">{formattedLocked}</TableCell>
        <TableCell className="text-right tabular-nums font-semibold">{formattedTotal}</TableCell>
      </TableRow>
    );
  };

   const TradeHistoryRow = ({ trade }: { trade: any }) => {
        const formattedPrice = useFormattedNumber(trade.price, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 8 }); // Adjust currency based on pair
        const formattedAmount = useFormattedNumber(trade.qty, { maximumFractionDigits: 8 });
        const formattedTotal = useFormattedNumber(trade.quoteQty, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }); // Adjust currency

       return (
           <TableRow key={trade.id || trade.orderId}>
               <TableCell className="text-xs whitespace-nowrap">{formatTimestamp(trade.time)}</TableCell>
               <TableCell>{trade.symbol}</TableCell>
               <TableCell className={cn("font-medium", trade.side === 'BUY' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500')}>{trade.side}</TableCell>
               <TableCell className="text-right tabular-nums">{formattedPrice}</TableCell>
               <TableCell className="text-right tabular-nums">{formattedAmount}</TableCell>
               <TableCell className="text-right tabular-nums">{formattedTotal}</TableCell>
               <TableCell className="text-right text-xs capitalize">{trade.status || 'N/A'}</TableCell>
           </TableRow>
       );
   };

  // Enhanced Chart Tooltip
  const ChartTooltipContent = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const dataPoint = payload[0].payload; // Candle data is in payload
        const pricePayload = payload.find((p: any) => p.dataKey === 'close');
        const volumePayload = payload.find((p: any) => p.dataKey === 'volume');

        if (!dataPoint) return null;

         const timeLabel = formatTimestamp(label);
         const price = pricePayload ? formatNumberClientSide(pricePayload.value, { style: 'currency', currency: 'USD', maximumFractionDigits: Math.max(2, String(pricePayload.value).split('.')[1]?.length || 0) }) : 'N/A';
         const volume = volumePayload ? formatNumberClientSide(volumePayload.value, { maximumFractionDigits: 0 }) : 'N/A';
          const open = formatNumberClientSide(dataPoint.open, { style: 'currency', currency: 'USD', maximumFractionDigits: Math.max(2, String(dataPoint.open).split('.')[1]?.length || 0) });
          const high = formatNumberClientSide(dataPoint.high, { style: 'currency', currency: 'USD', maximumFractionDigits: Math.max(2, String(dataPoint.high).split('.')[1]?.length || 0) });
          const low = formatNumberClientSide(dataPoint.low, { style: 'currency', currency: 'USD', maximumFractionDigits: Math.max(2, String(dataPoint.low).split('.')[1]?.length || 0) });
          const close = formatNumberClientSide(dataPoint.close, { style: 'currency', currency: 'USD', maximumFractionDigits: Math.max(2, String(dataPoint.close).split('.')[1]?.length || 0) });

        return (
          <div className="custom-tooltip p-2 bg-card border border-border rounded shadow-lg text-card-foreground text-xs">
            <p className="label font-bold mb-1">{`${selectedPair} - ${timeLabel}`}</p>
            <p><span className="font-medium">Kapanış:</span> {price}</p>
            <p><span className="font-medium">Açılış:</span> {open}</p>
            <p><span className="font-medium">Yüksek:</span> {high}</p>
            <p><span className="font-medium">Düşük:</span> {low}</p>
             <p><span className="font-medium">Hacim:</span> {volume}</p>
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

   // Determine chart color based on price movement
  const chartColor = React.useMemo(() => {
      if (!candleData || candleData.length < 2) return "hsl(var(--primary))"; // Default if not enough data
      const firstClose = candleData[0].close;
      const lastClose = candleData[candleData.length - 1].close;
      return lastClose >= firstClose ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))'; // Green for up, Red for down
  }, [candleData]);


  // --- JSX Structure ---
  return (
    
      <SidebarProvider>
        <Sidebar side="left" collapsible="icon" variant="sidebar">
          {/* Sidebar Header: Logo, User Info/Login */}
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2 justify-center group-data-[collapsible=icon]:justify-start">
              <Bot className="text-primary h-6 w-6" />
              <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">KriptoPilot</span>
            </div>
            <SidebarSeparator />
            {activeUser ? (
              <div className="flex flex-col items-center group-data-[collapsible=icon]:items-start p-2 gap-2">
                <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">Hoşgeldin, {activeUser}!</span>
                 {activeApiEnvironment && (
                      <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-accent group-data-[collapsible=icon]:hidden">Aktif: {activeApiEnvironment.toUpperCase()}</span>
                  )}
                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full group-data-[collapsible=icon]:w-auto">
                  <LogOut className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0"/>
                  <span className="group-data-[collapsible=icon]:hidden">Çıkış Yap</span>
                </Button>
              </div>
            ) : (
              <div className="p-2 space-y-2 group-data-[collapsible=icon]:hidden">
                <Label htmlFor="username">Kullanıcı Adı</Label>
                <Input id="username" placeholder="Demo Kullanıcı" defaultValue="Demo Kullanıcı"/>
                <Button className="w-full" onClick={() => handleLogin((document.getElementById('username') as HTMLInputElement)?.value || 'Demo Kullanıcı')}>
                  <LogIn className="mr-2 h-4 w-4"/> Giriş Yap
                </Button>
                <p className="text-xs text-muted-foreground text-center">Demo girişi API erişimi sağlamaz.</p>
              </div>
            )}
          </SidebarHeader>
          <SidebarSeparator />

          {/* Sidebar Content: Navigation Menu */}
           <SidebarContent>
             <SidebarMenu>
               {/* API Settings */}
               <SidebarMenuItem>
                 <SidebarMenuButton tooltip="API Ayarları" isActive={false}>
                   <Settings /> API Ayarları
                 </SidebarMenuButton>
                 <SidebarMenuSub>
                   <SidebarMenuSubItem>
                     <SidebarMenuSubButton href="#api-spot">Spot</SidebarMenuSubButton>
                   </SidebarMenuSubItem>
                   {/* <SidebarMenuSubItem><SidebarMenuSubButton href="#api-futures">Futures</SidebarMenuSubButton></SidebarMenuSubItem> */}
                   <SidebarMenuSubItem>
                     <SidebarMenuSubButton href="#api-testnet-spot">Testnet Spot</SidebarMenuSubButton>
                   </SidebarMenuSubItem>
                   {/* <SidebarMenuSubItem><SidebarMenuSubButton href="#api-testnet-futures">Testnet Futures</SidebarMenuSubButton></SidebarMenuSubItem> */}
                   <SidebarMenuSubItem>
                     <SidebarMenuSubButton href="#telegram">Telegram</SidebarMenuSubButton>
                   </SidebarMenuSubItem>
                 </SidebarMenuSub>
               </SidebarMenuItem>

                {/* Portfolio */}
               <SidebarMenuItem>
                 <SidebarMenuButton href="#portfolio" tooltip="Portföy" isActive={false}>
                   <Wallet /> Portföy
                 </SidebarMenuButton>
               </SidebarMenuItem>

                {/* Strategies */}
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Stratejiler" isActive={false}>
                    <BarChart3 /> Stratejiler
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

                 {/* Bot Pairs */}
                 <SidebarMenuItem>
                    <SidebarMenuButton href="#bot-pairs" tooltip="Bot Pariteleri" isActive={false}>
                      <ArrowRightLeft /> Bot Pariteleri
                    </SidebarMenuButton>
                 </SidebarMenuItem>

                  {/* Trade History */}
                <SidebarMenuItem>
                  <SidebarMenuButton href="#trade-history" tooltip="İşlem Geçmişi" isActive={false}>
                    <History /> İşlem Geçmişi
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Logs */}
                <SidebarMenuItem>
                  <SidebarMenuButton href="#logs" tooltip="Log Kayıtları" isActive={false}>
                    <FileText /> Log Kayıtları
                  </SidebarMenuButton>
                </SidebarMenuItem>

             </SidebarMenu>
           </SidebarContent>
          <SidebarSeparator />

          {/* Sidebar Footer: Bot Control */}
          <SidebarFooter>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                 Bot: {botStatus === 'running' ? <span className="text-green-500">Çalışıyor</span> : <span className="text-red-500">Durdu</span>}
                 {botStatus === 'running' && activeApiEnvironment && <span className="text-xs text-muted-foreground ml-1">({activeApiEnvironment})</span>}
             </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className={cn(!activeUser || !activeApiEnvironment || validationStatus[activeApiEnvironment] !== 'valid' || validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId !== 'valid' || (botStatus === 'stopped' && (activeStrategies.length === 0 || selectedPairsForBot.length === 0)) ? "cursor-not-allowed" : "")}>
                      <Button
                        variant={botStatus === 'running' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={toggleBotStatus}
                        className="group-data-[collapsible=icon]:w-full"
                        disabled={
                          !activeUser ||
                          !activeApiEnvironment ||
                           validationStatus[activeApiEnvironment] !== 'valid' ||
                           validationStatus.telegramToken !== 'valid' ||
                           validationStatus.telegramChatId !== 'valid' ||
                           (botStatus === 'stopped' && (activeStrategies.length === 0 || selectedPairsForBot.length === 0))
                        }
                      >
                        {botStatus === 'running' ? <Pause className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0"/> : <Play className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0"/>}
                        <span className="group-data-[collapsible=icon]:hidden">{botStatus === 'running' ? 'Durdur' : 'Başlat'}</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end">
                     { !activeUser ? "Botu kullanmak için giriş yapın." :
                       !activeApiEnvironment ? "Botu başlatmak için geçerli bir API ortamı (Spot/Testnet) seçin/doğrulayın." :
                       validationStatus[activeApiEnvironment] !== 'valid' ? `Botu başlatmak için aktif ortam (${activeApiEnvironment}) API anahtarlarını doğrulayın.` :
                       (validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId !== 'valid') ? "Botu başlatmak için Telegram ayarlarını doğrulayın." :
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

       {/* Main Content Area */}
       <SidebarInset>
         {/* Header: Trigger, Title, Pair/Interval Selectors */}
         <header className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
           <div className="flex items-center gap-4">
             <SidebarTrigger />
             <h1 className="text-xl font-semibold hidden sm:block">KriptoPilot Kontrol Paneli</h1>
           </div>
           <div className="flex items-center gap-2 sm:gap-4">
             <Select value={selectedPair} onValueChange={setSelectedPair} disabled={loadingPairs || availablePairs.length === 0}>
               <SelectTrigger className="w-[130px] sm:w-[180px]">
                 <SelectValue placeholder={loadingPairs ? "Yükleniyor..." : (availablePairs.length === 0 ? "Parite Yok" : "Parite Seç")} />
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
               <SelectTrigger className="w-[80px] sm:w-[100px]">
                 <SelectValue placeholder="Aralık" />
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

         {/* Main Content Body */}
         <main className="flex-1 p-4 overflow-auto">
           {error && (
             <Alert variant="destructive" className="mb-4">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Hata</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
           )}

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

             {/* Main Chart Area - Updated Chart */}
             <Card className="lg:col-span-2 min-h-[500px]">
               <CardHeader>
                 <CardTitle className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <TrendingUp className="text-primary" /> {/* Changed Icon */}
                     {selectedPair ? `${selectedPair.replace('USDT', '/USDT')} - ${selectedInterval}` : "Grafik"}
                     {loadingCandles && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                   </div>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(candleData[candleData.length - 1]?.closeTime)}</span> {/* Display last candle time */}
                 </CardTitle>
                 <CardDescription>Fiyat hareketlerini ve hacmi gösterir.</CardDescription>
               </CardHeader>
               <CardContent className="h-[400px] pr-4"> {/* Keep padding-right */}
                 {loadingCandles ? (
                   <div className="flex items-center justify-center h-full text-muted-foreground">
                     <Loader2 className="h-8 w-8 animate-spin mr-2" /> Yükleniyor...
                   </div>
                 ) : candleData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={candleData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}> {/* Adjusted left margin */}
                       <defs>
                         <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor={chartColor} stopOpacity={0.6} /> {/* Use dynamic color */}
                           <stop offset="95%" stopColor={chartColor} stopOpacity={0.1} /> {/* Use dynamic color */}
                         </linearGradient>
                         <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="hsl(var(--chart-2) / 0.5)" />
                           <stop offset="95%" stopColor="hsl(var(--chart-2) / 0.1)" />
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                       <XAxis
                         dataKey="openTime"
                         tickFormatter={(value) => formatTimestamp(value)}
                         stroke="hsl(var(--muted-foreground))"
                         tick={{ fontSize: 10 }}
                         minTickGap={50} // Increased gap
                         axisLine={false}
                         tickLine={false}
                         padding={{ left: 10, right: 10 }} // Add padding
                       />
                       <YAxis
                         yAxisId="price" // Renamed for clarity
                         orientation="left"
                         stroke="hsl(var(--muted-foreground))"
                         domain={['auto', 'auto']}
                         tick={{ fontSize: 10 }}
                         tickFormatter={(value) => formatNumberClientSide(value, { notation: 'compact', maximumFractionDigits: 1 })}
                         axisLine={false}
                         tickLine={false}
                         width={55} // Ensure enough space
                       />
                       <YAxis
                         yAxisId="volume"
                         orientation="right"
                         stroke="hsl(var(--muted-foreground))"
                         tick={{ fontSize: 10 }}
                         tickFormatter={(value) => formatNumberClientSide(value, { notation: 'compact' })}
                         domain={[0, 'auto']}
                         axisLine={false}
                         tickLine={false}
                         width={55} // Ensure enough space
                       />
                        <ChartTooltip
                           content={<ChartTooltipContent />}
                           cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1, strokeDasharray: '3 3' }} // Dashed cursor
                        />
                       <Legend verticalAlign="top" height={36} />
                       <Area // Use Area instead of Line
                         yAxisId="price"
                         type="monotone"
                         dataKey="close"
                         name="Kapanış"
                         stroke={chartColor} // Dynamic stroke color
                         fill="url(#chartGradient)" // Fill with gradient
                         strokeWidth={2}
                         dot={false}
                         activeDot={{ r: 4, strokeWidth: 1, fill: 'hsl(var(--background))', stroke: chartColor }} // Style active dot
                       />
                       <Bar
                         dataKey="volume"
                         name="Hacim"
                         yAxisId="volume"
                         fill="url(#volumeGradient)"
                         barSize={8} // Slightly thinner bars
                         radius={[2, 2, 0, 0]}
                        />
                     </ComposedChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="flex items-center justify-center h-full text-muted-foreground">
                     {selectedPair ? `${selectedPair} için ${selectedInterval} aralığında veri bulunamadı.` : "Lütfen bir parite seçin."}
                   </div>
                 )}
               </CardContent>
             </Card>


              {/* Side Panel Tabs: Portfolio, History, Logs */}
             <Card className="lg:col-span-1 min-h-[500px]">
               <Tabs defaultValue="portfolio" className="h-full flex flex-col">
                 <TabsList className="grid w-full grid-cols-3">
                   <TabsTrigger value="portfolio"><Wallet className="inline-block mr-1 h-4 w-4"/>Portföy</TabsTrigger>
                   <TabsTrigger value="history"><History className="inline-block mr-1 h-4 w-4"/>Geçmiş</TabsTrigger>
                   <TabsTrigger value="logs"><FileText className="inline-block mr-1 h-4 w-4"/>Loglar</TabsTrigger>
                 </TabsList>
                 <ScrollArea className="flex-1">
                   {/* Portfolio Tab */}
                   <TabsContent value="portfolio" id="portfolio" className="p-4"> {/* Added ID */}
                     <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            Portföy {!loadingPortfolio && activeApiEnvironment && `(${activeApiEnvironment.toUpperCase()})`}
                            {loadingPortfolio && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          </div>
                          {/* Optional: Add total value calculation here */}
                      </h3>
                       {/* Conditional Alerts for Portfolio */}
                      {!activeUser && (
                        <Alert variant="default" className="mb-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
                          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <AlertTitle className="text-blue-800 dark:text-blue-300">Giriş Gerekli</AlertTitle>
                          <AlertDescription className="text-blue-700 dark:text-blue-400">
                            Portföy verilerini görmek için giriş yapın.
                          </AlertDescription>
                        </Alert>
                      )}
                      {activeUser && !activeApiEnvironment && (
                         <Alert variant="default" className="mb-4 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700">
                            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <AlertTitle className="text-yellow-800 dark:text-yellow-300">API Doğrulaması Gerekli</AlertTitle>
                            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                              Portföy verilerini görmek için lütfen <a href="#api-settings" className="underline">API Ayarları</a> bölümünden geçerli bir Spot veya Testnet API anahtarını doğrulayın.
                            </AlertDescription>
                         </Alert>
                     )}
                     {activeUser && activeApiEnvironment && validationStatus[activeApiEnvironment] !== 'valid' && (
                          <Alert variant="default" className="mb-4 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700">
                            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <AlertTitle className="text-yellow-800 dark:text-yellow-300">API Doğrulaması Bekleniyor</AlertTitle>
                            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                                Aktif ortam ({activeApiEnvironment}) için API anahtarları doğrulanmamış. Lütfen <a href="#api-settings" className="underline">API Ayarları</a> bölümünden doğrulayın.
                            </AlertDescription>
                        </Alert>
                     )}

                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Varlık</TableHead>
                           <TableHead className="text-right">Kullanılabilir</TableHead>
                           <TableHead className="text-right">Kilitli</TableHead>
                            <TableHead className="text-right">Toplam</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {loadingPortfolio ? (
                           <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="inline-block h-6 w-6 animate-spin text-muted-foreground" /> Yükleniyor...</TableCell></TableRow>
                         ) : portfolioData.length > 0 && activeUser && activeApiEnvironment && validationStatus[activeApiEnvironment] === 'valid' ? (
                           portfolioData.map((balance) => <PortfolioRow key={balance.asset} balance={balance} />)
                         ) : (
                           <TableRow>
                             <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                 {!activeUser ? "Giriş yapınız." :
                                  !activeApiEnvironment ? "Aktif API ortamı yok (API doğrulaması yapın)." :
                                  validationStatus[activeApiEnvironment] !== 'valid' ? `Aktif ortam (${activeApiEnvironment}) API doğrulaması geçersiz.` :
                                  portfolioData.length === 0 && !loadingPortfolio ? "Portföy boş veya yüklenemedi." :
                                  "Portföy verisi bekleniyor..."}
                             </TableCell>
                           </TableRow>
                         )}
                       </TableBody>
                          {/* Optional: Add TableFooter for Total Value */}
                          {/* <TableFooter><TableRow><TableCell colSpan={3} className="text-right font-bold">Toplam Değer (Tahmini):</TableCell><TableCell className="text-right font-bold">{totalPortfolioValue}</TableCell></TableRow></TableFooter> */}
                     </Table>
                   </TabsContent>

                      {/* Trade History Tab */}
                     <TabsContent value="history" id="trade-history" className="p-4">
                       <h3 className="text-lg font-semibold mb-2">İşlem Geçmişi (Yakında)</h3>
                       <p className="text-sm text-muted-foreground mb-4">Binance API üzerinden son işlemleriniz burada listelenecektir.</p>
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
                             <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Gerçekleşen işlem verisi yok.</TableCell></TableRow>
                           ) : (
                             tradeHistoryData.map((trade, index) => <TradeHistoryRow key={trade.id || index} trade={trade} />)
                           )}
                         </TableBody>
                       </Table>
                     </TabsContent>

                     {/* Logs Tab */}
                     <TabsContent value="logs" id="logs" className="p-4">
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
                             <TableRow><TableCell colSpan={3} className="text-center h-24 text-muted-foreground">Log kaydı bulunamadı.</TableCell></TableRow>
                           ) : (
                             dynamicLogData.map((log, index) => (
                               <TableRow key={index}>
                                 <TableCell className="text-xs whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                                 <TableCell>
                                   <span className={cn("px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap",
                                        log.type === 'ERROR' || log.type.includes('ERROR') ? 'bg-destructive/10 text-destructive dark:bg-destructive/30' :
                                        log.type === 'WARN' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                        log.type === 'TRADE' || log.type === 'STRATEGY_START' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                        log.type === 'TELEGRAM' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                        log.type.startsWith('AI_') ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' :
                                        log.type.startsWith('BACKTEST') ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' :
                                        log.type === 'CONFIG' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' :
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
                     <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                            <KeyRound className="mr-2 text-primary" /> API Anahtar Yönetimi
                        </div>
                         {activeApiEnvironment && (
                            <span className="text-sm font-medium px-2 py-1 rounded bg-accent text-accent-foreground">
                                Aktif Ortam: <span className="font-bold">{activeApiEnvironment.toUpperCase()}</span>
                            </span>
                         )}
                    </CardTitle>
                    <CardDescription>
                       Binance API anahtarlarınızı girin ve doğrulayın. Doğrulanan son anahtar seti aktif ortam olarak belirlenir ve portföy/işlem işlemleri için kullanılır. Testnet anahtarları canlı bakiyenizi etkilemez.
                    </CardDescription>
                 </CardHeader>
                 <CardContent>
                    <Accordion type="multiple" className="w-full"> {/* Allow multiple open */}
                      {/* Binance Spot API */}
                      <AccordionItem value="api-spot" id="api-spot">
                        <AccordionTrigger>
                           <div className="flex items-center gap-2">
                               Binance Spot API (Canlı)
                               {validationStatus.spot === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                               {activeApiEnvironment === 'spot' && <span className="text-xs font-bold text-primary">(Aktif)</span>}
                           </div>
                        </AccordionTrigger>
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
                                  <TooltipContent><p>{ validationStatus.spot === 'valid' ? 'Spot API geçerli.' : validationStatus.spot === 'invalid' ? 'Spot API geçersiz.' : validationStatus.spot === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Binance Testnet Spot API */}
                      <AccordionItem value="api-testnet-spot" id="api-testnet-spot">
                         <AccordionTrigger>
                            <div className="flex items-center gap-2">
                               Binance Testnet Spot API
                                {validationStatus.testnetSpot === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                {activeApiEnvironment === 'testnetSpot' && <span className="text-xs font-bold text-primary">(Aktif)</span>}
                           </div>
                         </AccordionTrigger>
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
                                      <span className="ml-2 hidden sm:inline">Doğrula (Testnet)</span>
                                      <span className="ml-2 sm:hidden">Doğrula</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>{ validationStatus.testnetSpot === 'valid' ? 'Testnet Spot API geçerli.' : validationStatus.testnetSpot === 'invalid' ? 'Testnet Spot API geçersiz.' : validationStatus.testnetSpot === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                          </div>
                          <p className="text-xs text-muted-foreground">Testnet üzerinde test yapmak için kullanılır. Canlı bakiyenizi etkilemez.</p>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Placeholder for Futures (if needed later) */}
                       <AccordionItem value="api-futures" id="api-futures" disabled>
                           <AccordionTrigger className="text-muted-foreground cursor-not-allowed">Binance Futures API (Canlı - Yapılandırılmadı)</AccordionTrigger>
                           <AccordionContent className="p-4">
                                <Alert variant="default" className="bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700">
                                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                  <AlertTitle className="text-orange-800 dark:text-orange-300">Geliştirme Aşamasında</AlertTitle>
                                  <AlertDescription className="text-orange-700 dark:text-orange-400">Futures işlemleri için destek aktif değildir.</AlertDescription>
                               </Alert>
                           </AccordionContent>
                       </AccordionItem>
                        <AccordionItem value="api-testnet-futures" id="api-testnet-futures" disabled>
                            <AccordionTrigger className="text-muted-foreground cursor-not-allowed">Binance Testnet Futures API (Yapılandırılmadı)</AccordionTrigger>
                            <AccordionContent className="p-4">
                                <Alert variant="default" className="bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700">
                                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                  <AlertTitle className="text-orange-800 dark:text-orange-300">Geliştirme Aşamasında</AlertTitle>
                                  <AlertDescription className="text-orange-700 dark:text-orange-400">Testnet Futures işlemleri için destek aktif değildir.</AlertDescription>
                               </Alert>
                            </AccordionContent>
                        </AccordionItem>

                      {/* Telegram Bot Integration */}
                      <AccordionItem value="telegram" id="telegram">
                        <AccordionTrigger>
                           <div className="flex items-center gap-2">
                              Telegram Bot Entegrasyonu
                              {validationStatus.telegramToken === 'valid' && validationStatus.telegramChatId === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          </div>
                         </AccordionTrigger>
                        <AccordionContent className="space-y-4 p-4">
                          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                            <div className="flex-1 space-y-1">
                              <Label htmlFor="telegram-token">Bot Token</Label>
                              <Input id="telegram-token" type="password" placeholder="Telegram Bot Token Girin" value={apiKeys.telegram.token} onChange={(e) => handleApiKeyChange(e, 'telegram', 'token')} />
                            </div>
                            <TooltipProvider><Tooltip>
                                <TooltipTrigger asChild><Button size="sm" onClick={handleValidateTelegramToken} disabled={!apiKeys.telegram.token || validationStatus.telegramToken === 'pending'}><ValidationIcon status={validationStatus.telegramToken} /><span className="ml-2 hidden sm:inline">Token Doğrula</span><span className="ml-2 sm:hidden">Doğrula</span></Button></TooltipTrigger>
                                <TooltipContent><p>{ validationStatus.telegramToken === 'valid' ? 'Token geçerli.' : validationStatus.telegramToken === 'invalid' ? 'Token geçersiz.' : validationStatus.telegramToken === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}</p></TooltipContent>
                             </Tooltip></TooltipProvider>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                            <div className="flex-1 space-y-1">
                              <Label htmlFor="telegram-chat-id">Chat ID</Label>
                              <Input id="telegram-chat-id" placeholder="Telegram Grup/Kullanıcı ID Girin" value={apiKeys.telegram.chatId} onChange={(e) => handleApiKeyChange(e, 'telegram', 'chatId')} />
                            </div>
                             <TooltipProvider><Tooltip>
                                <TooltipTrigger asChild><Button size="sm" onClick={handleValidateTelegramChatId} disabled={!apiKeys.telegram.chatId || validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId === 'pending'}><ValidationIcon status={validationStatus.telegramChatId} /><span className="ml-2 hidden sm:inline">Test Mesajı</span><span className="ml-2 sm:hidden">Test Et</span></Button></TooltipTrigger>
                                <TooltipContent><p>{validationStatus.telegramToken !== 'valid' ? 'Önce geçerli token girin.' : validationStatus.telegramChatId === 'valid' ? 'Chat ID geçerli.' : validationStatus.telegramChatId === 'invalid' ? 'Chat ID geçersiz/bulunamadı.' : validationStatus.telegramChatId === 'pending' ? 'Doğrulanıyor...' : 'Doğrulama ve test mesajı için tıklayın.'}</p></TooltipContent>
                              </Tooltip></TooltipProvider>
                          </div>
                          <p className="text-xs text-muted-foreground">BotFather'dan token alın. Chat ID için <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="underline">@userinfobot</a> veya grup ID'si (-100...) kullanın. Botun gruba ekli olması/başlatılmış olması gerekir.</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>

                {/* Strategy Management */}
                <Card id="strategy-management" className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center"><List className="mr-2 text-primary" /> Strateji Yönetimi</div>
                      <Dialog open={isDefineStrategyDialogOpen} onOpenChange={setIsDefineStrategyDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm"><PlusCircle className="mr-2 h-4 w-4"/> Yeni Strateji (AI)</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Yeni Ticaret Stratejisi Tanımla (AI)</DialogTitle>
                            <DialogDescription>
                              AI'nın sizin için bir ticaret stratejisi tanımlamasını sağlayın. Net kurallar girin. AI tarafından oluşturulan stratejiler deneyseldir ve dikkatli kullanılmalıdır.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-1">
                              <Label htmlFor="define-strategy-name">Strateji Adı</Label>
                              <Input id="define-strategy-name" value={defineStrategyParams.name} onChange={(e) => handleDefineStrategyParamChange(e, 'name')} placeholder="Örn: RSI + Hacim Teyidi"/>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="define-strategy-desc">Kısa Açıklama</Label>
                              <Input id="define-strategy-desc" value={defineStrategyParams.description} onChange={(e) => handleDefineStrategyParamChange(e, 'description')} placeholder="Stratejinin ana fikri."/>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="define-strategy-prompt">Detaylı Strateji İstemi (Prompt)</Label>
                              <Textarea id="define-strategy-prompt" value={defineStrategyParams.prompt} onChange={(e) => handleDefineStrategyParamChange(e, 'prompt')} className="min-h-[150px]" placeholder="AI için detaylı alım/satım kuralları, indikatörler ve parametreler... Örn: 'RSI(14) 35 altına düştüğünde VE Hacim son 10 mumun ortalamasının 1.5 katından fazlaysa AL. RSI(14) 70 üzerine çıktığında veya %3 Stop-Loss tetiklendiğinde SAT.'"/>
                              <p className="text-xs text-muted-foreground">AI'nın anlayabileceği net ve spesifik kurallar yazın.</p>
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary" disabled={isDefiningStrategy}>İptal</Button></DialogClose>
                            <Button type="button" onClick={handleDefineNewStrategy} disabled={isDefiningStrategy || !defineStrategyParams.name || !defineStrategyParams.description || !defineStrategyParams.prompt}>
                              {isDefiningStrategy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {isDefiningStrategy ? 'Tanımlanıyor...' : 'AI ile Strateji Tanımla'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                     <CardDescription>Çalıştırmak istediğiniz stratejileri seçin veya AI ile yenilerini oluşturun.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-2">Aktif Stratejiler ({activeStrategies.length})</h4>
                    <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                      {activeStrategies.length === 0 && <span className="text-muted-foreground text-sm italic">Aktif strateji yok.</span>}
                      {activeStrategies.map((stratId) => {
                        const strategy = definedStrategies.find(s => s.id === stratId);
                        return (
                          <TooltipProvider key={stratId}><Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="secondary" size="sm" onClick={() => handleStrategyToggle(stratId)}>
                                {strategy?.name ?? stratId} <CloseIcon className="ml-2 h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{strategy?.description}</p></TooltipContent>
                          </Tooltip></TooltipProvider>
                        )
                      })}
                    </div>
                    <h4 className="font-semibold mb-2">Mevcut Stratejiler ({definedStrategies.length})</h4>
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                      <div className="space-y-1">
                        {definedStrategies.map((strategy) => (
                          <div key={strategy.id} className="flex items-center justify-between p-1.5 hover:bg-accent rounded-md group">
                            <Label htmlFor={`strat-${strategy.id}`} className="flex items-center gap-2 cursor-pointer text-sm flex-1">
                              <Checkbox id={`strat-${strategy.id}`} checked={activeStrategies.includes(strategy.id)} onCheckedChange={() => handleStrategyToggle(strategy.id)} />
                              {strategy.name}
                              {strategy.id.startsWith('ai_') && <Bot className="h-3 w-3 text-blue-500" title="AI Tarafından Tanımlandı"/>}
                            </Label>
                            <TooltipProvider><Tooltip>
                              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 group-hover:opacity-100"><Info className="h-4 w-4"/></Button></TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <p className="font-medium">{strategy.name}</p>
                                <p className="text-xs text-muted-foreground">{strategy.description}</p>
                                {strategy.prompt && <p className="text-xs mt-1 pt-1 border-t border-border text-muted-foreground italic">AI İstem: {strategy.prompt.substring(0, 100)}...</p> }
                              </TooltipContent>
                            </Tooltip></TooltipProvider>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Bot Pair Selection */}
                <Card id="bot-pairs" className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center"><ArrowRightLeft className="mr-2 text-primary" /> Bot İçin Parite Seçimi</CardTitle>
                     <CardDescription>Botun işlem yapmasını istediğiniz pariteleri seçin (Popüler USDT pariteleri listelenmiştir).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-2">Seçili Pariteler ({selectedPairsForBot.length})</h4>
                    <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                      {selectedPairsForBot.length === 0 && <span className="text-muted-foreground text-sm italic">Bot için parite seçilmedi.</span>}
                      {selectedPairsForBot.map((pairSymbol) => (
                        <Button key={pairSymbol} variant="secondary" size="sm" onClick={() => handleBotPairToggle(pairSymbol)}>
                          {pairSymbol} <CloseIcon className="ml-2 h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                    <h4 className="font-semibold mb-2">Mevcut Pariteler ({availablePairs.length})</h4>
                    {loadingPairs ? (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Yükleniyor...</div>
                    ) : availablePairs.length > 0 ? (
                      <ScrollArea className="h-[200px] border rounded-md p-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
                          {availablePairs.map((pair) => (
                            <Label key={pair.symbol} htmlFor={`pair-${pair.symbol}`} className="flex items-center gap-1.5 cursor-pointer text-xs p-1.5 hover:bg-accent rounded-md">
                              <Checkbox id={`pair-${pair.symbol}`} checked={selectedPairsForBot.includes(pair.symbol)} onCheckedChange={() => handleBotPairToggle(pair.symbol)} />
                              {pair.symbol}
                            </Label>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground">Parite bulunamadı veya yüklenemedi.</div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { const allSymbols = availablePairs.map(p => p.symbol); setSelectedPairsForBot(allSymbols); addLog('CONFIG', `Selected all ${allSymbols.length} available pairs for bot.`); }} disabled={loadingPairs || availablePairs.length === 0}>Tümünü Seç</Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedPairsForBot([]); addLog('CONFIG', 'Cleared all selected bot pairs.'); }} disabled={selectedPairsForBot.length === 0}>Temizle</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Management */}
                <Card id="risk-management" className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center"><Activity className="mr-2 text-primary" /> Risk Yönetimi (Zarar Durdur / Kar Al)</CardTitle>
                    <CardDescription>
                       Her işlem için otomatik Zarar Durdur (Stop-Loss) ve Kar Al (Take-Profit) yüzdeleri belirleyin. Bu ayarlar, çalışan stratejilere uygulanacaktır. (Geliştirme aşamasında)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stop-loss">Zarar Durdur (%)</Label>
                       <Input id="stop-loss" type="number" placeholder="Örn: 2" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} min="0.1" step="0.1" disabled/> {/* Added min/step */}
                      <p className="text-xs text-muted-foreground mt-1">Pozisyon açılış fiyatının % kaç altında zararı durdur.</p>
                    </div>
                    <div>
                      <Label htmlFor="take-profit">Kar Al (%)</Label>
                       <Input id="take-profit" type="number" placeholder="Örn: 5" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} min="0.1" step="0.1" disabled/> {/* Added min/step */}
                      <p className="text-xs text-muted-foreground mt-1">Pozisyon açılış fiyatının % kaç üstünde kar al.</p>
                    </div>
                     <div className="md:col-span-2">
                        <Button size="sm" disabled>Risk Ayarlarını Kaydet (Yakında)</Button>
                     </div>
                  </CardContent>
                </Card>

                {/* Backtesting */}
                <Card id="strategy-backtest" className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center"><FlaskConical className="mr-2 text-primary" /> Geriye Dönük Strateji Testi</CardTitle>
                    <CardDescription>
                      Seçtiğiniz stratejiyi geçmiş veriler üzerinde test ederek potansiyel performansını değerlendirin. Sonuçlar geleceği garanti etmez. Testler AI tarafından simüle edilir.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                      <div>
                        <Label htmlFor="backtest-strategy">Test Edilecek Strateji</Label>
                        <Select value={selectedBacktestStrategyId} onValueChange={(value) => handleBacktestSelectChange(value, 'strategyId')}>
                          <SelectTrigger id="backtest-strategy"><SelectValue placeholder="Strateji Seçin" /></SelectTrigger>
                          <SelectContent>
                            {definedStrategies.map(strategy => (
                              <SelectItem key={strategy.id} value={strategy.id}>{strategy.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="backtest-pair">Parite</Label>
                         <Select value={backtestParams.pair} onValueChange={(value) => handleBacktestSelectChange(value, 'pair')} disabled={loadingPairs || allAvailablePairs.length === 0}> {/* Use allAvailablePairs here */}
                          <SelectTrigger id="backtest-pair"><SelectValue placeholder={loadingPairs ? "Yükleniyor..." : (allAvailablePairs.length === 0 ? "Parite Yok" : "Parite Seç")} /></SelectTrigger>
                          <SelectContent>
                             <ScrollArea className="h-[300px]">
                                {/* Search Input */}
                                 {/* <div className="p-2"><Input placeholder="Parite ara..." onChange={(e) => { /* Implement search filtering logic */ }}/></div> */}
                                 {loadingPairs ? (
                                   <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                                 ) : allAvailablePairs.length > 0 ? (
                                    allAvailablePairs.map((pair) => ( /* Use all pairs for backtest */
                                    <SelectItem key={pair.symbol} value={pair.symbol}>{pair.symbol}</SelectItem>
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
                          <SelectTrigger id="backtest-interval"><SelectValue placeholder="Aralık Seçin" /></SelectTrigger>
                          <SelectContent>
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
                        <Input id="initial-balance" type="number" placeholder="1000" value={backtestParams.initialBalance} onChange={(e) => handleBacktestParamChange(e, 'initialBalance')} min="1"/>
                      </div>
                    </div>
                    <Button onClick={runBacktestHandler} disabled={isBacktesting || !selectedBacktestStrategyId || !backtestParams.pair || !backtestParams.startDate || !backtestParams.endDate || backtestParams.initialBalance <= 0}>
                      {isBacktesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4"/>}
                      {isBacktesting ? 'Test Çalışıyor...' : 'Testi Başlat'}
                    </Button>

                    {/* Backtest Results */}
                    <div className="mt-4 border p-4 rounded-md bg-muted/50 min-h-[100px]">
                      <h4 className="font-semibold mb-2">Test Sonuçları</h4>
                      {isBacktesting && (
                        <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Test ediliyor...</div>
                      )}
                      {!isBacktesting && backtestResult && !backtestResult.errorMessage && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                          <div><span className="font-medium">Strateji:</span> {definedStrategies.find(s => s.id === selectedBacktestStrategyId)?.name}</div>
                          <div><span className="font-medium">Parite/Aralık:</span> {backtestParams.pair} / {backtestParams.interval}</div>
                          <div><span className="font-medium">Tarih Aralığı:</span> {backtestParams.startDate} - {backtestParams.endDate}</div>
                          <div><span className="font-medium">Toplam İşlem:</span> {backtestResult.totalTrades}</div>
                          <div><span className="font-medium">Kazanan/Kaybeden:</span> {backtestResult.winningTrades} / {backtestResult.losingTrades}</div>
                          <div><span className="font-medium">Kazanma Oranı:</span> {formatNumberClientSide(backtestResult.winRate)}%</div>
                          <div><span className="font-medium">Maks. Düşüş:</span> {formatNumberClientSide(backtestResult.maxDrawdown)}%</div>
                          <div className={cn("font-semibold col-span-2 md:col-span-1", backtestResult.totalPnl >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500")}>
                            <span className="font-medium text-foreground">Net Kar/Zarar:</span> {formatNumberClientSide(backtestResult.totalPnl, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })} ({formatNumberClientSide(backtestResult.totalPnlPercent)}%)
                          </div>
                        </div>
                      )}
                      {!isBacktesting && backtestResult && backtestResult.errorMessage && (
                        <Alert variant="destructive" className="mt-2"><AlertCircle className="h-4 w-4" /><AlertTitle>Backtest Hatası</AlertTitle><AlertDescription>{backtestResult.errorMessage}</AlertDescription></Alert>
                      )}
                      {!isBacktesting && !backtestResult && (
                        <p className="text-sm text-muted-foreground italic">Test sonuçları burada gösterilecek.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

           </div> {/* End main grid */}
         </main>
       </SidebarInset>
     </SidebarProvider>
    
   );
 }

