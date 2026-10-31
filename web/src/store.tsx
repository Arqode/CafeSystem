// Client state management: cart (useReducer + Context) and admin session.
import { createContext, ReactNode, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { api, token, USE_API } from './api';
import type { CartLine, Product } from './types';

type Action = { t: 'add' | 'inc' | 'dec' | 'remove'; id: number } | { t: 'clear' };

function reducer(s: CartLine[], a: Action): CartLine[] {
  switch (a.t) {
    case 'add': return s.some((l) => l.productId === a.id) ? s.map((l) => (l.productId === a.id ? { ...l, qty: Math.min(50, l.qty + 1) } : l)) : [...s, { productId: a.id, qty: 1 }];
    case 'inc': return s.map((l) => (l.productId === a.id ? { ...l, qty: Math.min(50, l.qty + 1) } : l));
    case 'dec': return s.map((l) => (l.productId === a.id && l.qty > 1 ? { ...l, qty: l.qty - 1 } : l));
    case 'remove': return s.filter((l) => l.productId !== a.id);
    default: return [];
  }
}

const CartCtx = createContext<{ cart: CartLine[]; dispatch: (a: Action) => void } | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(reducer, [], () => { try { const raw = JSON.parse(localStorage.getItem('dashfood-cart-v1') || '[]'); return Array.isArray(raw) ? raw.filter(l => Number.isInteger(l.productId) && Number.isInteger(l.qty) && l.qty > 0 && l.qty <= 50) : []; } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('dashfood-cart-v1', JSON.stringify(cart)); } catch { /* Storage can be unavailable. */ } }, [cart]);
  return <CartCtx.Provider value={{ cart, dispatch }}>{children}</CartCtx.Provider>;
}
export const useCart = () => { const c = useContext(CartCtx); if (!c) throw new Error('CartProvider missing'); return c; };

export const cartCount = (cart: CartLine[]) => cart.reduce((a, l) => a + l.qty, 0);
export const cartTotal = (cart: CartLine[], products: Product[]) =>
  cart.reduce((a, l) => a + l.qty * (products.find((p) => p.id === l.productId)?.price ?? 0), 0);

const MINE = USE_API ? 'dashfood-my-orders-api-v2' : 'dashfood-my-orders-demo-v2';
export const getMine = (): number[] => { try { return JSON.parse(localStorage.getItem(MINE) || '[]') as number[]; } catch { return []; } };
export const addMine = (id: number) => { try { localStorage.setItem(MINE, JSON.stringify([...getMine(), id])); } catch { /* ignore */ } };

const AuthCtx = createContext<{ admin: boolean; login: (u: string, p: string) => Promise<void>; logout: () => void } | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState(Boolean(token.get()));
  const login = useCallback(async (u: string, p: string) => { await api.login(u, p); setAdmin(true); }, []);
  const logout = useCallback(() => { token.clear(); setAdmin(false); }, []);
  useEffect(() => { window.addEventListener('dashfood-session-expired', logout); return () => window.removeEventListener('dashfood-session-expired', logout); }, [logout]);
  return <AuthCtx.Provider value={{ admin, login, logout }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => { const c = useContext(AuthCtx); if (!c) throw new Error('AuthProvider missing'); return c; };
