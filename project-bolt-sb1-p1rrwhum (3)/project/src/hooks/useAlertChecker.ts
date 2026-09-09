import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { fetchPrice } from '@/lib/exchangeApi';
import { sendBrowserNotification, playBeep } from '@/lib/notifications';
import toast from 'react-hot-toast';

export function useAlertChecker() {
  const { alerts, alertsPaused, triggerAlert, isFutures, selectedExchange } = useStore();
  const checkedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    checkedRef.current = new Set();
  }, []);

  useEffect(() => {
    const checkAlerts = async () => {
      if (alertsPaused) return;
      const activeAlerts = alerts.filter((a) => !a.triggered);
      if (activeAlerts.length === 0) return;

      const symbols = [...new Set(activeAlerts.map((a) => a.symbol))];

      for (const symbol of symbols) {
        const price = await fetchPrice(symbol, selectedExchange, isFutures);
        if (price === null) continue;

        const symbolAlerts = activeAlerts.filter((a) => a.symbol === symbol);
        for (const alert of symbolAlerts) {
          const hit =
            (alert.direction === 'above' && price >= alert.targetPrice) ||
            (alert.direction === 'below' && price <= alert.targetPrice);

          if (hit && !checkedRef.current.has(alert.id)) {
            checkedRef.current.add(alert.id);
            triggerAlert(alert.id);

            const dirText = alert.direction === 'above' ? 'выше' : 'ниже';
            const msg = `${symbol} ${dirText} ${alert.targetPrice} (сейчас ${price.toFixed(4)})`;
            sendBrowserNotification(`Алерт сработал: ${symbol}`, msg);
            playBeep(800, 400);
            toast.success(msg, { duration: 6000, icon: '🔔' });
          }
        }
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [alerts, alertsPaused, triggerAlert, isFutures, selectedExchange]);
}
