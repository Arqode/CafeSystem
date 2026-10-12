import { useState } from 'react';
import { kzt } from '../components';
import { cartCount, cartTotal, useCart } from '../store';
import type { Category, Product } from '../types';

const CATS: Category[] = ['Burgers', 'Drinks', 'Desserts'];

export default function MenuPage({ products, onCart }: { products: Product[]; onCart: () => void }) {
  const { cart, dispatch } = useCart();
  const [cat, setCat] = useState<Category>('Burgers');
  const [q, setQ] = useState('');
  const list = products.filter((p) => (q ? p.name.toLowerCase().includes(q.toLowerCase()) : p.category === cat));
  const n = cartCount(cart);
  return (
    <>
      <div className="panel">
        <h2>Menu</h2>
        <p className="sub">Choose food and drinks, then open your cart.</p>
        <div className="chips" role="group" aria-label="Categories">
          {CATS.map((c) => <button key={c} className={`chip ${c}`} aria-pressed={!q && c === cat} onClick={() => { setCat(c); setQ(''); }}>{c}</button>)}
        </div>
        <input type="search" aria-label="Search menu" placeholder="Search menu..." value={q} onChange={(e) => setQ(e.target.value)} />
        {list.length === 0 && <div className="empty">Nothing found. Try another category or word.</div>}
        {list.map((p) => (
          <div className="card" key={p.id}>
            <div className="name">{p.name}</div>
            <p className="sub">{p.description}</p>
            <div className="row" style={{ marginTop: 12 }}>
              <span className="price" style={{ margin: 0 }}>{kzt(p.price)}</span>
              <button className="btn sm" aria-label={`Add ${p.name} to cart`} onClick={() => dispatch({ t: 'add', id: p.id })}>Add to cart</button>
            </div>
          </div>
        ))}
      </div>
      {n > 0 && (
        <div className="cartbar"><div>
          <div><small>Cart · {n} item{n > 1 ? 's' : ''}</small><strong>{kzt(cartTotal(cart, products))}</strong></div>
          <button className="btn sm" onClick={onCart}>View Cart</button>
        </div></div>
      )}
    </>
  );
}
