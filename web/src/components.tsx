import { FormEvent, ReactNode, useState } from 'react';
import { USE_API } from './api';
import { useAuth } from './store';
import type { Order } from './types';

export const kzt = (n: number) => `${new Intl.NumberFormat('en-US').format(n)} ₸`;
export const FLOW = ['New', 'Preparing', 'Ready', 'Completed'] as const;

export const Badge = ({ s }: { s: string }) => <span className={`badge s-${s}`}>{s}</span>;

export function OrderCard({ o, children, steps }: { o: Order; children?: ReactNode; steps?: boolean }) {
  const i = FLOW.indexOf(o.status as (typeof FLOW)[number]);
  return (
    <div className="card">
      <div className="row"><span className="name">Order #{o.id}</span><Badge s={o.status} /></div>
      <p className="sub">{o.items.map((it) => `${it.qty} × ${it.name}`).join(' · ')}</p>
      <p className="sub">{o.isDemo ? 'Synthetic demo order · ' : ''}{o.createdAt ? new Date(o.createdAt).toLocaleString('en-GB', {timeZone:'Asia/Qyzylorda'}) : ''}</p><p className="price">Total: {kzt(o.total)}</p>
      {steps && o.status !== 'Cancelled' && (
        <>
          <div className="steps" aria-hidden>{FLOW.map((f, k) => <i key={f} className={k <= i ? 'on' : ''} />)}</div>
          <div className="steps-l" aria-hidden>{FLOW.map((f) => <span key={f}>{f}</span>)}</div>
        </>
      )}
      {children}
    </div>
  );
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { admin, login } = useAuth();
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  if (admin) return <>{children}</>;
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await login(u.trim(), p); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <form className="panel" onSubmit={submit}>
      <h2>Staff login</h2>
      <p className="sub">Only café staff can see orders and edit the menu.</p>
      <label htmlFor="u">Username</label>
      <input id="u" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" required />
      <label htmlFor="p">Password</label>
      <input id="p" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required />
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn block" style={{ marginTop: 14 }} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      {!USE_API && <p className="hint">Demo mode: admin / admin123</p>}
    </form>
  );
}
