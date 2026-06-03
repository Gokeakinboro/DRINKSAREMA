"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatNGN } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUSES = ["", "PENDING_PAYMENT", "PAYMENT_CONFIRMED", "PROCESSING", "DISPATCHED", "DELIVERED", "CANCELLED"];
const STATUS_LABELS: Record<string, string> = {
  "": "All", PENDING_PAYMENT: "Pending", PAYMENT_CONFIRMED: "Confirmed", PROCESSING: "Processing",
  DISPATCHED: "Dispatched", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", status, page, search],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) p.set("status", status);
      if (search) p.set("search", search);
      return api.get(`/admin/orders?${p}`).then((r) => r.data);
    },
  });

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId);
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch { toast.error("Failed to update"); }
    finally { setUpdating(null); }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-ink-primary mb-6">Orders</h1>
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search order# or email…" className="input w-64" />
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`px-3 py-2 rounded-lg text-xs font-semibold ${status === s ? "bg-brand-primary text-white" : "bg-white text-ink-secondary border border-gray-200 hover:border-brand-primary"}`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt border-b border-gray-100">
            <tr>{["Order #", "Customer", "Items", "Total", "Status", "Date", "Actions"].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ink-secondary">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50"><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : data?.orders?.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-ink-secondary">No orders found</td></tr>
            ) : data?.orders?.map((order: any) => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-surface-alt/50">
                <td className="px-4 py-3 font-medium text-brand-primary">#{order.orderNumber}</td>
                <td className="px-4 py-3 text-ink-primary">{order.user?.firstName} {order.user?.lastName}<br /><span className="text-xs text-ink-muted">{order.user?.email}</span></td>
                <td className="px-4 py-3 text-ink-secondary">{order.items?.length}</td>
                <td className="px-4 py-3 font-semibold tabular-nums">{formatNGN(order.total)}</td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    disabled={updating === order.id}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                  >
                    {STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-ink-secondary text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <a href={`/orders/${order.id}`} target="_blank" rel="noreferrer" className="text-accent text-xs hover:underline">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium ${p === page ? "bg-brand-primary text-white" : "bg-white border border-gray-200 text-ink-primary"}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
