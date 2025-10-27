import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiFetch } from "../../Context/apiFetch";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react"; // Added XCircle for removing images

export default function AddProductForm({ product, onProductAdded, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category_id: "",
    unit_id: "",
    quantity: "", // Base quantity/size (optional)
    min_quantity: "", // NEW
    max_quantity: "", // NEW
    quantity_step: "", // NEW
    description: "",
    image: null, // Main image file
    images: [], // Gallery image files (File objects)
  });
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null); // Main image preview URL
  const [galleryPreviews, setGalleryPreviews] = useState([]); // Gallery image preview URLs
  const [existingGalleryImages, setExistingGalleryImages] = useState([]); // For editing [{id, image_url}]
  const isEdit = Boolean(product && product.id);

  // Populate form if editing
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [catData, unitData] = await Promise.all([
          apiFetch("http://localhost:3000/api/categories"),
          apiFetch("http://localhost:3000/api/units")
        ]);
        setCategories(catData || []);
        setUnits(unitData || []);
      } catch (err) {
        console.error("Failed to load categories/units:", err);
        setError("Could not load categories or units. Please try again.");
        toast.error("Failed to load categories/units.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);
  // Populate form if editing
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        price: product.price || "",
        category_id: product.category_id || "",
        unit_id: product.unit_id || "",
        quantity: product.quantity || "",
        min_quantity: product.min_quantity || "", // Populate new fields
        max_quantity: product.max_quantity || "", // Populate new fields
        quantity_step: product.quantity_step || "", // Populate new fields
        description: product.description || "",
        image: null, // Start fresh for main image file
        images: [], // Start fresh for gallery files
      });
      setPreview(product.image || null); // Show existing main image
      setExistingGalleryImages(product.product_images || []); // Show existing gallery images
      setGalleryPreviews([]); // Clear file previews
    } else {
      // Reset form
      setForm({ name: "", price: "", category_id: "", unit_id: "", quantity: "", min_quantity: "", max_quantity: "", quantity_step: "", description: "", image: null, images: [] });
      setPreview(null);
      setGalleryPreviews([]);
      setExistingGalleryImages([]);
    }
  }, [product, categories, units]);

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, image: file });
    setPreview(file ? URL.createObjectURL(file) : (product?.image || null));
  };

  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setForm(prev => ({ ...prev, images: [...prev.images, ...files] })); // Append new files

    // Create previews for the newly added files
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      file: file // Keep reference to the file object for removal
    }));
    setGalleryPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeNewGalleryImage = (fileObj) => {
    // Remove from form state
    setForm(prev => ({
      ...prev,
      images: prev.images.filter(f => f !== fileObj.file)
    }));
    // Remove from previews
    setGalleryPreviews(prev => prev.filter(p => p.url !== fileObj.url));
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(fileObj.url);
  };

  const removeExistingGalleryImage = async (imageId) => {
    if (!isEdit || !product || !imageId) return;
    if (!window.confirm("Are you sure you want to delete this gallery image? This is permanent.")) return;

    // Add API call here to delete the image from `product_images` table using its ID
    try {
      setLoading(true); // Indicate activity
      await apiFetch(`http://localhost:3000/api/products/images/${imageId}`, { // Adjust endpoint if needed
        method: 'DELETE',
      });
      setExistingGalleryImages(prev => prev.filter(img => img.id !== imageId));
      toast.success("Gallery image deleted.");
    } catch (err) {
      console.error("Failed to delete gallery image:", err);
      toast.error(err.message || "Failed to delete gallery image.");
    } finally {
      setLoading(false);
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... (Basic validations) ...
    if (!form.category_id || !form.unit_id) {
      setError("Please select both category and unit.");
      toast.error("Please select both category and unit.");
      return;
    }
    // Validate quantity rules if provided
    const min = parseFloat(form.min_quantity);
    const max = parseFloat(form.max_quantity);
    const step = parseFloat(form.quantity_step);
    if (form.min_quantity && (isNaN(min) || min < 0)) {
      setError("Minimum quantity must be a non-negative number."); return;
    }
    if (form.max_quantity && (isNaN(max) || max <= 0 || (form.min_quantity && max < min))) {
      setError("Maximum quantity must be a positive number and greater than or equal to minimum."); return;
    }
    if (form.quantity_step && (isNaN(step) || step <= 0)) {
      setError("Quantity step must be a positive number."); return;
    }


    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("category_id", form.category_id);
      formData.append("unit_id", form.unit_id);
      formData.append("description", form.description);

      // Append optional quantity fields if they have values
      if (form.quantity) formData.append("quantity", form.quantity);
      if (form.min_quantity) formData.append("min_quantity", form.min_quantity);
      if (form.max_quantity) formData.append("max_quantity", form.max_quantity);
      if (form.quantity_step) formData.append("quantity_step", form.quantity_step);

      // Append main image if selected
      if (form.image instanceof File) {
        formData.append("image", form.image);
      }

      // Append gallery images
      if (form.images.length > 0) {
        form.images.forEach((file) => {
          formData.append("images", file); // Use 'images' key for backend
        });
      }

      const url = isEdit
        ? `http://localhost:3000/api/products/${product.id}`
        : "http://localhost:3000/api/products";
      const method = isEdit ? "PUT" : "POST";

      const data = await apiFetch(url, { method: method, body: formData });
      const resultProduct = data.product || data;

      // Fetch updated product details including images for accurate UI update
      const finalProductData = await apiFetch(`http://localhost:3000/api/products/${resultProduct.id}`);

      toast.success(`Product ${isEdit ? "updated" : "added"} successfully!`);
      onProductAdded?.(finalProductData); // Pass complete updated data

      // Reset specific fields after success
      if (!isEdit) {
        setForm({ name: "", price: "", category_id: "", unit_id: "", quantity: "", min_quantity: "", max_quantity: "", quantity_step: "", description: "", image: null, images: [] });
        setPreview(null);
        setGalleryPreviews([]);
        setExistingGalleryImages([]);
      } else {
        // Clear file inputs but keep other data for potential further edits
        setForm(prev => ({ ...prev, image: null, images: [] }));
        setPreview(finalProductData.image || null); // Update preview with saved image URL
        setExistingGalleryImages(finalProductData.product_images || []); // Update existing gallery
        setGalleryPreviews([]); // Clear new file previews
      }
      // Revoke temporary object URLs for gallery previews to prevent memory leaks
      galleryPreviews.forEach(p => URL.revokeObjectURL(p.url));


    } catch (err) {
      console.error("Product submission failed:", err);
      const errorMessage = err.message || (isEdit ? "Failed to update product" : "Failed to add product");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p>Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 overflow-y-auto py-10">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
        <h2 className="text-2xl font-bold text-pink-600 mb-6 text-center">
          {isEdit ? "Edit Product" : "Add Product"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input name="name" value={form.name} onChange={handleChange} placeholder="Chocolate Cake" required disabled={loading} />
          </div>
          <div>
            <Label>Price (₹)</Label>
            <Input type="number" name="price" value={form.price} onChange={handleChange} placeholder="500" required disabled={loading} />
          </div>

          {/* Category Dropdown */}
          <div>
            <Label htmlFor="category_id">Category</Label>
            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
              disabled={loading || categories.length === 0}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-input border rounded-md focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-transparent disabled:opacity-50"
            >
              <option value="" disabled>Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && !loadingData && <p className="text-xs text-red-500 mt-1">No categories loaded. <a href="/admin/categories" className="underline">Add categories here</a>.</p>}
          </div>

          {/* Unit Dropdown */}
          <div>
            <Label htmlFor="unit_id">Unit</Label>
            <select
              id="unit_id"
              name="unit_id"
              value={form.unit_id}
              onChange={handleChange}
              required
              disabled={loading || units.length === 0}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-input border rounded-md focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-transparent disabled:opacity-50"
            >
              <option value="" disabled>Select a unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.description || 'No description'})
                </option>
              ))}
            </select>
            {units.length === 0 && !loadingData && <p className="text-xs text-red-500 mt-1">No units loaded. <a href="/admin/units" className="underline">Add units here</a>.</p>}
          </div>

          <div>
            <Label htmlFor="quantity">Base Quantity / Size (Optional)</Label>
            <Input
              id="quantity"
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              placeholder="e.g., 500 (if unit is 'g')"
              disabled={loading}
              step="any" // Allow decimals if needed
            />
            <p className="text-xs text-gray-500 mt-1">Enter the base amount this price corresponds to (e.g., 500 for 500g).</p>
          </div>

          {/* NEW Quantity Control Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="min_quantity">Min Quantity</Label>
              <Input id="min_quantity" type="number" name="min_quantity" value={form.min_quantity} onChange={handleChange} placeholder="e.g., 0.5" disabled={loading} step="any" />
            </div>
            <div>
              <Label htmlFor="max_quantity">Max Quantity (Optional)</Label>
              <Input id="max_quantity" type="number" name="max_quantity" value={form.max_quantity} onChange={handleChange} placeholder="e.g., 5" disabled={loading} step="any" />
            </div>
            <div>
              <Label htmlFor="quantity_step">Quantity Step</Label>
              <Input id="quantity_step" type="number" name="quantity_step" value={form.quantity_step} onChange={handleChange} placeholder="e.g., 0.5" disabled={loading} step="any" />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">Define purchase increments (e.g., Min 0.5, Step 0.5 for kg; Min 50, Step 50 for g; Min 1, Step 1 for pcs). Leave blank to use defaults.</p>
          <div>
            <Label>Description</Label>
            <Textarea name="description" value={form.description} onChange={handleChange} placeholder="Delicious dark chocolate cake" rows={4} required disabled={loading} />
          </div>
          <div>
            <Label>Image</Label>
            <Input type="file" name="image" accept="image/*" onChange={handleChange} disabled={loading} />
            {preview && (
              <img src={preview} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg border border-gray-200" />
            )}
          </div>

          {/* Gallery Images */}
          <div>
            <Label htmlFor="gallery-images">Gallery Images (Optional)</Label>
            <Input id="gallery-images" type="file" name="images" accept="image/*" multiple onChange={handleGalleryImagesChange} disabled={loading} />

            {/* Display Existing Gallery Images (for Edit mode) */}
            {isEdit && existingGalleryImages.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {existingGalleryImages.map(img => (
                  <div key={img.id} className="relative group">
                    <img src={img.image_url} alt="Existing gallery" className="w-full h-24 object-cover rounded border" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeExistingGalleryImage(img.id)}
                      aria-label="Delete existing gallery image"
                      disabled={loading}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Display New Gallery Image Previews */}
            {galleryPreviews.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {galleryPreviews.map((p, index) => (
                  <div key={index} className="relative group">
                    <img src={p.url} alt={`New gallery preview ${index + 1}`} className="w-full h-24 object-cover rounded border" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeNewGalleryImage(p)}
                      aria-label="Remove new gallery image"
                      disabled={loading}
                    >
                      <XCircle size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-center text-sm">{error}</p>}

          <div className="flex justify-between items-center mt-6">
            <Button type="submit" disabled={loading || loadingData} className="bg-pink-600 hover:bg-pink-700 text-white w-full">
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isEdit ? "Updating..." : "Adding..."}</>) : (isEdit ? "Update Product" : "Add Product")}
            </Button>
          </div>
          {onCancel && (
            <Button type="button" onClick={onCancel} variant="outline" className="mt-3 w-full" disabled={loading}>
              Cancel
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}