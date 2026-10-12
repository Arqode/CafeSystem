import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { OrderCard } from '../components';
import { getMine } from '../store';
import type { Order } from '../types';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [err, setErr] = useState('');
  const load = useCallback(() => {
    Promise.all(getMine().map((id) => api.order(id).catch(() => null)))
      .then((r) => setOrders((r.filter(Boolean) as Order[]).sort((a, b) => b.id - a.id)))
      .catch((e: Error) => setErr(e.message));
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);
  return (
    <div className="panel">
      <h2>My orders</h2>
      <p className="sub">Status updates every few seconds.</p>
      {err && <p className="err" role="alert">{err}</p>}
      {orders.length === 0 ? <div className="empty">No orders yet.</div> : orders.map((o) => <OrderCard key={o.id} o={o} steps />)}
    </div>
  );
}
