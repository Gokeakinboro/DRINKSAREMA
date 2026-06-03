"use client";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, Zap, Shield, Clock, Star } from "lucide-react";

const CATEGORIES = [
  { name: "Beer & Ciders", slug: "beer-ciders", emoji: "🍺", bg: "from-amber-400 to-amber-600" },
  { name: "Wines", slug: "wines", emoji: "🍷", bg: "from-red-700 to-red-900" },
  { name: "Spirits", slug: "spirits", emoji: "🥃", bg: "from-amber-600 to-amber-800" },
  { name: "Champagne", slug: "champagne-prosecco", emoji: "🥂", bg: "from-yellow-300 to-yellow-500" },
  { name: "RTD", slug: "ready-to-drink", emoji: "🍹", bg: "from-pink-400 to-pink-600" },
  { name: "Non-Alcoholic", slug: "non-alcoholic", emoji: "🧃", bg: "from-green-400 to-green-600" },
];

export default function HomePage() {
  const { data: featuredData } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => api.get("/products/featured").then((r) => r.data),
  });

  const { data: beerData } = useQuery({
    queryKey: ["products", "beer"],
    queryFn: () => api.get("/products?category=beer-ciders&limit=8").then((r) => r.data),
  });

  const { data: spiritsData } = useQuery({
    queryKey: ["products", "spirits"],
    queryFn: () => api.get("/products?category=spirits&limit=8").then((r) => r.data),
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute -bottom-20 left-10 w-72 h-72 rounded-full bg-brand-light blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-6">
              <Zap size={14} className="text-accent" />
              <span className="text-accent text-sm font-semibold">Sub-60 minute delivery in Lagos</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              Nigeria's Best<br />
              <span className="text-accent">Drinks Delivered</span><br />
              To Your Door
            </h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Browse 1,000+ authentic beers, wines, spirits and more. Fast delivery across Lagos, Abuja, Port Harcourt and Ibadan.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/category/spirits" className="btn-primary text-base px-8 py-4 flex items-center gap-2">
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link href="/event-calculator" className="bg-white/10 border border-white/20 text-white hover:bg-white/20 font-semibold px-8 py-4 rounded-lg flex items-center gap-2 transition-all text-base">
                🎉 Event Calculator
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: <Clock size={18} className="text-accent" />, text: "< 60 min delivery in Lagos" },
              { icon: <Shield size={18} className="text-success" />, text: "100% Authentic Products" },
              { icon: <Star size={18} className="text-warning" />, text: "Earn Loyalty Points" },
              { icon: <Zap size={18} className="text-brand-primary" />, text: "Free delivery over ₦25,000" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center justify-center gap-2 py-2">
                {icon}
                <span className="text-xs sm:text-sm font-medium text-ink-primary">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Shop by Category</h2>
          <Link href="/products" className="text-accent font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`bg-gradient-to-br ${cat.bg} rounded-2xl p-4 text-center text-white group hover:scale-105 transition-transform duration-200`}
            >
              <span className="text-3xl block mb-2">{cat.emoji}</span>
              <span className="text-xs font-semibold leading-tight block">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featuredData && featuredData.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Featured Picks</h2>
            <Link href="/products?tags=bestseller" className="text-accent font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
              See all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredData.slice(0, 8).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Promo banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-brand-primary to-brand-dark rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-accent font-semibold text-sm mb-2">First Order Promo</p>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-2">Get 10% Off Your First Order</h3>
            <p className="text-white/70">Use code <span className="text-accent font-bold">WELCOME10</span> at checkout. Min order ₦5,000.</p>
          </div>
          <Link href="/products" className="btn-primary whitespace-nowrap text-base px-8 py-4 flex items-center gap-2">
            Shop Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Beer section */}
      {beerData?.products?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">🍺 Beer & Ciders</h2>
            <Link href="/category/beer-ciders" className="text-accent font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {beerData.products.slice(0, 8).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Spirits section */}
      {spiritsData?.products?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">🥃 Spirits</h2>
            <Link href="/category/spirits" className="text-accent font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {spiritsData.products.slice(0, 8).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
