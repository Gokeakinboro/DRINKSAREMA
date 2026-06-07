"use client";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { formatNGN } from "@/lib/utils";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  unitPrice: number;
  casePrice?: number;
  images: string[];
  stockQuantity: number;
  abv?: number;
  volumeMl?: number;
  tags?: string[];
  category?: { name: string };
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const inStock = product.stockQuantity > 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const isBestseller = product.tags?.includes("bestseller");
  const isNew = product.tags?.includes("new");
  const isPremium = product.tags?.includes("premium");

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    try {
      await addItem(product.id, 1);
      toast.success("Added to cart!");
    } catch {
      toast.error("Could not add to cart");
    }
  }

  return (
    <Link href={`/products/${product.slug}`} className="card group block">
      <div className="relative overflow-hidden rounded-t-2xl">
        <div className="aspect-square bg-surface-alt relative">
          <Image
            src={product.images[0] || "/placeholder.jpg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isBestseller && <span className="badge bg-accent text-ink-primary">Bestseller</span>}
          {isNew && <span className="badge bg-success text-white">New</span>}
          {isPremium && <span className="badge bg-brand-primary text-white">Premium</span>}
          {isLowStock && <span className="badge bg-warning/90 text-white">Low Stock</span>}
        </div>

        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="badge bg-gray-200 text-ink-secondary text-sm px-3 py-1">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs text-ink-secondary font-medium mb-1">{product.brand}</p>
        <h3 className="text-sm font-semibold text-ink-primary line-clamp-2 mb-1 group-hover:text-brand-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-ink-muted mb-3">
          {product.volumeMl && <span>{product.volumeMl}ml</span>}
          {product.abv && <span>•</span>}
          {product.abv && <span>{product.abv}% ABV</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-brand-primary tabular-nums">{formatNGN(product.unitPrice)}</p>
            {product.casePrice && (
              <p className="text-xs text-ink-muted">Case: {formatNGN(product.casePrice)}</p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              inStock
                ? "bg-accent hover:bg-accent-dark text-ink-primary active:scale-95"
                : "bg-gray-100 text-ink-muted cursor-not-allowed"
            }`}
            aria-label="Add to cart"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
}
