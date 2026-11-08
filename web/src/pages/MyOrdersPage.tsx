import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { OrderCard } from "../components";
import { getMine } from "../store";
import type { Order } from "../types";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    Promise.allSettled(getMine().map((r) => api.order(r.id, r.trackingToken)))
      .then((results) => {
        const good = results
          .filter(
            (r): r is PromiseFulfilledResult<Order> => r.status === "fulfilled",
          )
          .map((r) => r.value);
        setOrders(good.sort((a, b) => b.id - a.id));
        setErr(
          results.some((r) => r.status === "rejected")
            ? "Some orders could not be loaded. Keep this browser data and try Refresh."
            : "",
        );
      })
      .catch((e: Error) => setErr(e.message));
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);
  return (
    <div className="panel">
      <h2>My orders</h2>
      <p className="sub">
        Status updates every few seconds. Orders are linked to this browser.
        Keep its data until pickup.
      </p>
      <button className="btn line sm" onClick={load}>
        Refresh orders
      </button>
      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}
      {orders.length === 0 ? (
        <div className="empty">No orders yet.</div>
      ) : (
        orders.map((o) => <OrderCard key={o.id} o={o} steps />)
      )}
    </div>
  );
}
