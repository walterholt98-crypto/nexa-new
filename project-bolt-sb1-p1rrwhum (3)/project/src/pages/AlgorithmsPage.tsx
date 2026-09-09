import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@/store';
import { getExchangeConfig, fetchTickers } from '@/lib/exchangeApi';
import { formatNumber } from '@/lib/utils';
import { AlgoFilterModal, DEFAULT_ALGO_FILTER, type AlgoFilter } from '@/components/AlgoFilterModal';
import {
  Cpu, RefreshCw, Activity, TrendingUp, AlertTriangle, Zap, ArrowRight,
  ChevronDown, SlidersHorizontal, Rocket, Bot, Eye, BarChart3, Layers, Flame,
} from 'lucide-react';

type AlgorithmType = 'pump_dump' | 'chaser' | 'spoofing' | 'accumulator' | 'arbitrage';
type SignalTag = 'BUY' | 'DANGER' | 'ARBITRAGE' | 'PUMP' | 'DUMP' | 'DEX_LAG';
type FilterType = 'all' | AlgorithmType;
type SortKey = 'volumeUsd' | 'activeMinutes' | 'moveInterval' | 'changePercent' | 'priceGap';
type SortDir = 'asc' | 'desc';

interface AlgoBot {
  id: string;
  symbol: string;
  baseAsset: string;
  exchange: string;
  exchangeId: string;
  algorithm: AlgorithmType;
  moveInterval: number;
  activeMinutes: number;
  volumeUsd: number;
  volumeSurge: number;
  changePercent: number;
  signal: SignalTag;
  surgeSpeed: number;
  priceGap: number;
  dexSource: string;
  standingTime: number;
}

const ALGO_LABELS: Record<AlgorithmType, string> = {
  pump_dump: 'Памп / Дамп Радар',
  chaser: 'Переставляш',
  spoofing: 'Спуфинг',
  accumulator: 'Набивание объёма',
  arbitrage: 'CEX / DEX Арбитраж',
};

const ALGO_DESC: Record<AlgorithmType, string> = {
  pump_dump: 'Pump & Dump Screener',
  chaser: 'Chaser Bot',
  spoofing: 'Spoofing',
  accumulator: 'Accumulator',
  arbitrage: 'Arbitrage',
};

const ALGO_ICONS: Record<AlgorithmType, typeof Rocket> = {
  pump_dump: Rocket,
  chaser: Bot,
  spoofing: Eye,
  accumulator: BarChart3,
  arbitrage: Layers,
};

const ALGO_STYLES: Record<AlgorithmType, string> = {
  pump_dump: 'bg-neon-400/10 text-neon-400 border-neon-400/30',
  chaser: 'bg-orange-400/10 text-orange-400 border-orange-400/30',
  spoofing: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
  accumulator: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30',
  arbitrage: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
};

const SIGNAL_STYLES: Record<SignalTag, { bg: string; text: string; border: string; glow: string; icon: typeof TrendingUp }> = {
  BUY: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/40', glow: '', icon: TrendingUp },
  DANGER: { bg: 'bg-error/10', text: 'text-error', border: 'border-error/40', glow: '', icon: AlertTriangle },
  ARBITRAGE: { bg: 'bg-neon-400/10', text: 'text-neon-400', border: 'border-neon-400/40', glow: '', icon: Zap },
  PUMP: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/50', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.5)]', icon: Rocket },
  DUMP: { bg: 'bg-error/15', text: 'text-error', border: 'border-error/50', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.5)]', icon: TrendingUp },
  DEX_LAG: { bg: 'bg-amber-400/15', text: 'text-amber-400', border: 'border-amber-400/50', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]', icon: Flame },
};

const EXCHANGE_NAMES: Record<string, string> = {
  binance: 'Binance',
  bybit: 'Bybit',
  okx: 'OKX',
  gate: 'Gate.io',
  bitget: 'Bitget',
  kucoin: 'KuCoin',
  mexc: 'MEXC',
  bingx: 'BingX',
};

const DEX_SOURCES = ['Raydium', 'Uniswap V3', 'Orca', 'PancakeSwap'];

const FILTER_OPTIONS: { value: FilterType; label: string; icon: typeof Rocket }[] = [
  { value: 'all', label: 'Все алгоритмы', icon: Cpu },
  { value: 'pump_dump', label: '🚀 Памп / Дамп Радар', icon: Rocket },
  { value: 'chaser', label: '🤖 Переставляш', icon: Bot },
  { value: 'spoofing', label: '⚠️ Спуфинг', icon: Eye },
  { value: 'accumulator', label: '📊 Набивание объёма', icon: BarChart3 },
  { value: 'arbitrage', label: '⚡️ CEX / DEX Арбитраж', icon: Layers },
];

function pickAlgorithm(symbol: string, changePercent: number): AlgorithmType {
  if (Math.abs(changePercent) > 3) return 'pump_dump';
  const hash = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const types: AlgorithmType[] = ['chaser', 'spoofing', 'accumulator', 'arbitrage'];
  return types[hash % types.length];
}

function pickSignal(algo: AlgorithmType, changePercent: number): SignalTag {
  if (algo === 'pump_dump') return changePercent >= 0 ? 'PUMP' : 'DUMP';
  if (algo === 'arbitrage') return Math.random() > 0.4 ? 'DEX_LAG' : 'ARBITRAGE';
  if (algo === 'spoofing') return 'DANGER';
  return changePercent > 0 ? 'BUY' : 'DANGER';
}

function generateBots(
  tickers: { symbol: string; baseAsset: string; price: number; quoteVolume: number; priceChangePercent: number }[],
  exchangeId: string
): AlgoBot[] {
  const top = tickers.slice(0, 40);
  return top.map((t, i) => {
    const algo = pickAlgorithm(t.symbol, t.priceChangePercent);
    const moveInterval = 1 + Math.floor(Math.random() * 9);
    const activeMinutes = 5 + Math.floor(Math.random() * 180);
    const volumeUsd = t.quoteVolume * (0.005 + Math.random() * 0.03);
    const volumeSurge = 150 + Math.floor(Math.random() * 400);
    const changePercent = t.priceChangePercent;
    const surgeSpeed = Math.floor(Math.random() * 60);
    const priceGap = algo === 'arbitrage' ? 0.5 + Math.random() * 4.5 : 0;
    const dexSource = algo === 'arbitrage' ? DEX_SOURCES[i % DEX_SOURCES.length] : '';
    const standingTime = algo === 'arbitrage' ? Math.floor(Math.random() * 120) : 0;
    return {
      id: `${t.symbol}-${i}`,
      symbol: t.symbol,
      baseAsset: t.baseAsset,
      exchange: EXCHANGE_NAMES[exchangeId] || exchangeId,
      exchangeId,
      algorithm: algo,
      moveInterval,
      activeMinutes,
      volumeUsd,
      volumeSurge,
      changePercent,
      signal: pickSignal(algo, changePercent),
      surgeSpeed,
      priceGap,
      dexSource,
      standingTime,
    };
  });
}

export function AlgorithmsPage() {
  const { selectedExchange, isFutures } = useStore();
  const [bots, setBots] = useState<AlgoBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortKey, setSortKey] = useState<SortKey>('volumeUsd');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [algoFilter, setAlgoFilter] = useState<AlgoFilter>(DEFAULT_ALGO_FILTER);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const exchange = getExchangeConfig(selectedExchange);
      const tickers = await fetchTickers(exchange.id, isFutures);
      setBots(generateBots(tickers, exchange.id));
      setLastUpdate(new Date());
    } catch {
      setBots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedExchange, isFutures]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [dropdownOpen]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    return bots
      .filter((b) => filter === 'all' || b.algorithm === filter)
      .filter((b) => b.volumeUsd >= algoFilter.minVolumeUsd)
      .filter((b) => {
        if (filter === 'pump_dump' || filter === 'all') {
          return Math.abs(b.changePercent) >= algoFilter.minPumpDump;
        }
        return true;
      })
      .filter((b) => b.volumeSurge >= algoFilter.minVolumeSurge)
      .sort((a, b) => {
        const diff = a[sortKey] - b[sortKey];
        return sortDir === 'asc' ? diff : -diff;
      });
  }, [bots, filter, sortKey, sortDir, algoFilter]);

  const signalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bots.forEach((b) => {
      counts[b.signal] = (counts[b.signal] || 0) + 1;
    });
    return counts;
  }, [bots]);

  const activeFilterLabel = FILTER_OPTIONS.find((opt) => opt.value === filter)?.label || 'Все алгоритмы';
  const ActiveFilterIcon = FILTER_OPTIONS.find((opt) => opt.value === filter)?.icon || Cpu;

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const isArbView = filter === 'arbitrage' || filter === 'all';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Cpu size={22} className="text-neon-400" />
          <h1 className="text-xl font-bold text-slate-100">Алгоритмы</h1>
          <span className="text-xs text-slate-500 px-2 py-1 rounded bg-surface-700 border border-neon-400/10">
            {bots.length} активных ботов
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Activity size={12} className="text-neon-400 animate-pulse" />
              Обновлено {lastUpdate.toLocaleTimeString('ru-RU')}
            </span>
          )}
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-neon-400/10 text-neon-400 border border-neon-400/30 hover:bg-neon-400/20 transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>
      </div>

      {/* Signal summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {(['BUY', 'DANGER', 'ARBITRAGE'] as SignalTag[]).map((sig) => {
          const style = SIGNAL_STYLES[sig];
          const Icon = style.icon;
          return (
            <div key={sig} className={`glass-card rounded-xl border ${style.border} p-3 flex items-center gap-3`}>
              <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center`}>
                <Icon size={18} className={style.text} />
              </div>
              <div>
                <div className={`text-lg font-bold ${style.text}`}>{signalCounts[sig] || 0}</div>
                <div className="text-xs text-slate-500">{sig}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar: Dropdown + Filter button */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-surface-700 text-slate-200 border border-neon-400/20 hover:border-neon-400/40 transition-all min-w-[200px]"
          >
            <ActiveFilterIcon size={14} className="text-neon-400 flex-shrink-0" />
            <span className="flex-1 text-left truncate">{activeFilterLabel}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div
              className="absolute top-full left-0 mt-1 w-full min-w-[220px] glass-card rounded-xl border border-neon-400/20 p-1.5 shadow-neon-md z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {FILTER_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setFilter(opt.value); setDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === opt.value
                        ? 'bg-neon-400/10 text-neon-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-surface-700'
                    }`}
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => setFilterModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-surface-700 text-slate-300 border border-neon-400/20 hover:border-neon-400/40 hover:text-neon-400 transition-all"
        >
          <SlidersHorizontal size={14} />
          Фильтр
        </button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-neon-400/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neon-400/10 bg-surface-800/50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Монета / Биржа</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Тип алгоритма</th>
                {filter === 'pump_dump' ? (
                  <th className="text-left px-4 py-3 text-slate-500 font-medium cursor-pointer hover:text-neon-400 transition-colors" onClick={() => handleSort('changePercent')}>
                    Памп / Дамп{sortIndicator('changePercent')}
                  </th>
                ) : filter === 'arbitrage' ? (
                  <th className="text-left px-4 py-3 text-slate-500 font-medium cursor-pointer hover:text-neon-400 transition-colors" onClick={() => handleSort('priceGap')}>
                    Цена / Спред{sortIndicator('priceGap')}
                  </th>
                ) : (
                  <th className="text-left px-4 py-3 text-slate-500 font-medium cursor-pointer hover:text-neon-400 transition-colors" onClick={() => handleSort('moveInterval')}>
                    Время & Скорость
                  </th>
                )}
                <th className="text-right px-4 py-3 text-slate-500 font-medium cursor-pointer hover:text-neon-400 transition-colors" onClick={() => handleSort('volumeUsd')}>
                  Объём ($){sortIndicator('volumeUsd')}
                </th>
                <th className="text-center px-4 py-3 text-slate-500 font-medium">Сигнал</th>
              </tr>
            </thead>
            <tbody>
              {loading && bots.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-neon-400/5">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-4 shimmer-bg rounded" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    Активные алгоритмы не обнаружены
                  </td>
                </tr>
              ) : (
                filtered.map((bot) => {
                  const sigStyle = SIGNAL_STYLES[bot.signal];
                  const SigIcon = sigStyle.icon;
                  const AlgoIcon = ALGO_ICONS[bot.algorithm];
                  const isPumpDump = bot.algorithm === 'pump_dump';
                  const isArbitrage = bot.algorithm === 'arbitrage';
                  return (
                    <tr key={bot.id} className="border-b border-neon-400/5 hover:bg-surface-700/30 transition-colors">
                      {/* Coin & Exchange */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-neon-400/10 flex items-center justify-center text-neon-400 text-xs font-bold flex-shrink-0">
                            {bot.baseAsset.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-mono font-medium text-slate-200">{bot.baseAsset}</div>
                            <div className="text-xs text-slate-500">
                              {bot.exchange}
                              {isArbitrage && bot.dexSource && (
                                <span className="text-amber-400"> ↔ {bot.dexSource}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Algorithm Type */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${ALGO_STYLES[bot.algorithm]}`}>
                          <AlgoIcon size={12} />
                          {ALGO_LABELS[bot.algorithm]}
                        </span>
                        <div className="text-[10px] text-slate-600 mt-1">{ALGO_DESC[bot.algorithm]}</div>
                      </td>
                      {/* Dynamic column based on algorithm type */}
                      {isPumpDump ? (
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border w-fit ${sigStyle.bg} ${sigStyle.text} ${sigStyle.border} ${sigStyle.glow}`}>
                              <SigIcon size={12} />
                              {bot.signal === 'PUMP' ? '🚀' : '🔻'} {bot.signal === 'PUMP' ? 'PUMP' : 'DUMP'} {bot.changePercent >= 0 ? '+' : ''}{bot.changePercent.toFixed(1)}%
                            </span>
                            <span className="text-xs text-slate-500">
                              Скорость: {bot.surgeSpeed}с · Всплеск: +{bot.volumeSurge}%
                            </span>
                          </div>
                        </td>
                      ) : isArbitrage ? (
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {bot.signal === 'DEX_LAG' ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border w-fit ${sigStyle.bg} ${sigStyle.text} ${sigStyle.border} ${sigStyle.glow}`}>
                                <Flame size={12} />
                                🔥 +{bot.priceGap.toFixed(1)}% DEX Lag
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border w-fit ${sigStyle.bg} ${sigStyle.text} ${sigStyle.border}`}>
                                <Zap size={12} />
                                ⚡️ Спред {bot.priceGap.toFixed(1)}%
                              </span>
                            )}
                            <span className="text-xs text-slate-500">
                              Стоит {bot.standingTime}с · {bot.exchange} ↔ {bot.dexSource}
                            </span>
                          </div>
                        </td>
                      ) : isArbView && (bot.signal === 'PUMP' || bot.signal === 'DUMP') ? (
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border w-fit ${sigStyle.bg} ${sigStyle.text} ${sigStyle.border} ${sigStyle.glow}`}>
                              <SigIcon size={12} />
                              {bot.signal === 'PUMP' ? '🚀' : '🔻'} {bot.signal} {bot.changePercent >= 0 ? '+' : ''}{bot.changePercent.toFixed(1)}%
                            </span>
                            <span className="text-xs text-slate-500">
                              Скорость: {bot.surgeSpeed}с · Всплеск: +{bot.volumeSurge}%
                            </span>
                          </div>
                        </td>
                      ) : (
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300">
                              <ArrowRight size={12} className="text-neon-400" />
                              {bot.algorithm === 'chaser' ? '🤖' : bot.algorithm === 'spoofing' ? '⚠️' : '📊'} Движение каждые {bot.moveInterval}с
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Activity size={11} className="text-slate-500" />
                              Активен {bot.activeMinutes}м
                            </div>
                          </div>
                        </td>
                      )}
                      {/* Volume */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono text-slate-300">${formatNumber(bot.volumeUsd)}</div>
                        <div className="text-[10px] text-slate-600 mt-0.5">+{bot.volumeSurge}% всплеск</div>
                      </td>
                      {/* Signal */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${sigStyle.bg} ${sigStyle.text} ${sigStyle.border} ${sigStyle.glow}`}>
                          <SigIcon size={12} />
                          {bot.signal}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 text-xs text-slate-500 border-t border-neon-400/10">
            Показано {filtered.length} из {bots.length} алгоритмов
          </div>
        )}
      </div>

      <AlgoFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={setAlgoFilter}
        onReset={() => setAlgoFilter(DEFAULT_ALGO_FILTER)}
        current={algoFilter}
      />
    </div>
  );
}
