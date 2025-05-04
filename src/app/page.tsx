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
import { Balance, Candle, SymbolInfo, getAccountBalances, getCandlestickData, getExchangeInfo, placeOrder, validateApiKey as validateBinanceApiKeys } from '@/services/binance';
import { sendMessage, validateBotToken, validateChatId } from '@/services/telegram'; // Import validation functions
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFormattedNumber, formatNumberClientSide, formatTimestamp } from '@/lib/formatting';
import { BacktestParams, BacktestResult, DefineStrategyParams, DefineStrategyResult, RunParams, RunResult, Strategy, backtestStrategy, runStrategy, defineNewStrategy } from '@/ai/flows/trading-strategy-flow'; // Import all exported members


// Initial empty data for charts before loading
const initialCandleData: Candle[] = [];

// Initial placeholder data (will be replaced by API calls)
const initialPortfolioData: Balance[] = [
  { asset: '...', free: 0, locked: 0 },
];

const tradeHistoryData = [
  { id: 1, timestamp: '2023-10-26 10:00:00', pair: 'BTC/USDT', type: 'Alış', price: 34000, amount: 0.1, total: 3400, status: 'Tamamlandı' },
  { id: 2, timestamp: '2023-10-26 11:30:00', pair: 'ETH/USDT', type: 'Satış', price: 1800, amount: 2, total: 3600, status: 'Tamamlandı' },
  { id: 3, timestamp: '2023-10-27 09:15:00', pair: 'BTC/USDT', type: 'Alış', price: 34500, amount: 0.05, total: 1725, status: 'Beklemede' },
];

const logData = [
  { timestamp: '2023-10-27 14:00:00', type: 'INFO', message: 'Bot başlatıldı.' },
  { timestamp: '2023-10-27 14:05:00', type: 'TRADE', message: 'BTC/USDT alış emri verildi: 0.1 BTC @ 34000 USDT' },
  { timestamp: '2023-10-27 14:05:10', type: 'TELEGRAM', message: 'İşlem bildirimi gönderildi: BTC/USDT Alış' },
  { timestamp: '2023-10-27 14:10:00', type: 'ERROR', message: 'Binance API bağlantı hatası: Zaman aşımı.' },
];

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


// ----- Backtesting Placeholder Logic -----
// BacktestParams and BacktestResult types are now imported from the flow file


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
    //strategyId: '', // Use strategyId here
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


  // --- Effects ---

  // Fetch available pairs on mount
  React.useEffect(() => {
    const fetchPairs = async () => {
      setLoadingPairs(true);
      setError(null);
      try {
        const info = await getExchangeInfo();
        const tradingPairs = info.symbols
          .filter(s => s.status === 'TRADING' && s.isSpotTradingAllowed)
          .sort((a, b) => a.symbol.localeCompare(b.symbol));
        allAvailablePairs = tradingPairs; // Keep the full list
        setAvailablePairs(tradingPairs);
        if (tradingPairs.length > 0 && !selectedPair) {
           setSelectedPair(tradingPairs[0].symbol); // Set default selected pair
           setBacktestParams(prev => ({ ...prev, pair: tradingPairs[0].symbol })); // Also default backtest pair
        }
      } catch (err) {
        console.error("Failed to fetch exchange info:", err);
        setError("Piyasa verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.");
        toast({ title: "Hata", description: "Binance pariteleri alınamadı.", variant: "destructive" });
      } finally {
        setLoadingPairs(false);
      }
    };
    fetchPairs();
  }, []); // Removed selectedPair from dependencies as it caused re-fetch on selection

  // Fetch candlestick data when selected pair or interval changes
  React.useEffect(() => {
    const fetchCandleData = async () => {
      if (!selectedPair) return;
      setLoadingCandles(true);
      setError(null);
      setCandleData([]); // Clear previous data immediately
      try {
        const data = await getCandlestickData(selectedPair, selectedInterval, 100); // Fetch 100 candles
        setCandleData(data);
      } catch (err) {
        console.error(`Failed to fetch candlestick data for ${selectedPair}:`, err);
        setCandleData([]); // Ensure data is cleared on error
        toast({ title: "Grafik Hatası", description: `${selectedPair} için grafik verisi yüklenemedi.`, variant: "destructive" });
      } finally {
        setLoadingCandles(false);
      }
    };
    fetchCandleData();
  }, [selectedPair, selectedInterval]);


  // Fetch portfolio data (Only if API keys are validated for the active environment)
  React.useEffect(() => {
    const fetchPortfolio = async () => {
        // Determine active environment based on future UI element or default (e.g., Spot)
        const activeEnv = 'spot'; // Example: Assuming Spot is the default/active
        if (!activeUser || validationStatus[activeEnv] !== 'valid') {
            // Don't fetch if not logged in or API keys not valid
            setPortfolioData(initialPortfolioData); // Show placeholder
            return;
        }

        // Proceed only if logged in AND spot keys are validated
        setLoadingPortfolio(true);
        try {
            // Use the validated keys for the active environment
            const balances = await getAccountBalances(apiKeys[activeEnv].key, apiKeys[activeEnv].secret);
             // Filter out zero balances for a cleaner view
             const filteredBalances = balances.filter(b => parseFloat(b.free.toString()) > 0 || parseFloat(b.locked.toString()) > 0);
             setPortfolioData(filteredBalances.length > 0 ? filteredBalances : []); // Set empty if all are zero, else set filtered
        } catch (err) {
            console.error("Failed to fetch portfolio:", err);
            toast({ title: "Portföy Hatası", description: "Hesap bakiyeleri yüklenemedi.", variant: "destructive" });
            setPortfolioData(initialPortfolioData); // Reset on error
        } finally {
            setLoadingPortfolio(false);
        }
    };
    // Check if activeUser exists before calling fetchPortfolio
     if (activeUser) {
        fetchPortfolio();
     } else {
       setPortfolioData(initialPortfolioData); // Reset portfolio if logged out
       setLoadingPortfolio(false);
     }
     // Re-fetch if active user changes OR if the validation status of the active environment changes to 'valid'
  }, [activeUser, validationStatus.spot, apiKeys.spot.key, apiKeys.spot.secret]); // Adjust dependencies based on how you manage active environment


  // --- Handlers ---

  const handleLogin = (username: string) => {
    setActiveUser(username);
    toast({ title: `${username} olarak giriş yapıldı.` });
  };

  const handleLogout = () => {
    setActiveUser(null);
     // Reset validation statuses on logout
    setValidationStatus({
        spot: 'not_checked',
        futures: 'not_checked',
        testnetSpot: 'not_checked',
        testnetFutures: 'not_checked',
        telegramToken: 'not_checked',
        telegramChatId: 'not_checked',
    });
     // Optionally clear API keys as well, though they might be persisted elsewhere
     // setApiKeys({ spot: { key: '', secret: '' }, ... });
    toast({ title: 'Çıkış yapıldı.' });
  };

  const toggleBotStatus = async () => {
     if (botStatus === 'stopped' && selectedPairsForBot.length === 0) {
        toast({ title: "Başlatma Hatası", description: "Lütfen botun çalışacağı en az bir parite seçin.", variant: "destructive" });
        return;
    }
    if (botStatus === 'stopped' && activeStrategies.length === 0) {
        toast({ title: "Başlatma Hatası", description: "Lütfen en az bir aktif strateji seçin.", variant: "destructive" });
        return;
    }
    // Basic check for API key validation (assuming Spot for now)
     if (botStatus === 'stopped' && validationStatus.spot !== 'valid') {
         toast({ title: "Başlatma Hatası", description: "Lütfen geçerli Spot API anahtarlarını kaydedin ve doğrulayın.", variant: "destructive" });
         return;
     }
    // Basic check for Telegram validation
     if (botStatus === 'stopped' && (validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId !== 'valid')) {
         toast({ title: "Başlatma Hatası", description: "Lütfen geçerli Telegram bot token ve chat ID'sini kaydedin ve doğrulayın.", variant: "destructive" });
         return;
     }


    const newStatus = botStatus === 'running' ? 'stopped' : 'running';
    setBotStatus(newStatus);
    const statusMessage = newStatus === 'running' ? 'başlatıldı' : 'durduruldu';
    const pairsMessage = newStatus === 'running' ? ` (${selectedPairsForBot.join(', ')})` : '';
    const strategiesMessage = newStatus === 'running' ? `Stratejiler: ${activeStrategies.map(id => availableStrategies.find(s=>s.id===id)?.name).join(', ')}` : '';
    toast({ title: `Bot ${statusMessage}${pairsMessage}.`, description: strategiesMessage });


    if (newStatus === 'running') {
        console.log("Starting bot for pairs:", selectedPairsForBot, "with strategies:", activeStrategies);
        logData.push({ timestamp: new Date().toISOString(), type: 'INFO', message: `Bot ${selectedPairsForBot.join(', ')} paritelerinde başlatıldı. Stratejiler: ${activeStrategies.map(id => availableStrategies.find(s=>s.id===id)?.name).join(', ')}` });


        // Placeholder: Iterate and attempt to start each strategy on each pair
        for (const pair of selectedPairsForBot) {
            for (const strategyId of activeStrategies) {
                const strategy = availableStrategies.find(s => s.id === strategyId);
                 if (strategy) {
                     try {
                         console.log(`Attempting to run strategy ${strategy.name} on ${pair}`);
                         // Call the AI flow to run the strategy
                         // Note: Real implementation needs robust background execution/monitoring
                         const runParams: RunParams = { strategy, pair, interval: selectedInterval /* Use the globally selected interval or strategy-specific one */};
                         const result: RunResult = await runStrategy(runParams); // Assuming runStrategy is async
                         logData.push({ timestamp: new Date().toISOString(), type: 'STRATEGY_START', message: `Strateji '${strategy.name}' ${pair} üzerinde başlatıldı: ${result.message || result.status}` });
                         // Consider sending Telegram notification per strategy/pair start
                         // await sendMessage(`📈 Strategy ${strategy.name} started on ${pair}. Status: ${result.status}`, apiKeys.telegram.token, apiKeys.telegram.chatId);
                    } catch (error) {
                         console.error(`Error starting strategy ${strategy.name} on ${pair}:`, error);
                         const message = error instanceof Error ? error.message : "Bilinmeyen hata";
                         toast({ title: "Bot Strateji Hatası", description: `${strategy.name} - ${pair}: Başlatılamadı: ${message}`, variant: "destructive" });
                         logData.push({ timestamp: new Date().toISOString(), type: 'ERROR', message: `Strateji '${strategy.name}' başlatma hatası (${pair}): ${message}` });
                         // Optionally stop the entire bot if one strategy fails to start? Or just log?
                         // setBotStatus('stopped');
                         // return; // Stop trying to start more strategies
                     }
                 } else {
                     logData.push({ timestamp: new Date().toISOString(), type: 'ERROR', message: `Strateji bulunamadı: ${strategyId} (Parite: ${pair})` });
                 }
             }
        }

         // Send a single summary Telegram notification after attempting all starts
         try {
             await sendMessage(`🤖 KriptoPilot bot ${selectedPairsForBot.join(', ')} paritelerinde ${activeStrategies.length} strateji ile aktif.`, apiKeys.telegram.token, apiKeys.telegram.chatId);
         } catch (error) {
              console.error("Error sending Telegram start message:", error);
             logData.push({ timestamp: new Date().toISOString(), type: 'TELEGRAM_ERROR', message: `Başlatma bildirimi gönderilemedi.` });
         }

    } else {
        console.log("Stopping bot...");
        // TODO: Implement actual bot stop logic (e.g., clear intervals, cancel jobs, potentially notify strategies)
         logData.push({ timestamp: new Date().toISOString(), type: 'INFO', message: `Bot durduruldu.` });
        // Send Telegram notification
         try {
             await sendMessage(`🛑 KriptoPilot bot durduruldu.`, apiKeys.telegram.token, apiKeys.telegram.chatId);
         } catch (error) {
             console.error("Error sending Telegram stop message:", error);
             // Don't necessarily revert bot status, just log the notification error
             logData.push({ timestamp: new Date().toISOString(), type: 'TELEGRAM_ERROR', message: `Durdurma bildirimi gönderilemedi.` });
         }
    }
  };

   const handleStrategyToggle = (strategyId: string) => {
    setActiveStrategies((prev) =>
      prev.includes(strategyId)
        ? prev.filter((id) => id !== strategyId)
        : [...prev, strategyId]
    );
  };

  const handleBotPairToggle = (pairSymbol: string) => {
      setSelectedPairsForBot((prev) =>
          prev.includes(pairSymbol)
              ? prev.filter((symbol) => symbol !== pairSymbol)
              : [...prev, pairSymbol]
      );
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
        } else if (field === 'token') {
            setValidationStatus(prev => ({ ...prev, telegramToken: 'not_checked' }));
        } else if (field === 'chatId') {
            // Only reset chat ID status if token is already valid, otherwise it needs token validation first anyway
             if (validationStatus.telegramToken === 'valid') {
                 setValidationStatus(prev => ({ ...prev, telegramChatId: 'not_checked' }));
             }
        }
    };

   const handleValidateApiKey = async (env: 'spot' | 'futures' | 'testnetSpot' | 'testnetFutures') => {
      setValidationStatus(prev => ({ ...prev, [env]: 'pending' }));
      // Determine if the environment is testnet
      const isTestnetEnv = env === 'testnetSpot' || env === 'testnetFutures';
      try {
          const isValid = await validateBinanceApiKeys(apiKeys[env].key, apiKeys[env].secret, isTestnetEnv);
          setValidationStatus(prev => ({ ...prev, [env]: isValid ? 'valid' : 'invalid' }));
          toast({
              title: isValid ? "API Anahtarı Doğrulandı" : "API Anahtarı Geçersiz",
              description: isValid ? `${env.toUpperCase()} API anahtarı başarıyla doğrulandı.` : `${env.toUpperCase()} API anahtarı geçersiz veya bağlantı sorunu.`,
              variant: isValid ? "default" : "destructive",
          });
      } catch (error) {
          console.error(`Error validating ${env} API keys:`, error);
          setValidationStatus(prev => ({ ...prev, [env]: 'invalid' }));
          toast({
              title: "Doğrulama Hatası",
              description: `${env.toUpperCase()} API anahtarları doğrulanırken bir hata oluştu.`,
              variant: "destructive",
          });
      }
  };

  const handleValidateTelegramToken = async () => {
      setValidationStatus(prev => ({ ...prev, telegramToken: 'pending' }));
      try {
          const isValid = await validateBotToken(apiKeys.telegram.token);
          setValidationStatus(prev => ({ ...prev, telegramToken: isValid ? 'valid' : 'invalid' }));
          toast({
              title: isValid ? "Telegram Token Doğrulandı" : "Telegram Token Geçersiz",
              description: isValid ? "Bot token geçerli." : "Bot token geçersiz veya Telegram API'ye ulaşılamadı.",
              variant: isValid ? "default" : "destructive",
          });
           // If token becomes invalid, also reset chat ID validation
           if (!isValid) {
              setValidationStatus(prev => ({ ...prev, telegramChatId: 'not_checked' }));
           }
      } catch (error) {
           console.error("Error validating Telegram token:", error);
          setValidationStatus(prev => ({ ...prev, telegramToken: 'invalid', telegramChatId: 'not_checked' }));
          toast({ title: "Doğrulama Hatası", description: "Telegram token doğrulanırken bir hata oluştu.", variant: "destructive" });
      }
  };

  const handleValidateTelegramChatId = async () => {
      if (validationStatus.telegramToken !== 'valid') {
          toast({ title: "Önce Token'ı Doğrulayın", description: "Chat ID'yi test etmek için önce geçerli bir bot token girip doğrulayın.", variant: "destructive" });
          return;
      }
      setValidationStatus(prev => ({ ...prev, telegramChatId: 'pending' }));
      try {
          const isValid = await validateChatId(apiKeys.telegram.token, apiKeys.telegram.chatId);
           // Send a test message if valid
           if (isValid) {
               await sendMessage("✅ KriptoPilot Telegram bağlantısı başarıyla doğrulandı!", apiKeys.telegram.token, apiKeys.telegram.chatId);
               setValidationStatus(prev => ({ ...prev, telegramChatId: 'valid' }));
                toast({
                  title: "Telegram Chat ID Doğrulandı",
                  description: `Chat ID geçerli. Test mesajı gönderildi: ${apiKeys.telegram.chatId}`,
                  variant: "default",
              });
           } else {
                setValidationStatus(prev => ({ ...prev, telegramChatId: 'invalid' }));
                 toast({
                    title: "Telegram Chat ID Geçersiz",
                    description: "Chat ID bulunamadı veya botun bu sohbete erişim izni yok.",
                    variant: "destructive",
                });
           }
      } catch (error) {
          console.error("Error validating/sending test message to Telegram chat ID:", error);
          setValidationStatus(prev => ({ ...prev, telegramChatId: 'invalid' }));
           // Check if the error message indicates "chat not found"
           const errorMessage = error instanceof Error ? error.message : "Bilinmeyen Telegram Hatası";
            if (errorMessage.toLowerCase().includes('chat not found')) {
                 toast({ title: "Doğrulama Hatası", description: `Chat ID (${apiKeys.telegram.chatId}) bulunamadı. Lütfen ID'yi kontrol edin ve botun sohbete eklendiğinden emin olun.`, variant: "destructive" });
             } else {
                  toast({ title: "Doğrulama Hatası", description: `Telegram Chat ID doğrulanırken/test mesajı gönderilirken hata: ${errorMessage}`, variant: "destructive" });
            }
      }
  };


   const handleDefineStrategyParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof DefineStrategyParams) => {
       setDefineStrategyParams(prev => ({ ...prev, [field]: e.target.value }));
   };

   const handleDefineNewStrategy = async () => {
       if (!defineStrategyParams.name.trim() || !defineStrategyParams.description.trim() || !defineStrategyParams.prompt.trim()) {
           toast({ title: "Hata", description: "Strateji adı, açıklaması ve istemi boş olamaz.", variant: "destructive" });
           return;
       }

       setIsDefiningStrategy(true);
       try {
           const result: DefineStrategyResult = await defineNewStrategy(defineStrategyParams);

           if (result.success && result.strategy) {
               // Add the newly defined strategy to the available list
               availableStrategies.push(result.strategy);
               toast({ title: "Strateji Tanımlandı", description: result.message || `"${result.strategy.name}" başarıyla tanımlandı.` });
                setIsDefineStrategyDialogOpen(false); // Close dialog on success
                // Reset form
               setDefineStrategyParams({ name: '', description: '', prompt: '' });
           } else {
               toast({ title: "Strateji Tanımlama Başarısız", description: result.message || "AI stratejiyi tanımlayamadı.", variant: "destructive" });
           }
       } catch (error) {
           console.error("Error defining new strategy:", error);
           const message = error instanceof Error ? error.message : "Bilinmeyen bir AI hatası oluştu.";
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

    // Find the selected strategy object using the selectedBacktestStrategyId
    const strategy = availableStrategies.find(s => s.id === selectedBacktestStrategyId);

    if (!strategy) {
         toast({ title: "Backtest Hatası", description: "Geçerli bir strateji seçilmedi.", variant: "destructive" });
         setIsBacktesting(false);
         return;
    }

     // Validate other backtest parameters
    if (!backtestParams.pair || !backtestParams.startDate || !backtestParams.endDate || backtestParams.initialBalance <= 0) {
         toast({ title: "Backtest Hatası", description: "Lütfen parite, tarih aralığı ve geçerli başlangıç bakiyesi girin.", variant: "destructive" });
         setBacktestResult({ errorMessage: "Eksik veya geçersiz parametreler.", totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0 });
         setIsBacktesting(false);
         return
    }
     if (new Date(backtestParams.startDate) >= new Date(backtestParams.endDate)) {
        toast({ title: "Backtest Hatası", description: "Başlangıç tarihi bitiş tarihinden önce olmalıdır.", variant: "destructive" });
        setBacktestResult({ errorMessage: "Geçersiz tarih aralığı.", totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0 });
         setIsBacktesting(false);
        return;
    }

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
      // Call the Genkit flow for backtesting with the full parameters
      const result: BacktestResult = await backtestStrategy(fullBacktestParams);

      setBacktestResult(result); // Set the result from the flow

      if (result.errorMessage) {
          toast({ title: "Backtest Sonucu", description: result.errorMessage, variant: "destructive" });
      } else {
          toast({ title: "Backtest Tamamlandı", description: `${strategy.name} stratejisi ${backtestParams.pair} üzerinde başarıyla test edildi.` });
      }
    } catch (error) {
      console.error("Backtest flow error:", error);
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir AI veya API hatası oluştu.";
      setBacktestResult({ errorMessage, totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0 });
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

   const TradeHistoryRow = ({ trade }: { trade: typeof tradeHistoryData[0] }) => {
       // Use the hook for client-side formatting
        const formattedPrice = useFormattedNumber(trade.price);
        const formattedAmount = useFormattedNumber(trade.amount, { maximumFractionDigits: 8 });
        const formattedTotal = useFormattedNumber(trade.total);

       return (
           <TableRow key={trade.id}>
               <TableCell className="text-xs whitespace-nowrap">{formatTimestamp(trade.timestamp)}</TableCell>
               <TableCell>{trade.pair.replace('/', '')}</TableCell>
               <TableCell className={trade.type === 'Alış' ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--destructive))]'}>{trade.type}</TableCell>
               <TableCell className="text-right tabular-nums">{formattedPrice}</TableCell>
               <TableCell className="text-right tabular-nums">{formattedAmount}</TableCell>
               <TableCell className="text-right tabular-nums">{formattedTotal}</TableCell>
                <TableCell className="text-right">{trade.status}</TableCell> {/* Keep status as text */}
           </TableRow>
       );
   };

   const ChartTooltipContent = ({ active, payload, label }: any) => {
        if (active && payload && payload.length && payload[0].payload) { // Check payload[0].payload exists
           const formattedValue = formatNumberClientSide(payload[0].value, { maximumFractionDigits: 4 });
           const timeLabel = formatTimestamp(payload[0].payload.openTime); // Use the direct function here
           return (
             <div className="custom-tooltip p-2 bg-card border border-border rounded shadow-lg text-card-foreground text-xs">
               <p className="label font-bold">{`${timeLabel}`}</p>
                <p className="intro">{`${payload[0].name}: ${formattedValue}`}</p>
                {/* Optionally add Open, High, Low, Close */}
                <p className="text-muted-foreground">O: {formatNumberClientSide(payload[0].payload.open)} H: {formatNumberClientSide(payload[0].payload.high)}</p>
                 <p className="text-muted-foreground">L: {formatNumberClientSide(payload[0].payload.low)} C: {formatNumberClientSide(payload[0].payload.close)}</p>
                 <p className="text-muted-foreground">Vol: {formatNumberClientSide(payload[0].payload.volume)}</p>
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
                <Button
                    variant={botStatus === 'running' ? 'destructive' : 'default'}
                    size="sm"
                    onClick={toggleBotStatus}
                    className="group-data-[collapsible=icon]:w-full"
                     disabled={!activeUser || botStatus === 'running' ? false : (validationStatus.spot !== 'valid' || validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId !== 'valid' || activeStrategies.length === 0 || selectedPairsForBot.length === 0)}
                    title={
                         !activeUser ? "Botu kullanmak için giriş yapın." :
                         botStatus === 'stopped' && validationStatus.spot !== 'valid' ? "Botu başlatmak için Spot API anahtarlarını doğrulayın" :
                         botStatus === 'stopped' && (validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId !== 'valid') ? "Botu başlatmak için Telegram ayarlarını doğrulayın" :
                         botStatus === 'stopped' && activeStrategies.length === 0 ? "Botu başlatmak için en az bir strateji seçin" :
                          botStatus === 'stopped' && selectedPairsForBot.length === 0 ? "Botu başlatmak için en az bir parite seçin" :
                         ""
                    }
                    >
                    {botStatus === 'running' ? <Pause className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0"/> : <Play className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0"/>}
                    <span className="group-data-[collapsible=icon]:hidden">{botStatus === 'running' ? 'Durdur' : 'Başlat'}</span>
                </Button>
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
             <Select value={selectedPair} onValueChange={setSelectedPair} disabled={loadingPairs}>
               <SelectTrigger className="w-[180px]">
                 <SelectValue placeholder={loadingPairs ? "Pariteler yükleniyor..." : "Parite Seçin"} />
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
                        {selectedPair ? `${selectedPair} - ${selectedInterval} Grafik` : "Grafik (Parite Seçin)"}
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
                           tickFormatter={(value) => formatTimestamp(value)} // Use direct function
                           stroke="hsl(var(--muted-foreground))"
                           tick={{ fontSize: 10 }}
                           interval="preserveStartEnd" // Adjust interval as needed
                           minTickGap={50} // Adjust gap for readability
                         />
                        <YAxis
                           stroke="hsl(var(--muted-foreground))"
                           domain={['auto', 'auto']}
                           tick={{ fontSize: 10 }}
                            tickFormatter={(value) => formatNumberClientSide(value, { maximumFractionDigits: 4 })} // Use client-side formatter
                           />
                       <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1 }}/>
                       <Legend />
                       <Line type="monotone" dataKey="close" name="Kapanış" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                       {/* TODO: Add buy/sell markers based on tradeHistoryData or bot signals */}
                     </LineChart>
                   </ResponsiveContainer>
                ) : (
                   <div className="flex items-center justify-center h-full text-muted-foreground">
                      {selectedPair ? `${selectedPair} için veri bulunamadı.` : "Lütfen bir parite seçin."}
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
                               Portföy verilerini görmek için lütfen giriş yapın.
                           </AlertDescription>
                       </Alert>
                     )}
                     {activeUser && validationStatus.spot !== 'valid' && (
                        <Alert variant="default" className="mb-4 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700">
                           <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <AlertTitle className="text-yellow-800 dark:text-yellow-300">API Doğrulaması Bekleniyor</AlertTitle>
                           <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                               Portföy verilerini görmek için lütfen Spot API anahtarlarınızı <a href="#api-spot" className="underline">API Ayarları</a> bölümünden girip doğrulayın.
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
                                    <Loader2 className="inline-block h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : portfolioData.length > 0 && portfolioData[0].asset !== '...' && activeUser && validationStatus.spot === 'valid' ? (
                           portfolioData.map((balance) => (
                              <PortfolioRow key={balance.asset} balance={balance} />
                           ))
                       ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                    {!activeUser ? "Giriş yapınız." :
                                     validationStatus.spot !== 'valid' ? "API doğrulaması bekleniyor." :
                                      portfolioData.length === 0 ? "Portföy boş." : // Explicitly state if empty after fetch
                                     "Portföy verisi yok veya yüklenemedi."}
                                </TableCell>
                            </TableRow>
                       )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="history" className="p-4">
                     <h3 className="text-lg font-semibold mb-2">İşlem Geçmişi (Placeholder)</h3>
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
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Gerçekleşen işlem yok.</TableCell>
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
                     <h3 className="text-lg font-semibold mb-2">Log Kayıtları</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                             <TableHead className="w-[150px]">Zaman</TableHead>
                             <TableHead className="w-[80px]">Tip</TableHead>
                             <TableHead>Mesaj</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                           {logData.length === 0 ? (
                              <TableRow>
                                  <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">Log kaydı bulunamadı.</TableCell>
                              </TableRow>
                           ) : (
                              logData.slice().reverse().map((log, index) => ( // Show newest logs first
                                 <TableRow key={index}>
                                   <TableCell className="text-xs whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                                   <TableCell>
                                       <span className={cn("px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap",
                                            log.type === 'ERROR' ? 'bg-destructive/10 text-destructive dark:bg-destructive/30' :
                                            log.type === 'TRADE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                            log.type === 'TELEGRAM' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                            log.type === 'TELEGRAM_ERROR' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                            log.type === 'STRATEGY_START' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
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
                  <Settings className="mr-2 text-primary" /> API Anahtar Yönetimi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full" defaultValue="api-spot">
                    {/* Binance Spot API */}
                    <AccordionItem value="api-spot" id="api-spot">
                        <AccordionTrigger>Binance Spot API</AccordionTrigger>
                        <AccordionContent className="space-y-4 p-4">
                           <div className="flex items-end gap-2">
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
                                                  <span className="ml-2">Doğrula</span>
                                              </Button>
                                         </TooltipTrigger>
                                         <TooltipContent>
                                             <p>{ validationStatus.spot === 'valid' ? 'API anahtarı geçerli.' : validationStatus.spot === 'invalid' ? 'API anahtarı geçersiz veya doğrulanamadı.' : validationStatus.spot === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}</p>
                                         </TooltipContent>
                                     </Tooltip>
                                </TooltipProvider>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                     {/* Binance Futures API */}
                     <AccordionItem value="api-futures" id="api-futures">
                         <AccordionTrigger>Binance Futures API</AccordionTrigger>
                         <AccordionContent className="space-y-4 p-4">
                             <div className="flex items-end gap-2">
                                 <div className="flex-1 space-y-1">
                                     <Label htmlFor="futures-api-key">API Key</Label>
                                     <Input id="futures-api-key" placeholder="Futures API Key Girin" value={apiKeys.futures.key} onChange={(e) => handleApiKeyChange(e, 'futures', 'key')}/>
                                 </div>
                                 <div className="flex-1 space-y-1">
                                     <Label htmlFor="futures-secret-key">Secret Key</Label>
                                     <Input id="futures-secret-key" type="password" placeholder="Futures Secret Key Girin" value={apiKeys.futures.secret} onChange={(e) => handleApiKeyChange(e, 'futures', 'secret')} />
                                 </div>
                                 <TooltipProvider>
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                             <Button size="sm" onClick={() => handleValidateApiKey('futures')} disabled={!apiKeys.futures.key || !apiKeys.futures.secret || validationStatus.futures === 'pending'}>
                                                 <ValidationIcon status={validationStatus.futures} />
                                                 <span className="ml-2">Doğrula</span>
                                             </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                             <p>{ validationStatus.futures === 'valid' ? 'API anahtarı geçerli.' : validationStatus.futures === 'invalid' ? 'API anahtarı geçersiz veya doğrulanamadı.' : validationStatus.futures === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}</p>
                                         </TooltipContent>
                                      </Tooltip>
                                 </TooltipProvider>
                             </div>
                             <p className="text-xs text-muted-foreground">Not: Futures API anahtarları ayrı olarak oluşturulmalıdır.</p>
                         </AccordionContent>
                     </AccordionItem>

                      {/* Binance Testnet Spot API */}
                      <AccordionItem value="api-testnet-spot" id="api-testnet-spot">
                          <AccordionTrigger>Binance Testnet Spot API</AccordionTrigger>
                          <AccordionContent className="space-y-4 p-4">
                               <div className="flex items-end gap-2">
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
                                              <span className="ml-2">Doğrula</span>
                                          </Button>
                                        </TooltipTrigger>
                                         <TooltipContent>
                                             <p>{ validationStatus.testnetSpot === 'valid' ? 'API anahtarı geçerli.' : validationStatus.testnetSpot === 'invalid' ? 'API anahtarı geçersiz veya doğrulanamadı.' : validationStatus.testnetSpot === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}</p>
                                          </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                               </div>
                               <p className="text-xs text-muted-foreground">Binance Testnet (<a href="https://testnet.binance.vision/" target="_blank" rel="noopener noreferrer" className="underline">testnet.binance.vision</a>) üzerinden alınır.</p>
                          </AccordionContent>
                      </AccordionItem>

                      {/* Binance Testnet Futures API */}
                     <AccordionItem value="api-testnet-futures" id="api-testnet-futures">
                         <AccordionTrigger>Binance Testnet Futures API</AccordionTrigger>
                         <AccordionContent className="space-y-4 p-4">
                             <div className="flex items-end gap-2">
                                 <div className="flex-1 space-y-1">
                                     <Label htmlFor="testnet-futures-api-key">API Key</Label>
                                     <Input id="testnet-futures-api-key" placeholder="Testnet Futures API Key Girin" value={apiKeys.testnetFutures.key} onChange={(e) => handleApiKeyChange(e, 'testnetFutures', 'key')}/>
                                 </div>
                                 <div className="flex-1 space-y-1">
                                     <Label htmlFor="testnet-futures-secret-key">Secret Key</Label>
                                     <Input id="testnet-futures-secret-key" type="password" placeholder="Testnet Futures Secret Key Girin" value={apiKeys.testnetFutures.secret} onChange={(e) => handleApiKeyChange(e, 'testnetFutures', 'secret')}/>
                                 </div>
                                  <TooltipProvider>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                          <Button size="sm" onClick={() => handleValidateApiKey('testnetFutures')} disabled={!apiKeys.testnetFutures.key || !apiKeys.testnetFutures.secret || validationStatus.testnetFutures === 'pending'}>
                                               <ValidationIcon status={validationStatus.testnetFutures} />
                                               <span className="ml-2">Doğrula</span>
                                           </Button>
                                       </TooltipTrigger>
                                        <TooltipContent>
                                             <p>{ validationStatus.testnetFutures === 'valid' ? 'API anahtarı geçerli.' : validationStatus.testnetFutures === 'invalid' ? 'API anahtarı geçersiz veya doğrulanamadı.' : validationStatus.testnetFutures === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}</p>
                                         </TooltipContent>
                                     </Tooltip>
                                  </TooltipProvider>
                             </div>
                              <p className="text-xs text-muted-foreground">Binance Testnet Futures (<a href="https://testnet.binancefuture.com/" target="_blank" rel="noopener noreferrer" className="underline">testnet.binancefuture.com</a>) üzerinden alınır.</p>
                         </AccordionContent>
                     </AccordionItem>

                    {/* Telegram Bot Integration */}
                   <AccordionItem value="telegram" id="telegram">
                      <AccordionTrigger>Telegram Bot Entegrasyonu</AccordionTrigger>
                      <AccordionContent className="space-y-4 p-4">
                          <div className="flex items-end gap-2">
                              <div className="flex-1 space-y-1">
                                  <Label htmlFor="telegram-token">Bot Token</Label>
                                  <Input id="telegram-token" type="password" placeholder="Telegram Bot Token Girin" value={apiKeys.telegram.token} onChange={(e) => handleApiKeyChange(e, 'telegram', 'token')} />
                              </div>
                               <TooltipProvider>
                                   <Tooltip>
                                       <TooltipTrigger asChild>
                                            <Button size="sm" onClick={handleValidateTelegramToken} disabled={!apiKeys.telegram.token || validationStatus.telegramToken === 'pending'}>
                                                <ValidationIcon status={validationStatus.telegramToken} />
                                                <span className="ml-2">Token'ı Doğrula</span>
                                            </Button>
                                       </TooltipTrigger>
                                       <TooltipContent>
                                            <p>{ validationStatus.telegramToken === 'valid' ? 'Token geçerli.' : validationStatus.telegramToken === 'invalid' ? 'Token geçersiz veya doğrulanamadı.' : validationStatus.telegramToken === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}</p>
                                        </TooltipContent>
                                   </Tooltip>
                               </TooltipProvider>
                          </div>
                           <div className="flex items-end gap-2">
                               <div className="flex-1 space-y-1">
                                   <Label htmlFor="telegram-chat-id">Chat ID</Label>
                                   <Input id="telegram-chat-id" placeholder="Telegram Grup/Kullanıcı ID Girin" value={apiKeys.telegram.chatId} onChange={(e) => handleApiKeyChange(e, 'telegram', 'chatId')} />
                               </div>
                                <TooltipProvider>
                                    <Tooltip>
                                       <TooltipTrigger asChild>
                                           <Button size="sm" onClick={handleValidateTelegramChatId} disabled={!apiKeys.telegram.chatId || validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId === 'pending'}>
                                               <ValidationIcon status={validationStatus.telegramChatId} />
                                               <span className="ml-2">Test Mesajı Gönder</span>
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
                           <p className="text-xs text-muted-foreground">BotFather'dan token alın. Chat ID için <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="underline">@userinfobot</a> (kendi ID'niz) veya grup ID'si (-100... ile başlar) kullanın. Botun gruba ekli olması gerekir.</p>
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
                                      AI'nın sizin için bir ticaret stratejisi tanımlamasını sağlayın. İstem alanına net kurallar girin.
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
                                 <Button type="button" variant="secondary" onClick={() => setIsDefineStrategyDialogOpen(false)} disabled={isDefiningStrategy}>İptal</Button>
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
                 <h4 className="font-semibold mb-2">Aktif Stratejiler</h4>
                 <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                    {activeStrategies.length === 0 && <span className="text-muted-foreground text-sm italic">Aktif strateji yok.</span>}
                    {activeStrategies.map((stratId) => {
                        const strategy = availableStrategies.find(s => s.id === stratId);
                        return (
                             <Button key={stratId} variant="secondary" size="sm" onClick={() => handleStrategyToggle(stratId)}>
                                {strategy?.name ?? stratId} <CloseIcon className="ml-2 h-4 w-4" />
                             </Button>
                        )
                    })}
                 </div>
                <h4 className="font-semibold mb-2">Mevcut Stratejiler ({availableStrategies.length})</h4>
                 <ScrollArea className="h-[200px] border rounded-md p-2">
                    <div className="space-y-1">
                       {availableStrategies.map((strategy) => (
                        <div key={strategy.id} className="flex items-center justify-between p-1.5 hover:bg-accent rounded-md">
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
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <Info className="h-4 w-4 text-muted-foreground"/>
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
                      {selectedPairsForBot.length === 0 && <span className="text-muted-foreground text-sm italic">Bot için parite seçilmedi.</span>}
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
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
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
                           Parite bulunamadı veya yüklenemedi.
                      </div>
                  )}
                   <div className="mt-4 flex gap-2">
                       <Button size="sm" variant="outline" onClick={() => setSelectedPairsForBot(availablePairs.map(p => p.symbol))} disabled={loadingPairs || availablePairs.length === 0}>
                           Tümünü Seç
                       </Button>
                       <Button size="sm" variant="outline" onClick={() => setSelectedPairsForBot([])}>
                           Seçimi Temizle
                       </Button>
                   </div>
               </CardContent>
             </Card>

            {/* Risk Management */}
            <Card id="risk-management" className="lg:col-span-3">
               <CardHeader>
                  <CardTitle className="flex items-center">
                     <Activity className="mr-2 text-primary" /> Risk Yönetimi (Zarar Durdur / Kar Al)
                  </CardTitle>
               </CardHeader>
               <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stop-loss">Zarar Durdur (%)</Label>
                    <Input id="stop-loss" type="number" placeholder="Örn: 2" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)}/>
                    <p className="text-xs text-muted-foreground mt-1">Pozisyon açılış fiyatının yüzdesi.</p>
                  </div>
                  <div>
                     <Label htmlFor="take-profit">Kar Al (%)</Label>
                     <Input id="take-profit" type="number" placeholder="Örn: 5" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)}/>
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
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                         <Select value={backtestParams.pair} onValueChange={(value) => handleBacktestSelectChange(value, 'pair')} disabled={loadingPairs}>
                            <SelectTrigger id="backtest-pair">
                                <SelectValue placeholder={loadingPairs ? "Yükleniyor..." : "Parite Seçin"} />
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
                               <SelectItem value="1m">1m</SelectItem>
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
                             <Loader2 className="h-6 w-6 animate-spin mr-2" /> Test ediliyor...
                         </div>
                    )}
                    {!isBacktesting && backtestResult && !backtestResult.errorMessage && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                            <div><span className="font-medium">Toplam İşlem:</span> {backtestResult.totalTrades}</div>
                            <div><span className="font-medium">Kazanan İşlem:</span> {backtestResult.winningTrades}</div>
                            <div><span className="font-medium">Kaybeden İşlem:</span> {backtestResult.losingTrades}</div>
                            <div><span className="font-medium">Kazanma Oranı:</span> {formatNumberClientSide(backtestResult.winRate)}%</div>
                            <div><span className="font-medium">Maks. Kayıp:</span> {formatNumberClientSide(backtestResult.maxDrawdown)}%</div>
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
