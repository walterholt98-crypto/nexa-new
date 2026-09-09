import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { X, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
}

export function AlertModal({ open, onClose, symbol, currentPrice }: AlertModalProps) {
  const { addAlert } = useStore();
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open && currentPrice > 0) {
      setTargetPrice(currentPrice.toFixed(4));
    }
  }, [open, currentPrice]);

  if (!open) return null;

  const handleSubmit = () => {
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) {
      toast.error('Введите корректную целевую цену');
      return;
    }
    addAlert({ symbol, targetPrice: price, direction, note: note.trim() || undefined });
    toast.success(`Алерт установлен: ${symbol} ${direction === 'above' ? 'выше' : 'ниже'} ${price}`);
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card rounded-2xl w-full max-w-md mx-4 p-6 border border-neon-400/20 shadow-neon-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-neon-400/10 flex items-center justify-center">
              <Bell size={20} className="text-neon-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Установить алерт</h2>
              <p className="text-xs text-slate-500">{symbol} · Текущая цена: ${currentPrice.toFixed(4)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1.5 block">Целевая цена (USDT)</label>
            <input
              type="number"
              step="any"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full bg-surface-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 border border-neon-400/10 focus:outline-none focus:border-neon-400/40 font-mono"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1.5 block">Направление</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDirection('above')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  direction === 'above'
                    ? 'bg-neon-400/10 text-neon-400 neon-border'
                    : 'bg-surface-800 text-slate-400 border border-transparent'
                }`}
              >
                <TrendingUp size={16} />
                Выше
              </button>
              <button
                onClick={() => setDirection('below')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  direction === 'below'
                    ? 'bg-neon-400/10 text-neon-400 neon-border'
                    : 'bg-surface-800 text-slate-400 border border-transparent'
                }`}
              >
                <TrendingDown size={16} />
                Ниже
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1.5 block">Заметка (необязательно)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-surface-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 border border-neon-400/10 focus:outline-none focus:border-neon-400/40"
              placeholder="Например: Цель фиксации прибыли"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 w-full bg-neon-400 hover:bg-neon-500 text-white font-semibold py-2.5 rounded-lg transition-all shadow-neon-sm"
        >
          Создать алерт
        </button>
      </div>
    </div>
  );
}
