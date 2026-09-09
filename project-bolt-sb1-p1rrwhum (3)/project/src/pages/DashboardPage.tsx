import { useState } from 'react';
import { useStore } from '@/store';
import { LightweightChart } from '@/components/LightweightChart';
import { Search, X, Pencil } from 'lucide-react';

const DEFAULT_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];

const POPULAR_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT', 'MATICUSDT', 'DOTUSDT', 'LTCUSDT',
  'TRXUSDT', 'ATOMUSDT', 'NEARUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT',
  'INJUSDT', 'SUIUSDT', 'SEIUSDT', 'TIAUSDT', 'ORDIUSDT', 'PEPEUSDT',
];

const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
];

interface ChartCellProps {
  index: number;
  symbol: string;
  interval: string;
  onIntervalChange: (interval: string) => void;
  onSymbolChange: (symbol: string) => void;
}

function ChartCell({ index, symbol, interval, onIntervalChange, onSymbolChange }: ChartCellProps) {
  const { selectedExchange, isFutures } = useStore();
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = POPULAR_PAIRS.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glass-card rounded-xl border border-neon-400/10 overflow-hidden flex flex-col h-[45vh] min-h-[350px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neon-400/10 bg-surface-800/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">#{index + 1}</span>
          <span className="text-sm font-semibold text-neon-400 font-mono">{symbol}</span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">
            {selectedExchange === 'binance' ? 'Binance' : selectedExchange}
          </span>
          {isFutures && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-400/10 text-neon-400 font-medium">PERP</span>
          )}
        </div>
        <button
          onClick={() => { setEditing(!editing); setSearch(''); }}
          className="text-slate-500 hover:text-neon-400 transition-colors"
        >
          {editing ? <X size={16} /> : <Search size={16} />}
        </button>
      </div>

      {/* Pair search dropdown */}
      {editing && (
        <div className="absolute z-20 mt-12 mx-2 w-[calc(100%-1rem)] glass-card rounded-lg border border-neon-400/20 p-2 shadow-neon-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск пары..."
            autoFocus
            className="w-full bg-surface-800 text-slate-200 text-sm rounded px-2 py-1.5 border border-neon-400/10 focus:outline-none focus:border-neon-400/40 mb-2"
          />
          <div className="max-h-40 overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={p}
                onClick={() => { onSymbolChange(p); setEditing(false); }}
                className={`w-full text-left px-2 py-1.5 rounded text-sm font-mono transition-colors ${
                  p === symbol ? 'bg-neon-400/10 text-neon-400' : 'text-slate-400 hover:bg-surface-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 min-h-0 relative">
        <LightweightChart
          symbol={symbol}
          exchangeId={selectedExchange}
          isFutures={isFutures}
          interval={interval}
        />
      </div>

      {/* Timeframe buttons */}
      <div className="flex items-center gap-1 px-2 py-2 border-t border-neon-400/10 bg-surface-800/30 flex-shrink-0">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => onIntervalChange(tf.value)}
            className={`px-2.5 py-1 rounded text-xs font-medium font-mono transition-all ${
              interval === tf.value
                ? 'bg-neon-400 text-white'
                : 'text-slate-500 hover:text-neon-400 hover:bg-surface-700'
            }`}
          >
            {tf.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => { setEditing(!editing); setSearch(''); }}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-500 hover:text-neon-400 hover:bg-surface-700 transition-all"
        >
          <Pencil size={12} />
          Изменить пару
        </button>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [pairs, setPairs] = useState<string[]>(DEFAULT_PAIRS);
  const [intervals, setIntervals] = useState<string[]>(['15m', '15m', '15m', '15m']);

  const updatePair = (index: number, symbol: string) => {
    setPairs((prev) => prev.map((p, i) => (i === index ? symbol : p)));
  };

  const updateInterval = (index: number, interval: string) => {
    setIntervals((prev) => prev.map((int, i) => (i === index ? interval : int)));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pairs.map((symbol, i) => (
          <ChartCell
            key={i}
            index={i}
            symbol={symbol}
            interval={intervals[i]}
            onIntervalChange={(int) => updateInterval(i, int)}
            onSymbolChange={(s) => updatePair(i, s)}
          />
        ))}
      </div>
    </div>
  );
}
