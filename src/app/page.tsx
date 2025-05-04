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
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
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
  TrendingUp
} from 'lucide-react';
import type { Balance, Candle, SymbolInfo, OrderParams, OrderResponse } from '@/services/binance';
import { getCandlestickData, getExchangeInfo, placeOrder, validateApiKey as validateBinanceApiKeys, getAccountBalances as fetchBalancesFromBinanceService } from '@/services/binance';
import { sendMessage, validateBotToken, validateChatId } from '@/services/telegram';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFormattedNumber, formatNumberClientSide, formatTimestamp } from '@/lib/formatting';
import type { BacktestParams, BacktestResult, DefineStrategyParams, DefineStrategyResult, RunParams, RunResult, Strategy } from '@/ai/types/strategy-types';
import { backtestStrategy, runStrategy, defineNewStrategy } from '@/ai/actions/trading-strategy-actions';
import { fetchAccountBalancesAction } from '@/actions/binanceActions'; // Server Action for fetching balances

// Initial empty data for charts before loading
const initialCandleData: Candle[] = [];

// Placeholder: Replace with actual trade history fetching if implemented
const tradeHistoryData: any[] = []; // Keep as any for placeholder

// Placeholder: Log entries will be added dynamically
const logData: { timestamp: string; type: string; message: string }[] = [];

// Will be populated by API
let allAvailablePairs: SymbolInfo[] = [];

// --- Updated Initial Strategies (Total 30) ---
const availableStrategies: Strategy[] = [
    // Existing 10
    { id: 'rsi_simple', name: 'Basit RSI Al/Sat', description: 'RSI 30 altına indiğinde al, 70 üstüne çıktığında sat.', prompt: 'RSI(14) < 30 iken AL, RSI(14) > 70 iken SAT.' },
    { id: 'sma_crossover', name: 'SMA Kesişimi (50/200)', description: '50 periyotluk SMA, 200 periyotluk SMA\'yı yukarı kestiğinde al, aşağı kestiğinde sat.', prompt: 'SMA(50) > SMA(200) iken ve önceki mumda SMA(50) <= SMA(200) ise AL. SMA(50) < SMA(200) iken ve önceki mumda SMA(50) >= SMA(200) ise SAT.' },
    { id: 'bollinger_bands', name: 'Bollinger Bantları Dokunuş', description: 'Fiyat alt Bollinger bandına dokunduğunda al, üst banda dokunduğunda sat.', prompt: 'Fiyat <= Alt Bollinger Bandı(20, 2) ise AL. Fiyat >= Üst Bollinger Bandı(20, 2) ise SAT.' },
    { id: 'macd_signal_crossover', name: 'MACD Sinyal Kesişimi', description: 'MACD çizgisi sinyal çizgisini yukarı kestiğinde al, aşağı kestiğinde sat.', prompt: 'MACD(12, 26, 9) çizgisi > Sinyal çizgisi iken ve önceki mumda MACD çizgisi <= Sinyal çizgisi ise AL. MACD çizgisi < Sinyal çizgisi iken ve önceki mumda MACD çizgisi >= Sinyal çizgisi ise SAT.' },
    { id: 'volume_spike', name: 'Hacim Patlaması + Fiyat Artışı', description: 'Hacim ortalamanın üzerine çıktığında ve fiyat arttığında al.', prompt: 'Hacim > SMA(Hacim, 20) * 2 VE Kapanış Fiyatı > Açılış Fiyatı ise AL. (Satış koşulu eklenmeli)' },
    { id: 'ichimoku_cloud_breakout', name: 'Ichimoku Bulut Kırılımı', description: 'Fiyat Ichimoku bulutunu yukarı kırdığında al, aşağı kırdığında sat.', prompt: 'Fiyat > Ichimoku Bulutu (Senkou Span A ve B) iken AL. Fiyat < Ichimoku Bulutu iken SAT.' },
    { id: 'stochastic_oversold', name: 'Stokastik Aşırı Satım', description: 'Stokastik %K çizgisi 20 altına düştüğünde ve tekrar yukarı kestiğinde al.', prompt: '%K(14, 3, 3) < 20 iken ve önceki mumda %K >= 20 ise SAT sinyali yoksa AL. %K > 80 iken SAT.' },
    { id: 'fibonacci_support', name: 'Fibonacci Destek Alımı', description: 'Fiyat önemli bir Fibonacci geri çekilme seviyesine (örn. 0.618) düşüp tepki verdiğinde al.', prompt: 'Fiyat son yükselişin 0.618 Fibonacci seviyesine yakınsa ve bir önceki mum yeşil ise AL. (Satış koşulu eklenmeli)' },
    { id: 'ema_crossover_fast', name: 'Hızlı EMA Kesişimi (9/21)', description: '9 periyotluk EMA, 21 periyotluk EMA\'yı yukarı kestiğinde al, aşağı kestiğinde sat.', prompt: 'EMA(9) > EMA(21) iken ve önceki mumda EMA(9) <= EMA(21) ise AL. EMA(9) < EMA(21) iken ve önceki mumda EMA(9) >= EMA(21) ise SAT.' },
    { id: 'support_resistance_bounce', name: 'Destek/Direnç Sekmesi', description: 'Fiyat önemli bir destek seviyesinden sektiğinde al, dirençten döndüğünde sat.', prompt: 'Tanımlanmış Destek seviyesine yakın ve bir önceki mum yeşil ise AL. Tanımlanmış Direnç seviyesine yakın ve bir önceki mum kırmızı ise SAT.' },
    // Added 20 more
    { id: 'adx_trend_following', name: 'ADX Trend Takibi', description: 'ADX > 25 ve +DI > -DI ise al, ADX > 25 ve -DI > +DI ise sat.', prompt: 'ADX(14) > 25 VE +DI(14) > -DI(14) ise AL. ADX(14) > 25 VE -DI(14) > +DI(14) ise SAT.' },
    { id: 'obv_divergence', name: 'OBV Uyumsuzluğu', description: 'Fiyat düşerken OBV yükseliyorsa (boğa uyumsuzluğu) al, fiyat yükselirken OBV düşüyorsa (ayı uyumsuzluğu) sat.', prompt: 'Fiyat Düşük < Önceki Düşük VE OBV > Önceki OBV ise AL. Fiyat Yüksek > Önceki Yüksek VE OBV < Önceki OBV ise SAT.' },
    { id: 'mfi_overbought_oversold', name: 'MFI Aşırı Alım/Satım', description: 'Para Akışı Endeksi (MFI) 20\'nin altına düşerse al, 80\'in üzerine çıkarsa sat.', prompt: 'MFI(14) < 20 ise AL. MFI(14) > 80 ise SAT.' },
    { id: 'parabolic_sar_reversal', name: 'Parabolic SAR Dönüşü', description: 'SAR noktaları fiyatın altına geçtiğinde al, üzerine geçtiğinde sat.', prompt: 'SAR fiyatın altına geçerse AL. SAR fiyatın üzerine geçerse SAT.' },
    { id: 'vwap_cross', name: 'VWAP Kesişimi', description: 'Fiyat VWAP\'ın üzerine çıktığında al, altına indiğinde sat (genellikle gün içi için).', prompt: 'Kapanış > VWAP ise AL. Kapanış < VWAP ise SAT.' },
    { id: 'cci_extreme', name: 'CCI Aşırı Seviyeler', description: 'Emtia Kanal Endeksi (CCI) -100\'ün altına düşüp tekrar üzerine çıktığında al, +100\'ün üzerine çıkıp tekrar altına indiğinde sat.', prompt: 'CCI(20) > -100 VE Önceki CCI(20) <= -100 ise AL. CCI(20) < 100 VE Önceki CCI(20) >= 100 ise SAT.' },
    { id: 'williams_r_oversold', name: 'Williams %R Aşırı Satım', description: 'Williams %R -80\'in altına düştüğünde al, -20\'nin üzerine çıktığında sat.', prompt: 'Williams %R(14) < -80 ise AL. Williams %R(14) > -20 ise SAT.' },
    { id: 'keltner_channel_breakout', name: 'Keltner Kanalı Kırılımı', description: 'Fiyat üst Keltner Kanalı\'nı kırdığında al, alt kanalı kırdığında sat.', prompt: 'Fiyat > Üst Keltner Kanalı(20, 2, 10) ise AL. Fiyat < Alt Keltner Kanalı(20, 2, 10) ise SAT.' },
    { id: 'aroon_crossover', name: 'Aroon Kesişimi', description: 'Aroon Up çizgisi Aroon Down çizgisini yukarı kestiğinde al, aşağı kestiğinde sat.', prompt: 'Aroon Up(14) > Aroon Down(14) VE Önceki Aroon Up(14) <= Önceki Aroon Down(14) ise AL. Aroon Up(14) < Aroon Down(14) VE Önceki Aroon Up(14) >= Önceki Aroon Down(14) ise SAT.' },
    { id: 'ema_triple_crossover', name: 'Üçlü EMA Kesişimi (Örn: 5/10/20)', description: 'Kısa EMA > Orta EMA > Uzun EMA olduğunda al, Uzun EMA > Orta EMA > Kısa EMA olduğunda sat.', prompt: 'EMA(5) > EMA(10) VE EMA(10) > EMA(20) ise AL. EMA(5) < EMA(10) VE EMA(10) < EMA(20) ise SAT.' },
    { id: 'rsi_divergence', name: 'RSI Uyumsuzluğu', description: 'Fiyat düşerken RSI yükseliyorsa (boğa) al, fiyat yükselirken RSI düşüyorsa (ayı) sat.', prompt: 'Fiyat Düşük < Önceki Düşük VE RSI(14) > Önceki RSI(14) ise AL. Fiyat Yüksek > Önceki Yüksek VE RSI(14) < Önceki RSI(14) ise SAT.' },
    { id: 'sma_bounce', name: 'SMA Sekmesi (Örn: 50)', description: 'Fiyat düşüp 50 günlük SMA\'dan destek alıp yükseldiğinde al.', prompt: 'Fiyat 50-SMA\'ya yakın VE Önceki mum kırmızı VE Mevcut mum yeşil ise AL. (Satış koşulu eklenmeli)' },
    { id: 'bollinger_squeeze_breakout', name: 'Bollinger Bant Sıkışması Kırılımı', description: 'Bollinger Bantları daraldığında (sıkışma) ve fiyat yukarı veya aşağı kırıldığında işlem aç.', prompt: 'Bollinger Bant Genişliği < Ortalama Bant Genişliği(20) * 0.8 VE Fiyat > Üst Bant ise AL. Bollinger Bant Genişliği < Ortalama Bant Genişliği(20) * 0.8 VE Fiyat < Alt Bant ise SAT.' },
    { id: 'macd_zero_cross', name: 'MACD Sıfır Çizgisi Kesişimi', description: 'MACD çizgisi sıfır çizgisini yukarı kestiğinde al, aşağı kestiğinde sat.', prompt: 'MACD(12, 26, 9) > 0 VE Önceki MACD(12, 26, 9) <= 0 ise AL. MACD(12, 26, 9) < 0 VE Önceki MACD(12, 26, 9) >= 0 ise SAT.' },
    { id: 'heikin_ashi_trend', name: 'Heikin Ashi Trend Takibi', description: 'Arka arkaya 2-3 yeşil Heikin Ashi mumu (gölgesiz) görüldüğünde al, kırmızı görüldüğünde sat.', prompt: 'Heikin Ashi 2 mumdur yeşil VE alt gölgesi yoksa AL. Heikin Ashi 2 mumdur kırmızı VE üst gölgesi yoksa SAT.' },
    { id: 'pivot_point_support', name: 'Pivot Noktası Destek/Direnç', description: 'Fiyat Pivot Noktası (P) veya Destek 1/2/3 (S1/S2/S3) seviyelerine gelip tepki verdiğinde al, Direnç 1/2/3 (R1/R2/R3) seviyelerine gelip tepki verdiğinde sat.', prompt: 'Fiyat S1 veya S2\'ye yakın VE bir önceki mum yeşil ise AL. Fiyat R1 veya R2\'ye yakın VE bir önceki mum kırmızı ise SAT.' },
    { id: 'ema_cloud_strategy', name: 'EMA Bulut Stratejisi (Örn: 9/21 EMA)', description: 'Fiyat EMA bulutunun (9 ve 21 EMA arası) üzerindeyken ve 9 EMA, 21 EMA\'nın üzerindeyken al, tersi durumda sat.', prompt: 'Kapanış > EMA(9) VE Kapanış > EMA(21) VE EMA(9) > EMA(21) ise AL. Kapanış < EMA(9) VE Kapanış < EMA(21) VE EMA(9) < EMA(21) ise SAT.' },
    { id: 'donchian_channel_breakout', name: 'Donchian Kanalı Kırılımı (Örn: 20 periyot)', description: 'Fiyat son 20 periyodun en yüksek seviyesini (üst Donchian kanalı) kırdığında al, en düşük seviyesini (alt Donchian kanalı) kırdığında sat.', prompt: 'Fiyat > Üst Donchian(20) ise AL. Fiyat < Alt Donchian(20) ise SAT.' },
    { id: 'chop_index_breakout', name: 'Chop Index Trend Başlangıcı', description: 'Chop Index (Örn: 14) belirli bir eşiğin (örn. 38) altına düştüğünde (piyasa trendli) al/sat sinyali ara.', prompt: 'Chop Index(14) < 38 VE (örneğin EMA kesişimi gibi bir AL sinyali) ise AL. Chop Index(14) < 38 VE (örneğin EMA kesişimi gibi bir SAT sinyali) ise SAT.' },
    { id: 'order_block_mitigation', name: 'Order Block Mitigation (SMC)', description: 'Fiyat daha önceki bir Order Block\'a (genellikle ters yönde büyük bir mum) geri döndüğünde ve tepki verdiğinde (mitigation) işlem aç.', prompt: 'Fiyat önceki Ayı Order Block bölgesine ulaştı VE tepki veriyor (örn. kırmızı mum) ise SAT. Fiyat önceki Boğa Order Block bölgesine ulaştı VE tepki veriyor (örn. yeşil mum) ise AL.' },
];


// ----- API Validation Types -----
type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'not_checked';
type ApiEnvironment = 'spot'; // Only spot is supported now

// ----- Main Dashboard Component -----
export default function Dashboard() {
  // --- State Definitions ---
  // Removed activeUser state
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

  // API Key and Input State - Simplified for Spot only
  const [apiKeys, setApiKeys] = React.useState({
      spot: { key: '', secret: '' },
      telegram: { token: '', chatId: '' },
  });

  // Validation Status State - Simplified for Spot only
  const [validationStatus, setValidationStatus] = React.useState<{
      spot: ValidationStatus;
      telegramToken: ValidationStatus;
      telegramChatId: ValidationStatus;
  }>({
      spot: 'not_checked',
      telegramToken: 'not_checked',
      telegramChatId: 'not_checked',
  });

   // State to track the currently active (last validated) API environment for portfolio/trading - Always 'spot' if validated
   const activeApiEnvironment: ApiEnvironment | null = validationStatus.spot === 'valid' ? 'spot' : null;


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
      addLog('INFO', 'Fetching available trading pairs from Binance Spot...');
      try {
        // Always fetch from Spot (isTestnet=false)
        const info = await getExchangeInfo(false);
        const tradingPairs = info.symbols
          .filter(s => s.status === 'TRADING' && s.isSpotTradingAllowed) // Filter active spot pairs
          .sort((a, b) => a.symbol.localeCompare(b.symbol));

        // Get top 100 USDT pairs based on some criteria (e.g., volume, or just first 100 alphabetically if volume isn't available)
        // For simplicity, we'll take the first 100 USDT pairs found alphabetically.
        // A better approach would use volume data if available or a predefined list of popular pairs.
        const usdtPairs = tradingPairs.filter(p => p.quoteAsset === 'USDT');
        const popularPairs = usdtPairs.slice(0, 100); // Limit to top 100 USDT pairs

        allAvailablePairs = tradingPairs; // Store all for potential future use (e.g., in backtest selector)
        setAvailablePairs(popularPairs); // Display only top 100 USDT pairs initially

        if (popularPairs.length > 0 && !selectedPair) {
          const defaultPair = popularPairs.find(p => p.symbol === 'BTCUSDT') || popularPairs[0];
          setSelectedPair(defaultPair.symbol);
          setBacktestParams(prev => ({ ...prev, pair: defaultPair.symbol }));
          addLog('INFO', `Successfully fetched ${tradingPairs.length} total pairs. Displaying top ${popularPairs.length} USDT pairs. Default pair set to ${defaultPair.symbol}.`);
        } else if (popularPairs.length === 0) {
          addLog('WARN', 'No popular USDT trading pairs found or fetched from Binance Spot.');
           // Fallback to showing all pairs if no USDT pairs found (limit still applied)
           const limitedAllPairs = tradingPairs.slice(0, 100);
           setAvailablePairs(limitedAllPairs);
           if (limitedAllPairs.length > 0 && !selectedPair) {
             const defaultPair = limitedAllPairs.find(p => p.symbol === 'BTCUSDT') || limitedAllPairs[0];
             setSelectedPair(defaultPair.symbol);
             setBacktestParams(prev => ({ ...prev, pair: defaultPair.symbol }));
             addLog('INFO', `No USDT pairs found. Displaying first ${limitedAllPairs.length} pairs. Default pair set to ${defaultPair.symbol}.`);
           }
        }
         addLog('INFO', `Available pairs count for bot selection: ${popularPairs.length}`);
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
      addLog('INFO', `Fetching candlestick data for ${selectedPair} (${selectedInterval}) from Spot...`);
      try {
          // Always fetch from Spot (isTestnet = false)
          const data = await getCandlestickData(selectedPair, selectedInterval, 200, false); // Fetch more candles (e.g., 200)
          setCandleData(data);
          if (data.length === 0) {
            addLog('WARN', `No candlestick data returned for ${selectedPair} (${selectedInterval}) from Spot.`);
          } else {
            addLog('INFO', `Successfully fetched ${data.length} candles for ${selectedPair} (${selectedInterval}) from Spot.`);
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
  }, [selectedPair, selectedInterval]); // Removed activeApiEnvironment dependency


  // Fetch portfolio data when API keys are validated
  React.useEffect(() => {
    const fetchPortfolio = async () => {
        if (validationStatus.spot !== 'valid') {
            setPortfolioData([]); // Clear portfolio if keys not valid or missing
            // Don't log here, wait for validation status change
            return;
        }

        setLoadingPortfolio(true);
        addLog('INFO', `Fetching portfolio data for Spot environment...`);
        try {
            // **SECURITY**: Use the Server Action for secure fetching
            const apiKeyHint = apiKeys.spot.key.substring(0, 4);
            const secretKeyHint = '****';
            // Call action without isTestnet flag
            const result = await fetchAccountBalancesAction(apiKeyHint, secretKeyHint);

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
                addLog('INFO', `Successfully fetched portfolio (Spot). Found ${filteredBalances.length} assets with non-zero balance.`);
                if (filteredBalances.length === 0) {
                    addLog('INFO', 'Portfolio is empty or all balances are zero.');
                }
            } else {
                throw new Error(result.error || `Failed to fetch balances for Spot.`);
            }
        } catch (err) {
            console.error("Failed to fetch portfolio:", err);
            const errorMsg = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
            addLog('ERROR', `Failed to fetch portfolio (Spot): ${errorMsg}`);
            toast({ title: "Portföy Hatası", description: `Hesap bakiyeleri yüklenemedi (Spot): ${errorMsg}`, variant: "destructive" });
            setPortfolioData([]); // Reset on error
        } finally {
            setLoadingPortfolio(false);
        }
    };

    fetchPortfolio();
     // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [validationStatus.spot]); // Trigger only when spot validation status changes


  // --- Handlers ---

  // Removed handleLogin and handleLogout


  const toggleBotStatus = async () => {
     const newStatus = botStatus === 'running' ? 'stopped' : 'running';

     if (newStatus === 'running') {
        // Pre-start checks
         if (validationStatus.spot !== 'valid') {
             toast({ title: "API Doğrulaması Gerekli", description: `Lütfen Spot API anahtarlarını doğrulayın.`, variant: "destructive" });
              addLog('WARN', `Bot start prevented: Spot API environment not validated.`);
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
        addLog('INFO', `Bot starting... Env: Spot, Pairs: ${selectedPairsForBot.join(', ') || 'None'}. Strategies: ${strategies.join(', ') || 'None'}.`);

        // --- Start Strategy Execution ---
        let strategyStartSuccessCount = 0;
        let strategyStartFailCount = 0;

        for (const pair of selectedPairsForBot) {
            for (const strategyId of activeStrategies) {
                const strategy = definedStrategies.find(s => s.id === strategyId);
                if (strategy) {
                    try {
                        console.log(`Attempting to run strategy ${strategy.name} on ${pair} in Spot`);
                        addLog('INFO', `Attempting to start strategy '${strategy.name}' on ${pair} (Spot)...`);

                        // Prepare parameters for the runStrategy action
                        // **SECURITY**: The action needs to handle keys securely based on Spot environment
                        const runParams: RunParams = {
                            strategy,
                            pair,
                            interval: selectedInterval, // Use global interval for now
                             // Add risk parameters if implemented
                             stopLossPercent: stopLoss ? parseFloat(stopLoss) : undefined,
                             takeProfitPercent: takeProfit ? parseFloat(takeProfit) : undefined,
                             // No environment or isTestnet needed here
                        };

                        // Call the server action
                        const result: RunResult = await runStrategy(runParams);

                        addLog('STRATEGY_START', `Strategy '${strategy.name}' on ${pair} (Spot) status: ${result.status}. ${result.message || ''}`);
                        strategyStartSuccessCount++;
                    } catch (error) {
                        strategyStartFailCount++;
                        console.error(`Error starting strategy ${strategy.name} on ${pair} in Spot):`, error);
                        const message = error instanceof Error ? error.message : "Bilinmeyen hata";
                        toast({ title: "Bot Strateji Hatası", description: `${strategy.name} - ${pair}: Başlatılamadı: ${message}`, variant: "destructive" });
                        addLog('ERROR', `Failed to start strategy '${strategy.name}' on ${pair} (Spot): ${message}`);
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
            await sendMessage(`✅ KriptoPilot bot (Spot) ${selectedPairsForBot.length} paritede aktif. ${successMsg} ${failMsg}`, apiKeys.telegram.token, apiKeys.telegram.chatId);
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
    env: 'spot' | 'telegram', // Simplified env types
    field: 'key' | 'secret' | 'token' | 'chatId'
  ) => {
    const value = e.target.value;
    setApiKeys(prev => ({
      ...prev,
      [env]: { ...prev[env], [field]: value },
    }));
    // Reset validation status for the specific env/field being changed
    if (env === 'spot') {
      setValidationStatus(prev => ({ ...prev, spot: 'not_checked' }));
      addLog('CONFIG', `Spot API key/secret changed, validation status reset.`);
    } else if (field === 'token') {
      setValidationStatus(prev => ({ ...prev, telegramToken: 'not_checked', telegramChatId: 'not_checked' }));
      addLog('CONFIG', 'Telegram token changed, validation status reset.');
    } else if (field === 'chatId') {
      setValidationStatus(prev => ({ ...prev, telegramChatId: 'not_checked' }));
      addLog('CONFIG', 'Telegram chat ID changed, validation status reset.');
    }
  };

  const handleValidateApiKey = async (env: 'spot') => { // Only spot validation
    setValidationStatus(prev => ({ ...prev, [env]: 'pending' }));
    addLog('INFO', `Validating ${env} API keys...`);
    // const isTestnetEnv = false; // Always false now
    try {
      // **Use the direct service call ONLY for validation**
      // In a real app, prefer a dedicated validation server action if possible
      const isValid = await validateBinanceApiKeys(apiKeys[env].key, apiKeys[env].secret); // isTestnet removed
      setValidationStatus(prev => ({ ...prev, [env]: isValid ? 'valid' : 'invalid' }));
      const message = isValid ? `${env.toUpperCase()} API anahtarı başarıyla doğrulandı.` : `${env.toUpperCase()} API anahtarı geçersiz veya doğrulanamadı.`;
      addLog(isValid ? 'INFO' : 'ERROR', `API Key Validation (${env}): ${message}`);
      toast({
        title: isValid ? "API Anahtarı Doğrulandı" : "API Anahtarı Geçersiz",
        description: message,
        variant: isValid ? "default" : "destructive",
      });
      // Active environment is now implicitly 'spot' if validationStatus.spot === 'valid'
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
        setBacktestResult({ errorMessage: "Geçersiz tarih aralığı.", totalTrades: 0, winningTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0 });
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
      // No environment or isTestnet needed
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
    
      
        
          
            
              
              
            
             {/* Removed User Login Section */}
          
          
          
             
               
                 
                   
                     
                       Spot
                     
                     {/* Removed Testnet/Futures links */}
                     
                       Telegram
                     
                   
                 
               
          
  
                
                   Portföy
                 
               
  
                
                    Stratejiler
                  
                  
                    
                      Yönetim
                    
                    
                      Geriye Dönük Test
                    
                    
                      Risk Yönetimi
                    
                  
                
  
                 
                     Bot Pariteleri
                   
                 
  
                  
                    İşlem Geçmişi
                  
                
  
                
                   Log Kayıtları
                 
               
  
             
          
          
            
              
                 Bot: {botStatus === 'running' ?  Çalışıyor :  Durdu}
                 {botStatus === 'running' && activeApiEnvironment &&  ({activeApiEnvironment.toUpperCase()})}
             
              
                
                  
                     { validationStatus.spot !== 'valid' ? `Botu başlatmak için Spot API anahtarlarını doğrulayın.` :
                       (validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId !== 'valid') ? "Botu başlatmak için Telegram ayarlarını doğrulayın." :
                       botStatus === 'stopped' && activeStrategies.length === 0 ? "Botu başlatmak için en az bir strateji seçin." :
                       botStatus === 'stopped' && selectedPairsForBot.length === 0 ? "Botu başlatmak için en az bir parite seçin." :
                       botStatus === 'running' ? "Botu durdur." : "Botu başlat."
                     }
                  
                
              
            
          
        
  
       
         
           
             
               
               
             
             
               
                 
                   {loadingPairs ? "Yükleniyor..." : (availablePairs.length === 0 ? "Parite Yok" : "Parite Seç")}
                 
               
               
                 
                   
                     Yükleniyor...
                   
                    availablePairs.map((pair) => (
                       {pair.baseAsset}/{pair.quoteAsset}
                     ))
                   
                   Parite bulunamadı.
                 
               
             
             
               
                 Aralık
               
             
             
               
                 1m
                 5m
                 15m
                 1h
                 4h
                 1d
               
             
           
  
         
           
             {error && (
               
                 
                  
                 Hata
                 
                  {error}
                 
               
             )}
  
            
              
  
               
                 
                   
                    
                      {selectedPair ? `${selectedPair.replace('USDT', '/USDT')} - ${selectedInterval}` : "Grafik"}
                      {loadingCandles && }
                    
                     {formatTimestamp(candleData[candleData.length - 1]?.closeTime)}
                 
                 
                   Fiyat hareketlerini ve hacmi gösterir.
                 
               
               
                 {loadingCandles ? (
                   
                     
                       Yükleniyor...
                     
                   
                 ) : candleData.length > 0 ? (
                   
                     
                         
                           
                           
                         
                         
                           
                             
                               {formatTimestamp(value)}
                           
                           
                         
                         
                           
                             {formatNumberClientSide(value, { notation: 'compact', maximumFractionDigits: 1 })}
                           
                           
                         
                         
                         
                            
                         
                         
                           
                             
                           
                             
                                 
                                 
                                 
                                 
                                 
                             
                           
                           
                             {formatNumberClientSide(value, { style: 'currency', currency: 'USD', maximumFractionDigits: Math.max(2, String(value).split('.')[1]?.length || 0) })}
                           
                         
  
                        
                           
                               Kapanış
                           
                           
                               Hacim
                           
                         
                         
                           
                             
                                 
                             
                               
                           
                         
                     
                   
                 ) : (
                   
                     {selectedPair ? `${selectedPair} için ${selectedInterval} aralığında veri bulunamadı.` : "Lütfen bir parite seçin."}
                   
                 )}
               
             
  
  
              
               
                 
                   
                      Portföy
                      Geçmiş
                      Loglar
                   
                   
                     
                       
                            
                                Portföy {activeApiEnvironment &&  (${activeApiEnvironment.toUpperCase()})}
                                {loadingPortfolio && }
                            
                            {/* Optional: Add total value calculation here */}
                       
                        {validationStatus.spot === 'not_checked' && (
                          
                             
                              API Doğrulaması Gerekli
                             
                             
                               Portföy verilerini görmek için lütfen  bölümünden geçerli bir Spot API anahtarını doğrulayın.
                             
                           
                         
                      )}
                      {validationStatus.spot === 'invalid' && (
                           
                             
                               Geçersiz API Anahtarı
                             
                             
                                 Girilen Spot API anahtarları geçersiz. Lütfen  bölümünden kontrol edin.
                             
                           
                      )}
  
                       
                         
                           
                             Varlık
                             Kullanılabilir
                             Kilitli
                              Toplam
                           
                         
                         
                           {loadingPortfolio ? (
                             
                               
                                 Yükleniyor...
                               
                             
                           ) : portfolioData.length > 0 && validationStatus.spot === 'valid' ? (
                            portfolioData.map((balance) => )
                           ) : (
                            
                              
                                  {validationStatus.spot !== 'valid' ? "API anahtarları doğrulanmamış veya geçersiz." :
                                   portfolioData.length === 0 && !loadingPortfolio ? "Portföy boş veya yüklenemedi." :
                                   "Portföy verisi bekleniyor..."}
                              
                            
                           )}
                         
                            {/* Optional: Add TableFooter for Total Value */}
                           {/*  Toplam Değer (Tahmini):{totalPortfolioValue} */}
                       
                     
  
                      
                         
                           İşlem Geçmişi (Yakında)
                         
                         Binance API üzerinden son işlemleriniz burada listelenecektir.
                         
                         
                           
                             
                               Zaman
                               Parite
                               Tip
                               Fiyat
                               Miktar
                               Toplam
                               Durum
                             
                           
                           
                             {tradeHistoryData.length === 0 ? (
                              
                                Gerçekleşen işlem verisi yok.
                               
                             ) : (
                              tradeHistoryData.map((trade, index) => )
                             )}
                           
                         
                       
                     
  
                     
                       
                         Log Kayıtları ({dynamicLogData.length})
                         
                         
                           
                             
                               Zaman
                               Tip
                               Mesaj
                             
                           
                           
                             {dynamicLogData.length === 0 ? (
                              
                                Log kaydı bulunamadı.
                               
                             ) : (
                              dynamicLogData.map((log, index) => (
                               
                                 
                                  {formatTimestamp(log.timestamp)}
                                  
                                  
                                   
                                     {log.type}
                                   
                                 
                                 {log.message}
                               
                              ))
                             )}
                           
                         
                       
                     
                   
                 
               
  
  
                
                  
                      
                         API Anahtar Yönetimi
                         {activeApiEnvironment && (
                             Aktif Ortam: 
                         )}
                     
                     
                        Binance Spot API anahtarlarınızı girin ve doğrulayın. Doğrulama başarılı olursa, bu anahtarlar portföy ve işlem işlemleri için kullanılacaktır.
                     
                  
                  
                     
                      
                        Binance Spot API
                         {validationStatus.spot === 'valid' && }
                        
                        
                           
                             API Key
                             
                             Spot API Key Girin
                           
                           
                             Secret Key
                             
                             Spot Secret Key Girin
                           
                            
                              
                                
                                   
                                     
                                       Doğrula
                                     
                                   
                                   
                                     { validationStatus.spot === 'valid' ? 'Spot API geçerli.' : validationStatus.spot === 'invalid' ? 'Spot API geçersiz.' : validationStatus.spot === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}
                                   
                                
                             
                           
                        
                      
  
                      
  
                      
                         Telegram Bot Entegrasyonu
                          {validationStatus.telegramToken === 'valid' && validationStatus.telegramChatId === 'valid' && }
                         
                         
                           
                             Bot Token
                             
                             Telegram Bot Token Girin
                           
                             
                               
                                 
                                    
                                      Token Doğrula
                                    
                                 
                                 
                                   { validationStatus.telegramToken === 'valid' ? 'Token geçerli.' : validationStatus.telegramToken === 'invalid' ? 'Token geçersiz.' : validationStatus.telegramToken === 'pending' ? 'Doğrulanıyor...' : 'Doğrulamak için tıklayın.'}
                                 
                               
                             
                           
  
                           
                             Chat ID
                             
                             Telegram Grup/Kullanıcı ID Girin
                           
                             
                               
                                 
                                    
                                      Test Mesajı
                                    
                                 
                                 
                                   {validationStatus.telegramToken !== 'valid' ? 'Önce geçerli token girin.' : validationStatus.telegramChatId === 'valid' ? 'Chat ID geçerli.' : validationStatus.telegramChatId === 'invalid' ? 'Chat ID geçersiz/bulunamadı.' : validationStatus.telegramChatId === 'pending' ? 'Doğrulanıyor...' : 'Doğrulama ve test mesajı için tıklayın.'}
                                 
                               
                             
                           
                           BotFather'dan token alın. Chat ID için  veya grup ID'si (-100...) kullanın. Botun gruba ekli olması/başlatılmış olması gerekir.
                         
                      
                    
                  
                
  
                 
                   
                      
                         Strateji Yönetimi
                        
                           
                             Yeni Strateji (AI)
                           
                           
                             
                               Yeni Ticaret Stratejisi Tanımla (AI)
                             
                             
                               AI'nın sizin için bir ticaret stratejisi tanımlamasını sağlayın. Net kurallar girin. AI tarafından oluşturulan stratejiler deneyseldir ve dikkatli kullanılmalıdır.
                             
                           
                           
                             
                               Strateji Adı
                               
                               Örn: RSI + Hacim Teyidi
                             
                             
                               Kısa Açıklama
                               
                               Stratejinin ana fikri.
                             
                             
                               Detaylı Strateji İstemi (Prompt)
                               
                               AI için detaylı alım/satım kuralları, indikatörler ve parametreler... Örn: 'RSI(14) 35 altına düştüğünde VE Hacim son 10 mumun ortalamasının 1.5 katından fazlaysa AL. RSI(14) 70 üzerine çıktığında veya %3 Stop-Loss tetiklendiğinde SAT.'
                               AI'nın anlayabileceği net ve spesifik kurallar yazın.
                             
                           
                           
                             
                               
                                 İptal
                               
                               
                                 {isDefiningStrategy && }
                                 {isDefiningStrategy ? 'Tanımlanıyor...' : 'AI ile Strateji Tanımla'}
                               
                             
                           
                         
                       
                     
                     Çalıştırmak istediğiniz stratejileri seçin veya AI ile yenilerini oluşturun.
                   
                   
                     Aktif Stratejiler ({activeStrategies.length})
                      Aktif strateji yok.
                      {activeStrategies.map((stratId) => {
                        const strategy = definedStrategies.find(s => s.id === stratId);
                        return (
                          
                            
                              {strategy?.name ?? stratId} 
                            
                             {strategy?.description}
                           
                         
                        )
                      })}
                     
                     Mevcut Stratejiler ({definedStrategies.length})
                     
                       
                         {definedStrategies.map((strategy) => (
                          
                             
                               
                                 
                                   
                                   {strategy.name}
                                   {strategy.id.startsWith('ai_') && AI Tarafından Tanımlandı}
                                 
                                  
                                   
                                    {strategy.name}
                                    
                                     {strategy.description}
                                     {strategy.prompt &&  AI İstem: {strategy.prompt.substring(0, 100)}...}
                                   
                                 
                               
                             
                           
                         ))}
                       
                     
                   
                 
  
                 
                   
                      
                         Bot İçin Parite Seçimi
                         Botun işlem yapmasını istediğiniz pariteleri seçin (En popüler {availablePairs.length} USDT paritesi listelenmiştir).
                     
                   
                   
                     Seçili Pariteler ({selectedPairsForBot.length})
                      Bot için parite seçilmedi.
                      {selectedPairsForBot.map((pairSymbol) => (
                         {pairSymbol} 
                      ))}
                     
                     Mevcut Popüler Pariteler ({availablePairs.length})
                     {loadingPairs ? (
                       
                         
                           Yükleniyor...
                         
                       
                     ) : availablePairs.length > 0 ? (
                       
                         
                           {availablePairs.map((pair) => (
                             
                               
                                 {pair.symbol}
                               
                             
                           ))}
                         
                       
                     ) : (
                       
                         Parite bulunamadı veya yüklenemedi.
                       
                     )}
                     
                       
                         Tümünü Seç
                         Temizle
                       
                     
                   
                 
  
                 
                   
                      
                         Risk Yönetimi (Zarar Durdur / Kar Al)
                         Her işlem için otomatik Zarar Durdur (Stop-Loss) ve Kar Al (Take-Profit) yüzdeleri belirleyin. Bu ayarlar, çalışan stratejilere uygulanacaktır. (Geliştirme aşamasında)
                     
                   
                   
                     
                       
                         
                           Zarar Durdur (%)
                           
                           Örn: 2
                           Pozisyon açılış fiyatının % kaç altında zararı durdur.
                         
                         
                           Kar Al (%)
                           
                           Örn: 5
                           Pozisyon açılış fiyatının % kaç üstünde kar al.
                         
                         
                           Risk Ayarlarını Kaydet (Yakında)
                         
                       
                     
                   
                 
  
                 
                   
                      
                         Geriye Dönük Strateji Testi
                         Seçtiğiniz stratejiyi geçmiş veriler üzerinde test ederek potansiyel performansını değerlendirin. Sonuçlar geleceği garanti etmez. Testler AI tarafından simüle edilir.
                     
                   
                   
                     
                       
                         
                           Test Edilecek Strateji
                            
                             Strateji Seçin
                           
                           
                             {definedStrategies.map(strategy => (
                              {strategy.name}
                             ))}
                           
                         
                         
                           Parite
                            
                             {loadingPairs ? "Yükleniyor..." : (allAvailablePairs.length === 0 ? "Parite Yok" : "Parite Seç")}
                           
                           
                              {/*   */}
                               {loadingPairs ? (
                                 
                                   Yükleniyor...
                                 
                                  allAvailablePairs.map((pair) => ( /* Use all pairs for backtest */
                                     {pair.symbol}
                                  ))
                                ) : (
                                  
                                    Parite bulunamadı.
                                  
                                )}
                             
                           
                         
                         
                           Zaman Aralığı
                            
                             Aralık Seçin
                           
                           
                             
                               5m
                               15m
                               1h
                               4h
                               1d
                             
                           
                         
                         
                           Başlangıç Tarihi
                           
                         
                         
                           Bitiş Tarihi
                           
                         
                         
                           Başlangıç Bakiyesi (USDT)
                           
                         
                       
                       
                         {isBacktesting ?  : }
                         {isBacktesting ? 'Test Çalışıyor...' : 'Testi Başlat'}
                       
  
                       
                         
                           Test Sonuçları
                            
                              Test ediliyor...
                           
                          
                           
                             
                               
                                 Strateji:
                                  {definedStrategies.find(s => s.id === selectedBacktestStrategyId)?.name}
                               
                               
                                 Parite/Aralık:
                                  {backtestParams.pair} / {backtestParams.interval}
                               
                               
                                 Tarih Aralığı:
                                  {backtestParams.startDate} - {backtestParams.endDate}
                               
                               
                                 Toplam İşlem:
                                  {backtestResult.totalTrades}
                               
                               
                                 Kazanan/Kaybeden:
                                  {backtestResult.winningTrades} / {backtestResult.losingTrades}
                               
                               
                                 Kazanma Oranı:
                                  {formatNumberClientSide(backtestResult.winRate)}%
                               
                               
                                 Maks. Düşüş:
                                  {formatNumberClientSide(backtestResult.maxDrawdown)}%
                               
                               
                                 Net Kar/Zarar:
                                  {formatNumberClientSide(backtestResult.totalPnl, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })} ({formatNumberClientSide(backtestResult.totalPnlPercent)}%)
                               
                             
                           
                           
                             
                               Backtest Hatası
                                {backtestResult.errorMessage}
                             
                           
                           
                             Test sonuçları burada gösterilecek.
                           
                         
                       
                     
                   
                 
  
            
          
        
      
     
    
   );
 }
  
  