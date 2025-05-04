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
} from 'lucide-react';
import { Balance, Candle } from '@/services/binance';
import { toast } from '@/hooks/use-toast';

// Placeholder data
const candleData: Candle[] = [
  { openTime: 1672531200000, open: 16600, high: 16700, low: 16500, close: 16650, volume: 100, closeTime: 1672531260000, quoteAssetVolume: 1665000, numberOfTrades: 100, takerBuyBaseAssetVolume: 50, takerBuyQuoteAssetVolume: 832500, ignore: 0 },
  { openTime: 1672531260000, open: 16650, high: 16750, low: 16600, close: 16720, volume: 120, closeTime: 1672531320000, quoteAssetVolume: 2006400, numberOfTrades: 120, takerBuyBaseAssetVolume: 60, takerBuyQuoteAssetVolume: 1003200, ignore: 0 },
  { openTime: 1672531320000, open: 16720, high: 16800, low: 16700, close: 16780, volume: 90, closeTime: 1672531380000, quoteAssetVolume: 1510200, numberOfTrades: 90, takerBuyBaseAssetVolume: 45, takerBuyQuoteAssetVolume: 755100, ignore: 0 },
  { openTime: 1672531380000, open: 16780, high: 16850, low: 16750, close: 16820, volume: 110, closeTime: 1672531440000, quoteAssetVolume: 1850200, numberOfTrades: 110, takerBuyBaseAssetVolume: 55, takerBuyQuoteAssetVolume: 925100, ignore: 0 },
  { openTime: 1672531440000, open: 16820, high: 16900, low: 16800, close: 16880, volume: 130, closeTime: 1672531500000, quoteAssetVolume: 2194400, numberOfTrades: 130, takerBuyBaseAssetVolume: 65, takerBuyQuoteAssetVolume: 1097200, ignore: 0 },
];

const portfolioData: Balance[] = [
  { asset: 'BTC', free: 0.5, locked: 0.1 },
  { asset: 'ETH', free: 10, locked: 2 },
  { asset: 'USDT', free: 5000, locked: 1000 },
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

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

export default function Dashboard() {
  const [activeUser, setActiveUser] = React.useState<string | null>(null);
  const [selectedPair, setSelectedPair] = React.useState<string>('BTC/USDT');
  const [selectedInterval, setSelectedInterval] = React.useState<string>('1h');
  const [selectedStrategy, setSelectedStrategy] = React.useState<string>(availableStrategies[0].id);
  const [botStatus, setBotStatus] = React.useState<'running' | 'stopped'>('stopped');
  const [activeStrategies, setActiveStrategies] = React.useState<string[]>([]);
  const [stopLoss, setStopLoss] = React.useState<string>('');
  const [takeProfit, setTakeProfit] = React.useState<string>('');

  const handleLogin = (username: string) => {
    setActiveUser(username);
    toast({ title: `${username} olarak giriş yapıldı.` });
  };

  const handleLogout = () => {
    setActiveUser(null);
    toast({ title: 'Çıkış yapıldı.' });
  };

  const toggleBotStatus = () => {
    setBotStatus((prev) => (prev === 'running' ? 'stopped' : 'running'));
    toast({ title: `Bot ${botStatus === 'running' ? 'durduruldu' : 'başlatıldı'}.` });
  };

   const handleStrategyToggle = (strategyId: string) => {
    setActiveStrategies((prev) =>
      prev.includes(strategyId)
        ? prev.filter((id) => id !== strategyId)
        : [...prev, strategyId]
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
             <Select value={selectedPair} onValueChange={setSelectedPair}>
               <SelectTrigger className="w-[150px]">
                 <SelectValue placeholder="Parite Seçin" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                 <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                 <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Chart Area */}
            <Card className="lg:col-span-2 h-[500px]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedPair} - {selectedInterval} Grafik</span>
                  <CandlestickChart className="text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-4rem)]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={candleData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="openTime" tickFormatter={formatTimestamp} stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
                    <ChartTooltip
                       contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                       itemStyle={{ color: 'hsl(var(--foreground))' }}
                       labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="close" name="Kapanış" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    {/* TODO: Add buy/sell markers */}
                  </LineChart>
                </ResponsiveContainer>
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
                    <h3 className="text-lg font-semibold mb-2">Anlık Portföy</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Varlık</TableHead>
                          <TableHead className="text-right">Kullanılabilir</TableHead>
                          <TableHead className="text-right">Kilitli</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portfolioData.map((balance) => (
                          <TableRow key={balance.asset}>
                            <TableCell className="font-medium">{balance.asset}</TableCell>
                            <TableCell className="text-right">{balance.free.toFixed(4)}</TableCell>
                            <TableCell className="text-right">{balance.locked.toFixed(4)}</TableCell>
                          </TableRow>
                        ))}
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
                            <TableCell className="text-xs">{trade.timestamp}</TableCell>
                            <TableCell>{trade.pair}</TableCell>
                            <TableCell className={trade.type === 'Alış' ? 'text-green-600' : 'text-red-600'}>{trade.type}</TableCell>
                            <TableCell className="text-right">{trade.price}</TableCell>
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
                               <TableCell className="text-xs">{log.timestamp}</TableCell>
                               <TableCell><span className={`px-2 py-1 rounded text-xs ${log.type === 'ERROR' ? 'bg-red-100 text-red-800' : log.type === 'TRADE' ? 'bg-blue-100 text-blue-800' : log.type === 'TELEGRAM' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{log.type}</span></TableCell>
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
                <Accordion type="single" collapsible className="w-full">
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
                 <div className="flex flex-wrap gap-2 mb-4">
                    {activeStrategies.length === 0 && <span className="text-muted-foreground text-sm">Aktif strateji yok.</span>}
                    {activeStrategies.map((stratId) => {
                        const strategy = availableStrategies.find(s => s.id === stratId);
                        return (
                             <Button key={stratId} variant="secondary" size="sm" onClick={() => handleStrategyToggle(stratId)}>
                                {strategy?.name} <X className="ml-2 h-4 w-4" />
                             </Button>
                        )
                    })}
                 </div>
                <h4 className="font-semibold mb-2">Mevcut Stratejiler</h4>
                 <ScrollArea className="h-[200px] border rounded-md p-2">
                    <div className="space-y-2">
                       {availableStrategies.map((strategy) => (
                        <div key={strategy.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                          <Label htmlFor={`strat-${strategy.id}`} className="flex items-center gap-2 cursor-pointer">
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
                 <Button size="sm" className="mt-4"><PlusCircle className="mr-2 h-4 w-4"/> Yeni Strateji Ekle (Yapılandırma)</Button>
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
                          <Select defaultValue="BTC/USDT">
                            <SelectTrigger id="backtest-pair">
                               <SelectValue placeholder="Parite Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                               <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                               <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
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
                <Button><FlaskConical className="mr-2 h-4 w-4"/> Testi Başlat</Button>
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

// Add Checkbox component temporarily until ShadCN is updated
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <CheckIcon className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
