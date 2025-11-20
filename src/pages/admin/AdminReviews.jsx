import React, { useEffect, useMemo, useState } from "react";

/**
 * AdminReviews.jsx
 *
 * - AdminReviews (default export) : page wrapper
 * - FiltersPanel
 * - ReviewsTable (list with checkboxes)
 * - ReviewDetailDrawer (slide-over)
 *
 * Env:
 *  VITE_API_URL (defaults to http://localhost:3000)
 *  VITE_ADMIN_TOKEN (required for admin endpoints in dev)
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || "";

function adminHeaders() {
  const h = { "Accept": "application/json", "Content-Type": "application/json" };
  if (ADMIN_TOKEN) h["x-admin-token"] = ADMIN_TOKEN;
  return h;
}

// small helper
function friendlyDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminReviews() {
  const [filters, setFilters] = useState({
    status: "pending", // pending / approved / rejected / all
    product: "",
    has_images: "any", // any | true | false
    min_rating: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [drawerReview, setDrawerReview] = useState(null);
  const [error, setError] = useState("");

  async function loadReviews() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      const offset = (page - 1) * PAGE_SIZE;
      qs.set("limit", PAGE_SIZE);
      qs.set("offset", offset);
      if (filters.status && filters.status !== "all") qs.set("status", filters.status);
      if (filters.product) qs.set("product", filters.product);
      if (filters.min_rating) qs.set("min_rating", filters.min_rating);
      if (filters.search) qs.set("search", filters.search);
      if (filters.has_images && filters.has_images !== "any") qs.set("has_images", filters.has_images);
      qs.set("sort", "created_at.desc");

      const url = `${API_BASE}/api/admin/reviews?${qs.toString()}`;
      const res = await fetch(url, { headers: adminHeaders() });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setReviews(json.data || []);
      setTotal(typeof json.total === "number" ? json.total : null);
      // reset selection on new load
      setSelected(new Set());
    } catch (e) {
      console.error("loadReviews error", e);
      setError(e.message || "Failed to load reviews");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line
  }, [filters, page]);

  // row selection handlers
  function toggleSelect(id) {
    setSelected(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAllVisible() {
    setSelected(new Set(reviews.map(r => r.id)));
  }
  function clearSelection() {
    setSelected(new Set());
  }

  async function callAdmin(action, ids, extra = {}) {
    // action: approve|reject|delete
    try {
      const body = { action, ids: Array.from(ids), ...extra };
      const res = await fetch(`${API_BASE}/api/admin/reviews/bulk`, {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = await res.json();
      // reload after action
      await loadReviews();
      return json;
    } catch (e) {
      console.error("bulk action failed", e);
      alert("Bulk action failed: " + (e.message || e));
      throw e;
    }
  }

  async function singleAction(endpoint, method = "POST", body = null) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: adminHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const j = await res.json();
      await loadReviews();
      return j;
    } catch (e) {
      console.error("singleAction", e);
      alert("Action failed: " + (e.message || e));
      throw e;
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin — Manage Reviews</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => { setFilters({ status: "all", product: "", has_images: "any", min_rating: "", search: "" }); setPage(1); }} className="px-3 py-2 bg-stone-100 rounded">Reset filters</button>
          <button onClick={() => loadReviews()} className="px-3 py-2 bg-amber-500 text-white rounded">Refresh</button>
        </div>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-6">
        <aside>
          <FiltersPanel filters={filters} setFilters={(up) => { setFilters(prev => ({ ...prev, ...up })); setPage(1); }} />
          <div className="mt-4 bg-white p-4 rounded border">
            <div className="text-sm text-gray-600 mb-2">Selection</div>
            <div className="flex gap-2">
              <button onClick={selectAllVisible} className="px-3 py-2 border rounded">Select all</button>
              <button onClick={clearSelection} className="px-3 py-2 border rounded">Clear</button>
              <div className="ml-auto text-sm text-gray-600">Selected: {selected.size}</div>
            </div>

            <div className="mt-4 flex gap-2">
              <button disabled={selected.size===0} onClick={() => {
                if (!confirm(`Approve ${selected.size} reviews?`)) return;
                callAdmin("approve", selected);
              }} className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50">Approve</button>

              <button disabled={selected.size===0} onClick={() => {
                const reason = prompt("Reason for rejection (optional):") || undefined;
                if (!confirm(`Reject ${selected.size} reviews?`)) return;
                callAdmin("reject", selected, { reason });
              }} className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50">Reject</button>

              <button disabled={selected.size===0} onClick={() => {
                if (!confirm(`Delete ${selected.size} reviews? This cannot be undone.`)) return;
                callAdmin("delete", selected);
              }} className="px-3 py-2 bg-gray-800 text-white rounded disabled:opacity-50">Delete</button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <div>Tip: approve reviews to make them public; reject abusive content.</div>
            <div className="mt-2">This admin UI uses header <code>x-admin-token</code> for demo auth.</div>
          </div>
        </aside>

        <section>
          <div className="bg-white rounded border p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-600">Showing</div>
                <div className="text-lg font-semibold">{total ?? reviews.length} reviews</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setPage(1); loadReviews(); }} className="px-3 py-2 border rounded">Reload</button>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-gray-500">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="py-16 text-center text-gray-500">No reviews found</div>
            ) : (
              <>
                <ReviewsTable
                  reviews={reviews}
                  selected={selected}
                  toggleSelect={toggleSelect}
                  openReview={(r) => setDrawerReview(r)}
                  onApprove={(id) => singleAction(`/api/admin/reviews/${id}/approve`, "POST")}
                  onReject={(id) => {
                    const reason = prompt("Rejection reason (optional):");
                    singleAction(`/api/admin/reviews/${id}/reject`, "POST", { reason });
                  }}
                  onDelete={(id) => {
                    if (!confirm("Delete this review?")) return;
                    singleAction(`/api/admin/reviews/${id}`, "DELETE");
                  }}
                />

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Page {page}</div>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-2 border rounded">Prev</button>
                    <button onClick={() => setPage(p => p+1)} className="px-3 py-2 border rounded">Next</button>
                  </div>
                </div>
              </>
            )}

            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
        </section>
      </div>

      {drawerReview && (
        <ReviewDetailDrawer
          reviewId={drawerReview.id}
          onClose={() => setDrawerReview(null)}
          onSaved={() => { setDrawerReview(null); loadReviews(); }}
        />
      )}
    </div>
  );
}

/* -------------------------------
   FiltersPanel component
   ------------------------------- */
function FiltersPanel({ filters, setFilters }) {
  return (
    <div className="bg-white p-4 rounded border">
      <h3 className="font-semibold mb-3">Filters</h3>

      <label className="block text-sm mb-2">
        Status
        <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value })} className="mt-1 w-full border px-2 py-1 rounded">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>

      <label className="block text-sm mb-2">
        Product ID
        <input value={filters.product} onChange={(e) => setFilters({ product: e.target.value })} className="mt-1 w-full border px-2 py-1 rounded" placeholder="product id (optional)" />
      </label>

      <label className="block text-sm mb-2">
        Has images
        <select value={filters.has_images} onChange={(e) => setFilters({ has_images: e.target.value })} className="mt-1 w-full border px-2 py-1 rounded">
          <option value="any">Any</option>
          <option value="true">With images</option>
          <option value="false">No images</option>
        </select>
      </label>

      <label className="block text-sm mb-2">
        Min rating
        <input type="number" min="0" max="5" step="0.1" value={filters.min_rating} onChange={(e) => setFilters({ min_rating: e.target.value })} className="mt-1 w-full border px-2 py-1 rounded" placeholder="e.g. 4" />
      </label>

      <label className="block text-sm mb-2">
        Search
        <input value={filters.search} onChange={(e) => setFilters({ search: e.target.value })} className="mt-1 w-full border px-2 py-1 rounded" placeholder="search title/body/display name" />
      </label>
    </div>
  );
}

/* -------------------------------
   ReviewsTable component
   ------------------------------- */
function ReviewsTable({ reviews, selected, toggleSelect, openReview, onApprove, onReject, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="text-left text-sm text-gray-600 border-b">
            <th className="px-3 py-3 w-8"><input type="checkbox" onChange={(e) => {
              if (e.target.checked) {
                // select all visible
                reviews.forEach(r => toggleSelect(r.id));
              } else {
                // deselect all visible (clear)
                reviews.forEach(r => { if (selected.has(r.id)) toggleSelect(r.id) });
              }
            }} /></th>
            <th className="px-3 py-3">Reviewer</th>
            <th className="px-3 py-3">Product</th>
            <th className="px-3 py-3">Rating</th>
            <th className="px-3 py-3">Body</th>
            <th className="px-3 py-3">Images</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id} className="align-top border-b hover:bg-stone-50">
              <td className="px-3 py-3">
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
              </td>
              <td className="px-3 py-3">
                <div className="font-semibold">{r.display_name || (r.user_id ? "User" : "Anonymous")}</div>
                <div className="text-xs text-gray-500">{friendlyDate(r.created_at)}</div>
              </td>
              <td className="px-3 py-3">
                <div className="text-sm">{r.product_id}</div>
              </td>
              <td className="px-3 py-3">
                <div className="text-sm font-bold">{Number(r.rating).toFixed(1)} ★</div>
              </td>
              <td className="px-3 py-3">
                <div className="text-sm max-w-xl truncate" title={r.body}>{r.body}</div>
              </td>
              <td className="px-3 py-3">
                {Array.isArray(r.review_images) && r.review_images.length > 0 ? (
                  <div className="flex gap-1">
                    {r.review_images.slice(0,3).map(img => <img key={img.id} src={img.storage_path} alt={img.alt||""} className="w-12 h-12 object-cover rounded" />)}
                    {r.review_images.length > 3 && <div className="text-xs text-gray-500">+{r.review_images.length - 3}</div>}
                  </div>
                ) : <div className="text-xs text-gray-400">—</div>}
              </td>
              <td className="px-3 py-3">
                <span className={`px-2 py-1 rounded text-xs ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.status}</span>
              </td>
              <td className="px-3 py-3">
                <div className="flex gap-2">
                  <button onClick={() => onApprove(r.id)} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Approve</button>
                  <button onClick={() => onReject(r.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Reject</button>
                  <button onClick={() => openReview(r)} className="px-2 py-1 border rounded text-xs">Open</button>
                  <button onClick={() => onDelete(r.id)} className="px-2 py-1 border rounded text-xs text-red-600">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------
   ReviewDetailDrawer component
   ------------------------------- */
function ReviewDetailDrawer({ reviewId, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/reviews/${reviewId}`, { headers: adminHeaders() });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setReview(json);
    } catch (e) {
      console.error("load review", e);
      setError(e.message || "Failed to load review");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [reviewId]);

  async function doAction(action) {
    setBusy(true);
    try {
      if (action === "approve") {
        await fetch(`${API_BASE}/api/admin/reviews/${reviewId}/approve`, { method: "POST", headers: adminHeaders() });
      } else if (action === "reject") {
        const reason = prompt("Reason for rejection (optional):");
        await fetch(`${API_BASE}/api/admin/reviews/${reviewId}/reject`, { method: "POST", headers: adminHeaders(), body: JSON.stringify({ reason }) });
      } else if (action === "delete") {
        if (!confirm("Delete review permanently?")) return;
        await fetch(`${API_BASE}/api/admin/reviews/${reviewId}`, { method: "DELETE", headers: adminHeaders() });
      }
      await load();
      if (onSaved) onSaved();
    } catch (e) {
      console.error("doAction", e);
      alert("Action failed: " + (e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function postReply() {
    if (!replyText.trim()) return alert("Reply text required");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/reviews/${reviewId}/reply`, { method: "POST", headers: adminHeaders(), body: JSON.stringify({ body: replyText }) });
      if (!res.ok) throw new Error(await res.text());
      setReplyText("");
      await load();
    } catch (e) {
      console.error("postReply", e);
      alert("Reply failed: " + (e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function deleteImage(img) {
    if (!confirm("Remove this image? This will delete the DB reference and attempt provider deletion.")) return;
    setBusy(true);
    try {
      // Use delete review images endpoint if you have one.
      // We will call "DELETE /api/admin/reviews/:id" is destructive; better to implement image-specific route.
      // For now call bulk delete on review (not desired). So instead call the generic admin route to delete the review image row:
      const res = await fetch(`${API_BASE}/api/admin/reviews/${reviewId}`, { method: "GET", headers: adminHeaders() });
      // that won't delete — better to call underlying storage deletion endpoint you implement.
      // To keep safe: call backend route '/api/admin/reviews/:id' with body instructing deletion of single image
      // If you haven't implemented it, show alert.
      alert("Image deletion: please implement server-side endpoint to delete single review image. See controllers/adminReviewsController.js");
    } catch (e) {
      console.error("deleteImage", e);
      alert("Image deletion failed: " + (e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose()} />
      <div className="relative ml-auto w-full max-w-2xl bg-white h-full overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold">Review detail</h2>
          <div className="flex gap-2">
            <button onClick={() => doAction("approve")} disabled={busy} className="px-3 py-2 bg-green-600 text-white rounded">Approve</button>
            <button onClick={() => doAction("reject")} disabled={busy} className="px-3 py-2 bg-red-600 text-white rounded">Reject</button>
            <button onClick={() => doAction("delete")} disabled={busy} className="px-3 py-2 border rounded text-red-600">Delete</button>
            <button onClick={() => onClose()} className="px-3 py-2 border rounded">Close</button>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : review ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div>
                <div className="mb-2 text-sm text-gray-500">Product</div>
                <div className="font-bold mb-4">{review.product_id}</div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500">Reviewer</div>
                  <div className="font-semibold">{review.display_name || (review.user_id ? "User" : "Anonymous")}</div>
                  <div className="text-xs text-gray-400">{friendlyDate(review.created_at)}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500">Rating</div>
                  <div className="text-lg font-bold">{Number(review.rating).toFixed(1)} ★</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500">Title</div>
                  <div className="font-medium">{review.title || "—"}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500">Body</div>
                  <div className="whitespace-pre-line">{review.body}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500">Replies</div>
                  <div className="space-y-2 mt-2">
                    {Array.isArray(review.review_replies) && review.review_replies.length > 0 ? (
                      review.review_replies.map(rep => (
                        <div key={rep.id} className="bg-gray-50 p-3 rounded text-sm">
                          <div className="text-xs text-gray-500">Admin reply — {friendlyDate(rep.created_at)}</div>
                          <div>{rep.body}</div>
                        </div>
                      ))
                    ) : <div className="text-xs text-gray-400">No replies</div>}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-sm text-gray-500">Post a reply</div>
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full border rounded p-2 h-24" placeholder="Reply to the customer..." />
                  <div className="flex gap-2 mt-2">
                    <button onClick={postReply} disabled={busy} className="px-3 py-2 bg-amber-600 text-white rounded">Send reply</button>
                    <button onClick={() => setReplyText("")} className="px-3 py-2 border rounded">Clear</button>
                  </div>
                </div>
              </div>

              <aside>
                <div className="mb-4">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded text-sm ${review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : review.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{review.status}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500">Images</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Array.isArray(review.review_images) && review.review_images.length > 0 ? (
                      review.review_images.map(img => (
                        <div key={img.id} className="relative">
                          <img src={img.storage_path} alt={img.alt || ""} className="w-full h-28 object-cover rounded" />
                          <button onClick={() => deleteImage(img)} className="absolute top-1 right-1 bg-black/50 text-white rounded p-1 text-xs">Remove</button>
                        </div>
                      ))
                    ) : <div className="text-xs text-gray-400">No images</div>}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Meta</div>
                  <div className="mt-2 text-sm text-gray-700">
                    <div>Verified: {review.is_verified_purchase ? "Yes" : "No"}</div>
                    <div>Helpful count: {review.helpful_count ?? 0}</div>
                    <div>Created: {friendlyDate(review.created_at)}</div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        ) : null }

      </div>
    </div>
  );
}
