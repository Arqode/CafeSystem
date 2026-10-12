import { useCallback, useEffect, useState } from 'react';
import { api, USE_API } from './api';
import { AdminGate } from './components';
import AdminOrdersPage from './pages/AdminOrdersPage';
import CartPage from './pages/CartPage';
import ManageMenuPage from './pages/ManageMenuPage';
import MenuPage from './pages/MenuPage';
import MyOrdersPage from './pages/MyOrdersPage';
import { cartCount, useAuth, useCart } from './store';
import type { Product } from './types';

type View = 'menu' | 'cart' | 'orders' | 'admin' | 'manage';

export default function App() {
  const [view, setView] = useState<View>('menu');
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const { cart } = useCart();
  const { admin, logout } = useAuth();

  const refresh = useCallback(() => {
    api.products(false).then(setProducts).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const n = cartCount(cart);
  const tabs: [View, string][] = [['menu', 'Menu'], ['cart', n ? `Cart (${n})` : 'Cart'], ['orders', 'My orders'], ['admin', 'Orders (staff)'], ['manage', 'Manage menu']];
  const staff = view === 'admin' || view === 'manage';

  return (
    <div className={`app${staff ? ' wide' : ''}`}>
      <header className="top">
        <div><h1>MY CAFÉ</h1><p className="sub">Order online</p></div>
        {admin && <button className="btn line sm" onClick={logout}>Log out</button>}
      </header>
      <nav className="tabs" aria-label="Main">
        {tabs.map(([k, label]) => <button key={k} aria-current={view === k ? 'page' : undefined} onClick={() => setView(k)}>{label}</button>)}
      </nav>
      {error && <p className="err" role="alert">Could not load the menu: {error}</p>}
      {view === 'menu' && <MenuPage products={products} onCart={() => setView('cart')} />}
      {view === 'cart' && <CartPage products={products} onMenu={() => setView('menu')} onPlaced={() => setView('orders')} />}
      {view === 'orders' && <MyOrdersPage />}
      {view === 'admin' && <AdminGate><AdminOrdersPage /></AdminGate>}
      {view === 'manage' && <AdminGate><ManageMenuPage onChanged={refresh} /></AdminGate>}
      <p className="hint">{USE_API ? 'Connected to the REST API.' : 'Demo mode: data is stored in this browser.'}</p>
    </div>
  );
}
