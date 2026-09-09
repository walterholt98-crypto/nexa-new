import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Alert, User } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface NexaStore {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;

  // Favorites
  favorites: string[];
  addFavorite: (symbol: string) => void;
  removeFavorite: (symbol: string) => void;
  toggleFavorite: (symbol: string) => void;
  isFavorite: (symbol: string) => boolean;
  setFavorites: (symbols: string[]) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'triggered' | 'createdAt'>) => void;
  removeAlert: (id: string) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  triggerAlert: (id: string) => void;
  clearAlertHistory: () => void;
  setAlerts: (alerts: Alert[]) => void;

  // Settings
  selectedExchange: string;
  setSelectedExchange: (exchange: string) => void;

  isFutures: boolean;
  toggleFutures: () => void;
  setFutures: (val: boolean) => void;

  isDarkMode: boolean;
  toggleDarkMode: () => void;

  alertsPaused: boolean;
  toggleAlertsPaused: () => void;
}

export const useStore = create<NexaStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),

      favorites: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
      addFavorite: (symbol) => {
        set((s) => ({
          favorites: s.favorites.includes(symbol) ? s.favorites : [...s.favorites, symbol],
        }));
        const u = get().user;
        if (u && isSupabaseConfigured) {
          supabase.from('user_favorites').insert({ symbol }).then(
            ({ error }) => { if (error && error.code !== '23505') console.warn('fav insert', error.message); },
            () => {}
          );
        }
      },
      removeFavorite: (symbol) => {
        set((s) => ({ favorites: s.favorites.filter((f) => f !== symbol) }));
        const u = get().user;
        if (u && isSupabaseConfigured) {
          supabase.from('user_favorites').delete().eq('symbol', symbol).then(
            ({ error }) => { if (error) console.warn('fav delete', error.message); },
            () => {}
          );
        }
      },
      toggleFavorite: (symbol) => {
        if (get().favorites.includes(symbol)) get().removeFavorite(symbol);
        else get().addFavorite(symbol);
      },
      isFavorite: (symbol) => get().favorites.includes(symbol),
      setFavorites: (symbols) => set({ favorites: symbols }),

      alerts: [],
      addAlert: (alert) => {
        const newAlert: Alert = {
          ...alert,
          id: crypto.randomUUID(),
          triggered: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ alerts: [...s.alerts, newAlert] }));
        const u = get().user;
        if (u && isSupabaseConfigured) {
          supabase.from('user_alerts').insert({
            id: newAlert.id,
            symbol: alert.symbol,
            target_price: alert.targetPrice,
            direction: alert.direction,
            note: alert.note || null,
          }).then(
            ({ error }) => { if (error) console.warn('alert insert', error.message); },
            () => {}
          );
        }
      },
      removeAlert: (id) => {
        set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) }));
        const u = get().user;
        if (u && isSupabaseConfigured) {
          supabase.from('user_alerts').delete().eq('id', id).then(
            ({ error }) => { if (error) console.warn('alert delete', error.message); },
            () => {}
          );
        }
      },
      updateAlert: (id, updates) => {
        set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, ...updates } : a)) }));
        const u = get().user;
        if (u && isSupabaseConfigured) {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.triggered !== undefined) dbUpdates.triggered = updates.triggered;
          if (updates.triggeredAt !== undefined) dbUpdates.triggered_at = updates.triggeredAt;
          if (Object.keys(dbUpdates).length > 0) {
            supabase.from('user_alerts').update(dbUpdates).eq('id', id).then(
              ({ error }) => { if (error) console.warn('alert update', error.message); },
              () => {}
            );
          }
        }
      },
      triggerAlert: (id) => {
        set((s) => ({
          alerts: s.alerts.map((a) =>
            a.id === id ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a
          ),
        }));
        const u = get().user;
        if (u && isSupabaseConfigured) {
          supabase.from('user_alerts').update({
            triggered: true,
            triggered_at: new Date().toISOString(),
          }).eq('id', id).then(
            ({ error }) => { if (error) console.warn('alert trigger', error.message); },
            () => {}
          );
        }
      },
      clearAlertHistory: () => {
        const triggeredIds = get().alerts.filter((a) => a.triggered).map((a) => a.id);
        set((s) => ({ alerts: s.alerts.filter((a) => !a.triggered) }));
        const u = get().user;
        if (u && isSupabaseConfigured && triggeredIds.length > 0) {
          supabase.from('user_alerts').delete().in('id', triggeredIds).then(
            ({ error }) => { if (error) console.warn('alert clear', error.message); },
            () => {}
          );
        }
      },
      setAlerts: (alerts) => set({ alerts }),

      selectedExchange: 'binance',
      setSelectedExchange: (exchange) => set({ selectedExchange: exchange }),

      isFutures: false,
      toggleFutures: () => set((s) => ({ isFutures: !s.isFutures })),
      setFutures: (val) => set({ isFutures: val }),

      isDarkMode: true,
      toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),

      alertsPaused: false,
      toggleAlertsPaused: () => set((s) => ({ alertsPaused: !s.alertsPaused })),
    }),
    { name: 'nexa-screener-store' }
  )
);
