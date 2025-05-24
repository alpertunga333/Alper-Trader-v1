
// src/app/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
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
  SidebarMenuButton,
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
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Line,
  Area,
  Pie,
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
  TrendingUp,
  Home,
  BrainCircuit // Icon for Strategies
} from 'lucide-react';
import type { Balance, Candle, SymbolInfo, OrderParams, OrderResponse } from '@/services/binance';
import { getCandlestickData, getExchangeInfo, placeOrder } from '@/services/binance';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFormattedNumber, formatNumberClientSide, formatTimestamp } from '@/lib/formatting';
import type { BacktestParams, BacktestResult, DefineStrategyParams, DefineStrategyResult, RunParams, RunResult, Strategy, ApiEnvironment } from '@/ai/types/strategy-types';
import { backtestStrategy, runStrategy, defineNewStrategy } from '@/ai/actions/trading-strategy-actions';
import { fetchAccountBalancesAction } from '@/actions/binanceActions';
import { Separator } from '@/components/ui/separator';
import { validateBinanceKeysAction } from '@/actions/binanceValidationActions';
import {
    validateTelegramTokenAction,
    validateTelegramChatIdAction,
    sendTelegramMessageAction
} from '@/actions/telegramActions';
import { fetchDefaultApiSettingsAction, type DefaultApiSettings } from '@/actions/defaultApiSettingsActions';

import { ApiKeySettingsPanel } from '@/components/dashboard/api-settings-panel';
import { TelegramSettingsPanel } from '@/components/dashboard/telegram-settings-panel';


// Initial empty data for charts before loading
const initialCandleData: Candle[] = [];

// Placeholder: Replace with actual trade history fetching if implemented
const tradeHistoryData: any[] = []; // Example: Placeholder for trade history

// Will be populated by API, used for backtesting dropdown.
let allAvailablePairsStore: SymbolInfo[] = [];


// --- Updated Initial Strategies (Total 30) ---
const availableStrategies: Strategy[] = [
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


// Chart Colors
const PIE_CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(180, 63%, 49%)", // Cyan
  "hsl(240, 63%, 60%)", // Indigo
  "hsl(330, 70%, 55%)", // Pink
  "hsl(75, 70%, 45%)", // Lime
  "hsl(200, 80%, 50%)", // Sky
];

// User-defined list of pairs for the bot selection
const userDefinedPairSymbols: string[] = [
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT', 'ADA/USDT', 'AVAX/USDT',
    'SHIB/USDT', 'DOT/USDT', 'LINK/USDT', 'TRX/USDT', 'MATIC/USDT', 'LTC/USDT', 'BCH/USDT', 'NEAR/USDT',
    'PEPE/USDT', 'WIF/USDT', 'ICP/USDT', 'UNI/USDT', 'ETC/USDT', 'APT/USDT', 'FIL/USDT', 'OP/USDT',
    'ARB/USDT', 'XLM/USDT', 'HBAR/USDT', 'VET/USDT', 'GRT/USDT', 'RNDR/USDT', 'IMX/USDT', 'TIA/USDT',
    'SUI/USDT', 'SEI/USDT', 'BONK/USDT', 'JUP/USDT', 'PYTH/USDT'
].map(p => p.replace('/', '')); // Ensure no slashes for API calls


// ----- API Validation Types -----
type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'not_checked';

// Custom Candlestick Shape Component
const Candlestick = (props: any) => {
  const { x, y, width, height, low, high, open, close, fill, stroke } = props;
  // fill color is determined by <Cell> in Bar component for the body
  // low, high, open, close are from the original data payload

  // Ensure all necessary props are available
  if (x === undefined || y === undefined || width === undefined || height === undefined ||
      low === undefined || high === undefined || open === undefined || close === undefined) {
    return null;
  }
  const isUp = close >= open; // Changed to >= to handle candles where open equals close

  // Wick line coordinates
  const wickX = x + width / 2;
  const highY = props.yAxis.scale(high);
  const lowY = props.yAxis.scale(low);

  // Body coordinates
  // Recharts 'y' is the top of the bar. Height is |open - close| scaled.
  // For up candles, top of body is 'close'. For down, top of body is 'open'.
  const bodyTopY = props.yAxis.scale(isUp ? close : open);
  const bodyBottomY = props.yAxis.scale(isUp ? open : close);
  const bodyHeight = Math.abs(bodyTopY - bodyBottomY);

  // Ensure bodyHeight is at least 1 to be visible if open and close are very close
  const actualBodyHeight = bodyHeight > 0 ? bodyHeight : 1;
  const actualBodyY = Math.min(bodyTopY, bodyBottomY);


  return (
    <g strokeWidth="1" shapeRendering="crispEdges">
      {/* Wick */}
      <line
        x1={wickX} y1={highY}
        x2={wickX} y2={lowY}
        stroke={fill} // Wick color matches candle body color
      />
      {/* Body */}
      <rect
        x={x}
        y={actualBodyY}
        width={width}
        height={actualBodyHeight}
        fill={fill}
        stroke={stroke || fill} // Use stroke prop if provided, otherwise fill
      />
    </g>
  );
};


// ----- Main Dashboard Component -----
export default function Dashboard() {
  // --- State Definitions ---
  const [selectedPair, setSelectedPair] = React.useState<string>('');
  const [selectedInterval, setSelectedInterval] = React.useState<string>('1h');
  const [botStatus, setBotStatus] = React.useState<'running' | 'stopped'>('stopped');
  const [activeStrategies, setActiveStrategies] = React.useState<string[]>([]);
  const [stopLoss, setStopLoss] = React.useState<string>('');
  const [takeProfit, setTakeProfit] = React.useState<string>('');
  const [availablePairsForBot, setAvailablePairsForBot] = React.useState<SymbolInfo[]>([]); // For bot selection UI
  const [allPairsForBacktest, setAllPairsForBacktest] = React.useState<SymbolInfo[]>([]); // For backtesting dropdown
  const [candleData, setCandleData] = React.useState<Candle[]>(initialCandleData);
  const [portfolioData, setPortfolioData] = React.useState<Balance[]>([]);
  const [totalPortfolioValueUsd, setTotalPortfolioValueUsd] = React.useState<number | null>(null);
  const [loadingPairs, setLoadingPairs] = React.useState(true);
  const [loadingCandles, setLoadingCandles] = React.useState(false);
  const [loadingPortfolio, setLoadingPortfolio] = React.useState(false);
  const [portfolioError, setPortfolioError] = React.useState<string | null>(null);
  const [selectedPairsForBot, setSelectedPairsForBot] = React.useState<string[]>([]);
  const [dynamicLogData, setDynamicLogData] = React.useState<{ timestamp: string; type: string; message: string }[]>([]);

  const [isDefineStrategyDialogOpen, setIsDefineStrategyDialogOpen] = React.useState(false);
  const [defineStrategyParams, setDefineStrategyParams] = React.useState<DefineStrategyParams>({ name: '', description: '', prompt: '' });
  const [isDefiningStrategy, setIsDefiningStrategy] = React.useState(false);
  const [definedStrategies, setDefinedStrategies] = React.useState<Strategy[]>(availableStrategies);

  const [backtestParams, setBacktestParams] = React.useState<Omit<BacktestParams, 'strategy'>>({ pair: '', interval: '1h', startDate: '', endDate: '', initialBalance: 1000 });
  const [selectedBacktestStrategyId, setSelectedBacktestStrategyId] = React.useState<string>('');
  const [backtestResult, setBacktestResult] = React.useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = React.useState(false);

  const [apiKeys, setApiKeys] = React.useState<DefaultApiSettings>({
      spot: { key: '', secret: '' },
      futures: { key: '', secret: '' },
      testnet_spot: { key: '', secret: '' },
      testnet_futures: { key: '', secret: '' },
      telegram: { token: '', chatId: '' },
  });

  const [validationStatus, setValidationStatus] = React.useState<{
      spot: ValidationStatus;
      futures: ValidationStatus;
      testnet_spot: ValidationStatus;
      testnet_futures: ValidationStatus;
      telegramToken: ValidationStatus;
      telegramChatId: ValidationStatus;
  }>({
      spot: 'not_checked',
      futures: 'not_checked',
      testnet_spot: 'not_checked',
      testnet_futures: 'not_checked',
      telegramToken: 'not_checked',
      telegramChatId: 'not_checked',
  });

  const [activeApiEnvironment, setActiveApiEnvironment] = React.useState<ApiEnvironment | null>(null);

  const [latestCandleInfo, setLatestCandleInfo] = React.useState<Candle | null>(null);
  const [priceChangeInfo, setPriceChangeInfo] = React.useState<{percent: number; absolute: number; color: string} | null>(null);


  // --- Helper Functions ---
  const addLog = (type: string, message: string) => {
    const newLog = { timestamp: new Date().toISOString(), type, message };
    setDynamicLogData(prevLogs => [newLog, ...prevLogs].slice(0, 100));
  };


  // --- Effects ---
  React.useEffect(() => {
    const loadDefaultSettings = async () => {
      addLog('INFO', 'Varsayılan API ayarları sunucu ortamından yükleniyor...');
      try {
        const defaultSettings = await fetchDefaultApiSettingsAction();
        setApiKeys(currentSettings => ({
            spot: {
                key: defaultSettings.spot.key || currentSettings.spot.key,
                secret: defaultSettings.spot.secret || currentSettings.spot.secret,
            },
            futures: {
                key: defaultSettings.futures.key || currentSettings.futures.key,
                secret: defaultSettings.futures.secret || currentSettings.futures.secret,
            },
            testnet_spot: {
                key: defaultSettings.testnet_spot.key || currentSettings.testnet_spot.key,
                secret: defaultSettings.testnet_spot.secret || currentSettings.testnet_spot.secret,
            },
            testnet_futures: {
                key: defaultSettings.testnet_futures.key || currentSettings.testnet_futures.key,
                secret: defaultSettings.testnet_futures.secret || currentSettings.testnet_futures.secret,
            },
            telegram: {
                token: defaultSettings.telegram.token || currentSettings.telegram.token,
                chatId: defaultSettings.telegram.chatId || currentSettings.telegram.chatId,
            },
        }));
        
        const anyKeyLoaded = Object.values(defaultSettings).some(env => (env as any).key || (env as any).secret || (env as any).token);
        if (anyKeyLoaded) {
            addLog('INFO', 'Varsayılan API ayarları ortam değişkenlerinden yüklendi ve önceden dolduruldu.');
            toast({ title: "Ayarlar Yüklendi", description: "Ortam değişkenlerinden varsayılan API ayarları yüklendi." });
        } else {
            addLog('INFO', 'Sunucu ortam değişkenlerinde varsayılan API ayarı bulunamadı.');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
        addLog('ERROR', `Varsayılan API ayarları yüklenemedi: ${errorMsg}`);
        toast({ title: "Varsayılan Ayar Yükleme Hatası", description: `Varsayılan API ayarları yüklenemedi: ${errorMsg}`, variant: "destructive" });
      }
    };
    loadDefaultSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const fetchPairs = async () => {
        setLoadingPairs(true);
        setPortfolioError(null);
        addLog('INFO', 'Fetching available trading pairs from Binance...');
        try {
            // Always fetch from SPOT for the most comprehensive list for backtesting.
            const spotInfo = await getExchangeInfo(false, false); // isTestnet=false, isFutures=false for SPOT
            
            allAvailablePairsStore = spotInfo.symbols
                .filter(s => s.status === 'TRADING' && s.isSpotTradingAllowed)
                .sort((a, b) => a.symbol.localeCompare(b.symbol));
            
            setAllPairsForBacktest(allAvailablePairsStore);

            // Filter the user-defined list against what's available and trading on SPOT
            const activeUserDefinedPairs = allAvailablePairsStore.filter(exchangePair =>
                userDefinedPairSymbols.includes(exchangePair.symbol)
            );
            setAvailablePairsForBot(activeUserDefinedPairs);

            if (activeUserDefinedPairs.length > 0 && !selectedPair) {
                const defaultPair = activeUserDefinedPairs.find(p => p.symbol === 'BTCUSDT') || activeUserDefinedPairs[0];
                setSelectedPair(defaultPair.symbol);
                setBacktestParams(prev => ({ ...prev, pair: defaultPair.symbol }));
                addLog('INFO', `Successfully fetched ${allAvailablePairsStore.length} total Spot pairs. Using ${activeUserDefinedPairs.length} user-defined pairs for bot selection. Default pair set to ${defaultPair.symbol}.`);
            } else if (activeUserDefinedPairs.length === 0) {
                addLog('WARN', `None of the user-defined pairs are currently trading or available on Binance Spot. Total Spot pairs: ${allAvailablePairsStore.length}.`);
                if (allAvailablePairsStore.length > 0 && !selectedPair) { 
                    setSelectedPair(allAvailablePairsStore[0].symbol);
                    setBacktestParams(prev => ({ ...prev, pair: allAvailablePairsStore[0].symbol}));
                    addLog('INFO', `Defaulting to first available pair from Spot: ${allAvailablePairsStore[0].symbol}`);
                }
            } else if (selectedPair && !activeUserDefinedPairs.find(p => p.symbol === selectedPair) && allAvailablePairsStore.length > 0) {
                // If current selectedPair is not in the filtered user list, reset to default from user list or general list
                const newDefault = activeUserDefinedPairs.find(p => p.symbol === 'BTCUSDT') || activeUserDefinedPairs[0] || allAvailablePairsStore[0];
                if (newDefault) {
                  setSelectedPair(newDefault.symbol);
                  setBacktestParams(prev => ({ ...prev, pair: newDefault.symbol }));
                  addLog('INFO', `Current selected pair ${selectedPair} not in user-defined list, reset to ${newDefault.symbol}.`);
                }
                addLog('INFO', `Displaying ${activeUserDefinedPairs.length} user-defined pairs for bot (active on Spot). Total Spot pairs: ${allAvailablePairsStore.length}.`);
            } else {
                 addLog('INFO', `Displaying ${activeUserDefinedPairs.length} user-defined pairs for bot (active on Spot). Total Spot pairs: ${allAvailablePairsStore.length}.`);
            }

        } catch (err) {
            console.error("Failed to fetch exchange info:", err);
            const errorMsg = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
            setPortfolioError(`Parite verileri yüklenemedi: ${errorMsg}`);
            addLog('ERROR', `Failed to fetch exchange info: ${errorMsg}`);
            toast({ title: "Hata", description: `Binance pariteleri alınamadı: ${errorMsg}`, variant: "destructive" });
        } finally {
            setLoadingPairs(false);
        }
    };
    fetchPairs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  React.useEffect(() => {
    const fetchCandleData = async () => {
      if (!selectedPair) return;
      setLoadingCandles(true);
      setCandleData([]); 
      setLatestCandleInfo(null);
      setPriceChangeInfo(null);

      const isTestnet = activeApiEnvironment ? (activeApiEnvironment === 'testnet_spot' || activeApiEnvironment === 'testnet_futures') : false;
      const isFutures = activeApiEnvironment ? (activeApiEnvironment === 'futures' || activeApiEnvironment === 'testnet_futures') : false;
      const envLabel = activeApiEnvironment?.replace('_', ' ').toUpperCase() || 'Spot (Default)';
      addLog('INFO', `Fetching candlestick data for ${selectedPair} (${selectedInterval}) from ${envLabel}...`);

      try {
          const data = await getCandlestickData(selectedPair, selectedInterval, isTestnet, isFutures, 200); // Fetch 200 candles
          setCandleData(data);

          if (data.length > 0) {
            addLog('INFO', `Successfully fetched ${data.length} candles for ${selectedPair} (${selectedInterval}) from ${envLabel}.`);
            const latestCandle = data[data.length - 1];
            setLatestCandleInfo(latestCandle);

            if (data.length > 1) {
                const firstCandleInPeriod = data[0]; 
                const change = latestCandle.close - firstCandleInPeriod.close;
                const percent = firstCandleInPeriod.close !== 0 ? (change / firstCandleInPeriod.close) * 100 : 0;
                setPriceChangeInfo({
                    percent: percent,
                    absolute: change,
                    color: percent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                });
            }
          } else {
            addLog('WARN', `No candlestick data returned for ${selectedPair} (${selectedInterval}) from ${envLabel}.`);
          }
      } catch (err) {
        console.error(`Failed to fetch candlestick data for ${selectedPair} (${envLabel}):`, err);
        const errorMsg = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
        setCandleData([]); 
        addLog('ERROR', `Failed to fetch candlestick data for ${selectedPair} (${envLabel}): ${errorMsg}`);
      } finally {
        setLoadingCandles(false);
      }
    };
    fetchCandleData();
  }, [selectedPair, selectedInterval, activeApiEnvironment]);

  const activeEnvValidationStatus = React.useMemo(() => {
    return activeApiEnvironment ? validationStatus[activeApiEnvironment] : undefined;
  }, [activeApiEnvironment, validationStatus]);

  React.useEffect(() => {
      const fetchPortfolio = async () => {
          if (!activeApiEnvironment) {
              setPortfolioData([]);
              setTotalPortfolioValueUsd(null);
              setPortfolioError(null);
              setLoadingPortfolio(false);
              return;
          }

          if (validationStatus[activeApiEnvironment] !== 'valid') {
               setPortfolioData([]);
               setTotalPortfolioValueUsd(null);
               setPortfolioError(`API anahtarları ${activeApiEnvironment.replace('_',' ').toUpperCase()} için doğrulanmadı.`);
               setLoadingPortfolio(false);
               return;
          }

          setLoadingPortfolio(true);
          setPortfolioError(null);
          setTotalPortfolioValueUsd(null); 
          const envLabel = activeApiEnvironment.replace('_', ' ').toUpperCase();
          addLog('INFO', `Fetching portfolio data for ${envLabel} environment...`);

          try {
              const apiKeyHint = apiKeys[activeApiEnvironment].key.substring(0, 4); 
              const secretKeyHint = '****'; 
              
              const result = await fetchAccountBalancesAction(apiKeyHint, secretKeyHint, activeApiEnvironment);

              if (result.success && result.balances) {
                  const filteredBalances = result.balances
                      .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
                       .sort((a, b) => {
                          const isAQuote = ['USDT', 'BUSD', 'USDC', 'TRY', 'EUR'].includes(a.asset);
                          const isBQuote = ['USDT', 'BUSD', 'USDC', 'TRY', 'EUR'].includes(b.asset);
                          if (isAQuote && !isBQuote) return -1;
                          if (!isAQuote && isBQuote) return 1;
                          return a.asset.localeCompare(b.asset);
                      });
                  setPortfolioData(filteredBalances);
                  addLog('INFO', `Successfully fetched portfolio (${envLabel}). Found ${filteredBalances.length} assets with non-zero balance.`);
                  if (filteredBalances.length === 0) {
                      addLog('INFO', `Portfolio (${envLabel}) is empty or all balances are zero.`);
                  }

                   let estimatedTotal = 0;
                   const stablecoins = ['USDT', 'USDC', 'BUSD', 'TUSD', 'DAI']; 
                   const tryEurRate = { TRY: 0.03, EUR: 1.08 }; 
                   
                   const basePrices: Record<string, number> = {
                       BTC: 65000, ETH: 3500, SOL: 150, BNB: 600,
                       ADA: 0.45, XRP: 0.5, DOGE: 0.15, SHIB: 0.000025,
                       // Add other common assets if needed for fallback
                   };

                   // Create a mutable copy for conditional updates
                   const prices = { ...basePrices };

                   if (latestCandleInfo && selectedPair) {
                       const baseAsset = selectedPair.replace(/USDT$|BUSD$|TRY$|EUR$/, ''); // Simple way to get base asset
                       if (prices.hasOwnProperty(baseAsset)) {
                           prices[baseAsset] = latestCandleInfo.close;
                       } else if (selectedPair.startsWith('BTC') && !selectedPair.endsWith('BTC') && prices.hasOwnProperty('BTC')) {
                           prices['BTC'] = latestCandleInfo.close;
                       } else if (selectedPair.startsWith('ETH') && !selectedPair.endsWith('ETH') && prices.hasOwnProperty('ETH')) {
                           prices['ETH'] = latestCandleInfo.close;
                       } else if (selectedPair.startsWith('SOL') && !selectedPair.endsWith('SOL') && prices.hasOwnProperty('SOL')) {
                           prices['SOL'] = latestCandleInfo.close;
                       } else if (selectedPair.startsWith('BNB') && !selectedPair.endsWith('BNB') && prices.hasOwnProperty('BNB')) {
                           prices['BNB'] = latestCandleInfo.close;
                       }
                   }


                   filteredBalances.forEach(b => {
                      const totalAmount = parseFloat(b.free) + parseFloat(b.locked);
                      if (stablecoins.includes(b.asset)) {
                          estimatedTotal += totalAmount; 
                      } else if (b.asset === 'TRY' && tryEurRate.TRY) {
                          estimatedTotal += totalAmount * tryEurRate.TRY;
                      } else if (b.asset === 'EUR' && tryEurRate.EUR) {
                          estimatedTotal += totalAmount * tryEurRate.EUR;
                      } else if (prices[b.asset]) {
                         estimatedTotal += totalAmount * prices[b.asset];
                      }
                   });
                  setTotalPortfolioValueUsd(estimatedTotal);
                  addLog('INFO', `Estimated total portfolio value (${envLabel}): ~$${estimatedTotal.toFixed(2)} USD`);

              } else {
                   const errMsg = result.error || `Failed to fetch balances for ${envLabel}.`;
                   setPortfolioError(errMsg);
                   setPortfolioData([]); 
                   setTotalPortfolioValueUsd(null);
                   if (activeApiEnvironment && (errMsg.includes('API anahtarları') || errMsg.includes('yapılandırılmamış') || errMsg.includes('Geçersiz'))) {
                        setValidationStatus(prev => ({ ...prev, [activeApiEnvironment!]: 'invalid' }));
                        addLog('WARN', `Portfolio fetch failed (${envLabel}) due to API key issue, setting status to invalid.`);
                   }
                   addLog('ERROR', `Portfolio fetch failed (${envLabel}): ${errMsg}`);
              }
          } catch (err) {
              const errorMsg = err instanceof Error ? err.message : "Portföy yüklenirken bilinmeyen bir hata oluştu.";
              console.error(`Failed to fetch portfolio (${envLabel}):`, err);
              setPortfolioError(errorMsg);
              addLog('ERROR', `Failed to fetch portfolio (${envLabel}): ${errorMsg}`);
              setPortfolioData([]); 
              setTotalPortfolioValueUsd(null);
          } finally {
              setLoadingPortfolio(false);
          }
      };

      const currentValidationStatus = activeApiEnvironment ? validationStatus[activeApiEnvironment] : 'not_checked';
      if (activeApiEnvironment && currentValidationStatus === 'valid') {
        fetchPortfolio();
      } else if (activeApiEnvironment && currentValidationStatus !== 'valid') {
        setPortfolioData([]);
        setTotalPortfolioValueUsd(null);
        setPortfolioError(`Lütfen aktif ortam (${activeApiEnvironment.replace('_',' ').toUpperCase()}) için API anahtarlarını doğrulayın.`);
        setLoadingPortfolio(false);
      } else {
        setPortfolioData([]);
        setTotalPortfolioValueUsd(null);
        setPortfolioError(null); 
        setLoadingPortfolio(false);
      }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [activeApiEnvironment, activeEnvValidationStatus, latestCandleInfo, selectedPair]);


  // --- Handlers ---
  const toggleBotStatus = async () => {
     const newStatus = botStatus === 'running' ? 'stopped' : 'running';
     const envLabel = activeApiEnvironment ? activeApiEnvironment.replace('_', ' ').toUpperCase() : 'Bilinmeyen Ortam';

     if (newStatus === 'running') {
         if (!activeApiEnvironment || validationStatus[activeApiEnvironment] !== 'valid') {
             toast({ title: "API Doğrulaması Gerekli", description: `Lütfen aktif ortam (${envLabel}) için API anahtarlarını doğrulayın.`, variant: "destructive" });
             addLog('WARN', `Bot start prevented: Active API environment (${envLabel}) not validated.`);
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

        setBotStatus('running'); 
        const strategies = activeStrategies.map(id => definedStrategies.find(s=>s.id===id)?.name).filter(Boolean);
        toast({ title: `Bot Başlatılıyor...`, description: `Ortam: ${envLabel}. Pariteler: ${selectedPairsForBot.join(', ')}. Stratejiler: ${strategies.join(', ')}.` });
        addLog('INFO', `Bot starting... Env: ${envLabel}, Pairs: ${selectedPairsForBot.join(', ') || 'None'}. Strategies: ${strategies.join(', ') || 'None'}.`);

        let strategyStartSuccessCount = 0;
        let strategyStartFailCount = 0;

        for (const pair of selectedPairsForBot) {
            for (const strategyId of activeStrategies) {
                const strategy = definedStrategies.find(s => s.id === strategyId);
                if (strategy) {
                    try {
                        addLog('INFO', `Attempting to start strategy '${strategy.name}' on ${pair} (${envLabel})...`);
                        const runParams: RunParams = {
                            strategy,
                            pair,
                            interval: selectedInterval,
                            stopLossPercent: stopLoss ? parseFloat(stopLoss) : undefined,
                            takeProfitPercent: takeProfit ? parseFloat(takeProfit) : undefined,
                            environment: activeApiEnvironment!,
                        };
                        const result: RunResult = await runStrategy(runParams);
                        addLog('STRATEGY_START', `Strategy '${strategy.name}' on ${pair} (${envLabel}) status: ${result.status}. ${result.message || ''}`);
                        if(result.status.toLowerCase() !== 'error') {
                            strategyStartSuccessCount++;
                        } else {
                            strategyStartFailCount++;
                        }
                    } catch (error) {
                        strategyStartFailCount++;
                        const message = error instanceof Error ? error.message : "Bilinmeyen hata";
                        toast({ title: "Bot Strateji Hatası", description: `${strategy.name} - ${pair} (${envLabel}): Başlatılamadı: ${message}`, variant: "destructive" });
                        addLog('ERROR', `Failed to start strategy '${strategy.name}' on ${pair} (${envLabel}): ${message}`);
                    }
                } else {
                    strategyStartFailCount++;
                    addLog('ERROR', `Strategy not found: ${strategyId} (Pair: ${pair})`);
                }
            }
        }

        addLog('INFO', `Strategy start attempt complete. Success: ${strategyStartSuccessCount}, Failed: ${strategyStartFailCount}.`);

        let finalBotStatus = 'running'; 
        let telegramMessageText = '';

        if (strategyStartSuccessCount === 0 && strategyStartFailCount > 0) {
            finalBotStatus = 'stopped'; 
            setBotStatus('stopped'); // Update UI immediately
            toast({
                title: "Bot Başlatılamadı",
                description: `Tüm stratejiler başlatılırken hata oluştu (${strategyStartFailCount} hata). Lütfen logları kontrol edin.`,
                variant: "destructive"
            });
            addLog('ERROR', `Bot completely failed to start. All ${strategyStartFailCount} strategy initializations failed.`);
        } else if (strategyStartFailCount > 0) {
            toast({
                title: "Kısmi Başlatma",
                description: `${strategyStartSuccessCount} strateji başlatıldı, ${strategyStartFailCount} başlatılamadı. Detaylar için logları inceleyin.`,
                variant: "default" 
            });
            addLog('WARN', `Bot started with partial success. Success: ${strategyStartSuccessCount}, Failed: ${strategyStartFailCount}.`);
            telegramMessageText = `⚠️ KriptoPilot bot (${envLabel}) ${selectedPairsForBot.length} paritede kısmen aktif. Başarılı: ${strategyStartSuccessCount}, Başarısız: ${strategyStartFailCount} strateji.`;
        } else if (strategyStartSuccessCount > 0 && strategyStartFailCount === 0) {
             toast({ title: `Bot Başarıyla Başlatıldı`, description: `${strategyStartSuccessCount} strateji ${envLabel} ortamında aktif.`});
             telegramMessageText = `✅ KriptoPilot bot (${envLabel}) ${selectedPairsForBot.length} paritede ${strategyStartSuccessCount} strateji ile tamamen aktif.`;
        }
        
        setBotStatus(finalBotStatus);

        if (finalBotStatus === 'running' && telegramMessageText) { 
            try {
                const telegramResult = await sendTelegramMessageAction(apiKeys.telegram.token, apiKeys.telegram.chatId, telegramMessageText);
                if (telegramResult.success) {
                  addLog('TELEGRAM', 'Bot start notification sent.');
                } else {
                  addLog('TELEGRAM_ERROR', `Bot start notification failed: ${telegramResult.message}`);
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : "Bilinmeyen hata";
                console.error("Error sending Telegram start message:", error);
                addLog('TELEGRAM_ERROR', `Bot start notification failed: ${errorMsg}`);
            }
        }


    } else { 
        setBotStatus('stopped');
        toast({ title: 'Bot Durduruldu.', description: `Aktif ortam: ${envLabel}` });
        addLog('INFO', `Bot stopping process initiated for environment ${envLabel}.`);
        console.log(`Stopping bot for environment ${envLabel}... (Placeholder: actual stop logic needed)`);

        if (validationStatus.telegramToken === 'valid' && validationStatus.telegramChatId === 'valid') {
            try {
                const telegramResult = await sendTelegramMessageAction(apiKeys.telegram.token, apiKeys.telegram.chatId, `🛑 KriptoPilot bot (${envLabel}) durduruldu.`);
                if (telegramResult.success) {
                  addLog('TELEGRAM', 'Bot stop notification sent.');
                } else {
                  addLog('TELEGRAM_ERROR', `Bot stop notification failed: ${telegramResult.message}`);
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : "Bilinmeyen hata";
                console.error("Error sending Telegram stop message:", error);
                addLog('TELEGRAM_ERROR', `Bot stop notification failed: ${errorMsg}`);
            }
        }
    }
  };

  const handleStrategyToggle = (strategyId: string) => {
    setActiveStrategies((prev) => {
      const isAdding = !prev.includes(strategyId);
       const newStrategies = isAdding ? [...prev, strategyId] : prev.filter((id) => id !== strategyId);
      const strategyName = definedStrategies.find(s => s.id === strategyId)?.name || strategyId;
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
    value: string,
    env: ApiEnvironment, 
    field: 'key' | 'secret'
  ) => {
    setApiKeys(prev => ({
      ...prev,
      [env]: { ...prev[env], [field]: value },
    }));
    setValidationStatus(prev => ({ ...prev, [env]: 'not_checked' }));
    addLog('CONFIG', `${env.replace('_',' ').toUpperCase()} API ${field} changed, validation status reset.`);
    if (activeApiEnvironment === env) {
        setActiveApiEnvironment(null); 
        addLog('CONFIG', `Deactivated API environment ${env.replace('_',' ').toUpperCase()} due to key change.`);
        setPortfolioData([]); 
        setTotalPortfolioValueUsd(null);
        setPortfolioError(null);
    }
  };

  const handleTelegramChange = (
      value: string,
      field: 'token' | 'chatId'
  ) => {
      setApiKeys(prev => ({
          ...prev,
          telegram: { ...prev.telegram, [field]: value },
      }));
      if (field === 'token') {
          setValidationStatus(prev => ({ ...prev, telegramToken: 'not_checked', telegramChatId: 'not_checked' }));
          addLog('CONFIG', 'Telegram token changed, validation status reset.');
      } else if (field === 'chatId') {
          setValidationStatus(prev => ({ ...prev, telegramChatId: 'not_checked' }));
          addLog('CONFIG', 'Telegram chat ID changed, validation status reset.');
      }
  };

 const handleValidateApiKey = async (env: ApiEnvironment) => {
    setValidationStatus(prev => ({ ...prev, [env]: 'pending' }));
    const envLabel = env.replace('_', ' ').toUpperCase();
    addLog('INFO', `Validating ${envLabel} API keys via Server Action...`);

    try {
      const result = await validateBinanceKeysAction(apiKeys[env].key, apiKeys[env].secret, env);
      const newStatus = result.isValid ? 'valid' : 'invalid';
      setValidationStatus(prev => ({ ...prev, [env]: newStatus }));

      addLog(result.isValid ? 'INFO' : 'ERROR', `API Key Validation (${envLabel}): ${result.message}`);
      toast({
        title: result.isValid ? "API Anahtarı Doğrulandı" : "API Anahtarı Geçersiz",
        description: result.message,
        variant: result.isValid ? "default" : "destructive",
      });

      if (result.isValid) {
        setActiveApiEnvironment(env);
        addLog('CONFIG', `Activated API environment: ${envLabel}`);
        setPortfolioError(null); 
      } else if (activeApiEnvironment === env) {
        setActiveApiEnvironment(null);
        addLog('CONFIG', `Deactivated API environment ${envLabel} due to failed validation.`);
        setPortfolioData([]); 
        setTotalPortfolioValueUsd(null);
        setPortfolioError(null);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Sunucu aksiyonu çağrılırken bilinmeyen bir hata oluştu.";
      console.error(`Error calling validateBinanceKeysAction for ${envLabel}:`, error);
      setValidationStatus(prev => ({ ...prev, [env]: 'invalid' }));
      addLog('ERROR', `API Key Validation Action Error (${envLabel}): ${errorMsg}`);
      toast({
        title: "Doğrulama Hatası",
        description: `${envLabel} API anahtarları doğrulanırken bir sunucu hatası oluştu: ${errorMsg}`,
        variant: "destructive",
      });
      if (activeApiEnvironment === env) { 
        setActiveApiEnvironment(null);
        addLog('CONFIG', `Deactivated API environment ${envLabel} due to validation action error.`);
        setPortfolioData([]);
        setTotalPortfolioValueUsd(null);
        setPortfolioError(null);
      }
    }
  };

  const handleValidateTelegramToken = async () => {
    setValidationStatus(prev => ({ ...prev, telegramToken: 'pending', telegramChatId: 'not_checked' })); 
    addLog('INFO', 'Validating Telegram bot token via Server Action...');
    try {
      const result = await validateTelegramTokenAction(apiKeys.telegram.token);
      setValidationStatus(prev => ({ ...prev, telegramToken: result.isValid ? 'valid' : 'invalid' }));

      addLog(result.isValid ? 'INFO' : 'ERROR', `Telegram Token Validation: ${result.message}`);
      toast({
        title: result.isValid ? "Telegram Token Doğrulandı" : "Telegram Token Geçersiz",
        description: result.message,
        variant: result.isValid ? "default" : "destructive",
      });
       if (!result.isValid) {
            setValidationStatus(prev => ({ ...prev, telegramChatId: 'not_checked'}));
            addLog('WARN', 'Telegram token invalid, chat ID validation cannot proceed.');
       }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Sunucu aksiyonu çağrılırken bilinmeyen bir hata oluştu.";
      console.error("Error calling validateTelegramTokenAction:", error);
      setValidationStatus(prev => ({ ...prev, telegramToken: 'invalid', telegramChatId: 'not_checked' }));
      addLog('ERROR', `Telegram Token Validation Action Error: ${errorMsg}`);
      toast({ title: "Doğrulama Hatası", description: `Telegram token doğrulanırken bir sunucu hatası oluştu: ${errorMsg}`, variant: "destructive" });
    }
  };

  const handleValidateTelegramChatId = async () => {
    if (validationStatus.telegramToken !== 'valid') {
      toast({ title: "Önce Token'ı Doğrulayın", description: "Chat ID'yi test etmek için önce geçerli bir bot token girip doğrulayın.", variant: "destructive" });
      addLog('WARN', 'Telegram chat ID validation prevented: Token not valid.');
      return;
    }
    setValidationStatus(prev => ({ ...prev, telegramChatId: 'pending' }));
    addLog('INFO', `Validating Telegram chat ID ${apiKeys.telegram.chatId} via Server Action...`);

    try {
      const validationResult = await validateTelegramChatIdAction(apiKeys.telegram.token, apiKeys.telegram.chatId);
      
      if (validationResult.isValid) {
        setValidationStatus(prev => ({ ...prev, telegramChatId: 'valid' }));
        addLog('INFO', `Telegram Chat ID ${apiKeys.telegram.chatId} validation successful. Sending test message...`);
        const messageResult = await sendTelegramMessageAction(apiKeys.telegram.token, apiKeys.telegram.chatId, "✅ KriptoPilot Telegram bağlantısı başarıyla doğrulandı!");

        if (messageResult.success) {
            addLog('TELEGRAM', `Test message sent to chat ID ${apiKeys.telegram.chatId}.`);
            toast({
              title: "Telegram Chat ID Doğrulandı",
              description: `Chat ID geçerli. Test mesajı gönderildi: ${apiKeys.telegram.chatId}`,
              variant: "default",
            });
        } else {
             setValidationStatus(prev => ({ ...prev, telegramChatId: 'invalid' })); 
            addLog('TELEGRAM_ERROR', `Test message failed to send: ${messageResult.message}`);
            toast({
              title: "Chat ID Doğrulandı, Mesaj Hatası",
              description: `Chat ID geçerli, ancak test mesajı gönderilemedi: ${messageResult.message || 'Bilinmeyen hata.'} Lütfen botun sohbete eklendiğinden ve mesaj gönderme izni olduğundan emin olun.`,
              variant: "destructive", 
            });
        }
      } else {
         setValidationStatus(prev => ({ ...prev, telegramChatId: 'invalid' }));
         addLog('ERROR', `Telegram Chat ID Validation: ${validationResult.message}`);
         toast({ title: "Telegram Chat ID Geçersiz", description: validationResult.message, variant: "destructive" });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Sunucu aksiyonu çağrılırken bilinmeyen bir hata oluştu.";
      console.error("Error calling Telegram Chat ID validation/messaging actions:", error);
      setValidationStatus(prev => ({ ...prev, telegramChatId: 'invalid' }));
      addLog('ERROR', `Telegram Chat ID Validation/Messaging Action Error: ${errorMsg} (ID: ${apiKeys.telegram.chatId})`);
      toast({ title: "Doğrulama Hatası", description: `Telegram Chat ID işlemleri sırasında sunucu hatası: ${errorMsg}`, variant: "destructive" });
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
        setDefinedStrategies(prev => [...prev, result.strategy!]); 
        toast({ title: "Strateji Tanımlandı", description: result.message || `"${result.strategy.name}" başarıyla tanımlandı.` });
        addLog('AI_TASK', `AI successfully defined strategy '${result.strategy.name}'. ID: ${result.strategy.id}`);
        setIsDefineStrategyDialogOpen(false); 
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

    const strategy = definedStrategies.find(s => s.id === selectedBacktestStrategyId);

    if (!strategy) {
      toast({ title: "Backtest Hatası", description: "Geçerli bir strateji seçilmedi.", variant: "destructive" });
      addLog('BACKTEST_ERROR', 'Backtest failed: No strategy selected.');
      setIsBacktesting(false);
      return;
    }
    addLog('BACKTEST', `Selected Strategy: ${strategy.name}`);

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
        return;
    }
    if (new Date(backtestParams.startDate) >= new Date(backtestParams.endDate)) {
        toast({ title: "Backtest Hatası", description: "Başlangıç tarihi bitiş tarihinden önce olmalıdır.", variant: "destructive" });
        setBacktestResult({ errorMessage: "Geçersiz tarih aralığı.", totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnl: 0, totalPnlPercent: 0, maxDrawdown: 0 });
        addLog('BACKTEST_ERROR', 'Backtest failed: Start date must be before end date.');
        setIsBacktesting(false);
        return;
    }
    addLog('BACKTEST', `Parameters: Pair=${backtestParams.pair}, Interval=${backtestParams.interval}, Start=${backtestParams.startDate}, End=${backtestParams.endDate}, Balance=${backtestParams.initialBalance}`);

    const fullBacktestParams: BacktestParams = {
      strategy: strategy, 
      pair: backtestParams.pair,
      interval: backtestParams.interval,
      startDate: backtestParams.startDate,
      endDate: backtestParams.endDate,
      initialBalance: backtestParams.initialBalance,
    };

    try {
      addLog('BACKTEST', `Calling backtestStrategy action for ${strategy.name} on ${backtestParams.pair} (Spot Data)...`);
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
    const total = parseFloat(balance.free) + parseFloat(balance.locked);
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
        const formattedPrice = formatNumberClientSide(trade.price, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 8 });
        const formattedAmount = formatNumberClientSide(trade.qty, { maximumFractionDigits: 8 });
        const formattedTotal = formatNumberClientSide(trade.quoteQty, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

       return (
           <TableRow key={trade.id || trade.orderId}> 
               <TableCell className="text-xs whitespace-nowrap">{formatTimestamp(trade.time)}</TableCell>
               <TableCell>{trade.symbol}</TableCell>
               <TableCell className={cn("font-medium", trade.isBuyer === false ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500')}>{trade.isBuyer === false ? 'BUY' : 'SELL'}</TableCell>
               <TableCell className="text-right tabular-nums">{formattedPrice}</TableCell>
               <TableCell className="text-right tabular-nums">{formattedAmount}</TableCell>
               <TableCell className="text-right tabular-nums">{formattedTotal}</TableCell>
               <TableCell className="text-right text-xs capitalize">{trade.commissionAsset || 'N/A'}</TableCell>
           </TableRow>
       );
   };

  const ChartTooltipContent = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const dataPoint = payload[0].payload; // The raw candle data
        if (!dataPoint) return null;

        const timeLabel = formatTimestamp(label, 'full'); 
        const open = formatNumberClientSide(dataPoint.open, { maximumFractionDigits: Math.max(2, String(dataPoint.open).split('.')[1]?.length || 0) });
        const high = formatNumberClientSide(dataPoint.high, { maximumFractionDigits: Math.max(2, String(dataPoint.high).split('.')[1]?.length || 0) });
        const low = formatNumberClientSide(dataPoint.low, { maximumFractionDigits: Math.max(2, String(dataPoint.low).split('.')[1]?.length || 0) });
        const close = formatNumberClientSide(dataPoint.close, { maximumFractionDigits: Math.max(2, String(dataPoint.close).split('.')[1]?.length || 0) });
        const volume = formatNumberClientSide(dataPoint.volume, { notation: 'compact', maximumFractionDigits: 2 });

        return (
          <div className="custom-tooltip p-2.5 bg-background/90 border border-border rounded-lg shadow-xl text-card-foreground text-xs backdrop-blur-sm">
            <p className="label font-semibold text-sm mb-1.5">{`${selectedPair} - ${timeLabel}`}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                <span className="font-medium text-muted-foreground">Açılış:</span><span className="text-right">{open}</span>
                <span className="font-medium text-muted-foreground">Yüksek:</span><span className="text-right">{high}</span>
                <span className="font-medium text-muted-foreground">Düşük:</span><span className="text-right">{low}</span>
                <span className="font-medium text-muted-foreground">Kapanış:</span><span className="text-right">{close}</span>
                <span className="font-medium text-muted-foreground">Hacim:</span><span className="text-right">{volume}</span>
            </div>
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


  const pieChartData = React.useMemo(() => {
      if (!portfolioData || !totalPortfolioValueUsd || totalPortfolioValueUsd === 0) return [];

      const stablecoins = ['USDT', 'USDC', 'BUSD', 'TUSD', 'DAI'];
      const tryEurRate = { TRY: 0.03, EUR: 1.08 }; 
      
      const basePrices: Record<string, number> = {
          BTC: 65000, ETH: 3500, SOL: 150, BNB: 600,
          ADA: 0.45, XRP: 0.5, DOGE: 0.15, SHIB: 0.000025
      };
      
      const prices = { ...basePrices };

      if (latestCandleInfo && selectedPair) {
          const baseAsset = selectedPair.replace(/USDT$|BUSD$|TRY$|EUR$/, '');
          if (prices.hasOwnProperty(baseAsset)) {
              prices[baseAsset] = latestCandleInfo.close;
          } else if (selectedPair.startsWith('BTC') && !selectedPair.endsWith('BTC') && prices.hasOwnProperty('BTC')) {
              prices['BTC'] = latestCandleInfo.close;
          } else if (selectedPair.startsWith('ETH') && !selectedPair.endsWith('ETH') && prices.hasOwnProperty('ETH')) {
              prices['ETH'] = latestCandleInfo.close;
          } else if (selectedPair.startsWith('SOL') && !selectedPair.endsWith('SOL') && prices.hasOwnProperty('SOL')) {
              prices['SOL'] = latestCandleInfo.close;
          } else if (selectedPair.startsWith('BNB') && !selectedPair.endsWith('BNB') && prices.hasOwnProperty('BNB')) {
              prices['BNB'] = latestCandleInfo.close;
          }
      }

      return portfolioData
          .map(balance => {
              const totalAmount = parseFloat(balance.free) + parseFloat(balance.locked);
              let valueUsd = 0;
              if (stablecoins.includes(balance.asset)) {
                  valueUsd = totalAmount;
              } else if (balance.asset === 'TRY' && tryEurRate.TRY) {
                  valueUsd = totalAmount * tryEurRate.TRY;
              } else if (balance.asset === 'EUR' && tryEurRate.EUR) {
                  valueUsd = totalAmount * tryEurRate.EUR;
              } else if (prices[balance.asset]) {
                  valueUsd = totalAmount * prices[balance.asset];
              } else {
                  return null;
              }
              return valueUsd > 0.01 ? { name: balance.asset, value: valueUsd } : null;
          })
          .filter((item): item is { name: string; value: number } => item !== null)
          .sort((a, b) => b.value - a.value); 
  }, [portfolioData, totalPortfolioValueUsd, latestCandleInfo, selectedPair]);

  const PortfolioPieChart = () => {
    if (loadingPortfolio || !pieChartData || pieChartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[150px] text-muted-foreground text-sm">
                {loadingPortfolio ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Dağılım verisi yok."}
            </div>
        );
    }

    const chartSize = 150; 

    return (
        <div className="flex flex-col items-center gap-2">
            <ResponsiveContainer width={chartSize} height={chartSize}>
                <ComposedChart> {/* Changed from PieChart to ComposedChart to avoid Recharts Pie warning */}
                    <ChartTooltip
                        cursor={false}
                        content={({ active, payload }) => {
                             if (active && payload && payload.length && payload[0].payload) { // Check payload[0].payload
                                const data = payload[0].payload as any; // Type assertion
                                if (!data) return null;
                                const value = data?.value !== undefined ? data.value : 0;
                                const totalValue = totalPortfolioValueUsd || 1; 
                                return (
                                  <div className="rounded-lg border bg-background p-2 text-xs shadow-sm">
                                    <div className="font-medium">{data.name}</div>
                                    <div className="text-muted-foreground">
                                       {formatNumberClientSide(value, { style: 'currency', currency: 'USD' })}
                                       {' '}
                                       ({formatNumberClientSide((value / totalValue) * 100)}%)
                                    </div>
                                  </div>
                                );
                              }
                             return null;
                        }}
                    />
                    <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={chartSize / 2 - 5} 
                        innerRadius={chartSize / 2 - 25} 
                        strokeWidth={2}
                        paddingAngle={1} 
                    >
                        {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} stroke={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}/>
                        ))}
                    </Pie>
                </ComposedChart>
            </ResponsiveContainer>
             <div className="text-center">
                 <p className="text-xs text-muted-foreground">Toplam Değer (Tahmini)</p>
                 <p className="text-lg font-semibold">
                     {totalPortfolioValueUsd !== null ? useFormattedNumber(totalPortfolioValueUsd, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '...'}
                 </p>
             </div>
        </div>
    );
  };
  
  return (
    <SidebarProvider>
       <Sidebar side="left" collapsible="icon" variant="sidebar">
         <SidebarHeader>
           <Link href="/" className="flex items-center gap-2 p-2">
             <TrendingUp className="h-6 w-6 text-primary" />
             <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">KriptoPilot</span>
           </Link>
         </SidebarHeader>

         <SidebarContent>
           <SidebarMenu>
             <SidebarMenuItem>
               <SidebarMenuButton href="#" isActive={true} tooltip="Gösterge Paneli">
                 <Home />
                 <span>Gösterge Paneli</span>
               </SidebarMenuButton>
             </SidebarMenuItem>

             <SidebarMenuItem>
               <SidebarMenuButton href="#portfolio" tooltip="Portföy">
                 <Wallet />
                 <span>Portföy</span>
               </SidebarMenuButton>
             </SidebarMenuItem>

             <SidebarMenuItem>
               <SidebarMenuButton href="#strategies" tooltip="Stratejiler">
                 <BrainCircuit />
                 <span>Stratejiler</span>
               </SidebarMenuButton>
               <SidebarMenuSub>
                 <SidebarMenuSubItem><SidebarMenuSubButton href="#strategies-manage">Yönetim</SidebarMenuSubButton></SidebarMenuSubItem>
                 <SidebarMenuSubItem><SidebarMenuSubButton href="#strategies-backtest">Geriye Dönük Test</SidebarMenuSubButton></SidebarMenuSubItem>
                 <SidebarMenuSubItem><SidebarMenuSubButton href="#strategies-risk">Risk Yönetimi</SidebarMenuSubButton></SidebarMenuSubItem>
               </SidebarMenuSub>
             </SidebarMenuItem>

             <SidebarMenuItem>
               <SidebarMenuButton href="#bot-pairs" tooltip="Bot Pariteleri">
                 <List />
                 <span>Bot Pariteleri</span>
               </SidebarMenuButton>
             </SidebarMenuItem>
           </SidebarMenu>
         </SidebarContent>

         <SidebarFooter>
           <Separator />
           <SidebarMenu>
             <SidebarMenuItem>
               <SidebarMenuButton href="#settings" tooltip="Ayarlar">
                 <Settings />
                 <span>Ayarlar</span>
               </SidebarMenuButton>
             </SidebarMenuItem>
           </SidebarMenu>
         </SidebarFooter>
       </Sidebar>

      <SidebarInset className="flex flex-col p-4 md:p-6">
        <Card className="mb-4 md:mb-6">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-4 gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={loadingPairs ? "Yükleniyor..." : (availablePairsForBot.length === 0 ? "Parite Yok" : "Parite Seç")} />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[300px]">
                    {loadingPairs ? (
                      <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                    ) : availablePairsForBot.length > 0 ? (
                      availablePairsForBot.map((pair) => (
                        <SelectItem key={pair.symbol} value={pair.symbol}>
                          {pair.baseAsset}/{pair.quoteAsset}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no_pairs" disabled>Parite bulunamadı.</SelectItem>
                    )}
                  </ScrollArea>
                </SelectContent>
              </Select>

              <Select value={selectedInterval} onValueChange={setSelectedInterval}>
                <SelectTrigger className="w-full md:w-[100px]">
                  <SelectValue placeholder="Aralık" />
                </SelectTrigger>
                <SelectContent>
                  {['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'].map(interval => (
                    <SelectItem key={interval} value={interval}>{interval}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium px-2 py-1 rounded",
                botStatus === 'running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                'dark:bg-opacity-20', 
                botStatus === 'running' ? 'dark:bg-green-800/30 dark:text-green-300' : 'dark:bg-red-800/30 dark:text-red-300'
              )}>
                Bot: {botStatus === 'running' ? 'Çalışıyor' : 'Durdu'}
                {botStatus === 'running' && activeApiEnvironment && ` (${activeApiEnvironment.replace('_',' ').toUpperCase()})`}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={toggleBotStatus}
                      variant={botStatus === 'running' ? 'destructive' : 'default'}
                      disabled={
                        botStatus === 'stopped' && (
                          !activeApiEnvironment ||
                          validationStatus[activeApiEnvironment] !== 'valid' ||
                          validationStatus.telegramToken !== 'valid' ||
                          validationStatus.telegramChatId !== 'valid' ||
                          activeStrategies.length === 0 ||
                          selectedPairsForBot.length === 0
                        )
                      }
                    >
                      {botStatus === 'running' ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
                      {botStatus === 'running' ? 'Durdur' : 'Başlat'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!activeApiEnvironment ? "Botu başlatmak için bir API ortamını doğrulayın." :
                      validationStatus[activeApiEnvironment!] !== 'valid' ? `Botu başlatmak için ${activeApiEnvironment!.replace('_',' ').toUpperCase()} API anahtarlarını doğrulayın.` :
                        (validationStatus.telegramToken !== 'valid' || validationStatus.telegramChatId !== 'valid') ? "Botu başlatmak için Telegram ayarlarını doğrulayın." :
                          botStatus === 'stopped' && activeStrategies.length === 0 ? "Botu başlatmak için en az bir strateji seçin." :
                            botStatus === 'stopped' && selectedPairsForBot.length === 0 ? "Botu başlatmak için en az bir parite seçin." :
                              botStatus === 'running' ? `Botu (${activeApiEnvironment!.replace('_',' ').toUpperCase()}) durdur.` : `Botu (${activeApiEnvironment!.replace('_',' ').toUpperCase()}) başlat.`
                    }
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 flex-1">
          {/* Main Chart Area */}
          <Card className="lg:col-span-2">
             <CardHeader className="flex flex-col space-y-1 pb-2 pt-3 px-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <CardTitle className="text-xl font-bold text-foreground">
                        {selectedPair ? `${selectedPair.replace('USDT', '/USDT')}` : "Grafik"}
                        {loadingCandles && <Loader2 className="ml-2 h-4 w-4 animate-spin inline-block text-muted-foreground" />}
                    </CardTitle>
                    {latestCandleInfo && !loadingCandles && (
                        <div className="flex items-baseline gap-2 text-lg">
                            <span className={cn("font-semibold", priceChangeInfo?.color || 'text-foreground')}>
                                {formatNumberClientSide(latestCandleInfo.close)}
                            </span>
                            {priceChangeInfo && (
                                <>
                                <span className={cn("text-sm font-medium", priceChangeInfo.color)}>
                                    {formatNumberClientSide(priceChangeInfo.absolute, { signDisplay: 'always', maximumFractionDigits: Math.max(2, String(latestCandleInfo.close).split('.')[1]?.length || 0)})}
                                </span>
                                <span className={cn("text-sm font-medium", priceChangeInfo.color)}>
                                    ({priceChangeInfo.percent >= 0 ? '+' : ''}{formatNumberClientSide(priceChangeInfo.percent, {maximumFractionDigits: 2})}%)
                                </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
                 {latestCandleInfo && !loadingCandles && (
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>A: <span className="text-foreground/90">{formatNumberClientSide(latestCandleInfo.open)}</span></span>
                        <span>Y: <span className="text-foreground/90">{formatNumberClientSide(latestCandleInfo.high)}</span></span>
                        <span>D: <span className="text-foreground/90">{formatNumberClientSide(latestCandleInfo.low)}</span></span>
                        <span>K: <span className="text-foreground/90">{formatNumberClientSide(latestCandleInfo.close)}</span></span>
                    </div>
                )}
                 <CardDescription className="text-xs text-muted-foreground pt-1">
                   {selectedInterval} {activeApiEnvironment && `(${activeApiEnvironment.replace('_', ' ').toUpperCase()})`}
                 </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Price Chart */}
              <div className="h-[350px] w-full pt-2 pr-2 pb-0 pl-0">
                 {loadingCandles ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Grafik yükleniyor...</span>
                    </div>
                 ) : candleData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart data={candleData} syncId="marketDataSync" margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} vertical={false}/>
                            <XAxis
                                dataKey="closeTime"
                                tickFormatter={(value) => formatTimestamp(value, 'short')}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={false} tickLine={false} interval="preserveStartEnd" tickCount={7} dy={5}
                            />
                            <YAxis
                                yAxisId="price"
                                orientation="right"
                                tickFormatter={(value) => formatNumberClientSide(value, {notation: 'compact', maximumFractionDigits: Math.max(2, String(value).split('.')[1]?.length || 0)})}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={false} tickLine={false}
                                domain={['dataMin - dataMin * 0.02', 'dataMax + dataMax * 0.02']} // Add padding
                                allowDataOverflow={true}
                            />
                             <TooltipProvider>
                                <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: 'hsl(var(--accent-foreground))', strokeWidth: 0.5, strokeDasharray: '3 3' }}/>
                             </TooltipProvider>
                            <Bar yAxisId="price" dataKey="open" strokeWidth={0}>
                                {candleData.map((entry, index) => (
                                    <Cell key={`cell-candle-${index}`} shape={<Candlestick />} fill={entry.close >= entry.open ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))'} />
                                ))}
                            </Bar>
                        </ComposedChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        {selectedPair ? `${selectedPair} için ${selectedInterval} aralığında veri bulunamadı.` : "Lütfen bir parite seçin."}
                    </div>
                 )}
              </div>
              {/* Volume Chart */}
              <div className="h-[100px] w-full pt-0 pr-2 pb-2 pl-0">
                {candleData.length > 0 && !loadingCandles && (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={candleData} syncId="marketDataSync" margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                             <XAxis dataKey="closeTime" hide={true} /> {/* Hidden XAxis for sync */}
                             <YAxis
                                yAxisId="volume"
                                orientation="right"
                                tickFormatter={(value) => formatNumberClientSide(value, { notation: 'compact', maximumFractionDigits: 1 })}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={false} tickLine={false} width={45}
                                domain={[0, 'dataMax * 3']} // Give more room for volume spikes
                             />
                             <Bar yAxisId="volume" dataKey="volume" barSize={6}>
                                {candleData.map((entry, index) => (
                                    <Cell key={`cell-volume-${index}`} fill={entry.close >= entry.open ? 'hsla(var(--chart-1), 0.5)' : 'hsla(var(--destructive), 0.4)'} />
                                ))}
                            </Bar>
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>


          <Card className="lg:col-span-1">
            <CardContent className="p-0"> 
              <Tabs defaultValue="portfolio" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-t-lg rounded-b-none p-0 h-auto"> 
                  <TabsTrigger value="portfolio" className="rounded-tl-md rounded-tr-none rounded-b-none py-2">
                    <Wallet className="h-4 w-4 mr-1" /> Portföy
                  </TabsTrigger>
                  <TabsTrigger value="history" className="rounded-none py-2"> 
                    <History className="h-4 w-4 mr-1" /> Geçmiş
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="rounded-tr-md rounded-tl-none rounded-b-none py-2">
                    <FileText className="h-4 w-4 mr-1" /> Loglar
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="portfolio" className="p-4 max-h-[450px] overflow-y-auto"> 
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-medium">
                      Portföy {activeApiEnvironment && ` (${activeApiEnvironment.replace('_',' ').toUpperCase()})`}
                    </h3>
                    {loadingPortfolio && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>

                  <div className="mb-4 p-4 bg-muted/50 rounded-lg"> 
                     <PortfolioPieChart />
                  </div>

                  {portfolioError && !loadingPortfolio && ( 
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Portföy Yüklenemedi</AlertTitle>
                        <AlertDescription>
                            {portfolioError.includes('yapılandırılmamış') || portfolioError.includes('Geçersiz') || portfolioError.includes('yanlış API') ? (
                                <>
                                    {portfolioError} Lütfen <Link href="#settings" className="font-medium underline">Ayarlar</Link> bölümünden ilgili ortam için API anahtarlarını girip doğrulayın.
                                </>
                            ) : portfolioError }
                         </AlertDescription>
                    </Alert>
                  )}

                  {!activeApiEnvironment && !loadingPortfolio && !portfolioError && ( 
                    <Alert variant="default" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>API Ortamı Seçilmedi</AlertTitle>
                      <AlertDescription>
                        Portföy verilerini görmek için lütfen <Link href="#settings" className="font-medium underline">Ayarlar</Link> bölümünden geçerli bir API ortamını doğrulayın ve aktif hale getirin.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Varlık</TableHead>
                        <TableHead className="text-right">Kullanılabilir</TableHead>
                        <TableHead className="text-right">Kilitli</TableHead>
                        <TableHead className="text-right"> Toplam</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingPortfolio ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Yükleniyor...
                          </TableCell>
                        </TableRow>
                      ) : portfolioData.length > 0 && !portfolioError ? (
                        portfolioData.map((balance) => <PortfolioRow key={balance.asset} balance={balance} />)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            {portfolioError ? "Veri yüklenemedi." : 
                              !activeApiEnvironment ? "Aktif API ortamı seçilmedi." : 
                                (activeApiEnvironment && validationStatus[activeApiEnvironment] !== 'valid' && !portfolioError) ? `${activeApiEnvironment.replace('_',' ').toUpperCase()} API anahtarları doğrulanmamış.` : 
                                  portfolioData.length === 0 && !loadingPortfolio ? "Portföy boş." : 
                                    "Portföy verisi bekleniyor..."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="history" className="p-4 max-h-[450px] overflow-y-auto">
                  <h3 className="text-base font-medium mb-2">İşlem Geçmişi {activeApiEnvironment && ` (${activeApiEnvironment.replace('_',' ').toUpperCase()})`} (Yakında)</h3>
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
                        <TableHead className="text-right">Komisyon</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tradeHistoryData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            Gerçekleşen işlem verisi yok.
                          </TableCell>
                        </TableRow>
                      ) : (
                        tradeHistoryData.map((trade, index) => <TradeHistoryRow key={index} trade={trade} />)
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="logs" className="p-4 max-h-[450px] overflow-y-auto">
                  <h3 className="text-base font-medium mb-2">Log Kayıtları ({dynamicLogData.length})</h3>
                  <ScrollArea className="h-[390px]"> 
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Zaman</TableHead>
                          <TableHead className="w-[80px]">Tip</TableHead>
                          <TableHead>Mesaj</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dynamicLogData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                              Log kaydı bulunamadı.
                            </TableCell>
                          </TableRow>
                        ) : (
                          dynamicLogData.map((log, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{formatTimestamp(log.timestamp)}</TableCell>
                              <TableCell>
                                <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium",
                                  log.type === 'INFO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                    log.type === 'WARN' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                      log.type === 'ERROR' || log.type.includes('ERROR') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                        log.type === 'CONFIG' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                          log.type.includes('START') || log.type === 'BACKTEST' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                            log.type.includes('TELEGRAM') ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' :
                                              log.type.includes('AI') ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' :
                                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                )}>
                                  {log.type}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs">{log.message}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card id="settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                API &amp; Telegram Ayarları
                {activeApiEnvironment && (
                  <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-primary/10 text-primary">Aktif: {activeApiEnvironment.replace('_',' ').toUpperCase()}</span>
                )}
              </CardTitle>
              <CardDescription>
                Binance API anahtarlarınızı farklı ortamlar (Spot, Futures, Testnet) için girin ve doğrulayın. Doğrulama başarılı olursa, ilgili anahtar seti portföy ve işlem işlemleri için aktif hale gelir. Telegram bildirimleri için bot token ve chat ID'nizi girin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {(['spot', 'futures', 'testnet_spot', 'testnet_futures'] as const).map((env: ApiEnvironment) => (
                    <ApiKeySettingsPanel
                        key={env}
                        environmentTag={env}
                        label={`Binance ${env.replace('_', ' ').toUpperCase()} API`}
                        apiKeyValue={apiKeys[env].key}
                        secretKeyValue={apiKeys[env].secret}
                        onApiKeyChange={(value) => handleApiKeyChange(value, env, 'key')}
                        onSecretKeyChange={(value) => handleApiKeyChange(value, env, 'secret')}
                        onValidate={() => handleValidateApiKey(env)}
                        validationStatus={validationStatus[env]}
                        isLoading={validationStatus[env] === 'pending'}
                        isActive={activeApiEnvironment === env}
                    />
                ))}
                <Separator />
                <TelegramSettingsPanel
                    tokenValue={apiKeys.telegram.token}
                    chatIdValue={apiKeys.telegram.chatId}
                    onTokenChange={(value) => handleTelegramChange(value, 'token')}
                    onChatIdChange={(value) => handleTelegramChange(value, 'chatId')}
                    onValidateToken={handleValidateTelegramToken}
                    onValidateChatId={handleValidateTelegramChatId}
                    tokenValidationStatus={validationStatus.telegramToken}
                    chatIdValidationStatus={validationStatus.telegramChatId}
                    isLoadingToken={validationStatus.telegramToken === 'pending'}
                    isLoadingChatId={validationStatus.telegramChatId === 'pending'}
                />
            </CardContent>
          </Card>

          <Card id="strategies" className="row-span-1 md:row-span-2"> 
            <CardContent className="p-0"> 
              <Tabs defaultValue="manage" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-t-lg rounded-b-none p-0 h-auto">
                  <TabsTrigger value="manage" className="rounded-tl-md rounded-tr-none rounded-b-none py-2">
                    <BrainCircuit className="h-4 w-4 mr-1" /> Yönetim
                  </TabsTrigger>
                  <TabsTrigger value="backtest" className="rounded-none py-2">
                    <FlaskConical className="h-4 w-4 mr-1" /> Test
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="rounded-tr-md rounded-tl-none rounded-b-none py-2">
                    <Activity className="h-4 w-4 mr-1" /> Risk
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manage" className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">Strateji Yönetimi</h3>
                    <Dialog open={isDefineStrategyDialogOpen} onOpenChange={setIsDefineStrategyDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Yeni Strateji (AI)
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]"> 
                        <DialogHeader>
                          <DialogTitle>Yeni Ticaret Stratejisi Tanımla (AI)</DialogTitle>
                          <DialogDescription>
                            AI'nın sizin için bir ticaret stratejisi tanımlamasını sağlayın. Net kurallar girin. AI tarafından oluşturulan stratejiler deneyseldir ve dikkatli kullanılmalıdır.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="strategy-name" className="text-right">Strateji Adı</Label>
                            <Input id="strategy-name" value={defineStrategyParams.name} onChange={(e) => handleDefineStrategyParamChange(e, 'name')} placeholder="Örn: RSI + Hacim Teyidi" className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="strategy-description" className="text-right">Kısa Açıklama</Label>
                            <Input id="strategy-description" value={defineStrategyParams.description} onChange={(e) => handleDefineStrategyParamChange(e, 'description')} placeholder="Stratejinin ana fikri." className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-start gap-4"> 
                            <Label htmlFor="strategy-prompt" className="text-right pt-2">Detaylı Strateji İstemi (Prompt)</Label>
                            <div className="col-span-3 space-y-1">
                              <Textarea id="strategy-prompt" value={defineStrategyParams.prompt} onChange={(e) => handleDefineStrategyParamChange(e, 'prompt')} placeholder="AI için detaylı alım/satım kuralları, indikatörler ve parametreler... Örn: 'RSI(14) 35 altına düştüğünde VE Hacim son 10 mumun ortalamasının 1.5 katından fazlaysa AL. RSI(14) 70 üzerine çıktığında veya %3 Stop-Loss tetiklendiğinde SAT.'" className="min-h-[150px]" />
                              <p className="text-xs text-muted-foreground">AI'nın anlayabileceği net ve spesifik kurallar yazın.</p>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="secondary">İptal</Button>
                          </DialogClose>
                          <Button type="button" onClick={handleDefineNewStrategy} disabled={isDefiningStrategy}>
                            {isDefiningStrategy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isDefiningStrategy ? 'Tanımlanıyor...' : 'AI ile Strateji Tanımla'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-sm text-muted-foreground">Çalıştırmak istediğiniz stratejileri seçin veya AI ile yenilerini oluşturun.</p>

                  <Accordion type="single" collapsible defaultValue="available-strategies">
                    <AccordionItem value="active-strategies">
                      <AccordionTrigger>Aktif Stratejiler ({activeStrategies.length})</AccordionTrigger>
                      <AccordionContent>
                        {activeStrategies.length === 0 ? (
                          <p className="text-sm text-muted-foreground px-4 pb-2">Aktif strateji yok.</p>
                        ) : (
                          <div className="space-y-1">
                            {activeStrategies.map((stratId) => {
                              const strategy = definedStrategies.find(s => s.id === stratId);
                              return (
                                <div key={stratId} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                  <span className="text-sm font-medium">{strategy?.name ?? stratId}</span>
                                  <Button variant="ghost" size="sm" className="h-auto p-1 text-muted-foreground hover:text-destructive" onClick={() => handleStrategyToggle(stratId)}>
                                    <CloseIcon className="h-3 w-3" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="available-strategies">
                      <AccordionTrigger>Mevcut Stratejiler ({definedStrategies.length})</AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea className="h-[250px] pr-3"> 
                          <div className="space-y-2">
                            {definedStrategies.map((strategy) => (
                              <div key={strategy.id} className="flex items-center gap-2 p-2 border rounded-md bg-card"> 
                                <Checkbox
                                  id={`strategy-${strategy.id}`}
                                  checked={activeStrategies.includes(strategy.id)}
                                  onCheckedChange={() => handleStrategyToggle(strategy.id)}
                                />
                                <div className="flex-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <label htmlFor={`strategy-${strategy.id}`} className="text-sm font-medium cursor-pointer flex items-center gap-1">
                                          {strategy.name}
                                          {strategy.id.startsWith('ai_') && <Info className="h-3 w-3 text-blue-500" />} 
                                        </label>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs font-semibold">{strategy.name}</p>
                                        <p className="text-xs">{strategy.description}</p>
                                        {strategy.prompt && <p className="text-xs mt-1 border-t pt-1"><b>AI İstem:</b> {strategy.prompt.substring(0, 100)}...</p>}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                <TabsContent value="backtest" className="p-4 space-y-4">
                  <h3 className="text-base font-medium">Geriye Dönük Strateji Testi (Spot Verisi)</h3>
                  <p className="text-sm text-muted-foreground">Seçtiğiniz stratejiyi geçmiş Spot verileri üzerinde test ederek potansiyel performansını değerlendirin. Sonuçlar geleceği garanti etmez. Testler AI tarafından simüle edilir.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="backtest-strategy">Test Edilecek Strateji</Label>
                      <Select value={selectedBacktestStrategyId} onValueChange={(v) => handleBacktestSelectChange(v, 'strategyId')}>
                        <SelectTrigger id="backtest-strategy">
                          <SelectValue placeholder="Strateji Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {definedStrategies.map(strategy => (
                            <SelectItem key={strategy.id} value={strategy.id}>{strategy.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="backtest-pair">Parite</Label>
                      <Select value={backtestParams.pair} onValueChange={(v) => handleBacktestSelectChange(v, 'pair')}>
                        <SelectTrigger id="backtest-pair">
                          <SelectValue placeholder={loadingPairs ? "Yükleniyor..." : (allPairsForBacktest.length === 0 ? "Parite Yok" : "Parite Seç")} />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-[300px]">
                            {loadingPairs ? (
                              <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                            ) : allPairsForBacktest.length > 0 ? ( 
                              allPairsForBacktest.map((pair) => (
                                <SelectItem key={pair.symbol} value={pair.symbol}>{pair.symbol}</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no_pairs" disabled>Parite bulunamadı.</SelectItem>
                            )}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="backtest-interval">Zaman Aralığı</Label>
                      <Select value={backtestParams.interval} onValueChange={(v) => handleBacktestSelectChange(v, 'interval')}>
                        <SelectTrigger id="backtest-interval">
                          <SelectValue placeholder="Aralık Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'].map(interval => (
                             <SelectItem key={interval} value={interval}>{interval}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="backtest-balance">Başlangıç Bakiyesi (USDT)</Label>
                      <Input id="backtest-balance" type="number" value={backtestParams.initialBalance} onChange={(e) => handleBacktestParamChange(e, 'initialBalance')} placeholder="1000" min="1" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="backtest-start-date">Başlangıç Tarihi</Label>
                      <Input id="backtest-start-date" type="date" value={backtestParams.startDate} onChange={(e) => handleBacktestParamChange(e, 'startDate')} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="backtest-end-date">Bitiş Tarihi</Label>
                      <Input id="backtest-end-date" type="date" value={backtestParams.endDate} onChange={(e) => handleBacktestParamChange(e, 'endDate')} />
                    </div>
                  </div>
                  <Button onClick={runBacktestHandler} disabled={isBacktesting || !selectedBacktestStrategyId}>
                    {isBacktesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4" />}
                    {isBacktesting ? 'Test Çalışıyor...' : 'Testi Başlat'}
                  </Button>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-base">Test Sonuçları</CardTitle>
                      {isBacktesting && (
                        <CardDescription className="flex items-center gap-1 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" /> Test ediliyor...
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {backtestResult && !isBacktesting ? (
                        backtestResult.errorMessage ? (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Backtest Hatası</AlertTitle>
                            <AlertDescription>{backtestResult.errorMessage}</AlertDescription>
                          </Alert>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <p><strong>Strateji:</strong> {definedStrategies.find(s => s.id === selectedBacktestStrategyId)?.name}</p>
                            <p><strong>Parite/Aralık:</strong> {backtestParams.pair} / {backtestParams.interval}</p>
                            <p className="col-span-2"><strong>Tarih Aralığı:</strong> {backtestParams.startDate} - {backtestParams.endDate}</p>
                            <p><strong>Toplam İşlem:</strong> {backtestResult.totalTrades}</p>
                            <p><strong>Kazanan/Kaybeden:</strong> {backtestResult.winningTrades} / {backtestResult.losingTrades}</p>
                            <p><strong>Kazanma Oranı:</strong> <span className={cn(backtestResult.winRate >= 50 ? 'text-green-600' : 'text-red-600')}>{formatNumberClientSide(backtestResult.winRate)}%</span></p>
                            <p><strong>Maks. Düşüş:</strong> {formatNumberClientSide(backtestResult.maxDrawdown)}%</p>
                            <p className="col-span-2"><strong>Net Kar/Zarar:</strong> <span className={cn(backtestResult.totalPnl >= 0 ? 'text-green-600' : 'text-red-600')}>{formatNumberClientSide(backtestResult.totalPnl, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })} ({formatNumberClientSide(backtestResult.totalPnlPercent)}%)</span></p>
                          </div>
                        )
                      ) : !isBacktesting && (
                        <p className="text-sm text-muted-foreground">Test sonuçları burada gösterilecek.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="risk" className="p-4 space-y-4">
                  <h3 className="text-base font-medium">Risk Yönetimi (Zarar Durdur / Kar Al)</h3>
                  <p className="text-sm text-muted-foreground">Her işlem için otomatik Zarar Durdur (Stop-Loss) ve Kar Al (Take-Profit) yüzdeleri belirleyin. Bu ayarlar, çalışan stratejilere uygulanacaktır. (Geliştirme aşamasında)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="stop-loss">Zarar Durdur (%)</Label>
                      <Input id="stop-loss" type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="Örn: 2" min="0.1" step="0.1" />
                      <p className="text-xs text-muted-foreground">Pozisyon açılış fiyatının % kaç altında zararı durdur.</p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="take-profit">Kar Al (%)</Label>
                      <Input id="take-profit" type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="Örn: 5" min="0.1" step="0.1" />
                      <p className="text-xs text-muted-foreground">Pozisyon açılış fiyatının % kaç üstünde kar al.</p>
                    </div>
                    <div className="sm:col-span-2">
                      <Button disabled>
                        Risk Ayarlarını Kaydet (Yakında)
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card id="bot-pairs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Bot İçin Parite Seçimi
              </CardTitle>
              <CardDescription>Botun işlem yapmasını istediğiniz pariteleri seçin (Belirtilen {availablePairsForBot.length} kullanıcı tanımlı parite listelenmiştir).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Seçili Pariteler ({selectedPairsForBot.length})</Label>
                <div className="mt-1 flex flex-wrap gap-1 p-2 border rounded-md min-h-[40px] bg-muted/50">
                  {selectedPairsForBot.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">Bot için parite seçilmedi.</span>
                  ) : (
                    selectedPairsForBot.map((pairSymbol) => (
                      <div key={pairSymbol} className="flex items-center gap-1 bg-background border rounded-full px-2 py-0.5 text-xs">
                        <span>{pairSymbol}</span>
                        <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full text-muted-foreground hover:text-destructive" onClick={() => handleBotPairToggle(pairSymbol)}>
                          <CloseIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <Label>Kullanılabilir Tanımlı Pariteler ({availablePairsForBot.length})</Label>
                <ScrollArea className="h-[200px] mt-1 border rounded-md">
                  {loadingPairs ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Yükleniyor...
                    </div>
                  ) : availablePairsForBot.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2">
                      {availablePairsForBot.map((pair) => (
                        <div key={pair.symbol} className="flex items-center gap-1">
                          <Checkbox
                            id={`pair-${pair.symbol}`}
                            checked={selectedPairsForBot.includes(pair.symbol)}
                            onCheckedChange={() => handleBotPairToggle(pair.symbol)}
                          />
                          <label htmlFor={`pair-${pair.symbol}`} className="text-xs font-medium cursor-pointer">{pair.symbol}</label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      Tanımlı paritelerden hiçbiri aktif değil veya yüklenemedi.
                    </div>
                  )}
                </ScrollArea>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedPairsForBot(availablePairsForBot.map(p => p.symbol))}>Tümünü Seç</Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedPairsForBot([])}>Temizle</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
