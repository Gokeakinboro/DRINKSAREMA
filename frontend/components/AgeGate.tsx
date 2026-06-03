"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import Image from "next/image";

export function AgeGate() {
  const { ageVerified, setAgeVerified } = useAuthStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const cookie = document.cookie.split(";").find((c) => c.trim().startsWith("age_verified="));
    if (!cookie && !ageVerified) setShow(true);
  }, [ageVerified]);

  function confirm() {
    const expires = new Date(Date.now() + 30 * 86400_000).toUTCString();
    document.cookie = `age_verified=1; expires=${expires}; path=/`;
    setAgeVerified(true);
    setShow(false);
  }

  function deny() {
    window.location.href = "https://www.google.com";
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] age-gate-overlay flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 md:p-12 max-w-md w-full text-center shadow-2xl">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <div className="w-20 h-20 rounded-full bg-brand-primary flex items-center justify-center">
              <span className="text-3xl font-black text-white">18+</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-brand-primary mb-1">DrinksArena</h1>
          <p className="text-ink-secondary text-sm">Nigeria's Premier Online Drinks Store</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-ink-primary mb-2">Age Verification Required</h2>
          <p className="text-ink-secondary text-sm leading-relaxed">
            This website contains alcohol products. You must be 18 years of age or older to enter.
          </p>
        </div>

        <div className="space-y-3">
          <button onClick={confirm} className="btn-primary w-full text-base">
            Yes, I am 18 or older
          </button>
          <button onClick={deny} className="btn-outline w-full text-base">
            No, take me out
          </button>
        </div>

        <p className="text-xs text-ink-muted mt-6 leading-relaxed">
          By entering this site you agree to our Terms & Conditions and confirm you are of legal drinking age.
          Please drink responsibly.
        </p>
      </div>
    </div>
  );
}
