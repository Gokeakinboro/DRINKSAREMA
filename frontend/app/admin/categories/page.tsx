"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, Edit2, X, Loader2, FolderOpen } from "lucide-react";

const EMPTY = {
  name: "", slug: "", description: "", imageUrl: "", parentId: "", sortOrder: "0", isActive: true,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });

  function openCreate() {
    setForm({ ...EMPTY });
    setEditId(null);
    setModal("create");
  }

  function openEdit(c: any) {
    setForm({
      name: c.name ?? "",
      slug: c.slug ?? "",
      description: c.description ?? "",
      imageUrl: c.imageUrl ?? "",
      parentId: c.parentId ?? "",
      sortOrder: c.sortOrder != null ? String(c.sortOrder) : "0",
      isActive: c.isActive ?? true,
    });
    setEditId(c.id);
    setModal("edit");
  }

  function set(field: string, value: any) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "name" && modal === "create") next.slug = slugify(value);
      return next;
    });
  }

  async function save() {
    if (!form.name || !form.slug) { toast.error("Name and slug are required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder),
        isActive: form.isActive,
      };
      if (modal === "create") {
        await api.post("/categories", payload);
        toast.success("Category created");
      } else {
        await api.put(`/categories/${editId}`, payload);
        toast.success("Category updated");
      }
      setModal(null);
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const topLevel = categories?.filter((c: any) => !c.parentId) ?? [];
  const subCategories = categories?.filter((c: any) => c.parentId) ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink-primary">Categories</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {topLevel.map((cat: any) => {
            const children = subCategories.filter((s: any) => s.parentId === cat.id);
            return (
              <div key={cat.id} className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <FolderOpen size={18} className="text-brand-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-primary">{cat.name}</span>
                        {!cat.isActive && <span className="badge bg-gray-100 text-ink-muted">Hidden</span>}
                        {children.length > 0 && <span className="badge bg-brand-primary/10 text-brand-primary">{children.length} sub</span>}
                      </div>
                      <span className="text-xs text-ink-muted font-mono">/{cat.slug}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-muted">Sort: {cat.sortOrder}</span>
                    <button onClick={() => openEdit(cat)} className="text-brand-primary hover:text-accent text-xs flex items-center gap-1 font-medium">
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>
                </div>
                {children.length > 0 && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {children.map((child: any) => (
                      <div key={child.id} className="flex items-center justify-between px-5 py-3 pl-14 bg-surface-alt/50">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-ink-secondary">{child.name}</span>
                          {!child.isActive && <span className="badge bg-gray-100 text-ink-muted text-[10px]">Hidden</span>}
                          <span className="text-xs text-ink-muted font-mono">/{child.slug}</span>
                        </div>
                        <button onClick={() => openEdit(child)} className="text-brand-primary hover:text-accent text-xs flex items-center gap-1 font-medium">
                          <Edit2 size={12} /> Edit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-ink-primary">{modal === "create" ? "Add Category" : "Edit Category"}</h2>
              <button onClick={() => setModal(null)} className="text-ink-muted hover:text-ink-primary"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Name <span className="text-error">*</span></label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder="e.g. Whiskey" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Slug <span className="text-error">*</span></label>
                <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="input font-mono text-sm" placeholder="whiskey" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Parent Category</label>
                <select value={form.parentId} onChange={(e) => set("parentId", e.target.value)} className="input">
                  <option value="">None (top-level)</option>
                  {topLevel.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className="input" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="accent-brand-primary w-4 h-4" />
                    <span className="text-sm font-medium text-ink-primary">Active</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="input resize-none" rows={2} placeholder="Optional description…" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Image URL</label>
                <input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} className="input" placeholder="https://…" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="btn-outline py-2 px-5 text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {modal === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
