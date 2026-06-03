"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore, useCartStore } from "@/lib/store";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { setUser } = useAuthStore();
  const { fetchCart } = useCartStore();
  const [form, setForm] = useState({ emailOrPhone: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isPhone = /^\+?[\d\s-]{7,}$/.test(form.emailOrPhone);
      const payload = isPhone ? { phone: form.emailOrPhone, password: form.password } : { email: form.emailOrPhone, password: form.password };
      const { data } = await api.post("/auth/login", payload);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setUser(data.user);
      await fetchCart();
      toast.success(`Welcome back, ${data.user.firstName || "there"}!`);
      router.push(next);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center">
              <span className="text-white font-black text-sm">DA</span>
            </div>
            <span className="font-black text-2xl text-brand-primary">Drinks<span className="text-accent">Arena</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-ink-primary">Sign in to your account</h1>
          <p className="text-ink-secondary text-sm mt-1">Welcome back! Enter your details below.</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-primary mb-1.5">Email or Phone</label>
              <input
                type="text"
                value={form.emailOrPhone}
                onChange={(e) => setForm({ ...form, emailOrPhone: e.target.value })}
                placeholder="you@example.com or +234..."
                className="input"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-primary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Your password"
                  className="input pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3.5">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
          <p className="text-center text-sm text-ink-secondary mt-6">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-accent font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-alt flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
