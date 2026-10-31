import { useCallback, useEffect, useState } from 'react';
import { api, USE_API } from './api';
import { AdminGate } from './components';
import AdminOrdersPage from './pages/AdminOrdersPage';
import CartPage from './pages/CartPage';
import ManageMenuPage from './pages/ManageMenuPage';
import MenuPage from './pages/MenuPage';
import MyOrdersPage from './pages/MyOrdersPage';
import { cartCount, useAuth, useCart } from './store';
import AnalyticsPage from './pages/AnalyticsPage';
import type { Product } from './types';

type View = 'menu' | 'cart' | 'orders' | 'admin' | 'manage' | 'analytics';

export default function App() {
  const [view, setView] = useState<View>(() => (['menu','cart','orders','admin','manage','analytics'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'menu') as View);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const { cart } = useCart();
  const { admin, logout } = useAuth();

  const refresh = useCallback(() => {
    api.products(false).then(p => {setProducts(p); setError('');}).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => { refresh(); const t=setInterval(refresh,15000); window.addEventListener('focus',refresh); return()=>{clearInterval(t);window.removeEventListener('focus',refresh);}; }, [refresh]);

  useEffect(() => { const sync = () => setView((['menu','cart','orders','admin','manage','analytics'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'menu') as View); window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync); }, []);
  useEffect(() => { location.hash = view; window.scrollTo(0, 0); }, [view]);
  const n = cartCount(cart);
  const tabs: [View, string][] = [['menu', 'Menu'], ['cart', n ? `Cart (${n})` : 'Cart'], ['orders', 'My orders'], ['admin', 'Staff orders'], ['manage', 'Manage menu'], ['analytics', 'Insights']];
  const staff = view === 'admin' || view === 'manage' || view === 'analytics';

  return (
    <main className={`app${staff ? ' wide' : ''}`}>
      <header className="top">
        <a className="brand" href="#menu" onClick={() => setView('menu')}><img src="/logo.svg" width="46" height="46" alt="" /><span>DashFood<span className="brand-sub">Your everyday happy place</span></span></a><span className="header-note"><span className="live-dot" /> Order ahead. Pick up fresh.</span>
        {admin && <button className="btn line sm" onClick={logout}>Log out</button>}
      </header>
      <nav className="tabs" aria-label="Main">
        {tabs.map(([k, label]) => <button key={k} aria-current={view === k ? 'page' : undefined} onClick={() => setView(k)}>{label}</button>)}
      </nav>
      {view === 'analytics' && <AdminGate><AnalyticsPage /></AdminGate>}
      {error && <p className="err" role="alert">Could not load the menu: {error}</p>}
      {view === 'menu' && <MenuPage products={products} onCart={() => setView('cart')} />}
      {view === 'cart' && <CartPage products={products} onMenu={() => setView('menu')} onPlaced={() => setView('orders')} />}
      {view === 'orders' && <MyOrdersPage />}
      {view === 'admin' && <AdminGate><AdminOrdersPage /></AdminGate>}
      {view === 'manage' && <AdminGate><ManageMenuPage onChanged={refresh} /></AdminGate>}
      <footer><a className="footer-brand" href="#menu">DashFood</a><p>Good food. Zero queue.</p><span>{USE_API ? 'Order online · Pay at pickup' : 'Browser demo · Orders stay on this device'}</span></footer>
      <p className="hint"><a href="/media/credits.html" target="_blank" rel="noreferrer">Image credits (opens in a new tab)</a></p>
    </main>
  );
}
