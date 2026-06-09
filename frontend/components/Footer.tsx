import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-brand-dark text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <span className="text-white font-black text-xs">DA</span>
              </div>
              <span className="font-black text-xl">Drinks<span className="text-accent">Arena</span></span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Nigeria's premier online drinks store. Fast delivery of beer, wine, spirits and more across major cities.
            </p>
            <p className="text-white/40 text-xs">🍺 Please drink responsibly</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white/90">Shop</h3>
            <ul className="space-y-2 text-sm text-white/60">
              {[["Beer & Ciders", "/category/beer-ciders"], ["Wines", "/category/wines"], ["Spirits", "/category/spirits"], ["Champagne", "/category/champagne-prosecco"], ["Gift Sets", "/category/gift-sets-hampers"]].map(([name, href]) => (
                <li key={href}><Link href={href} className="hover:text-accent transition-colors">{name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white/90">Account</h3>
            <ul className="space-y-2 text-sm text-white/60">
              {[["Sign In", "/auth/login"], ["Register", "/auth/register"], ["My Orders", "/orders"], ["Loyalty Points", "/profile?tab=loyalty"], ["Event Calculator", "/event-calculator"]].map(([name, href]) => (
                <li key={href}><Link href={href} className="hover:text-accent transition-colors">{name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white/90">Info</h3>
            <ul className="space-y-2 text-sm text-white/60">
              {[["Delivery Info", "/delivery"], ["Returns Policy", "/returns"], ["Privacy Policy", "/privacy"], ["Terms & Conditions", "/terms"], ["Contact Us", "/contact"]].map(([name, href]) => (
                <li key={href}><Link href={href} className="hover:text-accent transition-colors">{name}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© {new Date().getFullYear()} DrinksArena. All rights reserved. For persons 18+ only.</p>
          <div className="flex items-center gap-4">
            <span>🔒 Secure Payments</span>
            <span>🚚 Fast Delivery</span>
            <span>✓ Authentic Products</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
