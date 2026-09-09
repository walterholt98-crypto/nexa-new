import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { EXCHANGES } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Flame, Clock, CheckCircle2, Rocket, LineChart, Calendar, ExternalLink } from 'lucide-react';

type ListingStatus = 'live' | 'upcoming' | 'just_listed' | 'pre_market';
type FilterKey = 'all' | 'upcoming' | 'just_listed' | 'pre_market';

interface Listing {
  id: string;
  name: string;
  ticker: string;
  exchangeId: string;
  status: ListingStatus;
  launchDate: string;
  price: number;
  isFutures: boolean;
}

const EXCHANGE_COLORS: Record<string, string> = {
  binance: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
  bybit: 'bg-orange-400/10 text-orange-400 border-orange-400/30',
  okx: 'bg-slate-400/10 text-slate-300 border-slate-400/30',
  gate: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  bitget: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30',
  kucoin: 'bg-teal-400/10 text-teal-400 border-teal-400/30',
  mexc: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
  bingx: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/30',
};

const EXCHANGE_NAMES: Record<string, string> = EXCHANGES.reduce(
  (acc, e) => { acc[e.id] = e.name; return acc; },
  {} as Record<string, string>
);

function buildListings(): Listing[] {
  const now = Date.now();
  const tokens = [
    { name: 'Pepe2', ticker: 'PEPE2', price: 0.0000042 },
    { name: 'NewTicket', ticker: 'NEWTICKET', price: 0.0312 },
    { name: 'QuantumAI', ticker: 'QAI', price: 1.45 },
    { name: 'MetaFi', ticker: 'METAFI', price: 0.087 },
    { name: 'SolarX', ticker: 'SOLX', price: 0.0042 },
    { name: 'ZephyrChain', ticker: 'ZEPH', price: 0.512 },
    { name: 'NeonDAO', ticker: 'NEON', price: 2.34 },
    { name: 'HyperLend', ticker: 'HYPE', price: 0.156 },
    { name: 'OmniStake', ticker: 'OMNI', price: 3.78 },
    { name: 'PulseNet', ticker: 'PULSE', price: 0.0234 },
    { name: 'AeroSwap', ticker: 'AERO', price: 0.645 },
    { name: 'FluxFi', ticker: 'FLUX', price: 0.0891 },
    { name: 'CosmicPad', ticker: 'COSMIC', price: 0.00123 },
    { name: 'VortexAI', ticker: 'VTX', price: 5.67 },
    { name: 'LumenX', ticker: 'LUMEN', price: 0.345 },
    { name: 'NovaBridge', ticker: 'NOVA', price: 1.12 },
  ];

  const statuses: ListingStatus[] = ['live', 'upcoming', 'just_listed', 'pre_market'];
  const exchangeIds = EXCHANGES.map((e) => e.id);

  return tokens.map((t, i) => {
    const status = statuses[i % statuses.length];
    const exchangeId = exchangeIds[i % exchangeIds.length];
    let launchDate: string;
    if (status === 'live' || status === 'just_listed') {
      launchDate = new Date(now - (i * 2 + 1) * 60 * 60 * 1000).toISOString();
    } else {
      launchDate = new Date(now + (i + 2) * 45 * 60 * 1000).toISOString();
    }
    return {
      id: `${t.ticker}-${exchangeId}-${i}`,
      name: t.name,
      ticker: t.ticker,
      exchangeId,
      status,
      launchDate,
      price: t.price * (0.9 + Math.random() * 0.2),
      isFutures: i % 3 === 0,
    };
  });
}

function formatCountdown(launchDate: string): string {
  const diff = new Date(launchDate).getTime() - Date.now();
  if (diff <= 0) return 'Скоро';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${String(hours).padStart(2, '0')}ч ${String(minutes).padStart(2, '0')}м`;
}

function formatLaunchDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day}.${month} ${hours}:${minutes} UTC`;
}

const FILTER_OPTIONS: { key: FilterKey; label: string; icon: typeof Clock }[] = [
  { key: 'all', label: 'Все', icon: Rocket },
  { key: 'upcoming', label: 'Скоро / Отсчёт', icon: Clock },
  { key: 'just_listed', label: 'Только что (24ч)', icon: CheckCircle2 },
  { key: 'pre_market', label: 'Pre-Market', icon: Flame },
];

const STATUS_BADGES: Record<ListingStatus, { label: string; bg: string; text: string; border: string; icon: typeof Clock }> = {
  live: { label: 'Активен', bg: 'bg-success/10', text: 'text-success', border: 'border-success/40', icon: CheckCircle2 },
  upcoming: { label: 'Скоро', bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/40', icon: Clock },
  just_listed: { label: 'Только что', bg: 'bg-neon-400/10', text: 'text-neon-400', border: 'border-neon-400/40', icon: Rocket },
  pre_market: { label: 'Pre-Market', bg: 'bg-purple-400/10', text: 'text-purple-400', border: 'border-purple-400/40', icon: Flame },
};

export function ListingsPage() {
  const navigate = useNavigate();
  const { selectedExchange, setSelectedExchange, isFutures } = useStore();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [tick, setTick] = useState(0);

  const listings = useMemo(() => buildListings(), []);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const marketListings = useMemo(() => listings.filter((listing) => {
    const matchesExchange = selectedExchange === 'all' || listing.exchangeId === selectedExchange;
    const matchesMarket = isFutures
      ? listing.isFutures || listing.status === 'pre_market'
      : !listing.isFutures && listing.status !== 'pre_market';
    return matchesExchange && matchesMarket;
  }), [listings, selectedExchange, isFutures]);

  const filtered = useMemo(() => {
    if (filter === 'all') return marketListings;
    return marketListings.filter((listing) => listing.status === filter);
  }, [marketListings, filter, tick]);

  const counts = useMemo(() => ({
    all: marketListings.length,
    upcoming: marketListings.filter((listing) => listing.status === 'upcoming').length,
    just_listed: marketListings.filter((listing) => listing.status === 'just_listed').length,
    pre_market: marketListings.filter((listing) => listing.status === 'pre_market').length,
  }), [marketListings]);

  const openInCharts = (listing: Listing) => {
    setSelectedExchange(listing.exchangeId);
    navigate('/dashboard');
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="glass-card rounded-xl border border-neon-400/30 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-neon-400/10 flex items-center justify-center flex-shrink-0">
          <Flame size={20} className="text-neon-400" />
        </div>
        <p className="text-sm font-medium text-slate-200">
          Отслеживайте новые монеты на 8 биржах секунда в секунду
        </p>
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const count = counts[opt.key];
          return (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                filter === opt.key
                  ? 'bg-neon-400/10 text-neon-400 border-neon-400/30'
                  : 'bg-surface-700 text-slate-400 border-neon-400/10 hover:text-neon-400 hover:border-neon-400/20'
              }`}
            >
              <Icon size={14} />
              {opt.label}
              <span className="text-xs text-slate-500 ml-1">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-neon-400/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neon-400/10 bg-surface-800/50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Токен / Тикер</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Биржа</th>
                <th className="text-center px-4 py-3 text-slate-500 font-medium">Статус</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Дата запуска (UTC)</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Цена / Оценка</th>
                <th className="text-center px-4 py-3 text-slate-500 font-medium">Действие</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    Листинги не найдены
                  </td>
                </tr>
              ) : (
                filtered.map((listing) => {
                  const badge = STATUS_BADGES[listing.status];
                  const BadgeIcon = badge.icon;
                  const exColor = EXCHANGE_COLORS[listing.exchangeId] || 'bg-slate-400/10 text-slate-300 border-slate-400/30';
                  return (
                    <tr key={listing.id} className="border-b border-neon-400/5 hover:bg-surface-700/30 transition-colors">
                      {/* Token & Ticker */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-400/20 to-neon-600/20 flex items-center justify-center text-neon-400 text-xs font-bold flex-shrink-0">
                            {listing.ticker.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-200">{listing.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{listing.ticker}</div>
                          </div>
                        </div>
                      </td>
                      {/* Exchange tag */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${exColor}`}>
                          {EXCHANGE_NAMES[listing.exchangeId]}
                        </span>
                      </td>
                      {/* Status badge */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <BadgeIcon size={12} />
                          {listing.status === 'upcoming' ? formatCountdown(listing.launchDate) : badge.label}
                        </span>
                      </td>
                      {/* Launch date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar size={12} className="text-slate-500" />
                          {formatLaunchDate(listing.launchDate)}
                        </div>
                      </td>
                      {/* Price */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono text-slate-300">${formatPrice(listing.price)}</div>
                        {listing.isFutures && (
                          <div className="text-[10px] text-neon-400 font-medium mt-0.5">Futures</div>
                        )}
                      </td>
                      {/* Action */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openInCharts(listing)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neon-400/10 text-neon-400 border border-neon-400/30 hover:bg-neon-400/20 transition-all"
                        >
                          <LineChart size={13} />
                          Открыть в графиках
                          <ExternalLink size={11} />
                        </button>
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
            Показано {filtered.length} листингов
          </div>
        )}
      </div>
    </div>
  );
}
