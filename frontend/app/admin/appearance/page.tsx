"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Loader2, Palette, Type, Layout, Eye } from "lucide-react";

const FONTS = [
  { value: "inter", label: "Inter" },
  { value: "plus-jakarta", label: "Plus Jakarta Sans" },
  { value: "poppins", label: "Poppins" },
  { value: "nunito", label: "Nunito" },
  { value: "lato", label: "Lato" },
];

const SECTION_TOGGLES = [
  { key: "showCategoriesSection", label: "Categories Strip", desc: "Horizontal category scroll bar below the nav" },
  { key: "showFeaturedSection", label: "Featured Products", desc: "Featured picks carousel section on homepage" },
  { key: "showPromoBanner", label: "Promo Banner", desc: "First order / promotional banner strip" },
];

export default function AdminAppearancePage() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: theme, isLoading } = useQuery({
    queryKey: ["admin-site-theme"],
    queryFn: () => api.get("/admin/settings/theme").then((r) => r.data),
  });

  const [form, setForm] = useState<any>(null);
  if (theme && !form) setForm({ ...theme });

  function set(key: string, val: unknown) {
    setForm((prev: any) => ({ ...prev, [key]: val }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.put("/admin/settings/theme", {
        brandColour: form.brandColour,
        accentColour: form.accentColour,
        fontFamily: form.fontFamily,
        heroTitle: form.heroTitle,
        heroSubtitle: form.heroSubtitle,
        showFeaturedSection: form.showFeaturedSection,
        showCategoriesSection: form.showCategoriesSection,
        showPromoBanner: form.showPromoBanner,
      });
      toast.success("Appearance saved");
      qc.invalidateQueries({ queryKey: ["admin-site-theme"] });
      qc.invalidateQueries({ queryKey: ["site-theme"] });
    } catch {
      toast.error("Failed to save appearance");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !form) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Palette size={24} className="text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Appearance</h1>
          <p className="text-sm text-ink-secondary">Customise brand colours, typography, hero text, and section visibility.</p>
        </div>
      </div>

      {/* Brand Colours */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Palette size={18} className="text-brand-primary" />
          <h2 className="font-bold text-ink-primary">Brand Colours</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-2">Brand Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.brandColour}
                onChange={(e) => set("brandColour", e.target.value)}
                className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1 bg-white"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={form.brandColour}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) set("brandColour", e.target.value);
                  }}
                  className="input py-2 font-mono uppercase text-sm"
                  maxLength={7}
                  placeholder="#1A4731"
                />
                <p className="text-xs text-ink-muted mt-1">Buttons, links, sidebar, badges</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-2">Accent Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.accentColour}
                onChange={(e) => set("accentColour", e.target.value)}
                className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1 bg-white"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={form.accentColour}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) set("accentColour", e.target.value);
                  }}
                  className="input py-2 font-mono uppercase text-sm"
                  maxLength={7}
                  placeholder="#C9A227"
                />
                <p className="text-xs text-ink-muted mt-1">CTAs, highlights, active nav</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live colour preview */}
        <div className="mt-5 p-4 bg-surface-alt rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-ink-secondary mb-3">Preview</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: form.brandColour }}
            >
              Brand button
            </button>
            <button
              className="px-4 py-2 rounded-lg text-ink-primary text-sm font-semibold"
              style={{ backgroundColor: form.accentColour }}
            >
              Accent CTA
            </button>
            <span
              className="px-3 py-1 rounded-full text-white text-xs font-semibold"
              style={{ backgroundColor: form.brandColour }}
            >
              Badge
            </span>
            <div
              className="w-9 h-9 rounded-full border-4"
              style={{ backgroundColor: form.accentColour, borderColor: form.brandColour }}
            />
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Type size={18} className="text-brand-primary" />
          <h2 className="font-bold text-ink-primary">Typography</h2>
        </div>
        <label className="block text-xs font-semibold text-ink-secondary mb-3">Body Font</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FONTS.map((f) => (
            <button
              key={f.value}
              onClick={() => set("fontFamily", f.value)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                form.fontFamily === f.value
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-semibold text-ink-primary" style={{ fontFamily: f.label }}>
                {f.label}
              </p>
              <p className="text-xs text-ink-muted mt-0.5" style={{ fontFamily: f.label }}>
                Aa Bb Cc 123
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Hero Text */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Layout size={18} className="text-brand-primary" />
          <h2 className="font-bold text-ink-primary">Hero Text</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">
              Hero Title <span className="text-ink-muted font-normal">({form.heroTitle?.length ?? 0}/100)</span>
            </label>
            <input
              type="text"
              value={form.heroTitle}
              onChange={(e) => set("heroTitle", e.target.value)}
              className="input"
              maxLength={100}
              placeholder="Nigeria's Premier Online Drinks Store"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">
              Hero Subtitle <span className="text-ink-muted font-normal">({form.heroSubtitle?.length ?? 0}/160)</span>
            </label>
            <input
              type="text"
              value={form.heroSubtitle}
              onChange={(e) => set("heroSubtitle", e.target.value)}
              className="input"
              maxLength={160}
              placeholder="Fast delivery of beers, wines & spirits across Lagos"
            />
          </div>
        </div>

        {/* Hero live preview */}
        <div
          className="mt-5 p-6 rounded-xl text-white"
          style={{ background: `linear-gradient(135deg, ${form.brandColour} 0%, ${form.accentColour} 100%)` }}
        >
          <h3 className="text-lg font-black leading-snug">{form.heroTitle || "Hero Title"}</h3>
          <p className="text-sm mt-1 opacity-80">{form.heroSubtitle || "Hero subtitle text"}</p>
        </div>
      </div>

      {/* Section Toggles */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Eye size={18} className="text-brand-primary" />
          <h2 className="font-bold text-ink-primary">Homepage Sections</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {SECTION_TOGGLES.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-ink-primary">{label}</p>
                <p className="text-xs text-ink-muted mt-0.5">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => set(key, !form[key])}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-6 ${
                  form[key] ? "bg-brand-primary" : "bg-gray-200"
                }`}
                aria-checked={form[key]}
                role="switch"
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    form[key] ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pb-6">
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save Appearance
        </button>
      </div>
    </div>
  );
}
