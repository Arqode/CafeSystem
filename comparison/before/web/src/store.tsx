// Client state management: cart (useReducer + Context) and admin session.
import { createContext, ReactNode, useCallback, useContext, useReducer, useState } from 'react';
import { api, token } from './api';
import type { CartLine, Product } from './types';

type Action = { t: 'add' | 'inc' | 'dec' | 'remove'; id: number } | { t: 'clear' };

function reducer(s: CartLine[], a: Action): CartLine[] {
  switch (a.t) {
    case 'add': return s.some((l) => l.productId === a.id) ? s.map((l) => (l.productId === a.id ? { ...l, qty: l.qty + 1 } : l)) : [...s, { productId: a.id, qty: 1 }];
    case 'inc': return s.map((l) => (l.productId === a.id ? { ...l, qty: l.qty + 1 } : l));
    case 'dec': return s.map((l) => (l.productId === a.id && l.qty > 1 ? { ...l, qty: l.qty - 1 } : l));
    case 'remove': return s.filter((l) => l.productId !== a.id);
    default: return [];
  }
}

const CartCtx = createContext<{ cart: CartLine[]; dispatch: (a: Action) => void } | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(reducer, []);
  return <CartCtx.Provider value={{ cart, dispatch }}>{children}</CartCtx.Provider>;
}
export const useCart = () => { const c = useContext(CartCtx); if (!c) throw new Error('CartProvider missing'); return c; };

export const cartCount = (cart: CartLine[]) => cart.reduce((a, l) => a + l.qty, 0);
export const cartTotal = (cart: CartLine[], products: Product[]) =>
  cart.reduce((a, l) => a + l.qty * (products.find((p) => p.id === l.productId)?.price ?? 0), 0);

const MINE = 'cafe-my-orders';
export const getMine = (): number[] => { try { return JSON.parse(localStorage.getItem(MINE) || '[]') as number[]; } catch { return []; } };
export const addMine = (id: number) => { try { localStorage.setItem(MINE, JSON.stringify([...getMine(), id])); } catch { /* ignore */ } };

const AuthCtx = createContext<{ admin: boolean; login: (u: string, p: string) => Promise<void>; logout: () => void } | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState(Boolean(token.get()));
  const login = useCallback(async (u: string, p: string) => { await api.login(u, p); setAdmin(true); }, []);
  const logout = useCallback(() => { token.clear(); setAdmin(false); }, []);
  return <AuthCtx.Provider value={{ admin, login, logout }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => { const c = useContext(AuthCtx); if (!c) throw new Error('AuthProvider missing'); return c; };
