import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { EXCHANGES } from '@/types';
import { AuthModal } from '@/components/AuthModal';
import { Zap, Menu, X, LogOut, Moon, Sun } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Графики' },
  { to: '/coins', label: 'Монеты' },
  { to: '/map', label: 'Карта плотностей' },
  { to: '/alerts', label: 'Оповещения' },
  { to: '/listings', label: 'Листинги' },
  { to: '/algorithms', label: 'Алгоритмы' },
];

export function Header() {
  const navigate = useNavigate();
  const {
    selectedExchange,
    setSelectedExchange,
    isFutures,
    setFutures,
    user,
    logout,
    isDarkMode,
    toggleDarkMode,
  } = useStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const initials = user ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '';

  return (
    <>
      <header className="sticky top-0 z-50 glass-card border-b border-neon-400/10">
        <div className="flex items-center justify-between gap-2 md:gap-4 px-4 md:px-6 py-3">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-400 to-neon-600 flex items-center justify-center shadow-neon-sm">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-base gradient-text leading-none">Nexa Screener</h1>
            </div>
          </div>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-neon-400/10 text-neon-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Exchange selector */}
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className="bg-surface-700 text-slate-200 text-xs rounded-lg px-2 py-2 border border-neon-400/20 focus:outline-none focus:border-neon-400/50 cursor-pointer"
            >
              <option value="all">Все биржи</option>
              {EXCHANGES.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>

            {/* Spot/Futures */}
            <div className="hidden sm:flex items-center bg-surface-700 rounded-lg border border-neon-400/20 p-1">
              <button
                onClick={() => setFutures(false)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  !isFutures ? 'bg-neon-400 text-white' : 'text-slate-400'
                }`}
              >
                Спот
              </button>
              <button
                onClick={() => setFutures(true)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                  isFutures ? 'bg-neon-400 text-white' : 'text-slate-400'
                }`}
              >
                <Zap size={11} />
                Фьючерсы
              </button>
            </div>

            {/* Dark mode */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-surface-700 border border-neon-400/20 text-slate-400 hover:text-neon-400 transition-all"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-400 to-neon-600 flex items-center justify-center text-white text-xs font-bold shadow-neon-sm"
                >
                  {initials}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl border border-neon-400/20 p-2 shadow-neon-md">
                    <div className="px-3 py-2 border-b border-neon-400/10 mb-1">
                      <p className="text-sm font-medium text-slate-200">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <button
                      onClick={async () => { await supabase.auth.signOut(); logout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-error hover:bg-surface-700 transition-all"
                    >
                      <LogOut size={16} />
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-3 py-2 rounded-lg bg-neon-400/10 text-neon-400 border border-neon-400/30 text-sm font-semibold hover:bg-neon-400/20 transition-all"
              >
                Войти
              </button>
            )}

            {/* Mobile nav toggle */}
            <button
              className="md:hidden text-slate-400 hover:text-neon-400"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileNavOpen && (
          <nav className="md:hidden flex flex-col gap-1 px-4 pb-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-neon-400/10 text-neon-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="flex items-center bg-surface-700 rounded-lg border border-neon-400/20 p-1 mt-2">
              <button
                onClick={() => setFutures(false)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  !isFutures ? 'bg-neon-400 text-white' : 'text-slate-400'
                }`}
              >
                Спот
              </button>
              <button
                onClick={() => setFutures(true)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  isFutures ? 'bg-neon-400 text-white' : 'text-slate-400'
                }`}
              >
                Фьючерсы
              </button>
            </div>
          </nav>
        )}
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
