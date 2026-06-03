"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatNGN } from "@/lib/utils";
import { TrendingUp, ShoppingBag, Users, XCircle, BarChart2, Download } from "lucide-react";

const PERIODS = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "12m", label: "This year" },
];

function BarChart({ data, valueKey, labelKey, formatValue }: {
  data: any[]; valueKey: string; labelKey: string; formatValue: (v: number) => string;
}) {
  if (!data?.length) return <p className="text-ink-muted text-sm text-center py-8">No data for this period</p>;
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div className="flex items-end gap-1 h-40 w-full overflow-x-auto pb-6 relative">
      {data.map((d, i) => {
        const pct = max > 0 ? (d[valueKey] / max) * 100 : 0;
        return (
          <div key={i} className="flex flex-col items-center flex-1 min-w-[24px] group relative">
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-ink-primary text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 z-10 pointer-events-none">
              {formatValue(d[valueKey])}
            </div>
            <div
              className="w-full bg-brand-primary/20 hover:bg-brand-primary rounded-t transition-colors cursor-default"
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            <span className="text-[9px] text-ink-muted mt-1 truncate w-full text-center absolute -bottom-5">
              {String(d[labelKey]).slice(-5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBar({ label, value, max, format }: { label: string; value: number; max: number; format: (v: number) => string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-ink-secondary w-28 shrink-0 truncate text-xs">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="bg-brand-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-ink-primary font-semibold tabular-nums text-xs w-24 text-right">{format(value)}</span>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [exporting, setExporting] = useState<string | null>(null);

  async function downloadReport(type: "orders" | "products" | "categories") {
    setExporting(type);
    try {
      const response = await api.get(`/admin/analytics/export?period=${period}&type=${type}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `drinksarena-${type}-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed");
    } finally {
      setExporting(null);
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics", period],
    queryFn: () => api.get(`/admin/analytics?period=${period}`).then((r) => r.data),
  });

  const maxCatRevenue = Math.max(...(data?.byCategory?.map((c: any) => c.revenue) || [0]));
  const maxProductRevenue = Math.max(...(data?.topProducts?.map((p: any) => p.revenue) || [0]));

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 size={24} className="text-brand-primary" />
          <h1 className="text-2xl font-bold text-ink-primary">Sales Analytics</h1>
        </div>
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-card">
          {PERIODS.map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p.id ? "bg-brand-primary text-white shadow" : "text-ink-secondary hover:text-ink-primary"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Revenue", value: formatNGN(data?.totalRevenue ?? 0), icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
          { label: "Total Orders", value: (data?.totalOrders ?? 0).toLocaleString(), icon: ShoppingBag, color: "text-brand-primary", bg: "bg-brand-primary/10" },
          { label: "Avg Order Value", value: formatNGN(data?.avgOrderValue ?? 0), icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
          { label: "New Customers", value: (data?.newUsers ?? 0).toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Cancelled Orders", value: (data?.cancelledCount ?? 0).toLocaleString(), icon: XCircle, color: "text-error", bg: "bg-error/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
              <Icon size={17} className={color} />
            </div>
            {isLoading ? <div className="h-7 w-20 bg-gray-100 rounded animate-pulse mb-1" /> : (
              <p className="text-xl font-black text-ink-primary tabular-nums">{value}</p>
            )}
            <p className="text-xs text-ink-secondary">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-6">
        <h2 className="font-bold text-ink-primary mb-1">Revenue Over Time</h2>
        <p className="text-xs text-ink-muted mb-5">Hover bars to see exact values. Excludes cancelled orders.</p>
        {isLoading ? (
          <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
        ) : (
          <BarChart
            data={data?.revenueChart ?? []}
            valueKey="revenue"
            labelKey="label"
            formatValue={(v) => formatNGN(v)}
          />
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <div className="card p-6">
          <h2 className="font-bold text-ink-primary mb-1">Orders Volume</h2>
          <p className="text-xs text-ink-muted mb-5">Number of orders per period</p>
          {isLoading ? (
            <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <BarChart
              data={data?.revenueChart ?? []}
              valueKey="orders"
              labelKey="label"
              formatValue={(v) => `${v} orders`}
            />
          )}
        </div>

        {/* Revenue by Category */}
        <div className="card p-6">
          <h2 className="font-bold text-ink-primary mb-4">Revenue by Category</h2>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : data?.byCategory?.length === 0 ? (
            <p className="text-ink-muted text-sm">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {data?.byCategory?.map((c: any) => (
                <HorizontalBar key={c.name} label={c.name} value={c.revenue} max={maxCatRevenue} format={formatNGN} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export Reports */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download size={18} className="text-brand-primary" />
          <h2 className="font-bold text-ink-primary">Download Reports</h2>
          <span className="text-xs text-ink-muted ml-1">CSV format • {PERIODS.find((p) => p.id === period)?.label}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {([
            { type: "orders", label: "All Orders", desc: "Order details, customer info, totals" },
            { type: "products", label: "Product Sales", desc: "Units sold & revenue per product" },
            { type: "categories", label: "Category Breakdown", desc: "Revenue & volume by category" },
          ] as const).map(({ type, label, desc }) => (
            <button
              key={type}
              onClick={() => downloadReport(type)}
              disabled={exporting === type}
              className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 hover:border-brand-primary hover:bg-brand-primary/5 transition-all disabled:opacity-50 text-left"
            >
              <Download size={16} className={exporting === type ? "text-brand-primary animate-bounce" : "text-ink-muted"} />
              <div>
                <p className="font-semibold text-sm text-ink-primary">{label}</p>
                <p className="text-xs text-ink-muted">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Top Products by Revenue */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-ink-primary">Top Products by Revenue</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface-alt">
            <tr>
              {["#", "Product", "Brand", "Units Sold", "Revenue"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-secondary">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : data?.topProducts?.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-muted">No sales data for this period</td></tr>
            ) : (
              data?.topProducts?.map((p: any, i: number) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-surface-alt/50">
                  <td className="px-5 py-3 font-bold text-ink-muted">#{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-ink-primary">{p.name}</td>
                  <td className="px-5 py-3 text-ink-secondary">{p.brand}</td>
                  <td className="px-5 py-3 tabular-nums">{p.units}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[80px] bg-gray-100 rounded-full h-1.5">
                        <div className="bg-brand-primary h-1.5 rounded-full" style={{ width: `${(p.revenue / maxProductRevenue) * 100}%` }} />
                      </div>
                      <span className="font-semibold tabular-nums text-success">{formatNGN(p.revenue)}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
