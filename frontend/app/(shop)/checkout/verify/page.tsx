"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatNGN } from "@/lib/utils";

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get("ref") || params.get("reference") || params.get("trxref");
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [order, setOrder] = useState<any>(null);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (!ref) { setStatus("failed"); return; }
    api.post("/payments/verify", { reference: ref })
      .then(({ data }) => { setOrder(data.order); setPoints(data.pointsEarned); setStatus("success"); })
      .catch(() => setStatus("failed"));
  }, [ref]);

  if (status === "loading") return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 size={48} className="text-brand-primary animate-spin" />
      <p className="text-ink-secondary">Verifying your payment…</p>
    </div>
  );

  if (status === "failed") return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
      <XCircle size={64} className="text-error" />
      <h1 className="text-2xl font-bold text-ink-primary">Payment Verification Failed</h1>
      <p className="text-ink-secondary">We couldn't verify your payment. Please check your orders or contact support.</p>
      <div className="flex gap-3">
        <Link href="/orders" className="btn-secondary">My Orders</Link>
        <Link href="/" className="btn-outline">Go Home</Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center max-w-lg mx-auto">
      <CheckCircle size={72} className="text-success" />
      <div>
        <h1 className="text-3xl font-black text-ink-primary mb-2">Order Confirmed!</h1>
        <p className="text-ink-secondary">Your payment was successful. Your drinks are on their way!</p>
      </div>
      {order && (
        <div className="card p-6 w-full text-left">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-ink-primary">Order #{order.orderNumber}</span>
            <span className="badge bg-success/10 text-success">Confirmed</span>
          </div>
          <div className="space-y-2 text-sm text-ink-secondary mb-4">
            {order.items?.slice(0, 3).map((item: any) => (
              <div key={item.id} className="flex justify-between">
                <span className="line-clamp-1 flex-1 mr-2">{item.product?.name} ×{item.quantity}</span>
                <span className="tabular-nums">{formatNGN(item.subtotal)}</span>
              </div>
            ))}
            {order.items?.length > 3 && <p className="text-ink-muted text-xs">+{order.items.length - 3} more items</p>}
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-ink-primary">
            <span>Total Paid</span><span className="tabular-nums">{formatNGN(order.total)}</span>
          </div>
          {points > 0 && (
            <div className="mt-3 bg-accent/5 border border-accent/20 rounded-xl p-3 text-sm text-accent font-medium">
              ⭐ You earned {points} loyalty points on this order!
            </div>
          )}
        </div>
      )}
      <div className="flex gap-3">
        <Link href={order ? `/orders/${order.id}` : "/orders"} className="btn-secondary">Track Order</Link>
        <Link href="/" className="btn-outline">Continue Shopping</Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 size={48} className="text-brand-primary animate-spin" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
