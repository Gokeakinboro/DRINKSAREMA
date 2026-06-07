"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Layers, Star, BarChart2, LogOut, Palette } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/loyalty", label: "Loyalty", icon: Star },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/promos", label: "Promotions", icon: Tag },
  { href: "/admin/appearance", label: "Appearance", icon: Palette },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login?next=/admin"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); }
  }, [isAuthenticated, user]);

  return (
    <div className="flex h-screen bg-surface-alt overflow-hidden">
      <aside className="w-56 bg-brand-dark flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <span className="font-black text-lg text-white">Drinks<span className="text-accent">Arena</span></span>
          <p className="text-xs text-white/40 mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${pathname === href ? "bg-accent text-ink-primary" : "text-white/60 hover:text-white hover:bg-white/10"}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={() => { logout(); router.push("/"); }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
