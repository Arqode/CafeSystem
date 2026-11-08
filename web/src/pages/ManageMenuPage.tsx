import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { kzt } from "../components";
import type { Category, Product, ProductInput } from "../types";

const CATS: Category[] = ["Burgers", "Drinks", "Desserts"];
const EMPTY: ProductInput = {
  name: "",
  category: "Burgers",
  price: 0,
  description: "",
  active: true,
};

export default function ManageMenuPage({
  onChanged,
}: {
  onChanged: () => void;
}) {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductInput | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (form) {
      nameRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
      nameRef.current?.focus({ preventScroll: true });
    }
  }, [form?.id, Boolean(form)]);
  const open = (product: ProductInput) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setErr("");
    setForm({ ...product });
  };
  const close = () => {
    setForm(null);
    requestAnimationFrame(() => returnFocus.current?.focus());
  };
  const load = useCallback(() => {
    api
      .products(true)
      .then(setItems)
      .catch((e: Error) => setErr(e.message));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async (p: ProductInput) => {
    if (busy) return;
    setErr("");
    setBusy(true);
    try {
      await api.saveProduct(p);
      close();
      load();
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) return setErr("Enter a product name.");
    if (!Number.isInteger(form.price) || form.price < 1 || form.price > 1000000)
      return setErr("Enter a whole-number price between 1 and 1,000,000 KZT.");
    void save({ ...form, name: form.name.trim() });
  };
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="panel">
      <div className="row">
        <h2 style={{ margin: 0 }}>Manage menu</h2>
        <button className="btn sm" disabled={busy} onClick={() => open(EMPTY)}>
          Add product
        </button>
      </div>
      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}
      {form && (
        <form className="card" onSubmit={submit} noValidate>
          <h3 style={{ marginTop: 0 }}>
            {form.id ? "Edit product" : "New product"}
          </h3>
          <label htmlFor="n">Name</label>
          <input
            ref={nameRef}
            id="n"
            maxLength={100}
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
          <label htmlFor="c">Category</label>
          <select
            id="c"
            value={form.category}
            onChange={(e) => set("category", e.target.value as Category)}
          >
            {CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label htmlFor="p">Price, KZT</label>
          <input
            id="p"
            type="number"
            min={1}
            max={1000000}
            step={1}
            required
            value={form.price || ""}
            onChange={(e) => set("price", Number(e.target.value))}
          />
          <label htmlFor="d">Description</label>
          <input
            id="d"
            maxLength={1000}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <div className="actions">
            <button disabled={busy} className="btn">
              {busy ? "Saving…" : "Save product"}
            </button>
            <button
              disabled={busy}
              type="button"
              className="btn line"
              onClick={close}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {items.map((p) => (
        <div key={p.id} className={`card${p.active ? "" : " off"}`}>
          <div className="row">
            <span className="name">{p.name}</span>
            <span className="price" style={{ margin: 0 }}>
              {kzt(p.price)}
            </span>
          </div>
          <p className="sub">
            {p.category} ·{" "}
            {p.active ? "Available" : "Disabled — hidden from customers"}
          </p>
          <div className="actions">
            <button
              disabled={busy}
              className="btn line sm"
              onClick={() => open(p)}
            >
              Edit
            </button>
            <button
              disabled={busy}
              className="btn line sm"
              onClick={() => void save({ ...p, active: !p.active })}
            >
              {p.active ? "Disable" : "Enable"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
