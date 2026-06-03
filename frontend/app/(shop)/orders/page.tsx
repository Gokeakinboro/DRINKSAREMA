"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import { formatNGN } from "@/lib/utils";
import { Package, ChevronRight } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-warning/10 text-warning",
  PAYMENT_CONFIRMED: "bg-blue-50 text-blue-600",
  PROCESSING: "bg-purple-50 text-purple-600",
  DISPATCHED: "bg-indigo-50 text-indigo-600",
  DELIVERED: "bg-success/10 text-success",
  CANCELLED: "bg-error/10 text-error",
  REFUNDED: "bg-gray-100 text-ink-secondary",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAYMENT_CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  DISPATCHED: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  useEffect(() => { if (!isAuthenticated) router.push("/auth/login?next=/orders"); }, [isAuthenticated]);

  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get("/orders").then((r) => r.data),
    enabled: isAuthenticated,
  });

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
      {[1,2,3].map((i) => <div key={i} className="card p-5 animate-pulse h-24" />)}
    </div>
  );

  const orders = data?.orders || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-black text-ink-primary mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={64} className="mx-auto text-ink-muted mb-4" />
          <h2 className="text-xl font-bold text-ink-primary mb-2">No orders yet</h2>
          <p className="text-ink-secondary mb-6">Time to stock up!</p>
          <Link href="/" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="card p-5 flex items-center justify-between hover:shadow-card-hover transition-all group">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-surface-alt flex items-center justify-center">
                  <Package size={22} className="text-brand-primary" />
                </div>
                <div>
                  <p className="font-semibold text-ink-primary">Order #{order.orderNumber}</p>
                  <p className="text-sm text-ink-secondary">{new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · {order.items?.length} item(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="font-bold text-ink-primary tabular-nums">{formatNGN(order.total)}</p>
                  <span className={`badge text-xs ${STATUS_STYLES[order.status] || "bg-gray-100 text-ink-secondary"}`}>{STATUS_LABELS[order.status] || order.status}</span>
                </div>
                <ChevronRight size={18} className="text-ink-muted group-hover:text-brand-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
