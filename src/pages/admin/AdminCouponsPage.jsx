// src/pages/admin/AdminCouponsPage.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:3000";

// This shape is aligned with your actual "coupons" table + controller
const emptyCoupon = {
  id: null,
  code: "",
  description: "",
  type: "percent",          // "percent" | "fixed"
  value: 10,                // 10% or ₹10
  min_cart_amount: 0,
  is_active: true,

  // limits
  max_uses: null,           // maps to DB max_uses
  per_user_limit: null,     // maps to DB per_user_limit

  // schedule
  valid_from: "",           // datetime-local input string
  valid_to: "",             // datetime-local input string

  // auto + free gift
  is_auto: false,           // DB is_auto
  auto_threshold: 0,        // DB auto_threshold
  free_gift_product_id: "", // DB free_gift_product_id
  free_gift_qty: 1,         // DB free_gift_qty

  // read-only counter
  used_count: 0,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeTab, setActiveTab] = useState("list"); // "list" | "form"
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyCoupon);

  // ------- Load coupons + products on mount --------
  useEffect(() => {
    loadCoupons();
    loadProducts();
  }, []);

  async function loadCoupons() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/coupons`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load coupons");
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("loadCoupons error:", e);
      setError(e.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch(`${API_BASE}/api/products?limit=500`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("loadProducts error:", e);
    }
  }

  // ------- Helpers --------

  function startCreate() {
    setEditingId(null);
    setDraft({
      ...emptyCoupon,
      code: "",
      is_active: true,
    });
    setActiveTab("form");
    setError("");
    setSuccess("");
  }

  function startEdit(coupon) {
    setEditingId(coupon.id);
    setDraft({
      ...emptyCoupon,
      ...coupon,
      // convert ISO -> datetime-local (YYYY-MM-DDTHH:mm)
      valid_from: coupon.valid_from ? coupon.valid_from.slice(0, 16) : "",
      valid_to: coupon.valid_to ? coupon.valid_to.slice(0, 16) : "",
    });
    setActiveTab("form");
    setError("");
    setSuccess("");
  }

  function handleDraftChange(field, value) {
    setDraft((d) => ({
      ...d,
      [field]: value,
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        // Controller expects name; we can use description or code as fallback
        name: draft.description || draft.code,
        code: draft.code,
        description: draft.description || "",
        type: draft.type,
        value: Number(draft.value) || 0,
        min_cart_amount: Number(draft.min_cart_amount) || 0,
        is_active: !!draft.is_active,

        // limits
        max_uses: draft.max_uses ? Number(draft.max_uses) : null,
        per_user_limit: draft.per_user_limit
          ? Number(draft.per_user_limit)
          : null,

        // auto + free gift
        is_auto: !!draft.is_auto,
        auto_threshold: Number(draft.auto_threshold) || 0,
        free_gift_product_id: draft.free_gift_product_id || null,
        free_gift_qty: draft.free_gift_product_id
          ? Number(draft.free_gift_qty) || 1
          : null,
      };

      // convert datetime-local -> ISO if present
      if (draft.valid_from)
        payload.valid_from = new Date(draft.valid_from).toISOString();
      if (draft.valid_to)
        payload.valid_to = new Date(draft.valid_to).toISOString();

      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `${API_BASE}/api/admin/coupons/${editingId}`
        : `${API_BASE}/api/admin/coupons`;

      const res = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("save coupon failed:", txt);
        throw new Error("Failed to save coupon");
      }

      const saved = await res.json();
      setSuccess("Coupon saved");
      setDraft((d) => ({ ...d, id: saved.id }));
      setEditingId(saved.id);

      // Refresh list
      await loadCoupons();
    } catch (e) {
      setError(e.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(couponId) {
    if (!couponId) return;
    if (!window.confirm("Delete this coupon? This cannot be undone.")) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/coupons/${couponId}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete coupon");

      setSuccess("Coupon deleted");
      setDraft(emptyCoupon);
      setEditingId(null);
      setActiveTab("list");
      await loadCoupons();
    } catch (e) {
      setError(e.message || "Failed to delete coupon");
    } finally {
      setSaving(false);
    }
  }

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    [products]
  );

  // ------- Render --------

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900">
            Coupon & Offers Manager
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Create discount codes, configure auto-applied offers and free gift rules.
          </p>
        </div>

        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold shadow-sm hover:bg-orange-700 transition-colors"
        >
          + New Coupon
        </button>
      </header>

      {/* Status */}
      {(error || success) && (
        <div className="mb-4 space-y-2">
          {error && (
            <div className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-100">
              {success}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-stone-200">
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
            activeTab === "list"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
          onClick={() => setActiveTab("list")}
        >
          All Coupons
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
            activeTab === "form"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
          onClick={() => setActiveTab("form")}
        >
          {editingId ? "Edit Coupon" : "Create Coupon"}
        </button>
      </div>

      {activeTab === "list" ? (
        <CouponList
          coupons={coupons}
          loading={loading}
          onRefresh={loadCoupons}
          onEdit={startEdit}
          onDelete={handleDelete}
        />
      ) : (
        <CouponForm
          draft={draft}
          saving={saving}
          productOptions={productOptions}
          onChange={handleDraftChange}
          onSave={handleSave}
          onDelete={editingId ? () => handleDelete(editingId) : null}
        />
      )}
    </div>
  );
}

function CouponList({ coupons, loading, onRefresh, onEdit, onDelete }) {
  if (loading && !coupons.length) {
    return (
      <div className="flex items-center justify-center py-16 text-stone-400 text-sm">
        Loading coupons…
      </div>
    );
  }

  if (!coupons.length) {
    return (
      <div className="bg-white border border-dashed border-stone-300 rounded-xl p-8 text-center">
        <p className="text-stone-500 text-sm mb-3">
          No coupons created yet.
        </p>
        <button
          onClick={onRefresh}
          className="text-xs font-semibold text-orange-700 hover:text-orange-800"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 uppercase text-[11px]">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Code</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-left font-semibold">Value</th>
              <th className="px-3 py-2 text-left font-semibold">Min Cart</th>
              <th className="px-3 py-2 text-left font-semibold">Auto?</th>
              <th className="px-3 py-2 text-left font-semibold">Free Gift</th>
              <th className="px-3 py-2 text-left font-semibold">Active</th>
              <th className="px-3 py-2 text-right font-semibold">Usage</th>
              <th className="px-3 py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-stone-100">
                <td className="px-3 py-2 font-mono text-xs font-semibold">
                  {c.code}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-100 text-[11px] font-semibold">
                    {c.type}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {c.type === "percent"
                    ? `${c.value}%`
                    : `₹${Number(c.value || 0)}`}
                </td>
                <td className="px-3 py-2">₹{Number(c.min_cart_amount || 0)}</td>
                <td className="px-3 py-2">
                  {c.is_auto ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Auto
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-400">Manual</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">
                  {c.free_gift_product_id ? (
                    <span className="text-orange-700 font-semibold">
                      Gift: {c.free_gift_product_id}
                      {c.free_gift_qty
                        ? ` × ${c.free_gift_qty}`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-stone-400 text-[11px]">
                      None
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {c.is_active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[11px] font-semibold">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-xs text-stone-500">
                  {Number(c.used_count || 0)}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => onEdit(c)}
                      className="text-xs font-semibold text-stone-700 hover:text-orange-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CouponForm({
  draft,
  saving,
  productOptions,
  onChange,
  onSave,
  onDelete,
}) {
  return (
    <form
      onSubmit={onSave}
      className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5 space-y-6"
    >
      {/* Basic Info */}
      <section className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">
            Coupon Code
          </label>
          <input
            type="text"
            value={draft.code}
            onChange={(e) => onChange("code", e.target.value.toUpperCase())}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 font-mono"
            placeholder="WELCOME10"
            required
          />
          <p className="text-[11px] text-stone-400 mt-1">
            Shown to customers. Must be unique.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">
            Label / Description
          </label>
          <input
            type="text"
            value={draft.description || ""}
            onChange={(e) => onChange("description", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            placeholder="10% off on all cakes"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">
            Discount Type
          </label>
          <select
            value={draft.type}
            onChange={(e) => onChange("type", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="percent">% Percent</option>
            <option value="fixed">₹ Fixed Amount</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">
            Discount Value
          </label>
          <input
            type="number"
            min="0"
            value={draft.value}
            onChange={(e) => onChange("value", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            placeholder={draft.type === "percent" ? "10 = 10%" : "100 = ₹100"}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">
            Min Cart Amount
          </label>
          <input
            type="number"
            min="0"
            value={draft.min_cart_amount}
            onChange={(e) => onChange("min_cart_amount", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            placeholder="500 = applies when cart ≥ 500"
          />
        </div>

        <div className="flex items-center gap-3 mt-5">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600">
            <input
              type="checkbox"
              checked={!!draft.is_active}
              onChange={(e) => onChange("is_active", e.target.checked)}
              className="rounded border-stone-300"
            />
            Active
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600">
            <input
              type="checkbox"
              checked={!!draft.is_auto}
              onChange={(e) => onChange("is_auto", e.target.checked)}
              className="rounded border-stone-300"
            />
            Auto Apply
          </label>
        </div>
      </section>

      {/* Schedules & limits */}
      <section className="grid md:grid-cols-2 gap-4 border-t border-stone-100 pt-4">
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">
            Starts At (optional)
          </label>
          <input
            type="datetime-local"
            value={draft.valid_from || ""}
            onChange={(e) => onChange("valid_from", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">
            Ends At (optional)
          </label>
          <input
            type="datetime-local"
            value={draft.valid_to || ""}
            onChange={(e) => onChange("valid_to", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">
            Max Uses (Total)
          </label>
          <input
            type="number"
            min="0"
            value={draft.max_uses || ""}
            onChange={(e) => onChange("max_uses", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Leave blank = no limit"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">
            Max Uses per User
          </label>
          <input
            type="number"
            min="0"
            value={draft.per_user_limit || ""}
            onChange={(e) => onChange("per_user_limit", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Leave blank = no limit"
          />
        </div>
      </section>

      {/* Auto / Free Gift Config */}
      <section className="border-t border-stone-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-stone-800">
            Auto Apply & Free Gift
          </h3>
          <span className="text-[11px] text-stone-400">
            Used by cartController for auto discount & free gift logic
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1">
              Auto Threshold (Subtotal)
            </label>
            <input
              type="number"
              min="0"
              value={draft.auto_threshold}
              onChange={(e) => onChange("auto_threshold", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. 999 – auto apply above this amount"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              If subtotal ≥ threshold and coupon is auto + active, it can be
              applied automatically.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1">
              Free Gift Product (optional)
            </label>
            <select
              value={draft.free_gift_product_id || ""}
              onChange={(e) =>
                onChange("free_gift_product_id", e.target.value || "")
              }
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">No free gift</option>
              {productOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-400 mt-1">
              When set, cartController can auto add this product as free gift
              when coupon triggers.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1">
              Free Gift Quantity
            </label>
            <input
              type="number"
              min="1"
              value={draft.free_gift_qty}
              onChange={(e) => onChange("free_gift_qty", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              disabled={!draft.free_gift_product_id}
            />
          </div>
        </div>

        {/* Read-only counters */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone-500">
          {typeof draft.used_count !== "undefined" && (
            <span>
              Uses:{" "}
              <span className="font-semibold text-stone-800">
                {draft.used_count}
              </span>
            </span>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
        {onDelete && draft.id && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs font-semibold text-red-500 hover:text-red-600"
          >
            Delete Coupon
          </button>
        )}

        <div className="ml-auto flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold shadow-sm hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Coupon"}
          </button>
        </div>
      </div>
    </form>
  );
}
