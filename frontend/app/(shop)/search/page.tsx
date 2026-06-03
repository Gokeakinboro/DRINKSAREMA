"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { Search } from "lucide-react";

function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: () => api.get(`/search?q=${encodeURIComponent(q)}&limit=24`).then((r) => r.data),
    enabled: q.length >= 2,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-primary">
          {q ? `Search results for "${q}"` : "Search"}
        </h1>
        {data?.total !== undefined && <p className="text-ink-secondary text-sm mt-1">{data.total} product{data.total !== 1 ? "s" : ""} found</p>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card animate-pulse"><div className="aspect-square bg-gray-100 rounded-t-2xl" /><div className="p-4 space-y-2"><div className="h-3 bg-gray-100 rounded w-1/2" /><div className="h-4 bg-gray-100 rounded" /></div></div>)}
        </div>
      ) : data?.products?.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.products.map((p: any) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <Search size={64} className="mx-auto text-ink-muted mb-4" />
          <h2 className="text-xl font-bold text-ink-primary mb-2">No results found</h2>
          <p className="text-ink-secondary">Try a different search term or browse categories.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12"><div className="h-8 bg-gray-100 rounded w-48 mb-6 animate-pulse" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
