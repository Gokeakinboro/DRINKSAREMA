"use client";
import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { SlidersHorizontal, X } from "lucide-react";

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSub = searchParams.get("sub") || "";

  const [sort, setSort] = useState("createdAt_desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: catData } = useQuery({
    queryKey: ["category", slug],
    queryFn: () => api.get(`/categories/${slug}`).then((r) => r.data),
  });

  const subcategories: any[] = catData?.children || [];

  const { data, isLoading } = useQuery({
    queryKey: ["products", slug, activeSub, sort, page, limit, inStockOnly, minPrice, maxPrice],
    queryFn: () => {
      const params = new URLSearchParams({ sort, page: String(page), limit: String(limit) });
      if (activeSub) {
        params.set("subcategory", activeSub);
      } else {
        params.set("category", slug);
      }
      if (inStockOnly) params.set("inStock", "true");
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      return api.get(`/products?${params}`).then((r) => r.data);
    },
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  const activeSubData = subcategories.find((s) => s.slug === activeSub);
  const displayName = activeSubData?.name || catData?.name || slug;

  function selectSub(subSlug: string) {
    setPage(1);
    if (subSlug) {
      router.push(`/category/${slug}?sub=${subSlug}`, { scroll: false });
    } else {
      router.push(`/category/${slug}`, { scroll: false });
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-black text-ink-primary mb-1">{displayName}</h1>
        {total > 0 && (
          <p className="text-ink-secondary text-sm">{total} product{total !== 1 ? "s" : ""}</p>
        )}
      </div>

      {/* Subcategory pill navigation */}
      {subcategories.length > 0 && (
        <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => selectSub("")}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !activeSub
                  ? "bg-brand-primary text-white shadow-sm"
                  : "bg-white text-ink-secondary border border-gray-200 hover:border-brand-primary hover:text-brand-primary"
              }`}
            >
              All
            </button>
            {subcategories.map((sub: any) => (
              <button
                key={sub.id}
                onClick={() => selectSub(sub.slug)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeSub === sub.slug
                    ? "bg-brand-primary text-white shadow-sm"
                    : "bg-white text-ink-secondary border border-gray-200 hover:border-brand-primary hover:text-brand-primary"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile filter panel */}
      {showFilters && (
        <div className="md:hidden card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-primary">Filters</h3>
            <button onClick={() => setShowFilters(false)}><X size={18} className="text-ink-muted" /></button>
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }} className="rounded" />
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
      )}

      <div className="flex gap-8 items-start">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden md:block w-56 flex-shrink-0 self-start sticky top-24">
          <div className="card p-5">
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
              <span className="text-sm text-ink-secondary hidden sm:block">Show:</span>
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="input py-2 text-sm w-auto">
                {[12, 24, 48, 96].map((n) => <option key={n} value={n}>{n} per page</option>)}
              </select>
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
              <p className="text-ink-secondary">No products found{activeSub ? ` in ${activeSubData?.name || activeSub}` : " in this category"}.
              </p>
              {activeSub && (
                <button onClick={() => selectSub("")} className="mt-4 text-sm text-brand-primary underline">
                  View all {catData?.name}
                </button>
              )}
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
