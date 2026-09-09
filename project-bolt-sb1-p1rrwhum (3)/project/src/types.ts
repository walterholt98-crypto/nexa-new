export interface Alert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: 'above' | 'below';
  note?: string;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

export interface CoinTicker {
  symbol: string;
  baseAsset: string;
  price: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
  high: number;
  low: number;
  count: number;
  open: number;
  exchange: string;
}

export interface SmartFilter {
  minVolume: number;
  maxVolume: number;
  minPriceChange: number;
  maxPriceChange: number;
  minTrades: number;
  maxTrades: number;
  minSpread: number;
  maxSpread: number;
  minVolumeSpike: number;
  maxVolumeSpike: number;
  minNatr: number;
  maxNatr: number;
  minOiChange: number;
  maxOiChange: number;
  timeframe: '1m' | '5m' | '15m';
  exchangeMarkets: Record<string, { spot: boolean; futures: boolean }>;
}

export interface ExchangeConfig {
  id: string;
  name: string;
  baseUrl: string;
  futuresBaseUrl?: string;
  logo: string;
}

export interface User {
  name: string;
  email: string;
  provider: 'google' | 'vk' | 'email';
  avatar?: string;
}

export const EXCHANGES: ExchangeConfig[] = [
  { id: 'binance', name: 'Binance', baseUrl: 'https://api.binance.com', futuresBaseUrl: 'https://fapi.binance.com', logo: 'B' },
  { id: 'bybit', name: 'Bybit', baseUrl: 'https://api.bybit.com', futuresBaseUrl: 'https://api.bybit.com', logo: 'Y' },
  { id: 'okx', name: 'OKX', baseUrl: 'https://www.okx.com', futuresBaseUrl: 'https://www.okx.com', logo: 'O' },
  { id: 'gate', name: 'Gate.io', baseUrl: 'https://api.gateio.ws', futuresBaseUrl: 'https://api.gateio.ws', logo: 'G' },
  { id: 'bitget', name: 'Bitget', baseUrl: 'https://api.bitget.com', futuresBaseUrl: 'https://api.bitget.com', logo: 'Bg' },
  { id: 'kucoin', name: 'KuCoin', baseUrl: 'https://api.kucoin.com', futuresBaseUrl: 'https://api.kucoin.com', logo: 'K' },
  { id: 'mexc', name: 'MEXC', baseUrl: 'https://api.mexc.com', futuresBaseUrl: 'https://api.mexc.com', logo: 'M' },
  { id: 'bingx', name: 'BingX', baseUrl: 'https://api.bingx.com', futuresBaseUrl: 'https://api.bingx.com', logo: 'Bx' },
];

export const DEFAULT_SMART_FILTER: SmartFilter = {
  minVolume: 0,
  maxVolume: 0,
  minPriceChange: -100,
  maxPriceChange: 100,
  minTrades: 0,
  maxTrades: 0,
  minSpread: 0,
  maxSpread: 0,
  minVolumeSpike: 0,
  maxVolumeSpike: 0,
  minNatr: 0,
  maxNatr: 0,
  minOiChange: -100,
  maxOiChange: 100,
  timeframe: '5m',
  exchangeMarkets: EXCHANGES.reduce((acc, e) => {
    acc[e.id] = { spot: true, futures: true };
    return acc;
  }, {} as Record<string, { spot: boolean; futures: boolean }>),
};
