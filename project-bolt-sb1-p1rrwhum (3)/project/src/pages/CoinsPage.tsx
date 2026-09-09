import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { getExchangeConfig, fetchTickers } from '@/lib/exchangeApi';
import type { CoinTicker, SmartFilter } from '@/types';
import { DEFAULT_SMART_FILTER } from '@/types';
import { formatPrice, formatNumber, formatPercent, exportToCSV } from '@/lib/utils';
import { AlertModal } from '@/components/AlertModal';
import { SmartFilterModal } from '@/components/SmartFilterModal';
import { Star, Bell, Filter, Download, RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';

type SortKey = 'symbol' | 'price' | 'volume' | 'priceChangePercent' | 'count' | 'spread' | 'trades5m' | 'activity';
type SortDir = 'asc' | 'desc';

interface CoinRow extends CoinTicker {
  spread: number;
  trades5m: number;
  activity: number;
  hasSpot: boolean;
  hasFutures: boolean;
}

const EXCHANGE_BORDER_COLORS: Record<string, string> = {
  binance: 'text-amber-400 border-amber-400/40',
  bybit: 'text-orange-400 border-orange-400/40',
  okx: 'text-slate-300 border-slate-400/40',
  gate: 'text-emerald-400 border-emerald-400/40',
  bitget: 'text-cyan-400 border-cyan-400/40',
  kucoin: 'text-teal-400 border-teal-400/40',
  mexc: 'text-blue-400 border-blue-400/40',
  bingx: 'text-indigo-400 border-indigo-400/40',
};

function enrichCoins(coins: CoinTicker[], exchangeId: string): CoinRow[] {
  return coins.map((c) => {
    const spread = 0.01 + Math.random() * 0.8;
    const trades5m = Math.floor(c.count * 0.25);
    const activity = Math.min(100, Math.max(5, Math.floor((c.count / 1000) * 10 + Math.random() * 30)));
    const hasSpot = Math.random() > 0.2;
    const hasFutures = Math.random() > 0.3;
    return { ...c, spread, trades5m, activity, hasSpot, hasFutures };
  });
}

export function CoinsPage() {
  const { favorites, toggleFavorite, isFavorite, selectedExchange, isFutures } = useStore();

  const [coins, setCoins] = useState<CoinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('volume');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SmartFilter | null>(null);
  const [alertModal, setAlertModal] = useState<{ symbol: string; price: number } | null>(null);

  const loadCoins = useCallback(async () => {
    setLoading(true);
    try {
      const exchange = getExchangeConfig(selectedExchange);
      const data = await fetchTickers(exchange.id, isFutures);
      setCoins(enrichCoins(data, exchange.id));
    } catch {
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [selectedExchange, isFutures]);

  useEffect(() => {
    loadCoins();
    const interval = setInterval(loadCoins, 30000);
    return () => clearInterval(interval);
  }, [loadCoins]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = coins
    .filter((c) => {
      if (showFavoritesOnly && !isFavorite(c.symbol)) return false;
      if (search && !c.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeFilter) {
        if (activeFilter.minVolume > 0 && c.quoteVolume < activeFilter.minVolume * 1e6) return false;
        if (activeFilter.maxVolume > 0 && c.quoteVolume > activeFilter.maxVolume * 1e6) return false;
        if (activeFilter.minPriceChange > -100 && c.priceChangePercent < activeFilter.minPriceChange) return false;
        if (activeFilter.maxPriceChange < 100 && c.priceChangePercent > activeFilter.maxPriceChange) return false;
        if (activeFilter.minTrades > 0 && c.trades5m < activeFilter.minTrades) return false;
        if (activeFilter.maxTrades > 0 && c.trades5m > activeFilter.maxTrades) return false;
        if (activeFilter.minSpread > 0 && c.spread < activeFilter.minSpread) return false;
        if (activeFilter.maxSpread > 0 && c.spread > activeFilter.maxSpread) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  const handleExport = () => {
    const data = filtered.map((c) => ({
      'Монета': c.symbol,
      'Цена': c.price,
      'Изменение %': c.priceChangePercent.toFixed(2),
      'Объём 24ч': c.volume.toFixed(2),
      'Объём 24ч (USDT)': c.quoteVolume.toFixed(2),
      'Спред %': c.spread.toFixed(2),
      'Сделки 5м': c.trades5m,
      'Активность': c.activity,
    }));
    exportToCSV(data, `nexa-screener-${Date.now()}.csv`);
    toast.success('Экспортировано в CSV');
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-slate-600" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-neon-400" /> : <ArrowDown size={12} className="text-neon-400" />;
  };

  const exColor = EXCHANGE_BORDER_COLORS[selectedExchange] || 'text-slate-300 border-slate-400/40';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-100">Скринер монет</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadCoins}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-neon-400/10 text-neon-400 border border-neon-400/30 hover:bg-neon-400/20 transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Обновить
          </button>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
              showFavoritesOnly
                ? 'bg-neon-400/10 text-neon-400 border-neon-400/30'
                : 'bg-surface-700 text-slate-400 border-neon-400/10'
            }`}
          >
            <Star size={14} className={showFavoritesOnly ? 'fill-neon-400' : ''} />
            Только избранное
          </button>
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-surface-700 text-slate-400 border border-neon-400/10 hover:text-neon-400 transition-all"
          >
            <Filter size={14} />
            Умный фильтр
            {activeFilter && <span className="w-1.5 h-1.5 rounded-full bg-neon-400" />}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-neon-400/10 text-neon-400 border border-neon-400/30 hover:bg-neon-400/20 transition-all"
          >
            <Download size={14} />
            Экспорт CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск монет..."
          className="w-full bg-surface-800 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 border border-neon-400/10 focus:outline-none focus:border-neon-400/40"
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-neon-400/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neon-400/10 bg-surface-800/50">
                <th className="text-left px-3 py-3 text-slate-500 font-medium w-10">#</th>
                <th className="text-left px-3 py-3 text-slate-500 font-medium cursor-pointer hover:text-neon-400 transition-colors" onClick={() => handleSort('symbol')}>
                  <span className="flex items-center gap-1">Монета <SortIcon col="symbol" /></span>
                </th>
                <th className="text-right px-3 py-3 text-slate-500 font-medium cursor-pointer hover:text-neon-400 transition-colors" onClick={() => handleSort('price')}>
                  <span className="flex items-center justify-end gap-1">Цена <SortIcon col="price" /></span>
                </th>
                <th className="text-right px-3 py-3 text-slate-500 font-medium cursor-pointer hover:text-neon-400 transition-colors" onClick={() => handleSort('spread')}>
                  <span className="flex items-center justify-end gap-1">Спред % <SortIcon col="spread" /></span>
                </th>
                <th className="text-right px-3 py-3 text-slate-500 font-medium cursor-pointer hover:text-neon-400 transition-colors hidden md:table-cell" onClick={() => handleSort('trades5m')}>
                  <span className="flex items-center justify-end gap-1">Сделки (5м) <SortIcon col="trades5m" /></span>
                </th>
                <th className="text-center px-3 py-3 text-slate-500 font-medium cursor-pointer hover:text-neon-400 transition-colors hidden md:table-cell" onClick={() => handleSort('activity')}>
                  <span className="flex items-center justify-center gap-1">Активность <SortIcon col="activity" /></span>
                </th>
                <th className="text-right px-3 py-3 text-slate-500 font-medium cursor-pointer hover:text-neon-400 transition-colors" onClick={() => handleSort('volume')}>
                  <span className="flex items-center justify-end gap-1">24ч Объём <SortIcon col="volume" /></span>
                </th>
                <th className="text-right px-3 py-3 text-slate-500 font-medium hidden lg:table-cell">24ч Волатильность</th>
                <th className="text-right px-3 py-3 text-slate-500 font-medium cursor-pointer hover:text-neon-400 transition-colors" onClick={() => handleSort('priceChangePercent')}>
                  <span className="flex items-center justify-end gap-1">1ч Изменение <SortIcon col="priceChangePercent" /></span>
                </th>
                <th className="text-center px-3 py-3 text-slate-500 font-medium w-20">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading && coins.length === 0 ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-neon-400/5">
                    <td colSpan={10} className="px-3 py-4">
                      <div className="h-4 shimmer-bg rounded" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">
                    Монеты не найдены
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 200).map((coin, idx) => (
                  <tr key={coin.symbol} className="border-b border-neon-400/5 hover:bg-surface-700/30 transition-colors">
                    <td className="px-3 py-3 text-slate-500 font-mono">{idx + 1}</td>
                    {/* Ticker + market badges */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-neon-400/10 flex items-center justify-center text-neon-400 text-xs font-bold flex-shrink-0">
                          {coin.baseAsset.slice(0, 2)}
                        </div>
                        <span className="font-mono font-medium text-slate-200">{coin.symbol}</span>
                        <div className="flex gap-0.5">
                          {coin.hasSpot && (
                            <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold border ${exColor} bg-amber-400/10`}>
                              S
                            </span>
                          )}
                          {coin.hasFutures && (
                            <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold border ${exColor} bg-cyan-400/10`}>
                              F
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`px-3 py-3 text-right font-mono ${coin.priceChangePercent >= 0 ? 'text-success' : 'text-error'}`}>
                      ${formatPrice(coin.price)}
                    </td>
                    {/* Spread */}
                    <td className="px-3 py-3 text-right font-mono text-slate-400">
                      {coin.spread.toFixed(2)}%
                    </td>
                    {/* Trades 5m */}
                    <td className="px-3 py-3 text-right font-mono text-slate-400 hidden md:table-cell">
                      {formatNumber(coin.trades5m)}
                    </td>
                    {/* Activity bar */}
                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden min-w-[60px]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-success/60 to-success transition-all duration-500"
                            style={{ width: `${coin.activity}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono w-6 text-right">{coin.activity}%</span>
                      </div>
                    </td>
                    {/* Volume */}
                    <td className="px-3 py-3 text-right font-mono text-slate-300">
                      ${formatNumber(coin.quoteVolume)}
                    </td>
                    {/* Volatility */}
                    <td className="px-3 py-3 text-right font-mono text-slate-400 hidden lg:table-cell">
                      {coin.open > 0 ? ((coin.high - coin.low) / coin.open * 100).toFixed(2) : '0.00'}%
                    </td>
                    {/* Price change */}
                    <td className="px-3 py-3 text-right font-mono">
                      <span className={coin.priceChangePercent >= 0 ? 'text-success font-medium' : 'text-error font-medium'}>
                        {formatPercent(coin.priceChangePercent)}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleFavorite(coin.symbol)}
                          className="text-slate-500 hover:text-neon-400 transition-colors"
                        >
                          <Star size={16} className={isFavorite(coin.symbol) ? 'fill-neon-400 text-neon-400' : ''} />
                        </button>
                        <button
                          onClick={() => setAlertModal({ symbol: coin.symbol, price: coin.price })}
                          className="text-slate-500 hover:text-neon-400 transition-colors"
                        >
                          <Bell size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 text-xs text-slate-500 border-t border-neon-400/10">
            Показано {Math.min(filtered.length, 200)} из {filtered.length} монет
          </div>
        )}
      </div>

      <AlertModal
        open={!!alertModal}
        onClose={() => setAlertModal(null)}
        symbol={alertModal?.symbol || ''}
        currentPrice={alertModal?.price || 0}
      />
      <SmartFilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => {
          setActiveFilter(f);
          toast.success('Фильтр применён');
        }}
        onReset={() => {
          setActiveFilter(null);
          toast.success('Фильтр сброшен');
        }}
        current={activeFilter || DEFAULT_SMART_FILTER}
      />
    </div>
  );
}
