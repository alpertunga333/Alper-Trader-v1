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
  X as CloseIcon, // Renamed X to avoid conflict
  Check as CheckIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Balance, Candle, SymbolInfo, getAccountBalances, getCandlestickData, getExchangeInfo, placeOrder } from '@/services/binance';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

const availableStrategies = [
  { id: 'fibonacci', name: 'Fibonacci Geri Çekilme' },
  { id: 'volume', name: 'İşlem Hacmi Analizi' },
  { id: 'elliott', name: 'Elliott Dalga Teorisi' },
  { id: 'wyckoff', name: 'Wyckoff Metodu' },
  { id: 'ichimoku', name: 'Ichimoku Bulutu' },
  { id: 'smc', name: 'Market Yapıcı Hareketleri (SMC)' },
  { id: 'orderblock', name: 'Order Blok Analizi' },
  { id: 'volume_profile', name: 'Hacim Profili' },
  { id: 'gann', name: 'Gann Fan ve Açılar' },
  { id: 'rsi', name: 'Göreceli Güç Endeksi (RSI)' },
  { id: 'divergence', name: 'Uyumsuzluk (Divergence) Analizi' },
  { id: 'btc_dominance', name: 'Bitcoin Dominans Oranı' },
  { id: 'onchain', name: 'Onchain Analiz' },
  { id: 'sentiment', name: 'Sosyal Sentiment Analizi' },
  { id: 'liquidity_maps', name: 'Likidite Haritaları' },
  { id: 'open_interest', name: 'Açık Pozisyon Analizi' },
  { id: 'donchian', name: 'Donchian Kanalları' },
  { id: 'td_sequential', name: 'TD Sequential' },
  { id: 'htf_analysis', name: 'Yüksek Zaman Dilimi Analizi' },
  { id: 'fib_timezones', name: 'Fibonacci Zaman Bölgeleri' },
  { id: 'renko', name: 'Renko Grafikleri' },
  { id: 'harmonic', name: 'Harmonik Formasyonlar' },
  { id: 'log_regression', name: 'Logaritmik Regresyon Bantları' },
  { id: 'mfi', name: 'Momentum Akış İndeksi (MFI)' },
  { id: 'nvt', name: 'NVT Oranı' },
  { id: 'pivot_points', name: 'Fiyat Aksiyon Pivot Noktaları' },
  { id: 'seasonality', name: 'Mevsimsellik Analizi' },
  { id: 'roc', name: 'Hız ve İvme Göstergeleri (ROC)' },
  { id: 'calendar_events', name: 'Takvimsel Olaylar Stratejisi' },
  { id: 'long_short_ratio', name: 'Uzun/Kısa Oran Analizi' },
];

const formatTimestamp = (timestamp: number | string | undefined) => {
    if (timestamp === undefined || timestamp === null) return '';
    // Attempt to convert to number if it's a string timestamp
    const numericTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    if (isNaN(numericTimestamp)) return ''; // Handle invalid conversion

    const date = new Date(numericTimestamp);
    // Check if the date is valid
    if (isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

export default function Dashboard() {
  const [activeUser, setActiveUser] = React.useState<string | null>(null);
  const [selectedPair, setSelectedPair] = React.useState<string>(''); // Start empty
  const [selectedInterval, setSelectedInterval] = React.useState<string>('1h');
  const [selectedStrategy, setSelectedStrategy] = React.useState<string>(availableStrategies[0].id);
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


  // Fetch available pairs on component mount
  React.useEffect(() => {
    const fetchPairs = async () => {
      setLoadingPairs(true);
      setError(null);
      try {
        const info = await getExchangeInfo();
        const tradingPairs = info.symbols
          .filter(s => s.status === 'TRADING' && s.isSpotTradingAllowed) // Filter for active spot pairs
          .sort((a, b) => a.symbol.localeCompare(b.symbol)); // Sort alphabetically
        allAvailablePairs = tradingPairs; // Store globally if needed elsewhere
        setAvailablePairs(tradingPairs);
        if (tradingPairs.length > 0 && !selectedPair) {
           setSelectedPair(tradingPairs[0].symbol); // Set default selected pair
        }
      } catch (err) {
        console.error("Failed to fetch exchange info:", err);
        setError("Piyasa verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.");
        toast({
          title: "Hata",
          description: "Binance pariteleri alınamadı.",
          variant: "destructive",
        });
      } finally {
        setLoadingPairs(false);
      }
    };
    fetchPairs();
  }, []); // Empty dependency array ensures this runs only once on mount


  // Fetch candlestick data when selectedPair or selectedInterval changes
  React.useEffect(() => {
    const fetchCandleData = async () => {
      if (!selectedPair) return; // Don't fetch if no pair is selected

      setLoadingCandles(true);
      setError(null); // Clear previous errors specific to candle loading
      try {
        const data = await getCandlestickData(selectedPair, selectedInterval, 100); // Fetch last 100 candles
        setCandleData(data);
      } catch (err) {
        console.error(`Failed to fetch candlestick data for ${selectedPair}:`, err);
         // Don't set a general error, let the chart show 'no data' or a message
         setCandleData([]); // Clear data on error
         toast({
           title: "Grafik Hatası",
           description: `${selectedPair} için grafik verisi yüklenemedi.`,
           variant: "destructive",
         });
      } finally {
        setLoadingCandles(false);
      }
    };

    fetchCandleData();
  }, [selectedPair, selectedInterval]); // Re-run when pair or interval changes


  // Fetch portfolio data (example: fetch when user logs in)
   React.useEffect(() => {
     const fetchPortfolio = async () => {
       if (!activeUser) return; // Only fetch if logged in
       setLoadingPortfolio(true);
       try {
         // Assuming you have stored API keys securely associated with the user
         const apiKey = "YOUR_USER_SPECIFIC_API_KEY"; // Replace with actual key retrieval
         const secretKey = "YOUR_USER_SPECIFIC_SECRET_KEY"; // Replace with actual secret retrieval
         const balances = await getAccountBalances(apiKey, secretKey);
         setPortfolioData(balances);
       } catch (err) {
         console.error("Failed to fetch portfolio:", err);
         toast({
           title: "Portföy Hatası",
           description: "Hesap bakiyeleri yüklenemedi.",
           variant: "destructive",
         });
         setPortfolioData(initialPortfolioData); // Reset to initial on error
       } finally {
         setLoadingPortfolio(false);
       }
     };

     fetchPortfolio();
   }, [activeUser]); // Re-run when user changes


  const handleLogin = (username: string) => {
    setActiveUser(username);
    toast({ title: `${username} olarak giriş yapıldı.` });
  };

  const handleLogout = () => {
    setActiveUser(null);
    setPortfolioData(initialPortfolioData); // Clear portfolio on logout
    toast({ title: 'Çıkış yapıldı.' });
  };

  const toggleBotStatus = () => {
     if (botStatus === 'stopped' && selectedPairsForBot.length === 0) {
        toast({
            title: "Başlatma Hatası",
            description: "Lütfen botun çalışacağı en az bir parite seçin.",
            variant: "destructive",
        });
        return;
    }
    if (botStatus === 'stopped' && activeStrategies.length === 0) {
        toast({
            title: "Başlatma Hatası",
            description: "Lütfen en az bir aktif strateji seçin.",
            variant: "destructive",
        });
        return;
    }

    setBotStatus((prev) => (prev === 'running' ? 'stopped' : 'running'));
     const statusMessage = botStatus === 'running' ? 'durduruldu' : 'başlatıldı';
     const pairsMessage = botStatus === 'stopped' ? ` (${selectedPairsForBot.join(', ')})` : '';
    toast({ title: `Bot ${statusMessage}${pairsMessage}.` });

    if (botStatus === 'stopped') {
        // TODO: Start the bot logic for selectedPairsForBot and activeStrategies
        console.log("Starting bot for pairs:", selectedPairsForBot, "with strategies:", activeStrategies);
    } else {
        // TODO: Stop the bot logic
        console.log("Stopping bot...");
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
                    <Input id="username" placeholder="Kullanıcı adı girin" />
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
                <Button variant={botStatus === 'running' ? 'destructive' : 'default'} size="sm" onClick={toggleBotStatus} className="group-data-[collapsible=icon]:w-full">
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
                       <XAxis dataKey="openTime" tickFormatter={formatTimestamp} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={50} />
                       <YAxis stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickFormatter={(value) => value.toLocaleString(undefined, { maximumFractionDigits: 4 })} />
                       <ChartTooltip
                         contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                         itemStyle={{ color: 'hsl(var(--foreground))' }}
                         labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                         formatter={(value: number, name: string) => [value.toLocaleString(undefined, { maximumFractionDigits: 4 }), name]}
                         labelFormatter={(label) => `Zaman: ${formatTimestamp(label)}`}
                         />
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
                        ) : portfolioData.length > 0 ? (
                           portfolioData.map((balance) => (
                             <TableRow key={balance.asset}>
                               <TableCell className="font-medium">{balance.asset}</TableCell>
                               <TableCell className="text-right">{balance.free.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</TableCell>
                               <TableCell className="text-right">{balance.locked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</TableCell>
                             </TableRow>
                           ))
                       ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                    Portföy verisi yok veya yüklenemedi.
                                </TableCell>
                            </TableRow>
                       )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="history" className="p-4">
                     <h3 className="text-lg font-semibold mb-2">İşlem Geçmişi</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Zaman</TableHead>
                          <TableHead>Parite</TableHead>
                          <TableHead>Tip</TableHead>
                          <TableHead className="text-right">Fiyat</TableHead>
                          <TableHead className="text-right">Miktar</TableHead>
                          <TableHead className="text-right">Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tradeHistoryData.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell className="text-xs whitespace-nowrap">{trade.timestamp}</TableCell>
                            <TableCell>{trade.pair.replace('/', '')}</TableCell> {/* Display as BTCUSDT */}
                            <TableCell className={trade.type === 'Alış' ? 'text-green-600' : 'text-red-600'}>{trade.type}</TableCell>
                            <TableCell className="text-right">{trade.price.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{trade.amount}</TableCell>
                            <TableCell className="text-right">{trade.status}</TableCell>
                          </TableRow>
                        ))}
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
                          {logData.map((log, index) => (
                             <TableRow key={index}>
                               <TableCell className="text-xs whitespace-nowrap">{log.timestamp}</TableCell>
                               <TableCell>
                                   <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                                        log.type === 'ERROR' ? 'bg-destructive/10 text-destructive' :
                                        log.type === 'TRADE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                        log.type === 'TELEGRAM' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                        'bg-secondary text-secondary-foreground')}>
                                        {log.type}
                                   </span>
                               </TableCell>
                               <TableCell className="text-xs">{log.message}</TableCell>
                             </TableRow>
                           ))}
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
                  <AccordionItem value="api-spot" id="api-spot">
                    <AccordionTrigger>Binance Spot API</AccordionTrigger>
                    <AccordionContent className="space-y-4 p-4">
                      <div>
                        <Label htmlFor="spot-api-key">API Key</Label>
                        <Input id="spot-api-key" placeholder="Spot API Key Girin" />
                      </div>
                      <div>
                        <Label htmlFor="spot-secret-key">Secret Key</Label>
                        <Input id="spot-secret-key" type="password" placeholder="Spot Secret Key Girin" />
                      </div>
                      <Button size="sm">Kaydet</Button>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="api-futures" id="api-futures">
                    <AccordionTrigger>Binance Futures API</AccordionTrigger>
                    <AccordionContent className="space-y-4 p-4">
                       <div>
                        <Label htmlFor="futures-api-key">API Key</Label>
                        <Input id="futures-api-key" placeholder="Futures API Key Girin" />
                      </div>
                      <div>
                        <Label htmlFor="futures-secret-key">Secret Key</Label>
                        <Input id="futures-secret-key" type="password" placeholder="Futures Secret Key Girin" />
                      </div>
                      <Button size="sm">Kaydet</Button>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="api-testnet-spot" id="api-testnet-spot">
                    <AccordionTrigger>Binance Testnet Spot API</AccordionTrigger>
                     <AccordionContent className="space-y-4 p-4">
                       <div>
                        <Label htmlFor="testnet-spot-api-key">API Key</Label>
                        <Input id="testnet-spot-api-key" placeholder="Testnet Spot API Key Girin" />
                      </div>
                      <div>
                        <Label htmlFor="testnet-spot-secret-key">Secret Key</Label>
                        <Input id="testnet-spot-secret-key" type="password" placeholder="Testnet Spot Secret Key Girin" />
                      </div>
                      <Button size="sm">Kaydet</Button>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="api-testnet-futures" id="api-testnet-futures">
                    <AccordionTrigger>Binance Testnet Futures API</AccordionTrigger>
                     <AccordionContent className="space-y-4 p-4">
                       <div>
                        <Label htmlFor="testnet-futures-api-key">API Key</Label>
                        <Input id="testnet-futures-api-key" placeholder="Testnet Futures API Key Girin" />
                      </div>
                      <div>
                        <Label htmlFor="testnet-futures-secret-key">Secret Key</Label>
                        <Input id="testnet-futures-secret-key" type="password" placeholder="Testnet Futures Secret Key Girin" />
                      </div>
                      <Button size="sm">Kaydet</Button>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="telegram" id="telegram">
                     <AccordionTrigger>Telegram Bot Entegrasyonu</AccordionTrigger>
                     <AccordionContent className="space-y-4 p-4">
                       <div>
                         <Label htmlFor="telegram-token">Bot Token</Label>
                         <Input id="telegram-token" placeholder="Telegram Bot Token Girin" />
                       </div>
                       <div>
                         <Label htmlFor="telegram-chat-id">Chat ID</Label>
                         <Input id="telegram-chat-id" placeholder="Telegram Grup/Kullanıcı ID Girin" />
                       </div>
                       <Button size="sm">Kaydet</Button>
                     </AccordionContent>
                   </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

             {/* Strategy Management */}
            <Card id="strategy-management" className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <List className="mr-2 text-primary" /> Strateji Yönetimi
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <h4 className="font-semibold mb-2">Aktif Stratejiler</h4>
                 <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]"> {/* Added min-height */}
                    {activeStrategies.length === 0 && <span className="text-muted-foreground text-sm italic">Aktif strateji yok.</span>}
                    {activeStrategies.map((stratId) => {
                        const strategy = availableStrategies.find(s => s.id === stratId);
                        return (
                             <Button key={stratId} variant="secondary" size="sm" onClick={() => handleStrategyToggle(stratId)}>
                                {strategy?.name} <CloseIcon className="ml-2 h-4 w-4" />
                             </Button>
                        )
                    })}
                 </div>
                <h4 className="font-semibold mb-2">Mevcut Stratejiler</h4>
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
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <Info className="h-4 w-4 text-muted-foreground"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{strategy.name} hakkında kısa açıklama.</p> {/* Replace with actual descriptions */}
                                </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ))}
                    </div>
                 </ScrollArea>
                 <Button size="sm" className="mt-4" disabled><PlusCircle className="mr-2 h-4 w-4"/> Yeni Strateji Ekle (Yapılandırılmadı)</Button>
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
                  <h4 className="font-semibold mb-2">Seçili Pariteler</h4>
                  <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                      {selectedPairsForBot.length === 0 && <span className="text-muted-foreground text-sm italic">Bot için parite seçilmedi.</span>}
                      {selectedPairsForBot.map((pairSymbol) => (
                         <Button key={pairSymbol} variant="secondary" size="sm" onClick={() => handleBotPairToggle(pairSymbol)}>
                              {pairSymbol} <CloseIcon className="ml-2 h-4 w-4" />
                         </Button>
                      ))}
                  </div>

                 <h4 className="font-semibold mb-2">Mevcut Pariteler</h4>
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
                       <Button size="sm">Risk Ayarlarını Kaydet</Button>
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
                         <Select>
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
                         <Select disabled={loadingPairs}>
                            <SelectTrigger id="backtest-pair">
                                <SelectValue placeholder={loadingPairs ? "Yükleniyor..." : "Parite Seçin"} />
                            </SelectTrigger>
                            <SelectContent>
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
                            </SelectContent>
                          </Select>
                      </div>
                       <div>
                          <Label htmlFor="backtest-interval">Zaman Aralığı</Label>
                          <Select defaultValue="1h">
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
                         <Input id="backtest-start-date" type="date" />
                      </div>
                      <div>
                         <Label htmlFor="backtest-end-date">Bitiş Tarihi</Label>
                         <Input id="backtest-end-date" type="date" />
                      </div>
                      <div>
                          <Label htmlFor="initial-balance">Başlangıç Bakiyesi (USDT)</Label>
                          <Input id="initial-balance" type="number" placeholder="1000" />
                      </div>
                 </div>
                <Button disabled><FlaskConical className="mr-2 h-4 w-4"/> Testi Başlat (Yapılandırılmadı)</Button>
                <div className="mt-4 border p-4 rounded-md bg-muted/50">
                    <h4 className="font-semibold mb-2">Test Sonuçları</h4>
                    <p className="text-sm text-muted-foreground">Test sonuçları burada gösterilecek...</p>
                    {/* Placeholder for results like PnL, Win Rate, Max Drawdown etc. */}
                 </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Note: Removed the local Checkbox component definition as it exists in ui/checkbox.tsx
// Ensure `import { Checkbox } from '@/components/ui/checkbox';` is present at the top.
