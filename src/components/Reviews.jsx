import React, { useEffect, useMemo, useState } from "react";

/**
 * Reviews.jsx
 *
 * Components:
 *  - ReviewForm       : create review + image upload with progress
 *  - ReviewList       : list reviews, helpful voting, pagination
 *  - ReviewSummary    : aggregated rating + breakdown bars
 *
 * Usage:
 *  <Reviews productId="cookie-001" />
 *
 * Notes:
 *  - Expects API endpoints:
 *      GET  /api/products/:productId/reviews?limit=10&offset=0
 *      GET  /api/products/:productId/reviews/summary
 *      POST /api/products/:productId/reviews           (multipart/form-data)
 *      POST /api/reviews/:id/helpful                    (requires auth)
 *
 *  - If your backend is not at same origin, set VITE_API_URL in .env and uncomment API_BASE logic.
 */

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:3000";

export default function Reviews({ productId }) {
  return (
    <div className="space-y-6">
      {/* <StarRatingDisplay productId={productId} size="lg" showValue /> */}
      <ReviewSummary productId={productId} />
      <ReviewForm productId={productId} />
      <ReviewList productId={productId} />
    </div>
  );
}

/* ----------------------
   Utility helpers
   ---------------------- */
function getAuthHeaders() {
  // Replace with your auth logic if you have JWT/session
  // e.g. return { Authorization: `Bearer ${localStorage.getItem('token')}` }
  return {};
}

function friendlyDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}



export function StarRatingDisplay({
  rating: ratingProp,
  productId,
  size = "md",
  className = "",
  showValue = false
}) {
  const [avg, setAvg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ratingProp != null) {
      setAvg(Number(ratingProp));
      return;
    }
    if (!productId) {
      setAvg(0);
      return;
    }

    const ac = new AbortController();
    const signal = ac.signal;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/reviews/summary`, { signal });
        if (!res.ok) throw new Error("no-summary");
        const data = await res.json();
        const a = data?.average ?? data?.average_rating ?? 0;
        if (!signal.aborted) setAvg(Number(a) || 0);
      } catch (e) {
        if (!signal.aborted) setAvg(0);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [ratingProp, productId]);

  const r = Math.max(0, Math.min(5, Number(ratingProp ?? avg) || 0));
  const pct = Math.round((r / 5) * 10000) / 100;
  const sizeMap = { sm: "text-sm", md: "text-base", lg: "text-2xl" };
  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`relative inline-block leading-none ${sizeClass}`}
        role="img"
        aria-label={`Rating: ${r} out of 5`}
        title={`${r} out of 5`}
      >
        <div className="text-stone-300 select-none">
          <span aria-hidden>★★★★★</span>
        </div>
        <div
          className="absolute inset-0 overflow-hidden top-0 left-0 pointer-events-none"
          style={{ width: `${pct}%` }}
        >
          <div className="text-amber-500 select-none">
            <span aria-hidden>★★★★★</span>
          </div>
        </div>
      </div>

      {showValue && (
        <div className="text-xs text-stone-500 tabular-nums">
          {loading ? "…" : Number(r).toFixed(1)}
        </div>
      )}
    </div>
  );
}





/* ----------------------
   ReviewSummary component
   ---------------------- */
export function ReviewSummary({ productId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/reviews/summary`);
        if (!res.ok) throw new Error("Failed to fetch summary");
        const data = await res.json();
        setSummary(data);
      } catch (e) {
        console.warn(e);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  const avg = summary?.average ?? summary?.average_rating ?? 0;
  const total = summary?.total ?? summary?.total_reviews ?? 0;
  const counts = summary?.counts ?? summary?.breakdown ?? {};

  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold">{avg || 0}</div>
          <div className="text-sm text-gray-500">average rating</div>
          <div className="mt-2 text-sm text-gray-400">{total} reviews</div>
        </div>

        <div className="flex-1">
          <div className="space-y-2">
            {[5,4,3,2,1].map((star) => {
              const count = (counts?.[String(star)] ?? counts?.[star] ?? 0);
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="w-8 text-sm">{star}★</div>
                  <div className="flex-1 bg-gray-100 rounded overflow-hidden h-3">
                    <div className="bg-amber-500 h-3" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-10 text-right text-xs text-gray-500">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------
   ReviewForm component
   ---------------------- */
export function ReviewForm({ productId, onSaved }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [files, setFiles] = useState([]); // File objects
  const [previews, setPreviews] = useState([]); // {url, name}
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // limits
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

  useEffect(() => {
    // cleanup object URLs
    return () => previews.forEach(p => URL.revokeObjectURL(p.url));
  }, [previews]);

  function onDropFiles(selectedFiles) {
    const arr = Array.from(selectedFiles);
    const trimmed = arr.slice(0, MAX_FILES - files.length);
    const valid = [];
    const newPreviews = [];

    for (let f of trimmed) {
      if (f.size > MAX_FILE_SIZE) {
        setError(`"${f.name}" too large (max ${MAX_FILE_SIZE/1024/1024}MB).`);
        continue;
      }
      if (!/^image\//.test(f.type)) {
        setError(`"${f.name}" is not an image.`);
        continue;
      }
      valid.push(f);
      newPreviews.push({ url: URL.createObjectURL(f), name: f.name });
    }

    setFiles(prev => [...prev, ...valid]);
    setPreviews(prev => [...prev, ...newPreviews]);
  }

  function handleFileInput(e) {
    onDropFiles(e.target.files);
    e.target.value = null;
  }

  function removePreview(idx) {
    setFiles(fs => fs.filter((_, i) => i !== idx));
    const p = previews[idx];
    if (p) URL.revokeObjectURL(p.url);
    setPreviews(ps => ps.filter((_, i) => i !== idx));
  }

  function validate() {
    setError("");
    if (!rating && rating !== 0) { setError("Rating required"); return false; }
    if (!body || body.trim().length < 10) { setError("Please write at least 10 characters"); return false; }
    return true;
  }

  // upload via XMLHttpRequest so we can get upload progress events
  function postFormData(fd, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/api/products/${encodeURIComponent(productId)}/reviews`);
      // attach auth header if needed
      const authHeaders = getAuthHeaders();
      if (authHeaders.Authorization) xhr.setRequestHeader("Authorization", authHeaders.Authorization);

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          onProgress && onProgress(pct);
        }
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.onload = () => {
        try {
          const status = xhr.status;
          const text = xhr.responseText;
          if (status >= 200 && status < 300) {
            resolve(JSON.parse(text || "{}"));
          } else {
            reject(new Error(text || `HTTP ${status}`));
          }
        } catch (e) {
          reject(e);
        }
      };
      xhr.send(fd);
    });
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setProgress(0);
    setError("");

    const fd = new FormData();
    fd.append("rating", String(rating));
    if (title) fd.append("title", title);
    fd.append("body", body);
    if (displayName) fd.append("display_name", displayName);
    if (isVerified) fd.append("is_verified_purchase", "true");

    files.forEach((f) => fd.append("files", f, f.name));

    try {
      const result = await postFormData(fd, (pct) => setProgress(pct));
      setSubmitting(false);
      setFiles([]);
      previews.forEach(p => URL.revokeObjectURL(p.url));
      setPreviews([]);
      setTitle("");
      setBody("");
      setDisplayName("");
      setRating(5);
      setIsVerified(false);
      setProgress(0);
      if (onSaved) onSaved(result);
      // Optionally: emit an event or refresh review list via parent
      const ev = new CustomEvent("review:created", { detail: result });
      window.dispatchEvent(ev);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to submit");
      setSubmitting(false);
    }
  }

  // small star picker
  function StarPicker({ value, onChange }) {
    return (
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map((s) => (
          <button key={s} type="button" onClick={() => onChange(s)} className={`text-2xl ${s <= value ? 'text-amber-500' : 'text-gray-300'}`}>★</button>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border shadow-sm">
      <h3 className="font-semibold mb-2">Write a review</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium">Your rating</label>
          <StarPicker value={rating} onChange={(v) => setRating(v)} />
        </div>
        <div>
          <label className="text-xs font-medium">Display name (optional)</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm" placeholder="e.g. Priya K." />
        </div>
      </div>

      <div className="mt-3">
        <label className="text-xs font-medium">Title (optional)</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm" placeholder="Short headline" />
      </div>

      <div className="mt-3">
        <label className="text-xs font-medium">Your review</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm h-28" placeholder="Share your experience (taste, freshness, packaging)"></textarea>
      </div>

      <div className="mt-3">
        <label className="text-xs font-medium">Photos (optional)</label>
        <div className="mt-2 flex gap-2 items-center">
          <input type="file" accept="image/*" multiple onChange={handleFileInput} />
          <div className="text-xs text-gray-500">Up to {MAX_FILES} images, max 3MB each</div>
        </div>

        {previews.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {previews.map((p, i) => (
              <div key={i} className="relative w-24 h-24 rounded overflow-hidden border">
                <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePreview(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)} />
          <span>Verified purchase</span>
        </label>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setFiles([]); previews.forEach(p => URL.revokeObjectURL(p.url)); setPreviews([]); }} className="text-sm text-gray-500">Clear images</button>
        </div>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {submitting && <div className="mt-3 text-sm text-gray-600">Uploading... {progress}%</div>}

      <div className="mt-4 flex gap-3">
        <button disabled={submitting} type="submit" className="bg-amber-500 text-white px-4 py-2 rounded font-medium shadow">
          {submitting ? "Submitting..." : "Submit review"}
        </button>
        <button type="button" onClick={() => { setRating(5); setTitle(""); setBody(""); setFiles([]); previews.forEach(p => URL.revokeObjectURL(p.url)); setPreviews([]); }} className="px-4 py-2 border rounded">
          Reset
        </button>
      </div>
    </form>
  );
}

/* ----------------------
   ReviewList component
   ---------------------- */
export function ReviewList({ productId, pageSize = 6 }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(null);
  const [sort, setSort] = useState("recent"); // or helpful
  const [error, setError] = useState("");

  const fetchReviews = async (page = 1) => {
  setLoading(true);
  setError("");
  const offset = (page - 1) * pageSize;
  try {
    const url = `${API_BASE}/api/products/${encodeURIComponent(productId)}/reviews?limit=${pageSize}&offset=${offset}&sort=${sort}`;
    console.log(url)
    console.debug("Fetching reviews from", url);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        // include auth header if needed:
        // ...getAuthHeaders()
      },
      // credentials: 'include' // uncomment if your server uses cookie auth
    });

    const text = await res.text(); // always read as text first (safer for debugging)

    // If not JSON, log it for inspection and throw an error
    try {
      if (!res.ok) {
        console.error("Reviews fetch returned non-OK:", res.status, text);
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 400)}`);
      }
      const data = text ? JSON.parse(text) : [];
      // Accept two shapes:
      // 1) { data: [...], total: 123 }  OR  2) [ ... ]  (legacy)
      if (Array.isArray(data)) {
        setReviews(data);
        setTotal((prev) => {
          if (data.length < pageSize) return (page - 1) * pageSize + data.length;
          return prev ?? null;
        });
      } else if (data && data.data) {
        setReviews(data.data || []);
        setTotal(typeof data.total === "number" ? data.total : (data.data?.length ?? null));
      } else {
        // unexpected JSON
        console.warn("Unexpected reviews JSON shape:", data);
        setReviews(Array.isArray(data) ? data : []);
      }
    } catch (parseErr) {
      // JSON.parse failed or server returned non-JSON
      console.error("Failed to parse response as JSON. Raw response:", text);
      throw new Error("Server returned non-JSON response. See console for full body.");
    }
  } catch (e) {
    console.warn("Failed to load reviews:", e);
    setError(e.message || "Failed to load reviews");
    setReviews([]);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchReviews(page);
    // listen for new review events from ReviewForm
    const onNew = () => fetchReviews(1);
    window.addEventListener("review:created", onNew);
    return () => window.removeEventListener("review:created", onNew);
  }, [productId, page, sort]);

  async function markHelpful(reviewId) {
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) throw new Error("Failed");
      // optimistic update: increment helpful on client
      setReviews((r) => r.map(rt => rt.id === reviewId ? { ...rt, helpful_count: (rt.helpful_count || 0) + 1 } : rt));
    } catch (e) {
      alert("Please sign in to vote helpful");
    }
  }

  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Customer reviews</h3>
        <div>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="border px-2 py-1 text-sm rounded">
            <option value="recent">Most recent</option>
            <option value="helpful">Most helpful</option>
            <option value="rating_desc">Top rated</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No reviews yet — be the first to write one!</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border rounded p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{r.display_name || "Anonymous"}</div>
                  <div className="text-xs text-gray-500">{friendlyDate(r.created_at)}</div>
                </div>
                <div className="text-right">
                 <div className="text-sm font-medium">
  <StarRatingDisplay rating={r.rating} size="sm" showValue={false} />
</div>

                  <div className="text-xs text-gray-400">{r.helpful_count || 0} found this helpful</div>
                </div>
              </div>

              {r.title && <div className="mt-2 font-medium">{r.title}</div>}
              <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">{r.body}</div>

              {/* images */}
              {r.review_images?.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {r.review_images.map((img) => <img key={img.id} src={img.storage_path} alt={img.alt || ""} className="w-20 h-20 object-cover rounded" />)}
                </div>
              )}

              {/* admin replies */}
              {r.review_replies?.length > 0 && (
                <div className="mt-3 bg-gray-50 p-3 rounded text-sm">
                  {r.review_replies.map(rep => <div key={rep.id}><strong>Reply:</strong> {rep.body}</div>)}
                </div>
              )}

              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => markHelpful(r.id)} className="text-sm text-gray-500 hover:text-amber-500">Helpful</button>
                <button onClick={() => alert("Report flow not implemented")} className="text-sm text-red-500">Report</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* pagination controls */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 border rounded">Prev</button>
        <div className="text-sm px-3 py-1">Page {page}</div>
        <button onClick={() => setPage(p => p+1)} className="px-3 py-1 border rounded">Next</button>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
    </div>
  );
}


