"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Search, User, Menu, X, ChevronDown, LogOut, Package, Heart, Star } from "lucide-react";
import { useAuthStore, useCartStore } from "@/lib/store";
import api from "@/lib/api";

const NAV_CATEGORIES = [
  { name: "Beer & Ciders", slug: "beer-ciders" },
  { name: "Wines", slug: "wines" },
  { name: "Spirits", slug: "spirits" },
  { name: "Champagne", slug: "champagne-prosecco" },
  { name: "Ready-to-Drink", slug: "ready-to-drink" },
  { name: "Non-Alcoholic", slug: "non-alcoholic" },
];

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchCart(); }, []);

  useEffect(() => {
    if (search.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(search)}&limit=6`);
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setShowSuggestions(false);
    }
  }

  function handleLogout() {
    logout();
    setUserMenuOpen(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 bg-brand-primary shadow-lg">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-white font-black text-xs">DA</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight hidden sm:block">
              Drinks<span className="text-accent">Arena</span>
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search for beer, wine, spirits…"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/60 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:bg-white focus:text-ink-primary focus:placeholder-ink-muted transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white">
                <Search size={18} />
              </button>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-xl mt-1 overflow-hidden z-50">
                {suggestions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/products/${s.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-alt text-sm text-ink-primary"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <Search size={14} className="text-ink-muted flex-shrink-0" />
                    <span><strong>{s.name}</strong> — {s.brand}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-white hover:text-accent transition-colors">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full text-white text-xs font-bold flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen((o) => !o)} className="flex items-center gap-1.5 text-white hover:text-accent transition-colors p-2">
                  <User size={20} />
                  <span className="text-sm font-medium hidden md:block">{user?.firstName || "Account"}</span>
                  <ChevronDown size={14} className="hidden md:block" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-ink-primary text-sm">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-ink-secondary truncate">{user?.email || user?.phone}</p>
                    </div>
                    <nav className="py-1">
                      <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-primary hover:bg-surface-alt" onClick={() => setUserMenuOpen(false)}><User size={15}/> My Profile</Link>
                      <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-primary hover:bg-surface-alt" onClick={() => setUserMenuOpen(false)}><Package size={15}/> Orders</Link>
                      <Link href="/profile?tab=loyalty" className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-primary hover:bg-surface-alt" onClick={() => setUserMenuOpen(false)}><Star size={15}/> Loyalty Points <span className="ml-auto text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-semibold">{user?.loyaltyPoints}</span></Link>
                      {user?.role === "ADMIN" && (
                        <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-primary font-semibold hover:bg-surface-alt" onClick={() => setUserMenuOpen(false)}>Admin Panel</Link>
                      )}
                    </nav>
                    <div className="border-t border-gray-100 py-1">
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error hover:bg-red-50"><LogOut size={15}/> Sign out</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="btn-outline py-2 px-4 text-sm border-white text-white hover:bg-white hover:text-brand-primary">Sign in</Link>
                <Link href="/auth/register" className="btn-primary py-2 px-4 text-sm">Register</Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 text-white" onClick={() => setMobileOpen((o) => !o)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Category nav (desktop) */}
        <nav className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto">
          {NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
            >
              {cat.name}
            </Link>
          ))}
          <Link href="/event-calculator" className="ml-auto text-accent hover:text-accent-light px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border border-accent/30 hover:border-accent">
            🎉 Event Calculator
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-brand-dark border-t border-white/10">
          <nav className="px-4 py-3 space-y-1">
            {NAV_CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/category/${cat.slug}`} className="block text-white/80 hover:text-white py-2 text-sm" onClick={() => setMobileOpen(false)}>
                {cat.name}
              </Link>
            ))}
            <Link href="/event-calculator" className="block text-accent font-semibold py-2 text-sm" onClick={() => setMobileOpen(false)}>🎉 Event Calculator</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
