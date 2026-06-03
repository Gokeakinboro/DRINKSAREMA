"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [sort, setSort] = useState("createdAt_desc");
  const [page, setPage] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: catData } = useQuery({
    queryKey: ["category", slug],
    queryFn: () => api.get(`/categories/${slug}`).then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", slug, sort, page, inStockOnly, minPrice, maxPrice],
    queryFn: () => {
      const params = new URLSearchParams({ category: slug, sort, page: String(page), limit: "24" });
      if (inStockOnly) params.set("inStock", "true");
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      return api.get(`/products?${params}`).then((r) => r.data);
    },
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-ink-primary mb-1">{catData?.name || slug}</h1>
        {total > 0 && <p className="text-ink-secondary text-sm">{total} products</p>}
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters (desktop) */}
        <aside className={`hidden md:block w-56 flex-shrink-0`}>
          <div className="card p-5 sticky top-24">
            <h3 className="font-semibold text-ink-primary mb-4">Filters</h3>
            <div className="space-y-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={inStockOnly} onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }} className="rounded text-accent" />
                <span className="text-sm text-ink-primary">In Stock only</span>
              </label>
              <div>
                <p className="text-sm font-medium text-ink-primary mb-2">Price (₦)</p>
                <div className="flex gap-2">
                  <input value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} placeholder="Min" className="input text-sm py-2 w-full" />
                  <input value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} placeholder="Max" className="input text-sm py-2 w-full" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-4">
            <button className="md:hidden flex items-center gap-2 text-sm text-ink-secondary border border-gray-200 rounded-lg px-3 py-2" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={16} /> Filters
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-ink-secondary hidden sm:block">Sort:</span>
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="input py-2 text-sm w-auto">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-gray-100 rounded-t-2xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🍾</p>
              <p className="text-ink-secondary">No products found in this category.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product: any) => <ProductCard key={product.id} product={product} />)}
              </div>
              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium ${p === page ? "bg-brand-primary text-white" : "bg-white text-ink-primary border border-gray-200 hover:border-brand-primary"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
