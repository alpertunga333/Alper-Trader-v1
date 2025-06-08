
// src/components/dashboard/tradingview-widget.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TradingViewWidgetProps {
  symbolPair: string;
  interval: string;
  exchangePrefix?: string;
  className?: string;
  autosize?: boolean; // This prop now significantly influences behavior
}

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

export function TradingViewWidget({
  symbolPair,
  interval,
  exchangePrefix = 'BINANCE',
  className, // className for the root div of this component
  autosize = true, // Default to TV's autosize, but page.tsx will pass false for explicit sizing
}: TradingViewWidgetProps) {
  const containerId = React.useMemo(() => `${CONTAINER_ID_BASE}${Math.random().toString(36).substr(2, 9)}`, []);
  const widgetRef = React.useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark'>('dark');
  const [measuredDimensions, setMeasuredDimensions] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setCurrentTheme(theme);
    const observer = new MutationObserver(() => {
      setCurrentTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Effect to measure container if not using TV's autosize (component autosize=false)
  React.useLayoutEffect(() => {
    if (!autosize && widgetRef.current) {
      const { offsetWidth, offsetHeight } = widgetRef.current;
      if (offsetWidth > 0 && offsetHeight > 0) {
        if (!measuredDimensions || measuredDimensions.width !== offsetWidth || measuredDimensions.height !== offsetHeight) {
          setMeasuredDimensions({ width: offsetWidth, height: offsetHeight });
        }
      } else if (measuredDimensions !== null) {
        setMeasuredDimensions(null); // Container became 0x0, clear measured
      }
    } else if (autosize && measuredDimensions !== null) {
      // If switched to component's autosize mode, clear measured dimensions
      setMeasuredDimensions(null);
    }
  }, [autosize, measuredDimensions, className, symbolPair, interval]); // Re-check if className or key props change

  // Effect to load script and create/update widget
  React.useEffect(() => {
    if (!symbolPair || !widgetRef.current) {
      return;
    }
    
    const formattedSymbol = `${exchangePrefix}:${symbolPair.replace('/', '')}`;
    const tvInterval = getTradingViewInterval(interval);
    const script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const createWidgetInstance = () => {
      if (widgetRef.current && typeof TradingView !== 'undefined' && TradingView.widget) {
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

        if (autosize) { // If component's autosize prop is true
          widgetOptions.autosize = true; // Use TV script's own autosize feature
          widgetOptions.width = "100%";
          widgetOptions.height = "100%";
        } else if (measuredDimensions && measuredDimensions.width > 0 && measuredDimensions.height > 0) {
          // If component's autosize is false, and we have valid measured dimensions
          widgetOptions.autosize = false; // Do NOT use TV script's autosize
          widgetOptions.width = measuredDimensions.width;
          widgetOptions.height = measuredDimensions.height;
        } else if (!autosize && !measuredDimensions) {
          // Component's autosize is false, but dimensions not yet measured or container is 0x0.
          // Widget creation will be deferred until measuredDimensions is set by useLayoutEffect.
          // console.log("TradingViewWidget: Waiting for dimensions (or 0x0 container) in non-autosize mode.");
          return; 
        } else {
          // Fallback (should ideally not be reached with proper state management)
          console.warn("TradingViewWidget: Unexpected state for widget creation. Defaulting to TV autosize.");
          widgetOptions.autosize = true;
          widgetOptions.width = "100%";
          widgetOptions.height = "100%";
        }
        
        new TradingView.widget(widgetOptions);
      }
    };

    if (!script) {
      const newScript = document.createElement('script');
      newScript.id = SCRIPT_ID;
      newScript.type = 'text/javascript';
      newScript.src = 'https://s3.tradingview.com/tv.js';
      newScript.async = true;
      newScript.onload = createWidgetInstance;
      document.head.appendChild(newScript);
    } else {
      const checkTVReady = () => {
        if (typeof TradingView !== 'undefined' && TradingView.widget) {
          createWidgetInstance();
        } else {
          setTimeout(checkTVReady, 100);
        }
      };
      checkTVReady();
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
    };
  }, [symbolPair, interval, exchangePrefix, currentTheme, containerId, autosize, measuredDimensions]);

  return (
    <div
      id={containerId}
      ref={widgetRef}
      // The className (e.g., h-full w-full from page.tsx) is applied here.
      // This ensures this div has the dimensions for useLayoutEffect to measure if !autosize.
      // If component's 'autosize' prop is true, then style also sets height:100%, width:100%.
      className={cn("tradingview-widget-container", className)}
      style={autosize ? { width: '100%', height: '100%' } : undefined}
    />
  );
}

declare global {
  interface Window {
    TradingView: any;
  }
  const TradingView: any;
}
