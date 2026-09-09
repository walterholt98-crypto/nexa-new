import { useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';
import { fetchKlines } from '@/lib/exchangeApi';

interface LightweightChartProps {
  symbol: string;
  exchangeId: string;
  isFutures: boolean;
  interval: string;
}

export function LightweightChart({ symbol, exchangeId, isFutures, interval }: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const drawingModeRef = useRef(false);
  const trendLineRef = useRef<{ points: { x: number; y: number }[] } | null>(null);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!drawingModeRef.current || !chartRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!trendLineRef.current) {
      trendLineRef.current = { points: [{ x, y }] };
    } else {
      trendLineRef.current.points.push({ x, y });
      if (trendLineRef.current.points.length >= 2) {
        // Draw line on canvas overlay
        const overlay = containerRef.current.querySelector('canvas[data-overlay]') as HTMLCanvasElement;
        if (overlay) {
          const ctx = overlay.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = '#1e90ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(trendLineRef.current.points[0].x, trendLineRef.current.points[0].y);
            ctx.lineTo(trendLineRef.current.points[1].x, trendLineRef.current.points[1].y);
            ctx.stroke();
          }
        }
        trendLineRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a0a0a0',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(30, 144, 255, 0.05)' },
        horzLines: { color: 'rgba(30, 144, 255, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#1e90ff', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#1e90ff', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: 'rgba(30, 144, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(30, 144, 255, 0.1)',
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      color: 'rgba(30, 144, 255, 0.3)',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    resizeObserver.observe(containerRef.current);

    // Add drawing overlay canvas
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.setAttribute('data-overlay', 'true');
    overlayCanvas.style.position = 'absolute';
    overlayCanvas.style.top = '0';
    overlayCanvas.style.left = '0';
    overlayCanvas.style.pointerEvents = 'none';
    overlayCanvas.width = containerRef.current.clientWidth;
    overlayCanvas.height = containerRef.current.clientHeight;
    containerRef.current.appendChild(overlayCanvas);

    containerRef.current.addEventListener('mousedown', handleMouseDown);

    return () => {
      resizeObserver.disconnect();
      containerRef.current?.removeEventListener('mousedown', handleMouseDown);
      chart.remove();
      chartRef.current = null;
    };
  }, [handleMouseDown]);

  // Load data when symbol/interval/exchange changes
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    let cancelled = false;
    const loadData = async () => {
      const klines = await fetchKlines(symbol, exchangeId, isFutures, interval);
      if (cancelled || klines.length === 0) return;

      const candleData = klines.map((k) => ({
        time: k.time as Time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }));

      const volumeData = klines.map((k) => ({
        time: k.time as Time,
        value: k.volume,
        color: k.close >= k.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      }));

      candleSeriesRef.current!.setData(candleData);
      volumeSeriesRef.current!.setData(volumeData);
      chartRef.current?.timeScale().fitContent();
    };

    loadData();
    const pollInterval = setInterval(loadData, 5000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [symbol, exchangeId, isFutures, interval]);

  return <div ref={containerRef} className="w-full h-full relative" />;
}
