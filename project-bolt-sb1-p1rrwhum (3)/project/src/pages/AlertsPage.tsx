import { useStore } from '@/store';
import { formatPrice, timeAgo, formatDateTime } from '@/lib/utils';
import { Bell, BellOff, Trash2, TrendingUp, TrendingDown, Clock, Check, History, Eraser } from 'lucide-react';

export function AlertsPage() {
  const {
    alerts,
    removeAlert,
    alertsPaused,
    toggleAlertsPaused,
    clearAlertHistory,
  } = useStore();

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell size={22} className="text-neon-400" />
          <h1 className="text-xl font-bold text-slate-100">Оповещения</h1>
          <span className="text-xs text-slate-500 px-2 py-1 rounded bg-surface-700 border border-neon-400/10">
            {activeAlerts.length} активных · {triggeredAlerts.length} сработавших
          </span>
        </div>

        <div className="flex items-center gap-2">
          {triggeredAlerts.length > 0 && (
            <button
              onClick={clearAlertHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-surface-700 text-slate-400 border border-neon-400/10 hover:text-error transition-all"
            >
              <Eraser size={14} />
              Очистить историю
            </button>
          )}
          <button
            onClick={toggleAlertsPaused}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
              alertsPaused
                ? 'bg-warning/10 text-warning border-warning/30'
                : 'bg-neon-400/10 text-neon-400 border-neon-400/30'
            }`}
          >
            {alertsPaused ? <BellOff size={16} /> : <Bell size={16} />}
            {alertsPaused ? 'Оповещения выключены' : 'Все оповещения'}
          </button>
        </div>
      </div>

      {/* Paused banner */}
      {alertsPaused && (
        <div className="glass-card rounded-xl border border-warning/20 p-4 flex items-center gap-3">
          <BellOff size={18} className="text-warning" />
          <p className="text-sm text-warning">Оповещения приостановлены. Проверка цен не выполняется до возобновления.</p>
        </div>
      )}

      {/* Active Alerts Table */}
      <div className="glass-card rounded-xl border border-neon-400/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-neon-400/10 flex items-center gap-2">
          <Clock size={16} className="text-neon-400" />
          <h2 className="text-sm font-semibold text-slate-200">Активные алерты</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neon-400/10 bg-surface-800/50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Монета</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Целевая цена</th>
                <th className="text-center px-4 py-3 text-slate-500 font-medium">Направление</th>
                <th className="text-center px-4 py-3 text-slate-500 font-medium">Статус</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium hidden md:table-cell">Создан</th>
                <th className="text-center px-4 py-3 text-slate-500 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {activeAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    Нет активных алертов. Установите алерт со страницы «Монеты».
                  </td>
                </tr>
              ) : (
                activeAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-neon-400/5 hover:bg-surface-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-200">{alert.symbol}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">${formatPrice(alert.targetPrice)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        alert.direction === 'above' ? 'text-success' : 'text-error'
                      }`}>
                        {alert.direction === 'above' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {alert.direction === 'above' ? 'Выше' : 'Ниже'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-neon-400/10 text-neon-400 font-medium">
                        <Clock size={12} />
                        Активен
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell text-xs">{timeAgo(alert.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="text-slate-500 hover:text-error transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Log / History */}
      <div className="glass-card rounded-xl border border-neon-400/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-neon-400/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-neon-400" />
            <h2 className="text-sm font-semibold text-slate-200">История сработавших алертов</h2>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[400px]">
          {triggeredAlerts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Сработавших алертов пока нет.
            </div>
          ) : (
            [...triggeredAlerts].reverse().map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between px-4 py-3 border-b border-neon-400/5 hover:bg-surface-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-success/10 text-success font-medium">
                    <Check size={12} />
                    Сработал
                  </span>
                  <span className="text-sm font-mono font-medium text-slate-200">{alert.symbol}</span>
                  <span className="text-xs text-slate-500">
                    {alert.direction === 'above' ? 'выше' : 'ниже'} ${formatPrice(alert.targetPrice)}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {alert.triggeredAt ? formatDateTime(alert.triggeredAt) : '—'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
