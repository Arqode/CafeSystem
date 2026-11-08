import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { FLOW, OrderCard } from "../components";
import type { Order, Status } from "../types";

const FILTERS = [
  "All",
  "New",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
] as const;
const LABEL = ["Accept order", "Mark as ready", "Complete order"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const load = useCallback(() => {
    api
      .allOrders()
      .then((value) => {
        setOrders(value);
        setErr("");
      })
      .catch((e: Error) => setErr(e.message));
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const change = async (id: number, s: Status) => {
    if (busy !== null) return;
    setBusy(id);
    try {
      await api.setStatus(id, s);
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const list = orders.filter((o) =>
    filter === "All" ? true : o.status === filter,
  );

  return (
    <div className="panel">
      <p className="sub">Admin panel</p>
      <h2>Orders</h2>
      <h3>Order status</h3>
      <div className="chips" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            className="chip"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}
      {list.length === 0 && (
        <div className="empty">No orders with this status.</div>
      )}
      {list.map((o) => {
        const i = FLOW.indexOf(o.status as (typeof FLOW)[number]);
        return (
          <OrderCard key={o.id} o={o} showCustomer>
            {i >= 0 && i < 3 && (
              <div className="actions">
                <button
                  disabled={busy !== null}
                  className="btn"
                  style={{ flex: 1 }}
                  onClick={() => change(o.id, FLOW[i + 1])}
                >
                  {LABEL[i]}
                </button>
                {i < 2 && (
                  <button
                    disabled={busy !== null}
                    className="btn danger sm"
                    onClick={() => change(o.id, "Cancelled")}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </OrderCard>
        );
      })}
      <h3>Order workflow</h3>
      <div className="card">
        <div className="flow">New → Preparing → Ready → Completed</div>
        <p className="sub">Cancellation is available while New or Preparing.</p>
      </div>
    </div>
  );
}
