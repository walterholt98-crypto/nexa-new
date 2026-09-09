import axios from 'axios';
import type { CoinTicker, ExchangeConfig } from '@/types';
import { EXCHANGES } from '@/types';

const EXCHANGES_MAP: Record<string, ExchangeConfig> = EXCHANGES.reduce(
  (acc, e) => { acc[e.id] = e; return acc; },
  {} as Record<string, ExchangeConfig>
);

export function getExchangeConfig(id: string): ExchangeConfig {
  return EXCHANGES_MAP[id] || EXCHANGES_MAP['binance'];
}

export async function fetchTickers(exchangeId: string, isFutures: boolean): Promise<CoinTicker[]> {
  const exchange = getExchangeConfig(exchangeId);
  try {
    let result: CoinTicker[];
    switch (exchangeId) {
      case 'binance':
        result = await fetchBinance(exchange, isFutures); break;
      case 'bybit':
        result = await fetchBybit(exchange, isFutures); break;
      case 'okx':
        result = await fetchOKX(exchange, isFutures); break;
      case 'gate':
        result = await fetchGate(exchange, isFutures); break;
      case 'bitget':
        result = await fetchBitget(exchange, isFutures); break;
      case 'kucoin':
        result = await fetchKuCoin(exchange, isFutures); break;
      case 'mexc':
        result = await fetchMEXC(exchange, isFutures); break;
      case 'bingx':
        result = await fetchBingX(exchange, isFutures); break;
      default:
        result = await fetchBinance(EXCHANGES_MAP['binance'], false);
    }
    return result.length > 0 ? result : getDemoTickers(exchangeId);
  } catch {
    return getDemoTickers(exchangeId);
  }
}

const DEMO_COINS: { symbol: string; price: number; change: number; volume: number }[] = [
  { symbol: 'BTCUSDT', price: 67432.50, change: 2.34, volume: 28_500_000_000 },
  { symbol: 'ETHUSDT', price: 3521.80, change: 1.87, volume: 12_800_000_000 },
  { symbol: 'SOLUSDT', price: 168.45, change: 4.12, volume: 4_200_000_000 },
  { symbol: 'BNBUSDT', price: 584.20, change: -0.54, volume: 1_500_000_000 },
  { symbol: 'XRPUSDT', price: 0.5234, change: 1.23, volume: 1_200_000_000 },
  { symbol: 'DOGEUSDT', price: 0.1087, change: 5.67, volume: 980_000_000 },
  { symbol: 'ADAUSDT', price: 0.3845, change: -1.34, volume: 450_000_000 },
  { symbol: 'AVAXUSDT', price: 26.78, change: 3.45, volume: 420_000_000 },
  { symbol: 'LINKUSDT', price: 14.32, change: 0.89, volume: 380_000_000 },
  { symbol: 'DOTUSDT', price: 4.567, change: -2.10, volume: 310_000_000 },
  { symbol: 'MATICUSDT', price: 0.4123, change: 1.56, volume: 290_000_000 },
  { symbol: 'LTCUSDT', price: 64.50, change: -0.78, volume: 280_000_000 },
  { symbol: 'TRXUSDT', price: 0.1534, change: 0.45, volume: 250_000_000 },
  { symbol: 'SHIBUSDT', price: 0.00001823, change: 7.89, volume: 220_000_000 },
  { symbol: 'ATOMUSDT', price: 5.678, change: -1.23, volume: 180_000_000 },
  { symbol: 'UNIUSDT', price: 7.890, change: 2.45, volume: 170_000_000 },
  { symbol: 'NEARUSDT', price: 4.123, change: 6.78, volume: 160_000_000 },
  { symbol: 'APTUSDT', price: 8.456, change: -3.21, volume: 150_000_000 },
  { symbol: 'FILUSDT', price: 3.789, change: 1.12, volume: 140_000_000 },
  { symbol: 'ARBUSDT', price: 0.5678, change: -0.45, volume: 130_000_000 },
  { symbol: 'OPUSDT', price: 1.890, change: 4.56, volume: 120_000_000 },
  { symbol: 'INJUSDT', price: 23.45, change: 8.90, volume: 110_000_000 },
  { symbol: 'SUIUSDT', price: 1.234, change: -2.34, volume: 100_000_000 },
  { symbol: 'SEIUSDT', price: 0.4567, change: 3.78, volume: 95_000_000 },
  { symbol: 'RUNEUSDT', price: 5.678, change: -1.56, volume: 85_000_000 },
  { symbol: 'FTMUSDT', price: 0.6789, change: 2.34, volume: 80_000_000 },
  { symbol: 'AAVEUSDT', price: 112.30, change: 1.45, volume: 75_000_000 },
  { symbol: 'MKRUSDT', price: 2345.00, change: -0.34, volume: 70_000_000 },
  { symbol: 'GALAUSDT', price: 0.02345, change: 5.23, volume: 65_000_000 },
  { symbol: 'SANDUSDT', price: 0.3456, change: -1.78, volume: 60_000_000 },
];

function getDemoTickers(exchangeId: string): CoinTicker[] {
  return DEMO_COINS.map((c) => {
    const baseAsset = c.symbol.replace('USDT', '');
    const high = c.price * (1 + Math.abs(c.change) / 100 + 0.01);
    const low = c.price * (1 - Math.abs(c.change) / 100 - 0.01);
    const open = c.price / (1 + c.change / 100);
    return {
      symbol: c.symbol,
      baseAsset,
      price: c.price,
      priceChangePercent: c.change,
      volume: c.volume / c.price,
      quoteVolume: c.volume,
      high,
      low,
      count: Math.floor(c.volume / 10000),
      open,
      exchange: exchangeId,
    };
  });
}

export async function fetchPrice(symbol: string, exchangeId: string, isFutures: boolean): Promise<number | null> {
  try {
    const exchange = getExchangeConfig(exchangeId);
    if (exchangeId === 'binance') {
      const base = isFutures && exchange.futuresBaseUrl ? exchange.futuresBaseUrl : exchange.baseUrl;
      const url = isFutures
        ? `${base}/fapi/v1/ticker/price?symbol=${symbol}`
        : `${base}/api/v3/ticker/price?symbol=${symbol}`;
      const res = await axios.get(url, { timeout: 10000 });
      return parseFloat(res.data.price);
    }
    // Fallback: fetch all tickers and find the symbol
    const tickers = await fetchTickers(exchangeId, isFutures);
    const t = tickers.find((x) => x.symbol === symbol || x.baseAsset + 'USDT' === symbol);
    return t ? t.price : null;
  } catch {
    return null;
  }
}

export async function fetchKlines(symbol: string, exchangeId: string, isFutures: boolean, interval: string): Promise<any[]> {
  const exchange = getExchangeConfig(exchangeId);
  try {
    if (exchangeId === 'binance') {
      const base = isFutures && exchange.futuresBaseUrl ? exchange.futuresBaseUrl : exchange.baseUrl;
      const url = isFutures
        ? `${base}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=200`
        : `${base}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200`;
      const res = await axios.get(url, { timeout: 10000 });
      return res.data.map((k: any[]) => ({
        time: Math.floor(k[0] / 1000) as number,
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));
    }
    // Fallback for other exchanges — try Binance klines as a reasonable proxy
    const binance = EXCHANGES_MAP['binance'];
    const base = isFutures && binance.futuresBaseUrl ? binance.futuresBaseUrl : binance.baseUrl;
    const url = isFutures
      ? `${base}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=200`
      : `${base}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200`;
    const res = await axios.get(url, { timeout: 10000 });
    return res.data.map((k: any[]) => ({
      time: Math.floor(k[0] / 1000) as number,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch {
    return [];
  }
}

export async function fetchOrderBook(symbol: string, exchangeId: string, isFutures: boolean) {
  try {
    const exchange = getExchangeConfig(exchangeId);
    if (exchangeId === 'binance') {
      const base = isFutures && exchange.futuresBaseUrl ? exchange.futuresBaseUrl : exchange.baseUrl;
      const url = isFutures
        ? `${base}/fapi/v1/depth?symbol=${symbol}&limit=50`
        : `${base}/api/v3/depth?symbol=${symbol}&limit=50`;
      const res = await axios.get(url, { timeout: 10000 });
      return res.data;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Binance ───
async function fetchBinance(exchange: ExchangeConfig, isFutures: boolean): Promise<CoinTicker[]> {
  const base = isFutures && exchange.futuresBaseUrl ? exchange.futuresBaseUrl : exchange.baseUrl;
  const url = isFutures ? `${base}/fapi/v1/ticker/24hr` : `${base}/api/v3/ticker/24hr`;
  const res = await axios.get(url, { timeout: 15000 });
  const raw: any[] = Array.isArray(res.data) ? res.data : [res.data];
  return raw
    .filter((t) => t.symbol?.endsWith('USDT') && !t.symbol.includes('UP') && !t.symbol.includes('DOWN'))
    .map((t) => ({
      symbol: t.symbol as string,
      baseAsset: (t.symbol as string).replace('USDT', ''),
      price: parseFloat(t.lastPrice) || 0,
      priceChangePercent: parseFloat(t.priceChangePercent) || 0,
      volume: parseFloat(t.volume) || 0,
      quoteVolume: parseFloat(t.quoteVolume) || 0,
      high: parseFloat(t.highPrice) || 0,
      low: parseFloat(t.lowPrice) || 0,
      count: t.count ? parseInt(t.count) : 0,
      open: parseFloat(t.openPrice) || 0,
      exchange: 'binance',
    }))
    .filter((t) => t.price > 0)
    .sort((a: CoinTicker, b: CoinTicker) => b.quoteVolume - a.quoteVolume);
}

// ─── Bybit ───
async function fetchBybit(exchange: ExchangeConfig, isFutures: boolean): Promise<CoinTicker[]> {
  const url = isFutures
    ? `${exchange.baseUrl}/v5/market/tickers?category=linear`
    : `${exchange.baseUrl}/v5/market/tickers?category=spot`;
  const res = await axios.get(url, { timeout: 15000 });
  const list = res.data?.result?.list || [];
  return list
    .filter((t: any) => t.symbol?.endsWith('USDT'))
    .map((t: any) => ({
      symbol: t.symbol,
      baseAsset: t.symbol.replace('USDT', ''),
      price: parseFloat(t.lastPrice) || 0,
      priceChangePercent: parseFloat(t.price24hChangePercent || t.change24h || '0') || 0,
      volume: parseFloat(t.volume24h || t.turnover24h || '0') || 0,
      quoteVolume: parseFloat(t.turnover24h || t.volume24h || '0') || 0,
      high: parseFloat(t.highPrice24h || '0') || 0,
      low: parseFloat(t.lowPrice24h || '0') || 0,
      count: 0,
      open: 0,
      exchange: 'bybit',
    }))
    .filter((t: CoinTicker) => t.price > 0)
    .sort((a: CoinTicker, b: CoinTicker) => b.quoteVolume - a.quoteVolume);
}

// ─── OKX ───
async function fetchOKX(exchange: ExchangeConfig, isFutures: boolean): Promise<CoinTicker[]> {
  const instType = isFutures ? 'SWAP' : 'SPOT';
  const url = `${exchange.baseUrl}/api/v5/market/tickers?instType=${instType}`;
  const res = await axios.get(url, { timeout: 15000 });
  const list = res.data?.data || [];
  return list
    .filter((t: any) => t.instId?.endsWith('-USDT'))
    .map((t: any) => ({
      symbol: t.instId.replace('-', ''),
      baseAsset: t.instId.replace('-USDT', ''),
      price: parseFloat(t.last) || 0,
      priceChangePercent: parseFloat(t.open24h ? ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h) * 100).toFixed(2) : '0') || 0,
      volume: parseFloat(t.vol24h || '0') || 0,
      quoteVolume: parseFloat(t.volCcy24h || '0') || 0,
      high: parseFloat(t.high24h || '0') || 0,
      low: parseFloat(t.low24h || '0') || 0,
      count: 0,
      open: parseFloat(t.open24h || '0') || 0,
      exchange: 'okx',
    }))
    .filter((t: CoinTicker) => t.price > 0)
    .sort((a: CoinTicker, b: CoinTicker) => b.quoteVolume - a.quoteVolume);
}

// ─── Gate.io ───
async function fetchGate(exchange: ExchangeConfig, isFutures: boolean): Promise<CoinTicker[]> {
  if (isFutures) return fetchBinance(EXCHANGES_MAP['binance'], true);
  const url = `${exchange.baseUrl}/api/v4/spot/tickers`;
  const res = await axios.get(url, { timeout: 15000 });
  const list = res.data || [];
  return list
    .filter((t: any) => t.currency_pair?.endsWith('_USDT'))
    .map((t: any) => ({
      symbol: t.currency_pair.replace('_', ''),
      baseAsset: t.currency_pair.replace('_USDT', ''),
      price: parseFloat(t.last) || 0,
      priceChangePercent: parseFloat(t.change_percentage ? t.change_percentage.replace('%', '') : '0') || 0,
      volume: parseFloat(t.base_volume || '0') || 0,
      quoteVolume: parseFloat(t.quote_volume || '0') || 0,
      high: 0, low: 0, count: 0, open: 0,
      exchange: 'gate',
    }))
    .filter((t: CoinTicker) => t.price > 0)
    .sort((a: CoinTicker, b: CoinTicker) => b.quoteVolume - a.quoteVolume);
}

// ─── Bitget ───
async function fetchBitget(exchange: ExchangeConfig, isFutures: boolean): Promise<CoinTicker[]> {
  const url = isFutures
    ? `${exchange.baseUrl}/api/v2/mix/market/tickers?productType=USDT-FUTURES`
    : `${exchange.baseUrl}/api/v2/spot/market/tickers`;
  const res = await axios.get(url, { timeout: 15000 });
  const list = res.data?.data || [];
  return list
    .filter((t: any) => (t.symbol || t.instId)?.endsWith('USDT'))
    .map((t: any) => {
      const sym = t.symbol || t.instId || '';
      return {
        symbol: sym,
        baseAsset: sym.replace('USDT', ''),
        price: parseFloat(t.lastPr || t.last || '0') || 0,
        priceChangePercent: parseFloat(t.change24h || t.priceChangePercent || '0') || 0,
        volume: parseFloat(t.baseVolume || t.volume || '0') || 0,
        quoteVolume: parseFloat(t.quoteVolume || t.quoteVol || '0') || 0,
        high: parseFloat(t.high24h || t.highPr || '0') || 0,
        low: parseFloat(t.low24h || t.lowPr || '0') || 0,
        count: 0, open: 0,
        exchange: 'bitget',
      };
    })
    .filter((t: CoinTicker) => t.price > 0)
    .sort((a: CoinTicker, b: CoinTicker) => b.quoteVolume - a.quoteVolume);
}

// ─── KuCoin ───
async function fetchKuCoin(exchange: ExchangeConfig, isFutures: boolean): Promise<CoinTicker[]> {
  if (isFutures) return fetchBinance(EXCHANGES_MAP['binance'], true);
  const url = `${exchange.baseUrl}/api/v1/market/allTickers`;
  const res = await axios.get(url, { timeout: 15000 });
  const list = res.data?.data?.ticker || [];
  return list
    .filter((t: any) => t.symbol?.endsWith('-USDT'))
    .map((t: any) => ({
      symbol: t.symbol.replace('-', ''),
      baseAsset: t.symbol.replace('-USDT', ''),
      price: parseFloat(t.last) || 0,
      priceChangePercent: parseFloat(t.changeRate || '0') || 0,
      volume: parseFloat(t.vol || '0') || 0,
      quoteVolume: parseFloat(t.volValue || '0') || 0,
      high: parseFloat(t.high) || 0,
      low: parseFloat(t.low) || 0,
      count: 0,
      open: parseFloat(t.open) || 0,
      exchange: 'kucoin',
    }))
    .filter((t: CoinTicker) => t.price > 0)
    .sort((a: CoinTicker, b: CoinTicker) => b.quoteVolume - a.quoteVolume);
}

// ─── MEXC ───
async function fetchMEXC(exchange: ExchangeConfig, isFutures: boolean): Promise<CoinTicker[]> {
  const base = isFutures && exchange.futuresBaseUrl ? exchange.futuresBaseUrl : exchange.baseUrl;
  const url = `${base}/api/v3/ticker/24hr`;
  const res = await axios.get(url, { timeout: 15000 });
  const raw: any[] = Array.isArray(res.data) ? res.data : [res.data];
  return raw
    .filter((t) => t.symbol?.endsWith('USDT'))
    .map((t) => ({
      symbol: t.symbol as string,
      baseAsset: (t.symbol as string).replace('USDT', ''),
      price: parseFloat(t.lastPrice) || 0,
      priceChangePercent: parseFloat(t.priceChangePercent) || 0,
      volume: parseFloat(t.volume) || 0,
      quoteVolume: parseFloat(t.quoteVolume) || 0,
      high: parseFloat(t.highPrice) || 0,
      low: parseFloat(t.lowPrice) || 0,
      count: t.count ? parseInt(t.count) : 0,
      open: parseFloat(t.openPrice) || 0,
      exchange: 'mexc',
    }))
    .filter((t) => t.price > 0)
    .sort((a: CoinTicker, b: CoinTicker) => b.quoteVolume - a.quoteVolume);
}

// ─── BingX ───
async function fetchBingX(exchange: ExchangeConfig, isFutures: boolean): Promise<CoinTicker[]> {
  const base = isFutures && exchange.futuresBaseUrl ? exchange.futuresBaseUrl : exchange.baseUrl;
  const url = `${base}/openApi/spot/v1/ticker/24hr`;
  const res = await axios.get(url, { timeout: 15000 });
  const raw: any[] = res.data?.data || [];
  return raw
    .filter((t) => t.symbol?.endsWith('USDT'))
    .map((t) => ({
      symbol: t.symbol as string,
      baseAsset: (t.symbol as string).replace('USDT', ''),
      price: parseFloat(t.lastPrice || t.close || '0') || 0,
      priceChangePercent: parseFloat(t.priceChangePercent || t.priceChange || '0') || 0,
      volume: parseFloat(t.volume || '0') || 0,
      quoteVolume: parseFloat(t.quoteVolume || t.turnover || '0') || 0,
      high: parseFloat(t.highPrice || t.high || '0') || 0,
      low: parseFloat(t.lowPrice || t.low || '0') || 0,
      count: 0,
      open: parseFloat(t.openPrice || t.open || '0') || 0,
      exchange: 'bingx',
    }))
    .filter((t) => t.price > 0)
    .sort((a: CoinTicker, b: CoinTicker) => b.quoteVolume - a.quoteVolume);
}
