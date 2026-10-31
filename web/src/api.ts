// Single place where the front end talks to data.
// VITE_API_URL set   -> real REST API (Express + PostgreSQL)
// VITE_API_URL empty -> demo mode with localStorage (no server needed)
import type { CartLine, Order, Product, ProductInput, Status } from './types';

const BASE = import.meta.env.VITE_DEMO === 'true' ? '' : (import.meta.env.VITE_API_URL || '/');
export const USE_API = Boolean(BASE);

const KEY = 'cafe-token';
export const token = {
  get: () => sessionStorage.getItem(KEY),
  set: (t: string) => sessionStorage.setItem(KEY, t),
  clear: () => sessionStorage.removeItem(KEY),
};

export interface Api {
  analytics(): Promise<{count:number;revenue:number;average:number;daily:{label:string;value:number}[];popular:{label:string;value:number}[];hours:{label:string;value:number}[];queue:number;wait:number}>;
  login(username: string, password: string): Promise<void>;
  products(all: boolean): Promise<Product[]>;
  saveProduct(p: ProductInput): Promise<void>;
  placeOrder(lines: CartLine[]): Promise<Order>;
  order(id: number): Promise<Order>;
  allOrders(): Promise<Order[]>;
  setStatus(id: number, status: Status): Promise<void>;
}

/* ---------- real API ---------- */
async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const t = token.get();
  const r = await fetch((BASE === '/' ? '' : BASE) + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
  });
  if (r.status === 401 && t) { token.clear(); window.dispatchEvent(new Event('dashfood-session-expired')); throw new Error('Session expired. Log in again.'); }
  if (!r.ok) {
    const e = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(e.error || `Error ${r.status}`);
  }
  return r.json() as Promise<T>;
}

const http: Api = {
  analytics: () => req('/api/analytics'),
  async login(username, password) {
    const r = await req<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    token.set(r.token);
  },
  products: (all) => req<Product[]>(`/api/products${all ? '?all=1' : ''}`),
  async saveProduct(p) {
    if (p.id) await req(`/api/products/${p.id}`, { method: 'PUT', body: JSON.stringify(p) });
    else await req('/api/products', { method: 'POST', body: JSON.stringify(p) });
  },
  placeOrder: (lines) => req<Order>('/api/orders', { method: 'POST', body: JSON.stringify({ items: lines }) }),
  order: (id) => req<Order>(`/api/orders/${id}`),
  allOrders: () => req<Order[]>('/api/orders'),
  async setStatus(id, status) { await req(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); },
};

/* ---------- demo mode ---------- */
interface DB { next: number; products: Product[]; orders: Order[] }
const MKEY = 'cafe-mock-v1';
const seed: DB = {
  next: 152,
  products: [
    { id: 1, name: 'Cheeseburger', category: 'Burgers', price: 2500, description: 'Beef, cheese, sauce', active: true },
    { id: 2, name: 'Chicken Burger', category: 'Burgers', price: 2800, description: 'Chicken, cheese, vegetables', active: true },
    { id: 3, name: 'Double Burger', category: 'Burgers', price: 3400, description: 'Two patties, cheddar, pickles', active: true },
    { id: 4, name: 'Cola', category: 'Drinks', price: 800, description: 'Cold soft drink', active: true },
    { id: 5, name: 'Lemonade', category: 'Drinks', price: 1100, description: 'Fresh lemon, mint', active: true },
    { id: 6, name: 'Americano', category: 'Drinks', price: 1000, description: 'Black coffee, 250 ml', active: true },
    { id: 7, name: 'Cheesecake', category: 'Desserts', price: 1800, description: 'Classic, berry sauce', active: true },
    { id: 8, name: 'Brownie', category: 'Desserts', price: 1500, description: 'Chocolate, walnuts', active: true },
  ],
  orders: [{ id: 151, items: [{ name: 'Chicken Burger', price: 2800, qty: 1 }], total: 2800, status: 'Preparing' }],
};
const load = (): DB => {
  try { const r = localStorage.getItem(MKEY); if (r) return JSON.parse(r) as DB; } catch { /* ignore */ }
  return structuredClone(seed);
};
const save = (d: DB) => { try { localStorage.setItem(MKEY, JSON.stringify(d)); } catch { /* ignore */ } };

const mock: Api = {
  async analytics() { const d=load(); const done=d.orders.filter(o=>o.status==='Completed'); const queue=d.orders.filter(o=>o.status==='New'||o.status==='Preparing').length; return {count:d.orders.length,revenue:done.reduce((a,o)=>a+o.total,0),average:done.length?done.reduce((a,o)=>a+o.total,0)/done.length:0,daily:[],popular:[],hours:[],queue,wait:Math.min(60,5+queue*3)}; },
  async login(u, p) {
    if (u === 'admin' && p === 'admin123') token.set('demo');
    else throw new Error('Wrong username or password.');
  },
  async products(all) { return load().products.filter((p) => all || p.active); },
  async saveProduct(p) {
    const d = load();
    if (p.id) d.products = d.products.map((x) => (x.id === p.id ? { ...x, ...p, id: x.id } : x));
    else d.products.push({ ...p, id: Date.now() });
    save(d);
  },
  async placeOrder(lines) {
    const d = load();
    const items = lines.map((l) => {
      const p = d.products.find((x) => x.id === l.productId && x.active);
      if (!p) throw new Error('A product is no longer available.');
      return { name: p.name, price: p.price, qty: l.qty };
    });
    const o: Order = { id: d.next++, items, total: items.reduce((a, i) => a + i.price * i.qty, 0), status: 'New' };
    d.orders.push(o); save(d); return o;
  },
  async order(id) {
    const o = load().orders.find((x) => x.id === id);
    if (!o) throw new Error('Order not found.');
    return o;
  },
  async allOrders() { return load().orders.slice().sort((a, b) => b.id - a.id); },
  async setStatus(id, status) {
    const d = load(); d.orders.forEach((o) => { if (o.id === id) o.status = status; }); save(d);
  },
};

export const api: Api = USE_API ? http : mock;
