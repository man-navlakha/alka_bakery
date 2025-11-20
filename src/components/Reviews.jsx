import React, { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from 'react-hot-toast';

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
const Icons = {
  StarFilled: () => <svg className="w-full h-full text-amber-400 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>,
  StarEmpty: () => <svg className="w-full h-full text-stone-200 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>,
  Upload: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  CheckBadge: () => <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
  ThumbsUp: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>,
  Close: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
};
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
    <div className={`inline-flex items-center gap-2 -z-3 ${className}`}>
      <div
        className={`relative inline-block leading-none ${sizeClass}`}
        role="img"
        aria-label={`Rating: ${r} out of 5`}
        title={`${r} out of 5`}
      >
        <div className="text-stone-300 select-none ">
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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg mr-1 p-3  border shadow-sm">
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
        <div className="mt-2 flex flex-col gap-2 items-center">
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
   Review List
   ---------------------- */
export function ReviewList({ productId, pageSize = 5 }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("recent");
  const [hasMore, setHasMore] = useState(false);

  const fetchReviews = async (p = 1) => {
    setLoading(true);
    const offset = (p - 1) * pageSize;
    try {
      const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/reviews?limit=${pageSize}&offset=${offset}&sort=${sort}`);
      if (!res.ok) throw new Error("Err");
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      setReviews(list);
      setHasMore(list.length === pageSize);
    } catch {
      toast.error("Could not load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page);
    const onNew = () => fetchReviews(1);
    window.addEventListener("review:created", onNew);
    return () => window.removeEventListener("review:created", onNew);
  }, [productId, page, sort]);

  const handleHelpful = async (id) => {
    try {
        const res = await fetch(`${API_BASE}/api/reviews/${id}/helpful`, { method: 'POST', headers: getAuthHeaders() });
        if(!res.ok) throw new Error("Failed");
        setReviews(curr => curr.map(r => r.id === id ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r));
        toast.success("Marked as helpful!");
    } catch {
        toast.error("Please sign in to vote", { icon: '🔒' });
    }
  };

  return (
    <div className="max-w-screen w-full p-3 mr-3">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
        <h3 className="font-serif font-bold text-xl text-stone-900">Reviews</h3>
        <select 
            value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="bg-stone-50 border border-stone-200 text-stone-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-orange-200"
        >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating_desc">Highest Rated</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
         <div className="space-y-4 animate-pulse">
             {[1,2,3].map(i => <div key={i} className="h-32 bg-stone-100 rounded-xl" />)}
         </div>
      ) : reviews.length === 0 ? (
         <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-100">
             <div className="text-4xl mb-2">📝</div>
             <p className="text-stone-500 font-medium">No reviews yet. Be the first to write one!</p>
         </div>
      ) : (
         <div className="space-y-6">
             {reviews.map(r => (
                 <div key={r.id} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center font-bold text-stone-500 text-lg uppercase">
                                {r.display_name?.[0] || "?"}
                            </div>
                            <div>
                                <div className="font-bold text-stone-900 flex items-center gap-2">
                                    {r.display_name || "Anonymous"}
                                    {r.is_verified_purchase && (
                                        <span className="flex items-center gap-1 text-[10px] uppercase bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 tracking-wider font-bold">
                                            <Icons.CheckBadge /> Verified
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                                    <StarRatingDisplay rating={r.rating} size="sm" />
                                    <span>•</span>
                                    <span>{friendlyDate(r.created_at)}</span>
                                </div>
                            </div>
                         </div>
                     </div>
                     
                     {r.title && <h4 className="font-bold text-stone-800 mb-1">{r.title}</h4>}
                     <p className="text-stone-600 leading-relaxed text-sm whitespace-pre-line">{r.body}</p>

                     {r.review_images?.length > 0 && (
                         <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                             {r.review_images.map(img => (
                                 <img key={img.id} src={img.storage_path} alt="review" className="w-20 h-20 rounded-lg object-cover border border-stone-100" />
                             ))}
                         </div>
                     )}

                            {/* admin replies */}

              {r.review_replies?.length > 0 && (

                <div className="mt-3 bg-gray-50 p-3 rounded text-sm">

                  {r.review_replies.map(rep => <div key={rep.id}><strong>Reply:</strong> {rep.body}</div>)}

                </div>

              )}

                     <div className="mt-4 pt-4 border-t border-stone-50 flex items-center gap-4">
                         <button 
                            onClick={() => handleHelpful(r.id)}
                            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-orange-600 transition-colors group"
                         >
                             <div className="group-hover:scale-110 transition-transform"><Icons.ThumbsUp /></div>
                             <span>Helpful ({r.helpful_count || 0})</span>
                         </button>
                     </div>
                 </div>
             ))}
         </div>
      )}

      {/* Pagination */}
      <div className="mt-8 flex justify-center gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="px-4 py-2 border border-stone-200 rounded-lg text-sm font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-stone-100 rounded-lg text-sm font-bold text-stone-900">{page}</span>
          <button 
            onClick={() => setPage(p => p+1)} disabled={!hasMore && reviews.length < pageSize}
            className="px-4 py-2 border border-stone-200 rounded-lg text-sm font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
      </div>
    </div>
  );
}