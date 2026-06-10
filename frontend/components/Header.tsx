"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, ShoppingBag, Search, User, Menu, X, ChevronDown, LogOut, Package, Heart, Star } from "lucide-react";
import { useAuthStore, useCartStore } from "@/lib/store";
import api from "@/lib/api";

const NAV_CATEGORIES = [
  { name: "Beer & Ciders", slug: "Beer-Ciders" },
  { name: "Wines", slug: "Wines" },
  { name: "Spirits", slug: "Spirits" },
  { name: "Champagne", slug: "Champagnedrinks arena colour code sdf" },
  { name: "Ready-to-Drink", slug: "Ready-to-Drink" },
  { name: "Non-Alcoholic", slug: "Non-Alcoholic" },
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
        <div className="flex items-center justify-between h-20 gap-6">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">DA</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tight hidden lg:block">
              Drinks<span className="text-accent">Arena</span>
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-2xl relative hidden sm:block" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search for beer, wine, spirits…"
                className="w-full bg-black/20 border border-white/10 text-white placeholder-white/50 rounded-full px-5 py-2.5 pr-12 text-sm focus:outline-none focus:bg-white focus:text-ink-primary focus:placeholder-ink-muted transition-all backdrop-blur-sm shadow-inner"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-accent transition-colors">
                <Search size={18} />
              </button>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-2xl mt-2 overflow-hidden z-50 border border-gray-100">
                {suggestions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/products/${s.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-alt text-sm text-ink-primary border-b border-gray-50 last:border-0"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <Search size={14} className="text-ink-muted flex-shrink-0" />
                    <span><strong className="font-semibold">{s.name}</strong> <span className="text-ink-muted">— {s.brand}</span></span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Mobile Search Icon */}
            <button className="sm:hidden p-2 text-white/80 hover:text-white" onClick={() => searchRef.current?.querySelector('input')?.focus()}>
              <Search size={22} />
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-white/90 hover:text-white transition-colors">
              <ShoppingBag size={24} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-accent rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-brand-primary">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen((o) => !o)} className="flex items-center gap-2 text-white hover:text-accent transition-colors p-1.5 rounded-full hover:bg-white/10">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-semibold hidden md:block pr-1">{user?.firstName || "Account"}</span>
                  <ChevronDown size={14} className="hidden md:block opacity-70" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl overflow-hidden z-50 border border-gray-100">
                    <div className="px-5 py-4 border-b border-gray-100 bg-surface-alt/50">
                      <p className="font-bold text-ink-primary text-sm">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-ink-secondary truncate mt-0.5">{user?.email || user?.phone}</p>
                    </div>
                    <nav className="py-2">
                      <Link href="/profile" className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-ink-primary hover:bg-surface-alt hover:text-brand-primary transition-colors" onClick={() => setUserMenuOpen(false)}><User size={16}/> My Profile</Link>
                      <Link href="/orders" className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-ink-primary hover:bg-surface-alt hover:text-brand-primary transition-colors" onClick={() => setUserMenuOpen(false)}><Package size={16}/> Orders</Link>
                      <Link href="/profile?tab=loyalty" className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-ink-primary hover:bg-surface-alt hover:text-brand-primary transition-colors" onClick={() => setUserMenuOpen(false)}><Star size={16}/> Loyalty Points <span className="ml-auto text-xs bg-accent/20 text-accent-dark px-2 py-0.5 rounded-full font-bold">{user?.loyaltyPoints}</span></Link>
                      {user?.role === "ADMIN" && (
                        <Link href="/admin" className="flex items-center gap-3 px-5 py-2.5 text-sm text-brand-primary font-bold hover:bg-surface-alt transition-colors" onClick={() => setUserMenuOpen(false)}>Admin Panel</Link>
                      )}
                    </nav>
                    <div className="border-t border-gray-100 py-2 bg-gray-50/50">
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full px-5 py-2.5 text-sm font-medium text-error hover:bg-red-50 transition-colors"><LogOut size={16}/> Sign out</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/auth/login" className="text-white/90 font-medium text-sm hover:text-white transition-colors px-2">Log in</Link>
                <Link href="/auth/register" className="bg-accent hover:bg-accent-light text-white font-bold py-2 px-5 rounded-full text-sm transition-all shadow-sm">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 text-white/90 hover:text-white -mr-2" onClick={() => setMobileOpen((o) => !o)}>
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Category nav (desktop) */}
      <div className="hidden md:block bg-black/10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between w-full py-3 overflow-x-auto scrollbar-hide">
            {NAV_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex-1 text-center text-white/80 hover:text-white text-sm font-semibold whitespace-nowrap transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            <div className="flex-shrink-0 flex items-center border-l border-white/20 pl-6 ml-2">
              <Link href="/event-calculator" className="text-accent hover:text-accent-light text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-1.5">
                Event Calculator
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-brand-dark border-t border-white/10">
          <nav className="px-4 py-3 space-y-1">
            {NAV_CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/category/${cat.slug}`} className="block text-white/80 hover:text-white py-3 text-sm border-b border-white/5 last:border-0" onClick={() => setMobileOpen(false)}>
                {cat.name}
              </Link>
            ))}
            <Link href="/event-calculator" className="block text-accent font-semibold py-3 text-sm" onClick={() => setMobileOpen(false)}>Event Calculator</Link>
          </nav>
          
          {!isAuthenticated && (
            <div className="p-4 border-t border-white/10 flex flex-col gap-3">
              <Link href="/auth/login" className="btn-outline w-full text-center py-2.5 text-sm border-white text-white hover:bg-white hover:text-brand-primary" onClick={() => setMobileOpen(false)}>Log In</Link>
              <Link href="/auth/register" className="bg-accent text-white font-bold w-full text-center py-2.5 text-sm rounded-full" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
