import { useState } from 'react';
import { api } from '../api';
import { kzt } from '../components';
import { addMine, cartTotal, useCart } from '../store';
import type { Product } from '../types';

export default function CartPage({ products, onMenu, onPlaced }: { products: Product[]; onMenu: () => void; onPlaced: () => void }) {
  const { cart, dispatch } = useCart();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const unavailable = cart.some(l => !products.some(p => p.id === l.productId));
  const total = cartTotal(cart, products);

  if (cart.length === 0) {
    return <div className="panel"><h2>Your order</h2><div className="empty">Your cart is empty.<br /><br /><button className="btn" onClick={onMenu}>Open menu</button></div></div>;
  }
  const place = async () => {
    setBusy(true); setErr('');
    try { const o = await api.placeOrder(cart); addMine(o.id); dispatch({ t: 'clear' }); onPlaced(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn line sm" onClick={onMenu}>‹ Menu</button><h2 style={{ margin: 0 }}>Your order</h2></div>
      <h3>Selected products</h3>
      {cart.map((l) => {
        const p = products.find((x) => x.id === l.productId); if (!p) return <div className="card" key={l.productId}><p>This item is no longer available.</p><button className="btn line" onClick={() => dispatch({t:'remove',id:l.productId})}>Remove unavailable item</button></div>;
        return (
          <div className="card" key={l.productId}>
            <div className="row"><span className="name">{p.name}</span><span className="sub">{kzt(p.price)}</span></div>
            <div className="row" style={{ marginTop: 10 }}>
              <div><div className="sub">Quantity</div>
                <div className="qty">
                  <button aria-label="Decrease quantity" disabled={l.qty < 2} onClick={() => dispatch({ t: 'dec', id: p.id })}>−</button>
                  <span aria-live="polite">{l.qty}</span>
                  <button disabled={l.qty >= 50} aria-label="Increase quantity" onClick={() => dispatch({ t: 'inc', id: p.id })}>+</button>
                </div></div>
              <button className="btn line sm" onClick={() => dispatch({ t: 'remove', id: p.id })}>Remove</button>
            </div>
            <p className="price">Subtotal: {kzt(p.price * l.qty)}</p>
          </div>
        );
      })}
      <div className="card"><div className="row"><span>Subtotal</span><span>{kzt(total)}</span></div><div className="row total"><span>Total</span><span>{kzt(total)}</span></div></div>
      <div className="card"><div className="name">Pickup</div><p className="sub">Estimated preparation: 15 min. Payment at the café.</p></div>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn block" style={{ marginTop: 14 }} disabled={busy || unavailable} onClick={place}>{busy ? 'PLACING…' : 'Place order · Pay at pickup'}</button>
    </div>
  );
}
