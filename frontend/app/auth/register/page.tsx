"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setUser(data.user);
      toast.success("Account created! Welcome to DrinksArena 🎉");
      router.push("/");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed");
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
          <h1 className="text-2xl font-bold text-ink-primary">Create your account</h1>
          <p className="text-ink-secondary text-sm mt-1">You must be 18+ to create an account.</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-1.5">First Name</label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-1.5">Last Name</label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" className="input" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-primary mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-primary mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+2348012345678" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-primary mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" className="input pr-10" required minLength={8} />
                <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <p className="text-xs text-ink-secondary">By creating an account you agree to our <Link href="/terms" className="text-accent hover:underline">Terms</Link> and <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.</p>
            <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3.5">
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
          <p className="text-center text-sm text-ink-secondary mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-accent font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
