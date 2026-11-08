import { FormEvent, useRef, useState } from "react";
import { api } from "../api";
import { kzt } from "../components";
import { addMine, cartTotal, useCart } from "../store";
import type { Product } from "../types";

export default function CartPage({
  products,
  onMenu,
  onPlaced,
}: {
  products: Product[];
  onMenu: () => void;
  onPlaced: () => void;
}) {
  const { cart, dispatch } = useCart();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [nameError, setNameError] = useState("");
  const nameInput = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const checkout = useRef<{ fingerprint: string; key: string } | null>(null);
  const unavailable = cart.some(
    (l) => !products.some((p) => p.id === l.productId),
  );
  const total = cartTotal(cart, products);

  if (cart.length === 0) {
    return (
      <div className="panel">
        <h2>Your order</h2>
        <div className="empty">
          Your cart is empty.
          <br />
          <br />
          <button className="btn" onClick={onMenu}>
            Open menu
          </button>
        </div>
      </div>
    );
  }
  const place = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current || unavailable) return;
    const name = customerName.trim().replace(/\s+/g, " ");
    if (
      !name ||
      name.length > 80 ||
      !/\p{L}/u.test(name) ||
      /[\u0000-\u001f\u007f]/.test(name)
    ) {
      setNameError(
        "Enter your name so we can call you when your order is ready.",
      );
      nameInput.current?.focus();
      return;
    }
    setNameError("");
    setBusy(true);
    submitting.current = true;
    setErr("");
    try {
      // Verify receipt storage before creating an order. Preserve the same key after a lost response.
      localStorage.setItem("dashfood-storage-check", "1");
      localStorage.removeItem("dashfood-storage-check");
      const fingerprint = JSON.stringify({ cart, name });
      const stored = JSON.parse(
        localStorage.getItem("dashfood-checkout") || "null",
      ) as typeof checkout.current;
      checkout.current =
        stored?.fingerprint === fingerprint
          ? stored
          : { fingerprint, key: crypto.randomUUID() };
      localStorage.setItem(
        "dashfood-checkout",
        JSON.stringify(checkout.current),
      );
      const o = await api.placeOrder(cart, name, checkout.current.key);
      addMine({ id: o.id, trackingToken: o.trackingToken });
      localStorage.removeItem("dashfood-checkout");
      dispatch({ t: "clear" });
      onPlaced();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  };
  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: "flex-start" }}>
        <button className="btn line sm" onClick={onMenu}>
          ‹ Menu
        </button>
        <h2 style={{ margin: 0 }}>Your order</h2>
      </div>
      <h3>Selected products</h3>
      {cart.map((l) => {
        const p = products.find((x) => x.id === l.productId);
        if (!p)
          return (
            <div className="card" key={l.productId}>
              <p>This item is no longer available.</p>
              <button
                className="btn line"
                onClick={() => dispatch({ t: "remove", id: l.productId })}
              >
                Remove unavailable item
              </button>
            </div>
          );
        return (
          <div className="card" key={l.productId}>
            <div className="row">
              <span className="name">{p.name}</span>
              <span className="sub">{kzt(p.price)}</span>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <div>
                <div className="sub">Quantity</div>
                <div className="qty">
                  <button
                    aria-label="Decrease quantity"
                    disabled={l.qty < 2}
                    onClick={() => dispatch({ t: "dec", id: p.id })}
                  >
                    −
                  </button>
                  <span aria-live="polite">{l.qty}</span>
                  <button
                    disabled={l.qty >= 50}
                    aria-label="Increase quantity"
                    onClick={() => dispatch({ t: "inc", id: p.id })}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                className="btn line sm"
                onClick={() => dispatch({ t: "remove", id: p.id })}
              >
                Remove
              </button>
            </div>
            <p className="price">Subtotal: {kzt(p.price * l.qty)}</p>
          </div>
        );
      })}
      <div className="card">
        <div className="row">
          <span>Subtotal</span>
          <span>{kzt(total)}</span>
        </div>
        <div className="row total">
          <span>Total</span>
          <span>{kzt(total)}</span>
        </div>
      </div>
      <form className="checkout" onSubmit={place} noValidate>
        <section className="pickup-details" aria-labelledby="pickup-heading">
          <h3 id="pickup-heading">Who’s picking up?</h3>
          <p className="sub" id="pickup-help">
            We’ll call this name when your order is ready.
          </p>
          <label htmlFor="customer-name">
            Your name <span className="field-required">(required)</span>
          </label>
          <input
            ref={nameInput}
            id="customer-name"
            name="customerName"
            autoComplete="given-name"
            placeholder="e.g. Artur"
            required
            maxLength={80}
            value={customerName}
            disabled={busy}
            aria-invalid={Boolean(nameError)}
            aria-describedby={`pickup-help${nameError ? " customer-name-error" : ""}`}
            onChange={(e) => {
              setCustomerName(e.target.value);
              setNameError("");
            }}
          />
          {nameError && (
            <p className="field-error" id="customer-name-error" role="alert">
              {nameError}
            </p>
          )}
          <p className="pickup-payment">
            Pay at the café when you collect your order. Staff use your pickup
            name to hand over your food. Your order tracking key stays in this
            browser.
          </p>
        </section>
        {err && (
          <p className="err" role="alert">
            {err}
          </p>
        )}
        <button
          className="btn block"
          style={{ marginTop: 14 }}
          disabled={busy || unavailable}
          type="submit"
        >
          {busy ? "PLACING…" : "Place order · Pay at pickup"}
        </button>
      </form>
    </div>
  );
}
