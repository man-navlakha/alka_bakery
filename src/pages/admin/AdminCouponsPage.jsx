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
  const [rewardType, setRewardType] = useState("discount"); // 'discount' | 'gift'

  // Sync local state if the user selects a different coupon to edit from the parent
  useEffect(() => {
    if (draft.free_gift_product_id) {
      setRewardType("gift");
    } else {
      setRewardType("discount");
    }
  }, [draft.id, draft.free_gift_product_id]);

  const handleTypeSwitch = (type) => {
    setRewardType(type);
    if (type === "discount") {
      // Clearing gift data so it doesn't persist if saved
      onChange("free_gift_product_id", null);
      onChange("free_gift_qty", 1);
    } else {
      // Clearing discount value
      onChange("value", 0);
    }
  };

  return (
    <form
      onSubmit={onSave}
      className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 space-y-6"
    >
      {/* 1. Core Identity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">
            Coupon Code
          </label>
          <input
            type="text"
            value={draft.code}
            onChange={(e) => onChange("code", e.target.value.toUpperCase())}
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 font-mono text-stone-800 focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
            placeholder="SUMMER25"
            required
          />
          <p className="text-[10px] text-stone-400 mt-1">
            Must be unique. Customers enter this at checkout.
          </p>
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">
            Description
          </label>
          <input
            type="text"
            value={draft.description || ""}
            onChange={(e) => onChange("description", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-stone-800 focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
            placeholder="e.g. 25% off summer sale"
          />
        </div>
      </div>

      {/* 2. Reward Type Switcher */}
      <div className="bg-stone-50 p-1 rounded-xl flex border border-stone-200">
        <button
          type="button"
          onClick={() => handleTypeSwitch("discount")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            rewardType === "discount"
              ? "bg-white text-orange-700 shadow-sm ring-1 ring-stone-200"
              : "text-stone-500 hover:bg-stone-100"
          }`}
        >
          💰 Discount (Fixed / %)
        </button>
        <button
          type="button"
          onClick={() => handleTypeSwitch("gift")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            rewardType === "gift"
              ? "bg-white text-orange-700 shadow-sm ring-1 ring-stone-200"
              : "text-stone-500 hover:bg-stone-100"
          }`}
        >
          🎁 Free Gift
        </button>
      </div>

      {/* 3. Reward Configuration (Conditional) */}
      <div className="bg-stone-50/50 rounded-xl p-5 border border-stone-100">
        {rewardType === "discount" ? (
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">
                Discount Type
              </label>
              <select
                value={draft.type}
                onChange={(e) => onChange("type", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2.5 bg-white text-sm"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">
                Value
              </label>
              <input
                type="number"
                min="0"
                value={draft.value}
                onChange={(e) => onChange("value", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2.5 bg-white text-sm"
                placeholder={draft.type === "percent" ? "15" : "100"}
              />
              <p className="text-[10px] text-stone-400 mt-1">
                {draft.type === "percent"
                  ? "Example: 15 for 15% off"
                  : "Example: 100 for ₹100 off"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">
                Select Gift Product
              </label>
              <select
                value={draft.free_gift_product_id || ""}
                onChange={(e) =>
                  onChange("free_gift_product_id", e.target.value)
                }
                className="w-full border border-stone-300 rounded-lg px-3 py-2.5 bg-white text-sm"
              >
                <option value="">-- Choose a Product --</option>
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={draft.free_gift_qty || 1}
                onChange={(e) => onChange("free_gift_qty", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2.5 bg-white text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Triggers & Rules */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2 border-b border-stone-100 pb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          Rules & Constraints
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1">
              Min Cart Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              value={draft.min_cart_amount}
              onChange={(e) => onChange("min_cart_amount", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1">
              Usage Limit (Total)
            </label>
            <input
              type="number"
              min="0"
              value={draft.max_uses || ""}
              onChange={(e) => onChange("max_uses", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Unlimited"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1">
              Limit Per User
            </label>
            <input
              type="number"
              min="0"
              value={draft.per_user_limit || ""}
              onChange={(e) => onChange("per_user_limit", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Unlimited"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1">
              Valid From
            </label>
            <input
              type="datetime-local"
              value={draft.valid_from || ""}
              onChange={(e) => onChange("valid_from", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1">
              Valid Until
            </label>
            <input
              type="datetime-local"
              value={draft.valid_to || ""}
              onChange={(e) => onChange("valid_to", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-600"
            />
          </div>
        </div>
      </section>

      {/* 5. Automation Settings */}
      <div className="border-t border-stone-100 pt-4">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Active Toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={!!draft.is_active}
              onChange={(e) => onChange("is_active", e.target.checked)}
              className="w-5 h-5 text-orange-600 border-stone-300 rounded focus:ring-orange-500"
            />
            <div>
              <div className="text-sm font-bold text-stone-700 group-hover:text-orange-700">
                Active Status
              </div>
              <div className="text-[11px] text-stone-400">
                Enable this coupon
              </div>
            </div>
          </label>

          {/* Auto Apply Toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={!!draft.is_auto}
              onChange={(e) => onChange("is_auto", e.target.checked)}
              className="w-5 h-5 text-orange-600 border-stone-300 rounded focus:ring-orange-500"
            />
            <div>
              <div className="text-sm font-bold text-stone-700 group-hover:text-orange-700">
                Auto-Apply
              </div>
              <div className="text-[11px] text-stone-400">
                Apply automatically if conditions met
              </div>
            </div>
          </label>
        </div>

        {/* Auto Threshold (Only if Auto is enabled) */}
        {draft.is_auto && (
          <div className="mt-4 pl-8 animate-in fade-in slide-in-from-top-1">
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
              Auto-Apply Threshold (₹)
            </label>
            <input
              type="number"
              min="0"
              value={draft.auto_threshold}
              onChange={(e) => onChange("auto_threshold", e.target.value)}
              className="w-48 border border-stone-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. 1000"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Triggers when cart subtotal reaches this amount.
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
        {onDelete && draft.id ? (
          <button
            type="button"
            onClick={onDelete}
            className="text-red-500 text-sm font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
          >
            Delete Coupon
          </button>
        ) : (
          <div></div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-stone-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-orange-600 hover:shadow-orange-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Coupon"}
          </button>
        </div>
      </div>
    </form>
  );
}