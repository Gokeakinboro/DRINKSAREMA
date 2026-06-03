"use client";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { formatNGN, calcTotal } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function CartPage() {
  const { items, updateItem, removeItem } = useCartStore();
  const subtotal = items.reduce((s, i) => {
    const price = i.isCase && i.product.casePrice ? Number(i.product.casePrice) : Number(i.product.unitPrice);
    return s + price * i.quantity;
  }, 0);
  const { vat, delivery, total } = calcTotal(subtotal);

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingBag size={64} className="mx-auto text-ink-muted mb-4" />
      <h2 className="text-2xl font-bold text-ink-primary mb-2">Your cart is empty</h2>
      <p className="text-ink-secondary mb-6">Looks like you haven't added any drinks yet.</p>
      <Link href="/" className="btn-primary">Start Shopping</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-black text-ink-primary mb-8">Your Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = item.isCase && item.product.casePrice ? Number(item.product.casePrice) : Number(item.product.unitPrice);
            return (
              <div key={item.id} className="card p-4 flex gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-alt relative">
                  <Image src={item.product.images[0] || "/placeholder.jpg"} alt={item.product.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`} className="font-semibold text-ink-primary hover:text-brand-primary text-sm line-clamp-2">{item.product.name}</Link>
                  <p className="text-xs text-ink-secondary mt-0.5">{item.product.brand}{item.isCase && ` • Case`}</p>
                  <p className="font-bold text-brand-primary mt-1 tabular-nums">{formatNGN(price * item.quantity)}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => { removeItem(item.id); toast.success("Removed from cart"); }} className="text-ink-muted hover:text-error transition-colors">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"><Minus size={14} /></button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-24">
          <h2 className="font-bold text-ink-primary text-lg mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm mb-4">
            <div className="flex justify-between text-ink-secondary">
              <span>Subtotal</span><span className="tabular-nums">{formatNGN(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-secondary">
              <span>Delivery fee</span><span className="tabular-nums">{delivery === 0 ? <span className="text-success">Free</span> : formatNGN(delivery)}</span>
            </div>
            <div className="flex justify-between text-ink-secondary">
              <span>VAT (7.5%)</span><span className="tabular-nums">{formatNGN(vat)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-ink-primary text-base">
              <span>Total</span><span className="tabular-nums">{formatNGN(total)}</span>
            </div>
          </div>
          {delivery > 0 && (
            <p className="text-xs text-ink-secondary bg-surface-alt rounded-lg p-3 mb-4">
              Add <strong>{formatNGN(25000 - subtotal)}</strong> more for free delivery
            </p>
          )}
          <Link href="/checkout" className="btn-primary w-full text-center flex items-center justify-center gap-2">
            Proceed to Checkout <ArrowRight size={16} />
          </Link>
          <Link href="/" className="text-center text-sm text-accent font-medium mt-3 block hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
