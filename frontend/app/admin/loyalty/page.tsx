"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Loader2, Star, Settings, Users, Plus, Minus } from "lucide-react";

export default function AdminLoyaltyPage() {
  const qc = useQueryClient();
  const [savingSettings, setSavingSettings] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["loyalty-settings"],
    queryFn: () => api.get("/admin/loyalty/settings").then((r) => r.data),
  });

  const [form, setForm] = useState<any>(null);

  // Sync form when settings load
  if (settings && !form) setForm({ ...settings });

  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["loyalty-customers", customerSearch],
    queryFn: () => api.get(`/admin/loyalty/customers?search=${customerSearch}&limit=15`).then((r) => r.data),
  });

  async function saveSettings() {
    setSavingSettings(true);
    try {
      await api.put("/admin/loyalty/settings", {
        isActive: form.isActive,
        earnRateNaira: Number(form.earnRateNaira),
        redeemRate: Number(form.redeemRate),
        minRedeemPoints: Number(form.minRedeemPoints),
        maxRedeemPct: Number(form.maxRedeemPct),
      });
      toast.success("Loyalty settings saved");
      qc.invalidateQueries({ queryKey: ["loyalty-settings"] });
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function adjustPoints_() {
    if (!adjustUserId || !adjustPoints || !adjustReason) {
      toast.error("Fill in all fields");
      return;
    }
    setAdjusting(true);
    try {
      const pts = Number(adjustPoints);
      const { data } = await api.post("/admin/loyalty/adjust", { userId: adjustUserId, points: pts, reason: adjustReason });
      toast.success(`${pts > 0 ? "+" : ""}${pts} points applied to ${data.user.firstName || data.user.email}`);
      setAdjustUserId(""); setAdjustPoints(""); setAdjustReason("");
      qc.invalidateQueries({ queryKey: ["loyalty-customers"] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Adjustment failed");
    } finally {
      setAdjusting(false);
    }
  }

  if (loadingSettings || !form) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <Star size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-ink-primary">Loyalty Program</h1>
      </div>

      {/* Settings Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-brand-primary" />
            <h2 className="font-bold text-ink-primary">Program Settings</h2>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium text-ink-secondary">Program Active</span>
            <div
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.isActive ? "bg-brand-primary" : "bg-gray-200"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? "left-6" : "left-1"}`} />
            </div>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Earn Rate — ₦ per 1 Point</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-semibold">₦</span>
              <input
                type="number" value={form.earnRateNaira} min={1}
                onChange={(e) => setForm({ ...form, earnRateNaira: e.target.value })}
                className="input pl-8"
              />
            </div>
            <p className="text-xs text-ink-muted mt-1">Customer earns 1 point for every ₦{form.earnRateNaira} spent</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Redeem Rate — Points per ₦100 Discount</label>
            <input
              type="number" value={form.redeemRate} min={1}
              onChange={(e) => setForm({ ...form, redeemRate: e.target.value })}
              className="input"
            />
            <p className="text-xs text-ink-muted mt-1">{form.redeemRate} points = ₦100 off</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Minimum Points to Redeem</label>
            <input
              type="number" value={form.minRedeemPoints} min={1}
              onChange={(e) => setForm({ ...form, minRedeemPoints: e.target.value })}
              className="input"
            />
            <p className="text-xs text-ink-muted mt-1">Customers need at least {form.minRedeemPoints} points to redeem</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Max Redemption per Order (%)</label>
            <div className="relative">
              <input
                type="number" value={form.maxRedeemPct} min={1} max={100}
                onChange={(e) => setForm({ ...form, maxRedeemPct: e.target.value })}
                className="input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-semibold">%</span>
            </div>
            <p className="text-xs text-ink-muted mt-1">Points can cover max {form.maxRedeemPct}% of any order value</p>
          </div>
        </div>

        {/* Live preview */}
        <div className="mt-5 p-4 bg-surface-alt rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-ink-secondary mb-2">Live Preview</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>🛒 ₦10,000 order → <strong>{Math.floor(10000 / Number(form.earnRateNaira))} pts</strong> earned</span>
            <span>⭐ 100 pts → <strong>₦{Math.round(100 / Number(form.redeemRate) * 100)}</strong> discount</span>
            <span>🔒 Max redemption on ₦10,000 order: <strong>₦{Math.round(10000 * Number(form.maxRedeemPct) / 100)}</strong></span>
          </div>
        </div>

        <button onClick={saveSettings} disabled={savingSettings} className="btn-primary mt-5 py-2.5 px-6 flex items-center gap-2 text-sm disabled:opacity-50">
          {savingSettings && <Loader2 size={14} className="animate-spin" />}
          Save Settings
        </button>
      </div>

      {/* Manual Adjustment */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Star size={18} className="text-accent" />
          <h2 className="font-bold text-ink-primary">Manual Point Adjustment</h2>
        </div>
        <p className="text-sm text-ink-secondary mb-4">Award bonus points, correct errors, or apply penalties. Use negative numbers to deduct.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Customer ID</label>
            <input
              value={adjustUserId} onChange={(e) => setAdjustUserId(e.target.value)}
              className="input font-mono text-xs" placeholder="Paste customer UUID"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Points (+/−)</label>
            <input
              type="number" value={adjustPoints} onChange={(e) => setAdjustPoints(e.target.value)}
              className={`input ${Number(adjustPoints) < 0 ? "border-error text-error" : Number(adjustPoints) > 0 ? "border-success text-success" : ""}`}
              placeholder="e.g. 500 or -100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Reason</label>
            <input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="input" placeholder="e.g. Welcome bonus" />
          </div>
        </div>
        <button onClick={adjustPoints_} disabled={adjusting} className="btn-secondary mt-4 py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-50">
          {adjusting ? <Loader2 size={14} className="animate-spin" /> : (Number(adjustPoints) < 0 ? <Minus size={14} /> : <Plus size={14} />)}
          Apply Adjustment
        </button>
      </div>

      {/* Customer Leaderboard */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-brand-primary" />
            <h2 className="font-bold text-ink-primary">Customer Points</h2>
          </div>
          <input
            value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="Search customers…" className="input w-48 py-2 text-sm"
          />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface-alt">
            <tr>
              {["Customer", "Email / Phone", "Points Balance", "ID"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-secondary">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingCustomers ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : customersData?.customers?.map((c: any) => (
              <tr key={c.id} className="border-t border-gray-50 hover:bg-surface-alt/50">
                <td className="px-5 py-3 font-medium text-ink-primary">{c.firstName} {c.lastName}</td>
                <td className="px-5 py-3 text-ink-secondary">{c.email || c.phone}</td>
                <td className="px-5 py-3">
                  <span className={`font-bold tabular-nums ${c.loyaltyPoints > 0 ? "text-success" : "text-ink-muted"}`}>
                    {c.loyaltyPoints.toLocaleString()} pts
                  </span>
                  <span className="text-xs text-ink-muted ml-2">
                    ≈ ₦{Math.round(c.loyaltyPoints / Number(form.redeemRate) * 100).toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => setAdjustUserId(c.id)} className="text-xs text-brand-primary hover:underline font-mono">{c.id.slice(0, 8)}…</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
