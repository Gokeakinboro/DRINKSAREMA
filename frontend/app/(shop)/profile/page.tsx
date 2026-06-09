"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { User, Lock, MapPin, Star, Plus, Edit2, Trash2, X, CheckCircle, Loader2, TrendingUp, TrendingDown, Gift, ChevronRight } from "lucide-react";

type Tab = "profile" | "password" | "addresses" | "loyalty";

const ADDR_EMPTY = { label: "", street: "", city: "Lagos", state: "Lagos", country: "Nigeria", instructions: "", isDefault: false };

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && ["profile", "password", "addresses", "loyalty"].includes(t)) {
      setTab(t as Tab);
    }
  }, [searchParams]);

  // profile form
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // password form
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  // address modal
  const [addrModal, setAddrModal] = useState<"create" | "edit" | null>(null);
  const [addrId, setAddrId] = useState<string | null>(null);
  const [addr, setAddr] = useState({ ...ADDR_EMPTY });
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/auth/login?next=/profile");
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) setProfile({ firstName: user.firstName || "", lastName: user.lastName || "", phone: user.phone || "" });
  }, [user]);

  const { data: addresses, isLoading: loadingAddr } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.get("/users/me/addresses").then((r) => r.data),
    enabled: isAuthenticated,
  });

  const { data: loyalty } = useQuery({
    queryKey: ["loyalty"],
    queryFn: () => api.get("/users/me/loyalty").then((r) => r.data),
    enabled: isAuthenticated,
  });

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const { data } = await api.put("/users/me", profile);
      setUser({ ...user!, ...data });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    if (pw.next !== pw.confirm) { toast.error("Passwords don't match"); return; }
    if (pw.next.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setSavingPw(true);
    try {
      await api.put("/users/me/password", { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: "", next: "", confirm: "" });
      toast.success("Password changed");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  }

  function openCreateAddr() {
    setAddr({ ...ADDR_EMPTY });
    setAddrId(null);
    setAddrModal("create");
  }

  function openEditAddr(a: any) {
    setAddr({ label: a.label || "", street: a.street, city: a.city, state: a.state, country: a.country, instructions: a.instructions || "", isDefault: a.isDefault });
    setAddrId(a.id);
    setAddrModal("edit");
  }

  async function saveAddr() {
    setSavingAddr(true);
    try {
      if (addrModal === "create") {
        await api.post("/users/me/addresses", addr);
        toast.success("Address added");
      } else {
        await api.put(`/users/me/addresses/${addrId}`, addr);
        toast.success("Address updated");
      }
      setAddrModal(null);
      qc.invalidateQueries({ queryKey: ["addresses"] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save address");
    } finally {
      setSavingAddr(false);
    }
  }

  async function deleteAddr(id: string) {
    if (!confirm("Remove this address?")) return;
    await api.delete(`/users/me/addresses/${id}`);
    qc.invalidateQueries({ queryKey: ["addresses"] });
    toast.success("Address removed");
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Personal Info", icon: <User size={16} /> },
    { id: "password", label: "Password", icon: <Lock size={16} /> },
    { id: "addresses", label: "Addresses", icon: <MapPin size={16} /> },
    { id: "loyalty", label: "Loyalty Points", icon: <Star size={16} /> },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black text-ink-primary mb-2">My Account</h1>
      <p className="text-ink-secondary mb-8">Manage your profile, addresses and loyalty points</p>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-card mb-8 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center ${tab === t.id ? "bg-brand-primary text-white shadow" : "text-ink-secondary hover:text-ink-primary"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="card p-6 space-y-5">
          <h2 className="font-bold text-ink-primary text-lg">Personal Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">First Name</label>
              <input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="input" placeholder="First name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Last Name</label>
              <input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="input" placeholder="Last name" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Email</label>
            <input value={user?.email || ""} disabled className="input bg-surface-alt text-ink-muted cursor-not-allowed" />
            <p className="text-xs text-ink-muted mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Phone Number</label>
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input" placeholder="+234 800 000 0000" />
          </div>
          <button onClick={saveProfile} disabled={savingProfile} className="btn-primary flex items-center gap-2 py-2.5 px-6">
            {savingProfile && <Loader2 size={15} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      )}

      {/* Password Tab */}
      {tab === "password" && (
        <div className="card p-6 space-y-5">
          <h2 className="font-bold text-ink-primary text-lg">Change Password</h2>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Current Password</label>
            <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="input" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">New Password</label>
            <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="input" placeholder="At least 8 characters" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Confirm New Password</label>
            <input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className="input" placeholder="••••••••" />
          </div>
          <button onClick={savePassword} disabled={savingPw || !pw.current || !pw.next} className="btn-primary flex items-center gap-2 py-2.5 px-6 disabled:opacity-50">
            {savingPw && <Loader2 size={15} className="animate-spin" />}
            Update Password
          </button>
        </div>
      )}

      {/* Addresses Tab */}
      {tab === "addresses" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-ink-primary text-lg">Saved Addresses</h2>
            <button onClick={openCreateAddr} className="btn-primary py-2 px-4 text-sm flex items-center gap-2"><Plus size={15} /> Add Address</button>
          </div>
          {loadingAddr ? (
            <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : addresses?.length === 0 ? (
            <div className="card p-10 text-center">
              <MapPin size={32} className="text-ink-muted mx-auto mb-3" />
              <p className="text-ink-secondary">No addresses saved yet</p>
              <button onClick={openCreateAddr} className="btn-primary mt-4 py-2 px-5 text-sm">Add your first address</button>
            </div>
          ) : (
            addresses?.map((a: any) => (
              <div key={a.id} className={`card p-5 flex items-start justify-between ${a.isDefault ? "ring-2 ring-brand-primary" : ""}`}>
                <div className="flex gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${a.isDefault ? "bg-brand-primary text-white" : "bg-surface-alt text-ink-muted"}`}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-ink-primary text-sm">{a.label || a.city}</span>
                      {a.isDefault && <span className="badge bg-brand-primary/10 text-brand-primary text-[10px]"><CheckCircle size={10} className="mr-0.5" />Default</span>}
                    </div>
                    <p className="text-sm text-ink-secondary">{a.street}, {a.city}, {a.state}</p>
                    {a.instructions && <p className="text-xs text-ink-muted mt-1">Note: {a.instructions}</p>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEditAddr(a)} className="text-brand-primary hover:text-accent text-xs font-medium flex items-center gap-1"><Edit2 size={13} /> Edit</button>
                  <button onClick={() => deleteAddr(a.id)} className="text-error hover:text-red-700 text-xs font-medium flex items-center gap-1"><Trash2 size={13} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Loyalty Tab */}
      {tab === "loyalty" && (
        <div className="space-y-6">
          
          {/* Premium Balance Card */}
          <div className="card p-8 bg-gradient-to-br from-[#1A4731] via-[#20583D] to-[#113322] text-white shadow-card-hover overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute -top-12 -right-12 text-white/5">
              <Star size={180} fill="currentColor" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4 border border-white/10">
                  <Star size={14} className="text-[#C9A227] fill-current" />
                  <span className="text-sm font-medium text-white/90">Drinks Arena Rewards</span>
                </div>
                <p className="text-white/80 text-sm mb-1 font-medium">Available Balance</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-6xl font-black tracking-tight">{loyalty?.balance ?? user?.loyaltyPoints ?? 0}</p>
                  <p className="text-white/70 font-medium">pts</p>
                </div>
                <p className="text-[#C9A227] font-semibold mt-2">
                  ≈ ₦{((loyalty?.balance ?? 0) * 10).toLocaleString()} <span className="text-white/60 font-normal">in discount value</span>
                </p>
              </div>

              {/* Progress Bar for next reward */}
              <div className="bg-black/20 rounded-2xl p-5 backdrop-blur-md border border-white/10 md:w-64 w-full">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/80 font-medium">Next Reward</span>
                  <span className="text-[#C9A227] font-bold">100 pts</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5 mb-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#C9A227] to-[#E5C75A] h-2.5 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(100, ((loyalty?.balance ?? user?.loyaltyPoints ?? 0) / 100) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-white/60 text-center">
                  {((loyalty?.balance ?? 0) >= 100) 
                    ? "You've unlocked a reward!" 
                    : `${100 - (loyalty?.balance ?? 0)} more points to unlock ₦1,000 off`}
                </p>
              </div>
            </div>
          </div>

          {/* Available Rewards Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { pts: 100, reward: "₦1,000 Off", desc: "Valid on any order" },
              { pts: 250, reward: "Free Delivery", desc: "Up to ₦3,000 value" },
              { pts: 500, reward: "₦6,000 Off", desc: "VIP discount tier" },
            ].map((r, i) => {
              const pts = loyalty?.balance ?? user?.loyaltyPoints ?? 0;
              const isUnlocked = pts >= r.pts;
              return (
                <div key={i} className={`card p-5 border-2 transition-all ${isUnlocked ? 'border-[#C9A227]/30 bg-gradient-to-b from-[#C9A227]/5 to-transparent' : 'border-gray-100 opacity-60 grayscale'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${isUnlocked ? 'bg-[#C9A227]/20 text-[#C9A227]' : 'bg-gray-100 text-gray-400'}`}>
                    <Gift size={20} />
                  </div>
                  <h4 className="font-bold text-ink-primary text-lg">{r.reward}</h4>
                  <p className="text-ink-secondary text-sm mb-4">{r.desc}</p>
                  
                  {isUnlocked ? (
                    <button className="w-full py-2 bg-[#C9A227] hover:bg-[#B38D1F] text-white text-sm font-semibold rounded-lg transition-colors flex justify-center items-center gap-1">
                      Redeem Now <ChevronRight size={16} />
                    </button>
                  ) : (
                    <div className="w-full py-2 bg-gray-100 text-ink-muted text-sm font-semibold rounded-lg text-center flex items-center justify-center gap-2">
                      <Lock size={14} /> {r.pts} pts needed
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* How it works */}
            <div className="card p-6 h-full border border-gray-100 shadow-sm">
              <h3 className="font-bold text-ink-primary mb-5 flex items-center gap-2">
                <Star size={18} className="text-[#C9A227]" /> How to earn & use
              </h3>
              <div className="space-y-4">
                {[
                  ["Earn 1 point", "for every ₦100 spent in our store."],
                  ["Redeem points", "at checkout for direct cash discounts."],
                  ["Points never expire", "as long as your account remains active."],
                ].map(([title, desc], i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-[#1A4731]/10 text-[#1A4731] flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      {i !== 2 && <div className="w-0.5 h-6 bg-gray-100 mt-1"></div>}
                    </div>
                    <div className="-mt-0.5 pb-2">
                      <span className="font-semibold text-sm text-ink-primary block">{title}</span>
                      <span className="text-sm text-ink-secondary">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-6 h-full border border-gray-100 shadow-sm flex flex-col">
              <h3 className="font-bold text-ink-primary mb-5">Recent Activity</h3>
              
              {(!loyalty?.history || loyalty.history.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <Star size={24} className="text-gray-300" />
                  </div>
                  <p className="text-ink-secondary text-sm">No points history yet.</p>
                  <p className="text-ink-muted text-xs mt-1">Make your first purchase to start earning!</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
                  {loyalty.history.slice(0, 10).map((h: any, i: number) => (
                    <div key={i} className="flex items-start justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex gap-3 items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${h.points > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                          {h.points > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-ink-primary">{h.description || (h.points > 0 ? "Order reward" : "Points redeemed")}</p>
                          <p className="text-xs text-ink-muted">{new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <span className={`font-bold tabular-nums text-sm ${h.points > 0 ? "text-success" : "text-error"}`}>
                        {h.points > 0 ? "+" : ""}{h.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Address Modal */}
      {addrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setAddrModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-ink-primary">{addrModal === "create" ? "Add Address" : "Edit Address"}</h2>
              <button onClick={() => setAddrModal(null)}><X size={20} className="text-ink-muted" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Label (optional)</label>
                <input value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} className="input" placeholder="e.g. Home, Office" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Street Address <span className="text-error">*</span></label>
                <input value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} className="input" placeholder="12 Marina Street" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">City</label>
                  <input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">State</label>
                  <input value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Delivery Instructions</label>
                <input value={addr.instructions} onChange={(e) => setAddr({ ...addr, instructions: e.target.value })} className="input" placeholder="Gate code, landmark…" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={addr.isDefault} onChange={(e) => setAddr({ ...addr, isDefault: e.target.checked })} className="accent-brand-primary w-4 h-4" />
                <span className="text-sm font-medium text-ink-primary">Set as default address</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setAddrModal(null)} className="btn-outline py-2 px-5 text-sm">Cancel</button>
              <button onClick={saveAddr} disabled={savingAddr || !addr.street} className="btn-primary py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-50">
                {savingAddr && <Loader2 size={14} className="animate-spin" />}
                {addrModal === "create" ? "Add Address" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
