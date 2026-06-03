"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatNGN } from "@/lib/utils";
import { Package, MapPin, Clock } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment", PAYMENT_CONFIRMED: "Confirmed", PROCESSING: "Processing",
  DISPATCHED: "Out for Delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled", REFUNDED: "Refunded",
};

const STATUS_STEPS = ["PENDING_PAYMENT", "PAYMENT_CONFIRMED", "PROCESSING", "DISPATCHED", "DELIVERED"];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse"><div className="h-48 bg-gray-100 rounded-2xl" /></div>;
  if (!order) return <div className="text-center py-20"><p>Order not found</p><Link href="/orders" className="text-accent">Back to orders</Link></div>;

  const stepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/orders" className="text-ink-secondary hover:text-brand-primary text-sm">← Orders</Link>
        <span className="text-ink-muted">/</span>
        <span className="text-sm text-ink-primary font-medium">#{order.orderNumber}</span>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink-primary">Order #{order.orderNumber}</h1>
            <p className="text-sm text-ink-secondary mt-1">{new Date(order.createdAt).toLocaleString("en-NG")}</p>
          </div>
          <span className="badge bg-brand-primary text-white px-3 py-1 text-sm">{STATUS_LABELS[order.status] || order.status}</span>
        </div>

        {/* Progress */}
        {!["CANCELLED", "REFUNDED"].includes(order.status) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {STATUS_STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${i <= stepIdx ? "bg-success text-white" : "bg-gray-100 text-ink-muted"}`}>
                    {i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-1 mx-1 ${i < stepIdx ? "bg-success" : "bg-gray-100"}`} />}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-ink-secondary mt-1">
              {STATUS_STEPS.map((s) => <span key={s} className="text-center">{STATUS_LABELS[s]?.split(" ")[0]}</span>)}
            </div>
          </div>
        )}

        {/* Delivery address */}
        {order.address && (
          <div className="flex items-start gap-3 text-sm bg-surface-alt rounded-xl p-4 mb-4">
            <MapPin size={16} className="text-brand-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-ink-primary">Delivery address</p>
              <p className="text-ink-secondary">{order.address.street}, {order.address.city}, {order.address.state}</p>
              {order.deliveryNotes && <p className="text-ink-muted text-xs mt-1">Note: {order.deliveryNotes}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-ink-primary mb-4">Items Ordered</h2>
        <div className="space-y-4">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-alt relative">
                <Image src={item.product?.images?.[0] || "/placeholder.jpg"} alt={item.product?.name} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-ink-primary">{item.product?.name}</p>
                <p className="text-xs text-ink-secondary">{item.isCase ? "Case" : "Single"} · Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-ink-primary tabular-nums">{formatNGN(item.subtotal)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-ink-secondary"><span>Subtotal</span><span>{formatNGN(order.subtotal)}</span></div>
          {Number(order.discount) > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-{formatNGN(order.discount)}</span></div>}
          <div className="flex justify-between text-ink-secondary"><span>Delivery</span><span>{Number(order.deliveryFee) === 0 ? "Free" : formatNGN(order.deliveryFee)}</span></div>
          <div className="flex justify-between text-ink-secondary"><span>VAT</span><span>{formatNGN(order.vat)}</span></div>
          <div className="flex justify-between font-bold text-ink-primary text-base border-t border-gray-100 pt-2"><span>Total</span><span>{formatNGN(order.total)}</span></div>
        </div>
      </div>

      {/* Timeline */}
      {order.tracking?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-ink-primary mb-4 flex items-center gap-2"><Clock size={18} /> Order Timeline</h2>
          <div className="space-y-4">
            {[...order.tracking].reverse().map((t: any, i: number) => (
              <div key={t.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i === 0 ? "bg-brand-primary" : "bg-gray-200"}`} />
                  {i < order.tracking.length - 1 && <div className="w-0.5 h-full bg-gray-100 flex-1 mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="font-medium text-sm text-ink-primary">{STATUS_LABELS[t.status] || t.status}</p>
                  {t.note && <p className="text-xs text-ink-secondary">{t.note}</p>}
                  <p className="text-xs text-ink-muted mt-0.5">{new Date(t.createdAt).toLocaleString("en-NG")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
