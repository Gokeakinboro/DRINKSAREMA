"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { useCartStore, useAuthStore } from "@/lib/store";
import { formatNGN } from "@/lib/utils";
import { ProductCard } from "@/components/ProductCard";
import { ShoppingCart, Zap, Star, ChevronLeft, ChevronRight, Share2, Heart, Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [qty, setQty] = useState(1);
  const [isCase, setIsCase] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get(`/products/${slug}`).then((r) => r.data),
  });

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-10 animate-pulse">
        <div className="aspect-square bg-gray-100 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-6 bg-gray-100 rounded w-1/3" />
          <div className="h-8 bg-gray-100 rounded" />
          <div className="h-8 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  if (!data) return <div className="text-center py-20"><p>Product not found.</p><Link href="/" className="text-accent">Go home</Link></div>;

  const product = data;
  const similar = data.similar || [];
  const images = product.images?.length ? product.images : ["/placeholder.jpg"];
  const inStock = product.stockQuantity > 0;
  const price = isCase && product.casePrice ? Number(product.casePrice) : Number(product.unitPrice);
  const avgRating = product.reviews?.length ? product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length : 0;

  async function handleAddToCart() {
    if (!inStock) return;
    try {
      await addItem(product.id, qty, isCase);
      toast.success("Added to cart!");
    } catch { toast.error("Could not add to cart"); }
  }

  async function handleBuyNow() {
    if (!inStock) return;
    await handleAddToCart();
    window.location.href = "/checkout";
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-ink-secondary mb-6">
        <Link href="/" className="hover:text-brand-primary">Home</Link>
        <span>/</span>
        {product.category && <Link href={`/category/${product.category.slug}`} className="hover:text-brand-primary">{product.category.name}</Link>}
        <span>/</span>
        <span className="text-ink-primary truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 mb-16">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-surface-alt rounded-2xl overflow-hidden mb-3">
            <Image src={images[imgIdx]} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow"><ChevronLeft size={18} /></button>
                <button onClick={() => setImgIdx((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow"><ChevronRight size={18} /></button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img: string, i: number) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${i === imgIdx ? "border-accent" : "border-transparent"}`}>
                  <Image src={img} alt="" width={64} height={64} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {product.tags?.includes("bestseller") && <span className="badge bg-accent text-ink-primary">Bestseller</span>}
            {product.tags?.includes("new") && <span className="badge bg-success text-white">New</span>}
            {product.tags?.includes("premium") && <span className="badge bg-brand-primary text-white">Premium</span>}
            {!inStock && <span className="badge bg-gray-200 text-ink-secondary">Out of Stock</span>}
            {inStock && product.stockQuantity <= 5 && <span className="badge bg-warning/90 text-white">Low Stock — {product.stockQuantity} left</span>}
          </div>

          <p className="text-ink-secondary font-semibold mb-1">{product.brand}</p>
          <h1 className="text-2xl md:text-3xl font-black text-ink-primary mb-2">{product.name}</h1>

          <div className="flex items-center gap-4 text-sm text-ink-secondary mb-4">
            {product.volumeMl && <span>{product.volumeMl}ml</span>}
            {product.abv && <span>• {product.abv}% ABV</span>}
            {product.countryOfOrigin && <span>• {product.countryOfOrigin}</span>}
          </div>

          {avgRating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => <Star key={s} size={16} className={s <= Math.round(avgRating) ? "fill-warning text-warning" : "text-gray-200 fill-gray-200"} />)}
              </div>
              <span className="text-sm text-ink-secondary">({product.reviews?.length} reviews)</span>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-surface-alt rounded-2xl p-5 mb-6">
            {product.casePrice && (
              <div className="flex gap-2 mb-4">
                <button onClick={() => setIsCase(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${!isCase ? "border-brand-primary bg-brand-primary text-white" : "border-gray-200 text-ink-secondary"}`}>
                  Single {product.volumeMl ? `(${product.volumeMl}ml)` : ""}
                </button>
                <button onClick={() => setIsCase(true)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${isCase ? "border-brand-primary bg-brand-primary text-white" : "border-gray-200 text-ink-secondary"}`}>
                  Case of {product.caseQty}
                </button>
              </div>
            )}
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-3xl font-black text-brand-primary tabular-nums">{formatNGN(price)}</span>
              {isCase && <span className="text-sm text-ink-secondary">{formatNGN(Number(product.casePrice) / (product.caseQty || 1))} per bottle</span>}
            </div>
            <p className="text-xs text-ink-secondary">VAT included • Free delivery over ₦25,000</p>
          </div>

          {/* Quantity + CTA */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 text-ink-primary"><Minus size={16} /></button>
              <span className="w-10 text-center font-semibold text-ink-primary tabular-nums">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 text-ink-primary"><Plus size={16} /></button>
            </div>
            <button onClick={handleAddToCart} disabled={!inStock} className="btn-secondary flex items-center gap-2 flex-1 justify-center">
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <button onClick={handleBuyNow} disabled={!inStock} className="btn-primary flex items-center gap-2 flex-1 justify-center">
              <Zap size={18} /> Buy Now
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-4">
              <h3 className="font-semibold text-ink-primary mb-2">Description</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">{product.description}</p>
            </div>
          )}
          {product.tastingNotes && (
            <div>
              <h3 className="font-semibold text-ink-primary mb-2">Tasting Notes</h3>
              <p className="text-sm text-ink-secondary leading-relaxed italic">"{product.tastingNotes}"</p>
            </div>
          )}
          {product.nafdacNumber && (
            <p className="text-xs text-ink-muted mt-4">NAFDAC Reg. No: {product.nafdacNumber}</p>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.reviews?.length > 0 && (
        <section className="mb-12">
          <h2 className="section-title mb-6">Customer Reviews</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {product.reviews.slice(0, 6).map((review: any) => (
              <div key={review.id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm text-ink-primary">{review.user?.firstName} {review.user?.lastName?.charAt(0)}.</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1,2,3,4,5].map((s) => <Star key={s} size={13} className={s <= review.rating ? "fill-warning text-warning" : "fill-gray-200 text-gray-200"} />)}
                    </div>
                  </div>
                  <span className="text-xs text-ink-muted">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                {review.title && <p className="font-semibold text-sm text-ink-primary mb-1">{review.title}</p>}
                {review.body && <p className="text-sm text-ink-secondary">{review.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar products */}
      {similar.length > 0 && (
        <section>
          <h2 className="section-title mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {similar.slice(0, 8).map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
