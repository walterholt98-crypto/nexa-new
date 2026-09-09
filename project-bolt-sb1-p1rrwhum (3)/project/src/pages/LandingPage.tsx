import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { AuthModal } from '@/components/AuthModal';
import {
  Activity,
  BarChart3,
  Bell,
  Filter,
  Moon,
  Sun,
  ArrowRight,
  Mail,
  Send,
  Globe,
  Zap,
  Eye,
  Layers,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode, user, logout } = useStore();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const features = [
    { icon: Layers, title: 'Карта плотностей', desc: 'Визуализация кластеров ликвидности с бирж Binance, Bybit, OKX, Gate, Bitget, KuCoin, MEXC, BingX. Чем больше круг — тем выше плотность.' },
    { icon: Bell, title: 'Алерты в браузере и Telegram', desc: 'Устанавливайте ценовые уровни и получайте уведомления в браузере или Telegram-боте. Никогда не пропустите важное движение.' },
    { icon: Filter, title: 'Фильтр по объёму и изменению цены', desc: 'Настраивайте фильтры для отбора монет по торговому объёму и процентному изменению цены. Находите самые активные активы за секунды.' },
  ];

  const aboutIcons = [
    { icon: BarChart3, label: 'Графики TradingView' },
    { icon: Activity, label: 'Карта плотностей' },
    { icon: Bell, label: 'Алерты в браузере и Telegram' },
    { icon: Filter, label: 'Фильтр по объёму и цене' },
    { icon: Globe, label: '8 бирж в одном окне' },
    { icon: Eye, label: 'Тёмная/Светлая тема' },
  ];

  const exchanges = ['Binance', 'Bybit', 'OKX', 'Gate.io', 'Bitget', 'KuCoin', 'MEXC', 'BingX'];

  return (
    <div className="min-h-screen gradient-bg text-slate-200 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-neon-400/10 rounded-full blur-[120px]" />

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-400 to-neon-600 flex items-center justify-center shadow-neon-md">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl gradient-text leading-none">Nexa Screener</h1>
          </div>
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">{user.name}</span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-slate-400 hover:text-error transition-all"
            >
              Выйти
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className="px-5 py-2 bg-neon-400/10 text-neon-400 border border-neon-400/30 rounded-lg text-sm font-semibold hover:bg-neon-400/20 transition-all"
          >
            Войти
          </button>
        )}
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32">
        <div className="animate-fadeUp">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-400/10 border border-neon-400/20 text-neon-400 text-xs font-medium mb-8">
            <Activity size={14} className="animate-pulse" />
            Криптовалютная аналитика в реальном времени
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight max-w-4xl">
            <span className="gradient-text">Nexa Screener</span>
            <br />
            <span className="text-slate-100 text-2xl md:text-4xl">Криптовалютная аналитика в реальном времени</span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-10">
            Профессиональная торговая панель с данными с 8 бирж, картой плотностей, графиками TradingView и мгновенными алертами
          </p>

          <button
            onClick={() => navigate('/dashboard')}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-neon-400 hover:bg-neon-500 text-white font-semibold rounded-xl text-lg shadow-neon-lg transition-all hover:scale-105"
          >
            Открыть скринер
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* О скринере */}
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
          О <span className="gradient-text">скринере</span>
        </h2>
        <p className="text-slate-400 text-center max-w-3xl mx-auto mb-12 leading-relaxed">
          Nexa Screener — это мощный инструмент для трейдеров, который агрегирует данные с 8 крупнейших криптобирж в реальном времени. Анализируйте рыночные движения, отслеживайте ликвидность и получайте мгновенные оповещения — всё в одном интерфейсе.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {aboutIcons.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-neon-400/10 flex items-center justify-center">
                <item.icon size={26} className="text-neon-400" />
              </div>
              <span className="text-sm text-slate-400 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Возможности */}
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
          <span className="gradient-text">Возможности</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 border border-neon-400/10 hover:border-neon-400/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-neon-400/10 flex items-center justify-center mb-4 group-hover:shadow-neon-md transition-all">
                <f.icon size={24} className="text-neon-400" />
              </div>
              <h3 className="font-semibold text-lg text-slate-100 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Биржи */}
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Данные с <span className="gradient-text">8 бирж</span> в реальном времени
        </h2>
        <p className="text-slate-400 mb-10">Переключайтесь между биржами одним кликом в верхней панели</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {exchanges.map((ex, i) => (
            <div
              key={i}
              className="px-6 py-4 glass-card rounded-xl border border-neon-400/10 text-slate-300 font-semibold hover:border-neon-400/40 hover:text-neon-400 transition-all cursor-pointer"
            >
              {ex}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neon-400/10 mt-16 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-sm">© 2026 Nexa Screener. Все права защищены.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://t.me/nexascreener"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card border border-neon-400/10 text-slate-400 hover:text-neon-400 hover:border-neon-400/30 transition-all"
            >
              <Send size={16} />
              Telegram
            </a>
            <a
              href="mailto:contact@nexascreener.com"
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card border border-neon-400/10 text-slate-400 hover:text-neon-400 hover:border-neon-400/30 transition-all"
            >
              <Mail size={16} />
              Email
            </a>
          </div>
        </div>

        {/* Theme toggle at bottom */}
        <div className="flex justify-center mt-8">
          <button
            onClick={toggleDarkMode}
            className="relative w-16 h-8 rounded-full bg-surface-700 border border-neon-400/20 transition-all"
          >
            <div
              className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center ${
                isDarkMode
                  ? 'left-1 bg-neon-400'
                  : 'left-9 bg-slate-300'
              }`}
            >
              {isDarkMode ? <Moon size={12} className="text-white" /> : <Sun size={12} className="text-slate-700" />}
            </div>
          </button>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
