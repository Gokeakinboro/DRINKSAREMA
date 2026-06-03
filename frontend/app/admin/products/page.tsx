"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatNGN } from "@/lib/utils";
import toast from "react-hot-toast";
import Image from "next/image";
import { Plus, Edit2, Eye, X, Loader2, UploadCloud, Trash2 } from "lucide-react";

const EMPTY_FORM = {
  name: "", slug: "", brand: "", categoryId: "", sku: "",
  description: "", tastingNotes: "", abv: "", volumeMl: "",
  unitPrice: "", casePrice: "", caseQty: "",
  stockQuantity: "0", countryOfOrigin: "", nafdacNumber: "",
  images: "", tags: "", isActive: true, isFeatured: false,
};

type FormData = typeof EMPTY_FORM & { isActive: boolean; isFeatured: boolean };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stockEdit, setStockEdit] = useState<{ id: string; qty: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) p.set("search", search);
      return api.get(`/admin/products?${p}`).then((r) => r.data);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setModal("create");
  }

  function openEdit(p: any) {
    setForm({
      name: p.name ?? "",
      slug: p.slug ?? "",
      brand: p.brand ?? "",
      categoryId: p.categoryId ?? "",
      sku: p.sku ?? "",
      description: p.description ?? "",
      tastingNotes: p.tastingNotes ?? "",
      abv: p.abv != null ? String(p.abv) : "",
      volumeMl: p.volumeMl != null ? String(p.volumeMl) : "",
      unitPrice: p.unitPrice != null ? String(p.unitPrice) : "",
      casePrice: p.casePrice != null ? String(p.casePrice) : "",
      caseQty: p.caseQty != null ? String(p.caseQty) : "",
      stockQuantity: p.stockQuantity != null ? String(p.stockQuantity) : "0",
      countryOfOrigin: p.countryOfOrigin ?? "",
      nafdacNumber: p.nafdacNumber ?? "",
      images: Array.isArray(p.images) ? p.images.join("\n") : "",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
      isActive: p.isActive ?? true,
      isFeatured: p.isFeatured ?? false,
    });
    setEditId(p.id);
    setModal("edit");
  }

  function set(field: string, value: any) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "name" && modal === "create") next.slug = slugify(value);
      return next;
    });
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const existing = form.images ? form.images.split("\n").map((s) => s.trim()).filter(Boolean) : [];
      set("images", [...existing, data.url].join("\n"));
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed — check Cloudinary credentials");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    const updated = form.images.split("\n").map((s) => s.trim()).filter((s) => s && s !== url);
    set("images", updated.join("\n"));
  }

  async function save() {
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        slug: form.slug,
        brand: form.brand,
        categoryId: form.categoryId,
        sku: form.sku,
        description: form.description || null,
        tastingNotes: form.tastingNotes || null,
        abv: form.abv ? Number(form.abv) : null,
        volumeMl: form.volumeMl ? Number(form.volumeMl) : null,
        unitPrice: Number(form.unitPrice),
        casePrice: form.casePrice ? Number(form.casePrice) : null,
        caseQty: form.caseQty ? Number(form.caseQty) : null,
        stockQuantity: Number(form.stockQuantity),
        countryOfOrigin: form.countryOfOrigin || null,
        nafdacNumber: form.nafdacNumber || null,
        images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      };

      if (modal === "create") {
        await api.post("/products", payload);
        toast.success("Product created");
      } else {
        await api.put(`/products/${editId}`, payload);
        toast.success("Product updated");
      }
      setModal(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: any) {
    await api.put(`/products/${product.id}`, { isActive: !product.isActive });
    toast.success(product.isActive ? "Product hidden" : "Product visible");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function updateStock() {
    if (!stockEdit) return;
    await api.put(`/admin/products/${stockEdit.id}/stock`, { quantity: stockEdit.qty });
    toast.success("Stock updated");
    setStockEdit(null);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-semibold text-ink-secondary mb-1">{label}{required && <span className="text-error ml-0.5">*</span>}</label>
      {children}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink-primary">Products</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or SKU…" className="input w-64" />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt border-b border-gray-100">
            <tr>{["Image", "Product", "SKU", "Unit Price", "Case Price", "Stock", "Status", "Actions"].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ink-secondary">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : data?.products?.map((p: any) => (
              <tr key={p.id} className={`border-b border-gray-50 hover:bg-surface-alt/50 ${!p.isActive ? "opacity-50" : ""}`}>
                <td className="px-4 py-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-alt relative">
                    {p.images?.[0] && <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="48px" />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-primary line-clamp-1">{p.name}</p>
                  <p className="text-xs text-ink-secondary">{p.brand}</p>
                </td>
                <td className="px-4 py-3 text-ink-secondary font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3 font-semibold tabular-nums">{formatNGN(p.unitPrice)}</td>
                <td className="px-4 py-3 text-ink-secondary tabular-nums text-xs">
                  {p.casePrice ? `${formatNGN(p.casePrice)} / ${p.caseQty}` : "—"}
                </td>
                <td className="px-4 py-3">
                  {stockEdit?.id === p.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" value={stockEdit.qty} onChange={(e) => setStockEdit({ id: p.id, qty: Number(e.target.value) })} className="input w-16 py-1 text-xs" />
                      <button onClick={updateStock} className="text-success text-xs font-semibold">Save</button>
                      <button onClick={() => setStockEdit(null)} className="text-error text-xs">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setStockEdit({ id: p.id, qty: p.stockQuantity })} className={`text-sm font-semibold hover:underline ${p.stockQuantity === 0 ? "text-error" : p.stockQuantity <= 10 ? "text-warning" : "text-success"}`}>
                      {p.stockQuantity}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(p)} className={`badge cursor-pointer ${p.isActive ? "bg-success/10 text-success" : "bg-gray-100 text-ink-secondary"}`}>
                    {p.isActive ? "Active" : "Hidden"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="text-brand-primary hover:text-accent text-xs flex items-center gap-1"><Edit2 size={12} /> Edit</button>
                    <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer" className="text-ink-muted hover:text-accent text-xs flex items-center gap-1"><Eye size={12} /></a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium ${p === page ? "bg-brand-primary text-white" : "bg-white border border-gray-200 text-ink-primary"}`}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-ink-primary">{modal === "create" ? "Add Product" : "Edit Product"}</h2>
              <button onClick={() => setModal(null)} className="text-ink-muted hover:text-ink-primary"><X size={20} /></button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {/* Basic Info */}
              <Field label="Product Name" required>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder="e.g. Hennessy VS 70cl" />
              </Field>
              <Field label="Brand" required>
                <input value={form.brand} onChange={(e) => set("brand", e.target.value)} className="input" placeholder="e.g. Hennessy" />
              </Field>
              <Field label="Slug" required>
                <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="input font-mono text-sm" placeholder="hennessy-vs-70cl" />
              </Field>
              <Field label="SKU" required>
                <input value={form.sku} onChange={(e) => set("sku", e.target.value)} className="input font-mono text-sm" placeholder="HEN-VS-70" />
              </Field>
              <Field label="Category" required>
                <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="input">
                  <option value="">Select category…</option>
                  {categories?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Country of Origin">
                <input value={form.countryOfOrigin} onChange={(e) => set("countryOfOrigin", e.target.value)} className="input" placeholder="e.g. France" />
              </Field>

              {/* Pricing */}
              <Field label="Unit Price (₦)" required>
                <input type="number" value={form.unitPrice} onChange={(e) => set("unitPrice", e.target.value)} className="input" placeholder="25000" />
              </Field>
              <Field label="Volume (ml)">
                <input type="number" value={form.volumeMl} onChange={(e) => set("volumeMl", e.target.value)} className="input" placeholder="700" />
              </Field>
              <Field label="Case Price (₦)">
                <input type="number" value={form.casePrice} onChange={(e) => set("casePrice", e.target.value)} className="input" placeholder="Leave blank if N/A" />
              </Field>
              <Field label="Units per Case">
                <input type="number" value={form.caseQty} onChange={(e) => set("caseQty", e.target.value)} className="input" placeholder="12" />
              </Field>
              <Field label="Stock Quantity" required>
                <input type="number" value={form.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)} className="input" />
              </Field>
              <Field label="ABV (%)">
                <input type="number" step="0.1" value={form.abv} onChange={(e) => set("abv", e.target.value)} className="input" placeholder="40" />
              </Field>
              <Field label="NAFDAC Number">
                <input value={form.nafdacNumber} onChange={(e) => set("nafdacNumber", e.target.value)} className="input" placeholder="A7-1234" />
              </Field>
              <Field label="Tags (comma separated)">
                <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className="input" placeholder="bestseller, new arrival" />
              </Field>

              {/* Description spans full width */}
              <div className="col-span-2">
                <Field label="Description">
                  <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="input min-h-[80px] resize-y" placeholder="Product description…" />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Tasting Notes">
                  <textarea value={form.tastingNotes} onChange={(e) => set("tastingNotes", e.target.value)} className="input min-h-[60px] resize-y" placeholder="Tasting notes…" />
                </Field>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-ink-secondary mb-2">Product Images</label>
                {/* Uploaded image previews */}
                {form.images && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.images.split("\n").map((s) => s.trim()).filter(Boolean).map((url) => (
                      <div key={url} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-surface-alt">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(url)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Trash2 size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Upload button */}
                <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition-colors ${uploading ? "border-brand-primary/40 bg-brand-primary/5" : "border-gray-200 hover:border-brand-primary/40 hover:bg-brand-primary/5"}`}>
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploading}
                    onChange={(e) => { Array.from(e.target.files || []).forEach(uploadImage); e.target.value = ""; }} />
                  {uploading ? <Loader2 size={20} className="text-brand-primary animate-spin" /> : <UploadCloud size={20} className="text-ink-muted" />}
                  <div>
                    <p className="text-sm font-medium text-ink-primary">{uploading ? "Uploading…" : "Click to upload images"}</p>
                    <p className="text-xs text-ink-muted">JPG, PNG, WebP — max 5MB each. Multiple allowed.</p>
                  </div>
                </label>
              </div>

              {/* Toggles */}
              <div className="col-span-2 flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="accent-brand-primary w-4 h-4" />
                  <span className="text-sm font-medium text-ink-primary">Active (visible in shop)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="accent-brand-primary w-4 h-4" />
                  <span className="text-sm font-medium text-ink-primary">Featured on homepage</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setModal(null)} className="btn-outline py-2 px-5 text-sm">Cancel</button>
              <button onClick={save} disabled={saving || !form.name || !form.unitPrice || !form.categoryId || !form.sku} className="btn-primary py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {modal === "create" ? "Create Product" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
