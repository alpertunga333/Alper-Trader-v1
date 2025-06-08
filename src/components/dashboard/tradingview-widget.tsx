
// src/components/dashboard/tradingview-widget.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TradingViewWidgetProps {
  symbolPair: string;
  interval: string;
  exchangePrefix?: string;
  className?: string;
  autosize?: boolean;
}

const SCRIPT_ID = 'tradingview-widget-script';
const CONTAINER_ID_BASE = 'tradingview_chart_container_';

const getTradingViewInterval = (interval: string): string => {
  if (!interval) return 'D'; // Default to Daily if undefined
  if (interval.endsWith('m')) return interval.slice(0, -1); // '1m' -> '1', '30m' -> '30'
  if (interval.endsWith('h')) return (parseInt(interval.slice(0, -1)) * 60).toString(); // '1h' -> '60', '4h' -> '240'
  if (interval.endsWith('d')) return interval.toUpperCase(); // '1d' -> '1D', '3d' -> '3D'
  if (interval.endsWith('w')) return interval.toUpperCase(); // '1w' -> '1W'
  if (interval.toUpperCase() === '1M') return 'M'; // '1M' (Month) -> 'M'
  return 'D'; // Default fallback
};

export function TradingViewWidget({
  symbolPair,
  interval,
  exchangePrefix = 'BINANCE',
  className,
  autosize = false,
}: TradingViewWidgetProps) {
  const containerId = React.useMemo(() => `${CONTAINER_ID_BASE}${Math.random().toString(36).substr(2, 9)}`, []);
  const widgetRef = React.useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark'>('dark'); // Default to dark

  React.useEffect(() => {
    // Determine theme based on document class
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setCurrentTheme(theme);

    // Optional: Observe theme changes
    const observer = new MutationObserver(() => {
      setCurrentTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!symbolPair || !widgetRef.current) {
      return;
    }
    
    const formattedSymbol = `${exchangePrefix}:${symbolPair.replace('/', '')}`;
    const tvInterval = getTradingViewInterval(interval);

    const script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const createWidget = () => {
      if (widgetRef.current && typeof TradingView !== 'undefined' && TradingView.widget) {
        // Clear previous widget if any
        widgetRef.current.innerHTML = '';
        new TradingView.widget({
          autosize: autosize,
          width: autosize ? "100%" : undefined, // Conditional width
          height: autosize ? "100%" : undefined, // Conditional height
          symbol: formattedSymbol,
          interval: tvInterval,
          timezone: 'Etc/UTC',
          theme: currentTheme,
          style: '1', // 1 for Bars, 2 for Candles, 3 for Line, etc. (Candles default for most)
          locale: 'tr',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: containerId,
          toolbar_bg: currentTheme === 'dark' ? '#131722' : '#ffffff', // Match theme for toolbar
          studies: [
            "MASimple@tv-basicstudies", // Moving Average
            "Volume@tv-basicstudies" // Volume
          ],
          // details: true, // Show contract details panel
          // news: true, // Show news panel
        });
      }
    };

    if (!script) {
      const newScript = document.createElement('script');
      newScript.id = SCRIPT_ID;
      newScript.type = 'text/javascript';
      newScript.src = 'https://s3.tradingview.com/tv.js';
      newScript.async = true;
      newScript.onload = createWidget;
      document.head.appendChild(newScript);
    } else {
      // If script already exists, wait for TradingView object to be available
      // This can happen if the component re-renders quickly
      const checkTVReady = () => {
        if (typeof TradingView !== 'undefined' && TradingView.widget) {
          createWidget();
        } else {
          setTimeout(checkTVReady, 100);
        }
      };
      checkTVReady();
    }

    return () => {
      // Cleanup widget instance if TradingView and remove function exist
      // This is a bit tricky as TV widget doesn't have a formal destroy method for script-injected widgets.
      // Clearing the container is the most straightforward way.
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
    };
  }, [symbolPair, interval, exchangePrefix, currentTheme, containerId, autosize]);

  return (
    <div
      id={containerId}
      ref={widgetRef}
      className={cn("tradingview-widget-container", className, !autosize && "w-full h-full")}
      style={autosize ? { width: '100%', height: '100%' } : undefined}
    />
  );
}

// Declare TradingView global for TypeScript
declare global {
  interface Window {
    TradingView: any;
  }
  const TradingView: any;
}
