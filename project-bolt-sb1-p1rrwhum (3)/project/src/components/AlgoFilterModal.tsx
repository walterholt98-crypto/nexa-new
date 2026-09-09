import { useState } from 'react';
import { X, Filter, Clock, TrendingUp, BarChart3, DollarSign } from 'lucide-react';

export interface AlgoFilter {
  timeframe: '1m' | '5m' | '15m';
  minPumpDump: number;
  minVolumeSurge: number;
  minVolumeUsd: number;
}

export const DEFAULT_ALGO_FILTER: AlgoFilter = {
  timeframe: '5m',
  minPumpDump: 1.5,
  minVolumeSurge: 200,
  minVolumeUsd: 0,
};

interface AlgoFilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filter: AlgoFilter) => void;
  onReset: () => void;
  current: AlgoFilter;
}

const TIMEFRAMES: ('1m' | '5m' | '15m')[] = ['1m', '5m', '15m'];
const PUMP_THRESHOLDS = [1.5, 3.0, 5.0];

export function AlgoFilterModal({ open, onClose, onApply, onReset, current }: AlgoFilterModalProps) {
  const [timeframe, setTimeframe] = useState(current.timeframe);
  const [minPumpDump, setMinPumpDump] = useState(current.minPumpDump);
  const [minVolumeSurge, setMinVolumeSurge] = useState(current.minVolumeSurge);
  const [minVolumeUsd, setMinVolumeUsd] = useState(current.minVolumeUsd);

  if (!open) return null;

  const handleApply = () => {
    onApply({ timeframe, minPumpDump, minVolumeSurge, minVolumeUsd });
    onClose();
  };

  const handleReset = () => {
    setTimeframe(DEFAULT_ALGO_FILTER.timeframe);
    setMinPumpDump(DEFAULT_ALGO_FILTER.minPumpDump);
    setMinVolumeSurge(DEFAULT_ALGO_FILTER.minVolumeSurge);
    setMinVolumeUsd(DEFAULT_ALGO_FILTER.minVolumeUsd);
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card rounded-2xl w-full max-w-md mx-4 p-6 border border-neon-400/20 shadow-neon-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-neon-400/10 flex items-center justify-center">
              <Filter size={20} className="text-neon-400" />
            </div>
            <h2 className="text-lg font-bold gradient-text">Фильтр алгоритмов</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Timeframe */}
          <div>
            <label className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1.5">
              <Clock size={12} className="text-neon-400" />
              Таймфрейм
            </label>
            <div className="flex gap-2">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    timeframe === tf
                      ? 'bg-neon-400/10 text-neon-400 border-neon-400/40'
                      : 'bg-surface-800 text-slate-400 border-neon-400/10 hover:text-neon-400'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Min Pump/Dump % */}
          <div>
            <label className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-neon-400" />
              Мин. Памп / Дамп %
            </label>
            <div className="flex gap-2">
              {PUMP_THRESHOLDS.map((val) => (
                <button
                  key={val}
                  onClick={() => setMinPumpDump(val)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    minPumpDump === val
                      ? 'bg-neon-400/10 text-neon-400 border-neon-400/40'
                      : 'bg-surface-800 text-slate-400 border-neon-400/10 hover:text-neon-400'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Min Volume Surge % */}
          <div>
            <label className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1.5">
              <BarChart3 size={12} className="text-neon-400" />
              Мин. всплеск объёма %
            </label>
            <input
              type="number"
              value={minVolumeSurge}
              onChange={(e) => setMinVolumeSurge(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 border border-neon-400/10 focus:outline-none focus:border-neon-400/40"
              placeholder="200"
            />
          </div>

          {/* Min $ Volume */}
          <div>
            <label className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1.5">
              <DollarSign size={12} className="text-neon-400" />
              Мин. объём ($)
            </label>
            <input
              type="number"
              value={minVolumeUsd}
              onChange={(e) => setMinVolumeUsd(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 border border-neon-400/10 focus:outline-none focus:border-neon-400/40"
              placeholder="0"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 bg-surface-700 hover:bg-surface-600 text-slate-300 font-medium py-2.5 rounded-lg transition-all"
          >
            Сбросить
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-neon-400 hover:bg-neon-500 text-white font-semibold py-2.5 rounded-lg transition-all shadow-neon-sm"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
