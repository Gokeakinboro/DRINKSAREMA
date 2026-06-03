"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatNGN } from "@/lib/utils";
import { ShoppingBag, Users, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get("/admin/dashboard").then((r) => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => <div key={i} className="card p-5 animate-pulse h-24" />)}
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-ink-primary mb-6">Dashboard</h1>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's Orders", value: data?.today?.orders ?? 0, icon: ShoppingBag, color: "text-brand-primary", bg: "bg-brand-primary/10" },
          { label: "Today's Revenue", value: formatNGN(data?.today?.revenue ?? 0), icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
          { label: "Total Customers", value: data?.totalUsers ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Processing Orders", value: data?.pendingOrders ?? 0, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-black text-ink-primary tabular-nums">{value}</p>
            <p className="text-sm text-ink-secondary">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-ink-primary">Recent Orders</h2>
            <Link href="/admin/orders" className="text-accent text-sm hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {data?.recentOrders?.slice(0, 8).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-sm text-ink-primary">#{order.orderNumber}</p>
                  <p className="text-xs text-ink-secondary">{order.user?.firstName} {order.user?.lastName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm tabular-nums">{formatNGN(order.total)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === "DELIVERED" ? "bg-success/10 text-success" : order.status === "CANCELLED" ? "bg-error/10 text-error" : "bg-warning/10 text-warning"}`}>{order.status.replace(/_/g, " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-warning" />
            <h2 className="font-bold text-ink-primary">Low Stock Alert</h2>
          </div>
          {data?.lowStock?.length === 0 ? (
            <p className="text-ink-secondary text-sm">All products have adequate stock.</p>
          ) : (
            <div className="space-y-3">
              {data?.lowStock?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-ink-primary line-clamp-1 flex-1">{p.name}</p>
                  <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${p.stockQuantity === 0 ? "bg-error/10 text-error" : "bg-warning/10 text-warning"}`}>
                    {p.stockQuantity === 0 ? "Out of stock" : `${p.stockQuantity} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        {data?.topProducts?.length > 0 && (
          <div className="card p-6 lg:col-span-2">
            <h2 className="font-bold text-ink-primary mb-4">Top Selling Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {data.topProducts.map((tp: any, i: number) => (
                <div key={tp.productId} className="text-center p-3 bg-surface-alt rounded-xl">
                  <span className="text-2xl font-black text-ink-muted">#{i + 1}</span>
                  <p className="text-xs font-medium text-ink-primary mt-1 line-clamp-2">{tp.product?.name}</p>
                  <p className="text-xs text-ink-secondary mt-1">{tp._sum?.quantity} sold</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
