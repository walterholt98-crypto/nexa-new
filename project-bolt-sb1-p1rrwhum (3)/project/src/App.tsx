import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CoinsPage } from '@/pages/CoinsPage';
import { LiquidityPage } from '@/pages/LiquidityPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { ListingsPage } from '@/pages/ListingsPage';
import { AlgorithmsPage } from '@/pages/AlgorithmsPage';
import { useStore } from '@/store';
import { useAlertChecker } from '@/hooks/useAlertChecker';
import { requestNotificationPermission } from '@/lib/notifications';
import { supabase, isSupabaseConfigured, type DbAlert } from '@/lib/supabase';
import type { User, Alert } from '@/types';

function loadUserPreferences(userId: string) {
  if (!isSupabaseConfigured) {
    return Promise.resolve({ favorites: [] as string[], alerts: [] as Alert[] });
  }
  return Promise.all([
    supabase.from('user_favorites').select('symbol').eq('user_id', userId),
    supabase.from('user_alerts').select('*').eq('user_id', userId),
  ]).then(([favRes, alertRes]) => {
    const favorites = (favRes.data || []).map((r: { symbol: string }) => r.symbol);
    const alerts: Alert[] = (alertRes.data || []).map((r: DbAlert) => ({
      id: r.id,
      symbol: r.symbol,
      targetPrice: Number(r.target_price),
      direction: r.direction,
      note: r.note || undefined,
      triggered: r.triggered,
      triggeredAt: r.triggered_at || undefined,
      createdAt: r.created_at,
    }));
    return { favorites, alerts };
  });
}

function AppInner() {
  const { isDarkMode, setUser, setFavorites, setAlerts } = useStore();
  useAlertChecker();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const su = data.session.user;
        const displayName = su.user_metadata?.name || su.email?.split('@')[0] || 'Пользователь';
        const user: User = {
          name: displayName,
          email: su.email || '',
          provider: 'email',
        };
        setUser(user);
        loadUserPreferences(su.id).then(({ favorites, alerts }) => {
          setFavorites(favorites);
          setAlerts(alerts);
        });
      }
    });

    if (!isSupabaseConfigured) return;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          const su = session.user;
          const displayName = su.user_metadata?.name || su.email?.split('@')[0] || 'Пользователь';
          const user: User = {
            name: displayName,
            email: su.email || '',
            provider: 'email',
          };
          setUser(user);
          const { favorites, alerts } = await loadUserPreferences(su.id);
          setFavorites(favorites);
          setAlerts(alerts);
        } else {
          setUser(null);
        }
      })();
    });

    return () => { listener.subscription.unsubscribe(); };
  }, [setUser, setFavorites, setAlerts]);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/coins" element={<CoinsPage />} />
          <Route path="/map" element={<LiquidityPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/algorithms" element={<AlgorithmsPage />} />
        </Route>
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 20, 32, 0.95)',
            color: '#e2e8f0',
            border: '1px solid rgba(30, 144, 255, 0.3)',
            boxShadow: '0 0 16px rgba(30, 144, 255, 0.2)',
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
