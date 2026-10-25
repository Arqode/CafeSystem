import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { kzt } from '../components';
import type { Category, Product, ProductInput } from '../types';

const CATS: Category[] = ['Burgers', 'Drinks', 'Desserts'];
const EMPTY: ProductInput = { name: '', category: 'Burgers', price: 0, description: '', active: true };

export default function ManageMenuPage({ onChanged }: { onChanged: () => void }) {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductInput | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => { api.products(true).then(setItems).catch((e: Error) => setErr(e.message)); }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (p: ProductInput) => {
    setErr('');
    try { await api.saveProduct(p); setForm(null); load(); onChanged(); } catch (e) { setErr((e as Error).message); }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) return setErr('Enter a product name.');
    if (!(form.price > 0)) return setErr('Enter a price greater than 0.');
    void save({ ...form, name: form.name.trim() });
  };
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="panel">
      <div className="row"><h2 style={{ margin: 0 }}>Manage menu</h2><button className="btn sm" onClick={() => { setErr(''); setForm({ ...EMPTY }); }}>Add product</button></div>
      {err && <p className="err" role="alert">{err}</p>}
      {form && (
        <form className="card" onSubmit={submit} noValidate>
          <h3 style={{ marginTop: 0 }}>{form.id ? 'Edit product' : 'New product'}</h3>
          <label htmlFor="n">Name</label><input id="n" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <label htmlFor="c">Category</label>
          <select id="c" value={form.category} onChange={(e) => set('category', e.target.value as Category)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <label htmlFor="p">Price, KZT</label><input id="p" type="number" min={1} step={50} value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} />
          <label htmlFor="d">Description</label><input id="d" value={form.description} onChange={(e) => set('description', e.target.value)} />
          <div className="actions"><button className="btn">Save product</button><button type="button" className="btn line" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
      {items.map((p) => (
        <div key={p.id} className={`card${p.active ? '' : ' off'}`}>
          <div className="row"><span className="name">{p.name}</span><span className="price" style={{ margin: 0 }}>{kzt(p.price)}</span></div>
          <p className="sub">{p.category} · {p.active ? 'Available' : 'Disabled — hidden from customers'}</p>
          <div className="actions">
            <button className="btn line sm" onClick={() => { setErr(''); setForm(p); }}>Edit</button>
            <button className="btn line sm" onClick={() => void save({ ...p, active: !p.active })}>{p.active ? 'Disable' : 'Enable'}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
