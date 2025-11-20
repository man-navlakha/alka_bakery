  import React, { useEffect, useState } from "react";

  /**
   * AdminProducts.jsx
   *
   * Usage: place this behind an admin-only route. Tailwind CSS must be configured.
   *
   * Expects backend endpoints:
   *  GET    /api/products
   *  GET    /api/products/:id
   *  POST   /api/products
   *  PUT    /api/products/:id
   *  DELETE /api/products/:id
   *
   * The create/update payload shape matches the productController in your server:
   * {
   *   id, name, category, unit, price_per_100g?, price_per_pc?, description?,
   *   unitOptions?: [{ label, grams, price, position? }],
   *   images?: [{ url, alt?, position? }]
   * }
   */

  export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editing, setEditing] = useState(null); // product object being edited (null => create)
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Basic flash
    const [note, setNote] = useState(null);

    useEffect(() => {
      fetchProducts();
    }, []);

    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:3000/api/products");
        if (!res.ok) throw new Error(`Failed to load: ${res.statusText}`);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    function openCreate() {
      setEditing(null);
      setShowForm(true);
    }

    function openEdit(product) {
      setEditing(normalizeProductForForm(product));
      setShowForm(true);
    }

    function normalizeProductForForm(product) {
   
      // ensures unitOptions and images are arrays in the form-friendly shape
      return {
        ...product,
        // server uses product_unit_options and product_images; allow both shapes
        unitOptions: product.product_unit_options || product.unitOptions || [],
        images: (product.product_images || product.images || []).map((img) =>
          typeof img === "string" ? { url: img } : img
        ),
        // unify price keys used in UI
        price_per_100g: product.price_per_100g ?? product.pricePer100g ?? null,
        price_per_pc: product.price_per_pc ?? product.pricePerPc ?? null,
      };
    }

    async function handleDelete(productId) {
      if (!confirm("Delete this product? This action cannot be undone.")) return;
      try {
        const res = await fetch(`http://localhost:3000/api/products/${encodeURIComponent(productId)}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await res.text());
        setProducts((p) => p.filter((x) => x.id !== productId));
        setNote("Deleted product.");
        setTimeout(() => setNote(null), 3000);
      } catch (err) {
        alert("Failed to delete: " + err.message);
      }
    }

    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin — Products</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow"
            >
              + New Product
            </button>
            <button
              onClick={fetchProducts}
              className="bg-white border px-3 py-2 rounded-md text-sm"
              title="Reload"
            >
              Refresh
            </button>
          </div>
        </div>

        {note && <div className="mb-4 text-sm text-green-700 bg-green-100 p-2 rounded">{note}</div>}

        {loading ? (
          <div className="text-gray-500">Loading products...</div>
        ) : error ? (
          <div className="text-red-600">Error: {error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow divide-y">
            {products.length === 0 ? (
              <div className="p-4 text-gray-500">No products yet.</div>
            ) : (
              products.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  onEdit={() => openEdit(p)}
                  onDelete={() => handleDelete(p.id)}
                />
              ))
            )}
          </div>
        )}

        {showForm && (
          <ProductForm
            initial={editing}
            onClose={() => setShowForm(false)}
            onSaved={(savedProduct, action) => {
              // update local list optimistically
              setProducts((prev) => {
                if (action === "created") {
                  return [savedProduct, ...prev];
                }
                return prev.map((x) => (x.id === savedProduct.id ? savedProduct : x));
              });
              setShowForm(false);
              setNote(action === "created" ? "Product created." : "Product updated.");
              setTimeout(() => setNote(null), 3000);
            }}
          />
        )}

        <div className="mt-8 text-sm text-gray-500">
          Tip: Protect these routes with admin auth. In production do not expose a service role key to the client.
        </div>
      </div>
    );
  }

  /* -------- Product Row (list item) -------- */
  function ProductRow({ product, onEdit, onDelete }) {
    const primaryImage = (product.product_images && product.product_images[0]?.url) || product.image || (product.product_images && product.product_images[0]) || "";
    const priceInfo =
      product.unit === "gm"
        ? `₹${product.price_per_100g ?? product.pricePer100g}/100g`
        : product.unit === "pc"
          ? `₹${product.price_per_pc ?? product.pricePerPc}/pc`
          : product.product_unit_options?.length
            ? `From ₹${product.product_unit_options[0].price}`
            : "";

    return (
      <div className="p-4 flex items-center gap-4">
        <img src={primaryImage || "https://picsum.photos/seed/placeholder/120/80"} alt={product.name} className="w-28 h-20 object-cover rounded" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{product.name}</div>
              <div className="text-xs text-gray-500">{product.category} • {product.unit}</div>
            </div>
            <div className="text-sm text-gray-700">{priceInfo}</div>
          </div>
          <div className="text-sm text-gray-600 mt-2">{product.description}</div>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={onEdit} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm border">Edit</button>
          <button onClick={onDelete} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm border">Delete</button>
        </div>
      </div>
    );
  }

  /* -------- Product Form (create / edit) -------- */
  function ProductForm({ initial = null, onClose, onSaved }) {
    // form state
    const [selectedFiles, setSelectedFiles] = useState([]);
    const isEdit = Boolean(initial && initial.id);
    const [form, setForm] = useState(() =>
      initial
        ? {
          id: initial.id || "",
          name: initial.name || "",
          category: initial.category || "Cookies",
          unit: initial.unit || "gm", // gm|pc|variant
          price_per_100g: initial.price_per_100g ?? initial.pricePer100g ?? "",
          price_per_pc: initial.price_per_pc ?? initial.pricePerPc ?? "",
          unitOptions: initial.unitOptions ?? initial.product_unit_options ?? [],
          images: initial.images ?? initial.product_images ?? [],
          description: initial.description ?? "",
        }
        : {
          id: "",
          name: "",
          category: "Cookies",
          unit: "gm",
          price_per_100g: "",
          price_per_pc: "",
          unitOptions: [],
          images: [],
          description: "",
        }
    );
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState(null);

    // helpers
    function updateField(k, v) {
      setForm((f) => ({ ...f, [k]: v }));
    }

    function addUnitOption() {
      setForm((f) => ({ ...f, unitOptions: [...(f.unitOptions || []), { label: "", grams: "", price: "" }] }));
    }
    function updateUnitOption(idx, key, value) {
      setForm((f) => {
        const arr = [...(f.unitOptions || [])];
        arr[idx] = { ...arr[idx], [key]: value };
        return { ...f, unitOptions: arr };
      });
    }
    function removeUnitOption(idx) {
      setForm((f) => ({ ...f, unitOptions: f.unitOptions.filter((_, i) => i !== idx) }));
    }

    function addImage() {
      setForm((f) => ({ ...f, images: [...(f.images || []), { url: "", alt: "" }] }));
    }
    function updateImage(idx, key, value) {
      setForm((f) => {
        const arr = [...(f.images || [])];
        arr[idx] = { ...arr[idx], [key]: value };
        return { ...f, images: arr };
      });
    }
    function removeImage(idx) {
      setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
    }

    function validate() {
      setFormError(null);
      if (!form.id || !form.name) {
        setFormError("Please provide both an ID and a name for the product.");
        return false;
      }
      if (!["gm", "pc", "variant"].includes(form.unit)) {
        setFormError("Unit must be one of: gm, pc, variant.");
        return false;
      }
      if (form.unit === "gm" && !form.price_per_100g) {
        setFormError("Please set price_per_100g for gm products.");
        return false;
      }
      if (form.unit === "pc" && !form.price_per_pc) {
        setFormError("Please set price_per_pc for pc products.");
        return false;
      }
      if (form.unit === "variant" && (!form.unitOptions || form.unitOptions.length === 0)) {
        setFormError("Add at least one size option for variant products.");
        return false;
      }
      return true;
    }

    async function submit(e) {
      e?.preventDefault?.();
      if (!validate()) return;

      setSaving(true);
      setFormError(null);

      // 1. Create FormData object
      const formData = new FormData();

      // 2. Append simple fields
      formData.append("id", form.id);
      formData.append("name", form.name);
      formData.append("category", form.category);
      formData.append("unit", form.unit);

      // Handle numbers (append only if they exist)
      if (form.price_per_100g) formData.append("price_per_100g", form.price_per_100g);
      if (form.price_per_pc) formData.append("price_per_pc", form.price_per_pc);
      if (form.description) formData.append("description", form.description);

      // 3. Handle unitOptions (Complex Array -> JSON String)
      if (form.unit === "variant" && form.unitOptions?.length) {
        const cleanOptions = form.unitOptions.map((o, i) => ({
          label: o.label,
          grams: o.grams ? Number(o.grams) : null,
          price: Number(o.price),
          position: i,
        }));
        formData.append("unitOptions", JSON.stringify(cleanOptions));
      }

      // 4. Handle Images
      // Scenario A: User uploaded NEW files (Backend will replace old images with these)
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          // "images" matches the field name in uploadMiddleware(.array("images"))
          formData.append("images", file);
        });
      }
      // Scenario B: No new files, but we might be reordering existing URLs
      else if (form.images && form.images.length > 0) {
        const existingImages = form.images.map((img, p) => ({
          url: img.url,
          alt: img.alt || null,
          position: p
        }));
        formData.append("images", JSON.stringify(existingImages));
      }

      try {
        const method = isEdit ? "PUT" : "POST";
        const url = isEdit
          ? `http://localhost:3000/api/products/${encodeURIComponent(form.id)}`
          : "http://localhost:3000/api/products";

        const res = await fetch(url, {
          method,
          // IMPORTANT: Do NOT set Content-Type header. 
          // The browser sets it automatically to multipart/form-data with the boundary when using FormData.
          body: formData,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Server error");
        }

        const saved = await res.json();
        onSaved && onSaved(saved, isEdit ? "updated" : "created");
      } catch (err) {
        setFormError("Save failed: " + (err.message || err));
      } finally {
        setSaving(false);
      }
    }

    return (
      <div className="fixed inset-0  mt-18 z-50 flex items-start justify-center p-6">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <form onSubmit={submit} className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 z-10 overflow-auto max-h-[90vh]">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold">{isEdit ? "Edit Product" : "Create Product"}</h2>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="text-sm px-3 py-1 rounded border">Close</button>
            </div>
          </div>

          {formError && <div className="mt-3 text-sm text-red-700 bg-red-50 p-2 rounded">{formError}</div>}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium">ID (unique)</label>
              <input
                value={form.id}
                onChange={(e) => updateField("id", e.target.value)}
                disabled={isEdit}
                className="mt-1 block w-full border rounded px-3 py-2"
                placeholder="e.g. cookie-003"
              />
              <p className="text-xs text-gray-500 mt-1">IDs are used in API URLs and should be unique.</p>
            </div>

            <div>
              <label className="block text-sm font-medium">Name</label>
              <input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium">Category</label>
              <select value={form.category} onChange={(e) => updateField("category", e.target.value)} className="mt-1 block w-full border rounded px-3 py-2">
                <option>Cookies</option>
                <option>Cakes</option>
                <option>Gift Box</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Unit</label>
              <select value={form.unit} onChange={(e) => updateField("unit", e.target.value)} className="mt-1 block w-full border rounded px-3 py-2">
                <option value="gm">gm (price per 100g)</option>
                <option value="pc">pc (per piece)</option>
                <option value="variant">variant (sizes/options — e.g. cakes)</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            {form.unit === "gm" && (
              <div>
                <label className="block text-sm font-medium">Price per 100 g (₹)</label>
                <input type="number" value={form.price_per_100g} onChange={(e) => updateField("price_per_100g", e.target.value)} className="mt-1 block w-44 border rounded px-3 py-2" />
              </div>
            )}

            {form.unit === "pc" && (
              <div>
                <label className="block text-sm font-medium">Price per piece (₹)</label>
                <input type="number" value={form.price_per_pc} onChange={(e) => updateField("price_per_pc", e.target.value)} className="mt-1 block w-44 border rounded px-3 py-2" />
              </div>
            )}

            {form.unit === "variant" && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Unit Options (sizes)</label>
                  <button type="button" onClick={addUnitOption} className="text-sm px-2 py-1 bg-green-50 text-green-700 rounded border">+ Add size</button>
                </div>
                <div className="mt-2 space-y-2">
                  {(form.unitOptions || []).map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input placeholder="Label (e.g. 500 g)" value={opt.label} onChange={(e) => updateUnitOption(i, "label", e.target.value)} className="border rounded px-2 py-1 w-36" />
                      <input placeholder="grams" type="number" value={opt.grams} onChange={(e) => updateUnitOption(i, "grams", e.target.value)} className="border rounded px-2 py-1 w-24" />
                      <input placeholder="price (₹)" type="number" value={opt.price} onChange={(e) => updateUnitOption(i, "price", e.target.value)} className="border rounded px-2 py-1 w-28" />
                      <button type="button" onClick={() => removeUnitOption(i)} className="text-sm px-2 py-1 bg-red-50 text-red-700 rounded border">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Inside the JSX return of ProductForm */}

          <div className="mt-4">
            <label className="block text-sm font-medium">Product Images</label>

            {/* File Input for New Uploads */}
            <div className="mt-2">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  // Convert FileList to Array
                  const files = Array.from(e.target.files);
                  setSelectedFiles(files);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Uploading new files will replace existing images.
              </p>
            </div>

            {/* Preview Area */}
            <div className="mt-4 flex gap-4 overflow-x-auto">
              {/* 1. Show Newly Selected Files (Previews) */}
              {selectedFiles.length > 0 && selectedFiles.map((file, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="h-24 w-24 object-cover rounded border border-indigo-300"
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-indigo-600 text-white text-xs text-center opacity-75">
                    New
                  </span>
                </div>
              ))}

              {/* 2. Show Existing Images (Only if no new files selected, as backend replaces them) */}
              {selectedFiles.length === 0 && (form.images || []).map((img, i) => (
                <div key={i} className="relative flex-shrink-0 group">
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="h-24 w-24 object-cover rounded border"
                  />
                  {/* Delete existing image button */}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium">Description</label>
            <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="mt-1 block w-full border rounded px-3 py-2 h-24" />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-indigo-600 text-white">
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}
            </button>
          </div>
        </form>
      </div>
    );
  }
