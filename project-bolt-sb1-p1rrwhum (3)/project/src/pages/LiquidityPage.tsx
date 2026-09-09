import { useState, useEffect, useRef, useCallback } from 'react';
import { getExchangeConfig, fetchTickers } from '@/lib/exchangeApi';
import { useStore } from '@/store';
import { formatNumber, formatPrice } from '@/lib/utils';
import { Map, RefreshCw, RotateCcw, Activity } from 'lucide-react';

interface LiquidityCluster {
  symbol: string;
  baseAsset: string;
  price: number;
  density: number;
  bidDensity: number;
  askDensity: number;
  spread: number;
  x: number;
  y: number;
  radius: number;
  glow: number;
}

export function LiquidityPage() {
  const { selectedExchange, isFutures } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [clusters, setClusters] = useState<LiquidityCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCluster, setHoveredCluster] = useState<LiquidityCluster | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const exchange = getExchangeConfig(selectedExchange);
      const tickers = await fetchTickers(exchange.id, isFutures);
      const topCoins = tickers.slice(0, 24);

      const newClusters: LiquidityCluster[] = topCoins.map((ticker) => {
        const density = ticker.quoteVolume * 0.005 + ticker.volume * 0.01;
        return {
          symbol: ticker.symbol,
          baseAsset: ticker.baseAsset,
          price: ticker.price,
          density,
          bidDensity: density * 0.52,
          askDensity: density * 0.48,
          spread: 0.05,
          x: 0, y: 0, radius: 0, glow: 0,
        };
      });

      const maxDensity = Math.max(...newClusters.map((c) => c.density), 1);
      const cols = Math.ceil(Math.sqrt(newClusters.length));
      const rows = Math.ceil(newClusters.length / cols);

      newClusters.forEach((cluster, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        cluster.x = ((col + 0.5) / cols) * 100;
        cluster.y = ((row + 0.5) / rows) * 100;
        const sizeRatio = cluster.density / maxDensity;
        cluster.radius = 20 + sizeRatio * 50;
        cluster.glow = sizeRatio;
      });

      setClusters(newClusters);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedExchange, isFutures]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Background grid
    ctx.strokeStyle = 'rgba(30, 144, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < rect.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y < rect.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    for (const cluster of clusters) {
      const cx = (cluster.x / 100) * rect.width;
      const cy = (cluster.y / 100) * rect.height;
      const r = cluster.radius;

      // Glow
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5);
      const alpha = 0.15 + cluster.glow * 0.45;
      gradient.addColorStop(0, `rgba(30, 144, 255, ${alpha})`);
      gradient.addColorStop(0.4, `rgba(30, 144, 255, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(30, 144, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Core
      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const brightness = 0.4 + cluster.glow * 0.4;
      coreGradient.addColorStop(0, `rgba(77, 170, 255, ${brightness})`);
      coreGradient.addColorStop(1, `rgba(30, 144, 255, ${0.2 + cluster.glow * 0.3})`);
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = `rgba(30, 144, 255, ${0.3 + cluster.glow * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cluster.baseAsset, cx, cy - 6);

      ctx.fillStyle = 'rgba(30, 144, 255, 0.9)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(formatNumber(cluster.density), cx, cy + 8);
    }

    ctx.restore();
  }, [clusters, zoom, pan]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setMousePos({ x: e.clientX, y: e.clientY });

    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
      return;
    }

    // Account for zoom/pan when hit testing
    const adjustedX = (mx - pan.x) / zoom;
    const adjustedY = (my - pan.y) / zoom;

    let found: LiquidityCluster | null = null;
    for (const cluster of clusters) {
      const cx = (cluster.x / 100) * rect.width;
      const cy = (cluster.y / 100) * rect.height;
      const dist = Math.sqrt((adjustedX - cx) ** 2 + (adjustedY - cy) ** 2);
      if (dist <= cluster.radius) {
        found = cluster;
        break;
      }
    }
    setHoveredCluster(found);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.3, Math.min(5, z * delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Map size={22} className="text-neon-400" />
          <h1 className="text-xl font-bold text-slate-100">Карта плотностей</h1>
          <span className="text-xs text-slate-500 px-2 py-1 rounded bg-surface-700 border border-neon-400/10">
            {selectedExchange === 'binance' ? 'Binance' : selectedExchange} · {isFutures ? 'Фьючерсы' : 'Спот'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetView}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-surface-700 text-slate-400 border border-neon-400/10 hover:text-neon-400 transition-all"
          >
            <RotateCcw size={14} />
            Сбросить вид
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-neon-400/10 text-neon-400 border border-neon-400/30 hover:bg-neon-400/20 transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Canvas */}
        <div className="flex-1 glass-card rounded-xl border border-neon-400/10 p-2 relative" ref={containerRef}>
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-500">
            <Activity size={12} className="text-neon-400 animate-pulse" />
            Плотность стакана · больше круг — выше ликвидность · прокрутка = зум · перетаскивание = панорама
          </div>
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { setHoveredCluster(null); handleMouseUp(); }}
            onWheel={handleWheel}
            className="w-full h-[500px] rounded-lg cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
          />
          {loading && clusters.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-slate-500 text-sm">Загрузка данных плотности...</div>
            </div>
          )}
        </div>

        {/* Coin list sidebar */}
        <div className="lg:w-72 glass-card rounded-xl border border-neon-400/10 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-neon-400/10 flex items-center gap-2">
            <Activity size={14} className="text-neon-400" />
            <h2 className="text-sm font-semibold text-slate-200">Список монет</h2>
          </div>
          <div className="overflow-y-auto max-h-[460px]">
            {clusters.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">Загрузка...</div>
            ) : (
              clusters.map((c, i) => (
                <div
                  key={c.symbol}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-neon-400/5 hover:bg-surface-700/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-mono w-6">{i + 1}</span>
                    <span className="text-sm font-mono font-medium text-slate-200">{c.baseAsset}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-neon-400">{formatNumber(c.density)}</div>
                    <div className="text-[10px] text-slate-600">${formatPrice(c.price)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCluster && (
        <div
          className="fixed z-50 glass-card rounded-lg border border-neon-400/30 p-3 shadow-neon-md pointer-events-none"
          style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
        >
          <div className="text-sm font-bold text-neon-400 font-mono">{hoveredCluster.baseAsset}</div>
          <div className="text-xs text-slate-400 mt-1">Плотность: {formatNumber(hoveredCluster.density)}</div>
          <div className="text-xs text-slate-400">Цена: ${formatPrice(hoveredCluster.price)}</div>
          <div className="text-xs text-slate-400">Биржа: {selectedExchange === 'binance' ? 'Binance' : selectedExchange}</div>
        </div>
      )}
    </div>
  );
}
