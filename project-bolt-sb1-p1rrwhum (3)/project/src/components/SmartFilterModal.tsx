import { useState } from 'react';
import { EXCHANGES, DEFAULT_SMART_FILTER, type SmartFilter } from '@/types';
import { X, Filter, Check } from 'lucide-react';

interface SmartFilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filter: SmartFilter) => void;
  onReset: () => void;
  current?: SmartFilter;
}

const TIMEFRAMES: ('1m' | '5m' | '15m')[] = ['1m', '5m', '15m'];

const EXCHANGE_BORDER_COLORS: Record<string, string> = {
  binance: 'border-amber-400/40',
  bybit: 'border-orange-400/40',
  okx: 'border-slate-400/40',
  gate: 'border-emerald-400/40',
  bitget: 'border-cyan-400/40',
  kucoin: 'border-teal-400/40',
  mexc: 'border-blue-400/40',
  bingx: 'border-indigo-400/40',
};

function MinMaxInput({ label, minVal, maxVal, onMin, onMax, placeholder }: {
  label: string;
  minVal: string;
  maxVal: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] text-slate-500 font-medium mb-1 block">{label}</label>
      <div className="flex gap-1.5">
        <input
          type="number"
          value={minVal}
          onChange={(e) => onMin(e.target.value)}
          className="w-full bg-surface-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 border border-neon-400/10 focus:outline-none focus:border-neon-400/40"
          placeholder={placeholder || 'Min'}
        />
        <input
          type="number"
          value={maxVal}
          onChange={(e) => onMax(e.target.value)}
          className="w-full bg-surface-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 border border-neon-400/10 focus:outline-none focus:border-neon-400/40"
          placeholder="Max"
        />
      </div>
    </div>
  );
}

export function SmartFilterModal({ open, onClose, onApply, onReset, current }: SmartFilterModalProps) {
  const base = current || DEFAULT_SMART_FILTER;
  const [timeframe, setTimeframe] = useState(base.timeframe);
  const [minVolume, setMinVolume] = useState(String(base.minVolume));
  const [maxVolume, setMaxVolume] = useState(String(base.maxVolume));
  const [minPriceChange, setMinPriceChange] = useState(String(base.minPriceChange));
  const [maxPriceChange, setMaxPriceChange] = useState(String(base.maxPriceChange));
  const [minTrades, setMinTrades] = useState(String(base.minTrades));
  const [maxTrades, setMaxTrades] = useState(String(base.maxTrades));
  const [minSpread, setMinSpread] = useState(String(base.minSpread));
  const [maxSpread, setMaxSpread] = useState(String(base.maxSpread));
  const [minVolumeSpike, setMinVolumeSpike] = useState(String(base.minVolumeSpike));
  const [maxVolumeSpike, setMaxVolumeSpike] = useState(String(base.maxVolumeSpike));
  const [minNatr, setMinNatr] = useState(String(base.minNatr));
  const [maxNatr, setMaxNatr] = useState(String(base.maxNatr));
  const [minOiChange, setMinOiChange] = useState(String(base.minOiChange));
  const [maxOiChange, setMaxOiChange] = useState(String(base.maxOiChange));
  const [exchangeMarkets, setExchangeMarkets] = useState(base.exchangeMarkets);

  if (!open) return null;

  const toggleMarket = (exchangeId: string, market: 'spot' | 'futures') => {
    setExchangeMarkets((prev) => ({
      ...prev,
      [exchangeId]: { ...prev[exchangeId], [market]: !prev[exchangeId][market] },
    }));
  };

  const handleApply = () => {
    onApply({
      ...base,
      timeframe,
      minVolume: parseFloat(minVolume) || 0,
      maxVolume: parseFloat(maxVolume) || 0,
      minPriceChange: parseFloat(minPriceChange) || -100,
      maxPriceChange: parseFloat(maxPriceChange) || 100,
      minTrades: parseFloat(minTrades) || 0,
      maxTrades: parseFloat(maxTrades) || 0,
      minSpread: parseFloat(minSpread) || 0,
      maxSpread: parseFloat(maxSpread) || 0,
      minVolumeSpike: parseFloat(minVolumeSpike) || 0,
      maxVolumeSpike: parseFloat(maxVolumeSpike) || 0,
      minNatr: parseFloat(minNatr) || 0,
      maxNatr: parseFloat(maxNatr) || 0,
      minOiChange: parseFloat(minOiChange) || -100,
      maxOiChange: parseFloat(maxOiChange) || 100,
      exchangeMarkets,
    });
    onClose();
  };

  const handleReset = () => {
    const d = DEFAULT_SMART_FILTER;
    setTimeframe(d.timeframe);
    setMinVolume('0'); setMaxVolume('0');
    setMinPriceChange('-100'); setMaxPriceChange('100');
    setMinTrades('0'); setMaxTrades('0');
    setMinSpread('0'); setMaxSpread('0');
    setMinVolumeSpike('0'); setMaxVolumeSpike('0');
    setMinNatr('0'); setMaxNatr('0');
    setMinOiChange('-100'); setMaxOiChange('100');
    setExchangeMarkets(d.exchangeMarkets);
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card rounded-2xl w-full max-w-2xl mx-4 p-5 border border-neon-400/20 shadow-neon-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-neon-400/10 flex items-center justify-center">
              <Filter size={18} className="text-neon-400" />
            </div>
            <h2 className="text-base font-bold gradient-text">Умный фильтр</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Exchange & Market Matrix */}
        <div className="mb-4">
          <label className="text-[11px] text-slate-500 font-medium mb-2 block">Биржи и рынки</label>
          <div className="grid grid-cols-4 gap-1.5">
            {EXCHANGES.map((ex) => {
              const border = EXCHANGE_BORDER_COLORS[ex.id] || 'border-slate-400/40';
              const em = exchangeMarkets[ex.id] || { spot: false, futures: false };
              return (
                <div key={ex.id} className={`rounded-lg border ${border} bg-surface-800/50 p-1.5`}>
                  <div className="text-[10px] text-slate-400 font-medium text-center mb-1 truncate">{ex.name}</div>
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => toggleMarket(ex.id, 'spot')}
                      className={`w-7 h-7 rounded text-[10px] font-bold border transition-all ${
                        em.spot
                          ? 'bg-amber-400/20 text-amber-400 border-amber-400/50'
                          : 'bg-surface-700 text-slate-600 border-slate-600/30'
                      }`}
                    >
                      {em.spot ? <Check size={10} className="mx-auto" /> : 'S'}
                    </button>
                    <button
                      onClick={() => toggleMarket(ex.id, 'futures')}
                      className={`w-7 h-7 rounded text-[10px] font-bold border transition-all ${
                        em.futures
                          ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/50'
                          : 'bg-surface-700 text-slate-600 border-slate-600/30'
                      }`}
                    >
                      {em.futures ? <Check size={10} className="mx-auto" /> : 'F'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="mb-4">
          <label className="text-[11px] text-slate-500 font-medium mb-2 block">Таймфрейм</label>
          <div className="flex gap-1.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
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

        {/* Precision parameters grid */}
        <div className="grid grid-cols-2 gap-3">
          <MinMaxInput label="Изменение цены %" minVal={minPriceChange} maxVal={maxPriceChange} onMin={setMinPriceChange} onMax={setMaxPriceChange} placeholder="-100" />
          <MinMaxInput label="Сделки (кол-во)" minVal={minTrades} maxVal={maxTrades} onMin={setMinTrades} onMax={setMaxTrades} placeholder="0" />
          <MinMaxInput label="Оборот / Объём ($)" minVal={minVolume} maxVal={maxVolume} onMin={setMinVolume} onMax={setMaxVolume} placeholder="0" />
          <MinMaxInput label="Спред %" minVal={minSpread} maxVal={maxSpread} onMin={setMinSpread} onMax={setMaxSpread} placeholder="0.3" />
          <MinMaxInput label="Всплеск объёма %" minVal={minVolumeSpike} maxVal={maxVolumeSpike} onMin={setMinVolumeSpike} onMax={setMaxVolumeSpike} placeholder="200" />
          <MinMaxInput label="NATR %" minVal={minNatr} maxVal={maxNatr} onMin={setMinNatr} onMax={setMaxNatr} placeholder="0" />
          <MinMaxInput label="Изменение ОИ %" minVal={minOiChange} maxVal={maxOiChange} onMin={setMinOiChange} onMax={setMaxOiChange} placeholder="-100" />
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 bg-surface-700 hover:bg-surface-600 text-slate-300 font-medium py-2.5 rounded-lg transition-all text-sm"
          >
            Сбросить фильтры
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-neon-400 hover:bg-neon-500 text-white font-semibold py-2.5 rounded-lg transition-all shadow-neon-sm text-sm"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
