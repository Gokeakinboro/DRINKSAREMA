"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, useAuthStore } from "@/lib/store";
import { formatNGN, calcTotal } from "@/lib/utils";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { MapPin, Clock, CreditCard } from "lucide-react";

type Step = "delivery" | "slot" | "payment";

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<Step>("delivery");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({ street: "", city: "Lagos", state: "Lagos", instructions: "" });
  const [deliveryType, setDeliveryType] = useState<"ASAP" | "SCHEDULED">("ASAP");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "", phone: "" });

  const subtotal = items.reduce((s, i) => {
    const price = i.isCase && i.product.casePrice ? Number(i.product.casePrice) : Number(i.product.unitPrice);
    return s + price * i.quantity;
  }, 0);
  const { vat, delivery, total } = calcTotal(subtotal, promoDiscount);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/users/me/addresses").then((r) => {
      setAddresses(r.data);
      const def = r.data.find((a: any) => a.isDefault);
      if (def) setSelectedAddressId(def.id);
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!items.length) router.push("/cart");
  }, [items.length]);

  if (!items.length) return null;

  const showCheckout = isAuthenticated || guestMode;

  async function validatePromo() {
    setPromoError("");
    try {
      const { data } = await api.post("/promotions/validate", { code: promoCode, orderValue: subtotal });
      setPromoDiscount(data.discount);
      toast.success(`Promo applied! Saving ${formatNGN(data.discount)}`);
    } catch (err: any) {
      setPromoError(err.response?.data?.error || "Invalid promo code");
      setPromoDiscount(0);
    }
  }

  async function placeOrder() {
    if (guestMode && (!guestInfo.name || !guestInfo.email)) {
      toast.error("Please enter your name and email");
      return;
    }
    setIsPlacing(true);
    try {
      let addressId = selectedAddressId;
      if (!addressId && newAddress.street && isAuthenticated) {
        const { data: addr } = await api.post("/users/me/addresses", { ...newAddress, isDefault: false });
        addressId = addr.id;
      }
      const { data: order } = await api.post("/orders", {
        addressId,
        deliveryType,
        promoCode: promoDiscount > 0 ? promoCode : undefined,
        redeemPoints: usePoints ? (user?.loyaltyPoints || 0) : 0,
        deliveryNotes: newAddress.instructions,
        ...(guestMode ? { guestName: guestInfo.name, guestEmail: guestInfo.email, guestPhone: guestInfo.phone } : {}),
      });
      const { data: payment } = await api.post("/payments/initiate", { orderId: order.id });
      window.location.href = payment.authorizationUrl;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to place order");
      setIsPlacing(false);
    }
  }

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: "delivery", label: "Delivery", icon: <MapPin size={18} /> },
    { id: "slot", label: "Slot", icon: <Clock size={18} /> },
    { id: "payment", label: "Payment", icon: <CreditCard size={18} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-black text-ink-primary mb-8">Checkout</h1>

      {/* Auth / Guest selection */}
      {!isAuthenticated && !guestMode && (
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-ink-primary text-lg mb-4">How would you like to checkout?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a href="/auth/login?next=/checkout" className="flex flex-col items-center gap-2 p-5 border-2 border-brand-primary rounded-xl hover:bg-brand-primary/5 transition-all text-center">
              <span className="text-2xl">👤</span>
              <p className="font-semibold text-ink-primary">Sign In</p>
              <p className="text-xs text-ink-secondary">Faster checkout, order history &amp; loyalty points</p>
            </a>
            <button
              onClick={() => setGuestMode(true)}
              className="flex flex-col items-center gap-2 p-5 border-2 border-gray-200 rounded-xl hover:border-brand-primary/50 transition-all text-center"
            >
              <span className="text-2xl">🛍️</span>
              <p className="font-semibold text-ink-primary">Continue as Guest</p>
              <p className="text-xs text-ink-secondary">No account needed — quick &amp; easy</p>
            </button>
          </div>
        </div>
      )}

      {/* Guest info */}
      {!isAuthenticated && guestMode && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-ink-primary text-lg">Your Details</h2>
            <button onClick={() => setGuestMode(false)} className="text-xs text-ink-secondary hover:text-ink-primary underline">← Change</button>
          </div>
          <div className="space-y-3">
            <input value={guestInfo.name} onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })} placeholder="Full name *" className="input" />
            <input type="email" value={guestInfo.email} onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })} placeholder="Email address *" className="input" />
            <input type="tel" value={guestInfo.phone} onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })} placeholder="Phone number" className="input" />
          </div>
        </div>
      )}

      {showCheckout && (
        <>
          {/* Step indicators */}
          <div className="flex items-center mb-8">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  onClick={() => setStep(s.id)}
                  className={`flex items-center gap-2 font-semibold text-sm transition-colors ${step === s.id ? "text-brand-primary" : "text-ink-muted"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${step === s.id ? "bg-brand-primary text-white" : "bg-gray-100 text-ink-muted"}`}>
                    {s.icon}
                  </div>
                  <span className="hidden sm:block">{s.label}</span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${i < steps.indexOf(steps.find((x) => x.id === step)!) ? "bg-brand-primary" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">

              {/* Step 1: Delivery */}
              {step === "delivery" && (
                <div className="card p-6">
                  <h2 className="font-bold text-ink-primary text-lg mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-brand-primary" /> Delivery Address
                  </h2>
                  {addresses.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {addresses.map((addr) => (
                        <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? "border-brand-primary bg-brand-primary/5" : "border-gray-200 hover:border-brand-primary/30"}`}>
                          <input type="radio" name="address" value={addr.id} checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-0.5 accent-brand-primary" />
                          <div>
                            <p className="font-semibold text-sm text-ink-primary">{addr.label || addr.city}</p>
                            <p className="text-sm text-ink-secondary">{addr.street}, {addr.city}, {addr.state}</p>
                          </div>
                        </label>
                      ))}
                      <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${!selectedAddressId ? "border-brand-primary bg-brand-primary/5" : "border-gray-200 hover:border-brand-primary/30"}`}>
                        <input type="radio" name="address" checked={!selectedAddressId} onChange={() => setSelectedAddressId(null)} className="mt-0.5 accent-brand-primary" />
                        <span className="text-sm font-medium text-ink-primary">+ Add new address</span>
                      </label>
                    </div>
                  )}
                  {(!selectedAddressId || addresses.length === 0) && (
                    <div className="space-y-3">
                      <input value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} placeholder="Street address" className="input" />
                      <div className="grid grid-cols-2 gap-3">
                        <input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="City" className="input" />
                        <input value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} placeholder="State" className="input" />
                      </div>
                      <input value={newAddress.instructions} onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })} placeholder="Delivery instructions (optional)" className="input" />
                    </div>
                  )}
                  <button onClick={() => setStep("slot")} className="btn-secondary w-full mt-4">Continue to Delivery Slot</button>
                </div>
              )}

              {/* Step 2: Slot */}
              {step === "slot" && (
                <div className="card p-6">
                  <h2 className="font-bold text-ink-primary text-lg mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-brand-primary" /> Delivery Slot
                  </h2>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryType === "ASAP" ? "border-brand-primary bg-brand-primary/5" : "border-gray-200"}`}>
                      <input type="radio" name="deliveryType" value="ASAP" checked={deliveryType === "ASAP"} onChange={() => setDeliveryType("ASAP")} className="hidden" />
                      <p className="font-bold text-ink-primary mb-1">ASAP</p>
                      <p className="text-xs text-ink-secondary">Delivery in under 60 minutes*</p>
                      <p className="text-xs text-ink-muted mt-1">*Lagos only</p>
                    </label>
                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryType === "SCHEDULED" ? "border-brand-primary bg-brand-primary/5" : "border-gray-200"}`}>
                      <input type="radio" name="deliveryType" value="SCHEDULED" checked={deliveryType === "SCHEDULED"} onChange={() => setDeliveryType("SCHEDULED")} className="hidden" />
                      <p className="font-bold text-ink-primary mb-1">Scheduled</p>
                      <p className="text-xs text-ink-secondary">Choose a date &amp; time slot</p>
                    </label>
                  </div>
                  <button onClick={() => setStep("payment")} className="btn-secondary w-full">Continue to Payment</button>
                  <button onClick={() => setStep("delivery")} className="w-full text-sm text-ink-secondary mt-3 hover:text-ink-primary">← Back</button>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === "payment" && (
                <div className="card p-6">
                  <h2 className="font-bold text-ink-primary text-lg mb-4 flex items-center gap-2">
                    <CreditCard size={20} className="text-brand-primary" /> Payment
                  </h2>
                  <div className="bg-surface-alt rounded-xl p-4 mb-4">
                    <p className="text-sm font-medium text-ink-primary mb-1">Secure Payment via Paystack</p>
                    <p className="text-xs text-ink-secondary">Card (Visa/Mastercard/Verve) · Bank Transfer · USSD</p>
                  </div>
                  {user && user.loyaltyPoints >= 100 && (
                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ink-primary">Use Loyalty Points</p>
                          <p className="text-xs text-ink-secondary mt-0.5">You have <strong>{user.loyaltyPoints} pts</strong> available</p>
                        </div>
                        <div onClick={() => setUsePoints((v) => !v)} className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${usePoints ? "bg-accent" : "bg-gray-200"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${usePoints ? "left-5" : "left-0.5"}`} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-ink-primary mb-2">Promo Code</p>
                    <div className="flex gap-2">
                      <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Enter promo code" className="input flex-1" />
                      <button onClick={validatePromo} className="btn-outline px-4 py-3 text-sm">Apply</button>
                    </div>
                    {promoError && <p className="text-error text-xs mt-1">{promoError}</p>}
                    {promoDiscount > 0 && <p className="text-success text-xs mt-1">✓ Saving {formatNGN(promoDiscount)}</p>}
                  </div>
                  <button onClick={placeOrder} disabled={isPlacing} className="btn-primary w-full flex items-center justify-center gap-2 text-base">
                    {isPlacing ? "Redirecting to Paystack…" : `Pay ${formatNGN(total)}`}
                  </button>
                  <button onClick={() => setStep("slot")} className="w-full text-sm text-ink-secondary mt-3 hover:text-ink-primary">← Back</button>
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className="card p-5 h-fit sticky top-24">
              <h3 className="font-bold text-ink-primary mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => {
                  const price = item.isCase && item.product.casePrice ? Number(item.product.casePrice) : Number(item.product.unitPrice);
                  return (
                    <div key={item.product.id + String(item.isCase)} className="flex justify-between gap-2">
                      <span className="text-ink-secondary line-clamp-1 flex-1">{item.product.name} ×{item.quantity}</span>
                      <span className="text-ink-primary font-medium tabular-nums">{formatNGN(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-ink-secondary">Subtotal</span><span className="tabular-nums">{formatNGN(subtotal)}</span></div>
                {promoDiscount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-{formatNGN(promoDiscount)}</span></div>}
                <div className="flex justify-between"><span className="text-ink-secondary">VAT (7.5%)</span><span className="tabular-nums">{formatNGN(vat)}</span></div>
                <div className="flex justify-between"><span className="text-ink-secondary">Delivery</span><span className="tabular-nums">{delivery === 0 ? "Free" : formatNGN(delivery)}</span></div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                  <span>Total</span><span className="tabular-nums text-brand-primary">{formatNGN(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
