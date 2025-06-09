
// src/components/dashboard/tradingview-widget.tsx
'use client';

import * as React from 'react';
import Script from 'next/script'; // Import next/script
import { cn } from '@/lib/utils';

const SCRIPT_ID = 'tradingview-widget-script';
const CONTAINER_ID_BASE = 'tradingview_chart_container_';

const getTradingViewInterval = (interval: string): string => {
  if (!interval) return 'D';
  if (interval.endsWith('m')) return interval.slice(0, -1);
  if (interval.endsWith('h')) return (parseInt(interval.slice(0, -1)) * 60).toString();
  if (interval.endsWith('d')) return interval.toUpperCase();
  if (interval.endsWith('w')) return interval.toUpperCase();
  if (interval.toUpperCase() === '1M') return 'M';
  return 'D';
};

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: any) => any;
      // Add other TradingView types if necessary
    };
  }
}

interface TradingViewWidgetProps {
  symbolPair: string;
  interval: string;
  exchangePrefix?: string;
  className?: string;
  autosize?: boolean;
}

export function TradingViewWidget({
  symbolPair,
  interval,
  exchangePrefix = 'BINANCE',
  className,
  autosize = true,
}: TradingViewWidgetProps) {
  const containerId = React.useMemo(() => `${CONTAINER_ID_BASE}${Math.random().toString(36).substr(2, 9)}`, []);
  const widgetRef = React.useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark'>('light');
  const [measuredDimensions, setMeasuredDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = React.useState(false);

  React.useEffect(() => {
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setCurrentTheme(theme);
    const observer = new MutationObserver(() => {
      setCurrentTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  React.useLayoutEffect(() => {
    if (!autosize && widgetRef.current) {
      const { offsetWidth, offsetHeight } = widgetRef.current;
      if (offsetWidth > 0 && offsetHeight > 0) {
        if (!measuredDimensions || measuredDimensions.width !== offsetWidth || measuredDimensions.height !== offsetHeight) {
          setMeasuredDimensions({ width: offsetWidth, height: offsetHeight });
        }
      } else if (measuredDimensions !== null) {
        setMeasuredDimensions(null);
      }
    } else if (autosize && measuredDimensions !== null) {
      setMeasuredDimensions(null);
    }
  }, [autosize, className, symbolPair, interval, measuredDimensions]);

  React.useEffect(() => {
    if (!isScriptLoaded || !symbolPair || !widgetRef.current || typeof window.TradingView === 'undefined' || !window.TradingView.widget) {
      return;
    }

    const formattedSymbol = `${exchangePrefix}:${symbolPair.replace('/', '')}`;
    const tvInterval = getTradingViewInterval(interval);

    widgetRef.current.innerHTML = ''; // Clear previous widget

    const widgetOptions: any = {
      symbol: formattedSymbol,
      interval: tvInterval,
      timezone: 'Etc/UTC',
      theme: currentTheme,
      style: '1',
      locale: 'tr',
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      container_id: containerId,
      toolbar_bg: currentTheme === 'dark' ? '#131722' : '#ffffff',
      studies: ["MASimple@tv-basicstudies", "Volume@tv-basicstudies"],
    };

    if (autosize) {
      widgetOptions.autosize = true;
      widgetOptions.width = "100%";
      widgetOptions.height = "100%";
    } else if (measuredDimensions && measuredDimensions.width > 0 && measuredDimensions.height > 0) {
      widgetOptions.autosize = false;
      widgetOptions.width = measuredDimensions.width;
      widgetOptions.height = measuredDimensions.height;
    } else if (!autosize && !measuredDimensions) {
      // Still waiting for dimensions or container is 0x0, do nothing this run
      return;
    } else {
      widgetOptions.autosize = true;
      widgetOptions.width = "100%";
      widgetOptions.height = "100%";
    }
    
    new window.TradingView.widget(widgetOptions);

  }, [
    isScriptLoaded,
    symbolPair,
    interval,
    exchangePrefix,
    currentTheme,
    containerId,
    autosize,
    measuredDimensions
  ]);

  return (
    <>
      <Script
        id={SCRIPT_ID}
        src="https://s3.tradingview.com/tv.js"
        strategy="lazyOnload"
        onLoad={() => {
          // console.log("TradingView script loaded via next/script."); // Optional: for debugging
          setIsScriptLoaded(true);
        }}
        onError={(e) => {
          console.error("Error loading TradingView script via next/script:", e);
          // Potentially set an error state here to inform the user
        }}
      />
      <div
        id={containerId}
        ref={widgetRef}
        className={cn("tradingview-widget-container", className)}
        style={autosize ? { width: '100%', height: '100%' } : undefined}
      />
    </>
  );
}
