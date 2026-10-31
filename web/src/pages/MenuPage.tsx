import { useState } from 'react';
import { kzt } from '../components';
import { ProductPhoto } from '../media';
import { cartCount, cartTotal, useCart } from '../store';
import type { Category, Product } from '../types';

const CATS: (Category | 'All')[] = ['All', 'Burgers', 'Drinks', 'Desserts'];

export default function MenuPage({ products, onCart }: { products: Product[]; onCart: () => void }) {
  const { cart, dispatch } = useCart();
  const [cat, setCat] = useState<Category | 'All'>('All');
  const [q, setQ] = useState('');
  const [notice, setNotice] = useState({ text: '', sequence: 0 });
  const list = products.filter((p) => (q ? p.name.toLowerCase().includes(q.toLowerCase()) : cat === 'All' || p.category === cat));
  const n = cartCount(cart);
  return (
    <>
      <section className="hero"><div className="hero-copy"><span className="hero-tag"><span className="live-dot" /> Made fresh. Made for you.</span><h1>Good food.<br />Zero queue.</h1><p>Your favourites, a few taps away. Order ahead and we’ll take care of the delicious part.</p><a className="hero-cta" href="#menu-list">Explore the menu <span aria-hidden="true">↗</span></a><div className="hero-details"><span>Freshly prepared</span><span>Easy pickup</span><span>Pay at the café</span></div></div><div className="hero-visual"><img src="/media/double-burger-800.webp" alt="Fresh double burger with melted cheese" width="800" height="500" fetchPriority="high" /><div className="hero-sticker">Worth<br />every bite.</div><span className="pickup-pill">Ready in about 15 min</span></div></section>
      <div className="menu-heading" id="menu-list"><div><h2>What are you craving?</h2><p className="sub">A little comfort. A lot of flavour.</p></div><span className="menu-count">{products.length} favourites to choose from</span></div>
      <div className="panel menu-panel">
        <div className="menu-toolbar"><div className="chips" role="group" aria-label="Categories">
          {CATS.map((c) => <button key={c} className={`chip ${c}`} aria-pressed={!q && c === cat} onClick={() => { setCat(c); setQ(''); }}>{c === 'All' ? 'All menu' : c}</button>)}
        </div>
        <input type="search" aria-label="Search menu" placeholder="Search something delicious…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <p className="added-message" role="status" aria-live="polite" aria-atomic="true"><span key={notice.sequence}>{notice.text}</span></p>
        {list.length === 0 && <div className="empty">Nothing found. Try another category or word.</div>}
        <div className="product-grid">{list.map((p, index) => (
          <article className="card product-card" key={p.id}>
            <ProductPhoto product={p} priority={index === 0} />
            <span className="product-category">{p.category}</span><h3 className="name">{p.name}</h3>
            <p className="sub">{p.description}</p>
            <div className="row" style={{ marginTop: 12 }}>
              <span className="price" style={{ margin: 0 }}>{kzt(p.price)}</span>
              <button className="btn sm" aria-label={`Add ${p.name} to cart`} onClick={() => {
                dispatch({ t: 'add', id: p.id });
                setNotice((previous) => ({ text: `${p.name} added to cart.`, sequence: previous.sequence + 1 }));
              }}>+ Add to cart</button>
            </div>
          </article>
        ))}</div>
      </div>
      {n > 0 && (
        <div className="cartbar"><div>
          <div><small>Cart · {n} item{n > 1 ? 's' : ''}</small><strong>{kzt(cartTotal(cart, products))}</strong></div>
          <button className="btn sm" onClick={onCart}><img className="cart-icon" src="/media/cart-icon.svg" width={20} height={20} alt="" />View Cart</button>
        </div></div>
      )}
    </>
  );
}
