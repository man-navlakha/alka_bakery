import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiFetch } from "../../Context/apiFetch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AddProductForm({ product, onProductAdded, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category_id: "",
    unit_id: "",
    description: "",
    image: null,
  });
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingData, setLoadingData] = useState(true); // Loading state for dropdown data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
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
  }, []);// Populate form if editing
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        price: product.price || "",
        category_id: product.category_id || "", // Use category_id
        unit_id: product.unit_id || "",         // Use unit_id
        description: product.description || "",
        image: null,
      });
      setPreview(product.image || null);
    } else {
      // Reset form for adding, potentially setting default category/unit if desired
      setForm({ name: "", price: "", category_id: "", unit_id: "", description: "", image: null });
      setPreview(null);
    }
  }, [product, categories, units]); // Re-run if categories/units load after product

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === "file") {
      setForm({ ...form, image: files[0] });
      setPreview(files[0] ? URL.createObjectURL(files[0]) : (product?.image || null)); // Keep existing preview if no new file
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_id) {
      setError("Please select a category.");
      toast.error("Please select a category.");
      return;
    }
    if (!form.unit_id) {
      setError("Please select a unit.");
      toast.error("Please select a unit.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("category_id", form.category_id); // Send category_id
      formData.append("unit_id", form.unit_id);         // Send unit_id
      formData.append("description", form.description);

      if (form.image instanceof File) {
        formData.append("image", form.image);
      }

      const url = isEdit
        ? `http://localhost:3000/api/products/${product.id}`
        : "http://localhost:3000/api/products";
      const method = isEdit ? "PUT" : "POST";

      const data = await apiFetch(url, { method: method, body: formData });
      const resultProduct = data.product || data;

      // Manually add category/unit names for immediate display update if needed
      // (Ideally, the backend response includes these nested objects)
      if (!resultProduct.categories && categories.length > 0) {
        const category = categories.find(c => c.id === parseInt(resultProduct.category_id));
        if (category) resultProduct.categories = { name: category.name };
      }
      if (!resultProduct.units && units.length > 0) {
        const unit = units.find(u => u.id === parseInt(resultProduct.unit_id));
        if (unit) resultProduct.units = { name: unit.name };
      }

      const successMessage = isEdit ? "Product updated successfully!" : "Product added successfully!";
      toast.success(successMessage);
      onProductAdded?.(resultProduct);

      // Don't reset form if editing
      if (!isEdit) {
        setForm({ name: "", price: "", category_id: "", unit_id: "", description: "", image: null });
        setPreview(null);
      } else {
        // If editing, ensure the preview reflects the potentially updated image (or lack thereof)
        setPreview(resultProduct.image || null)
        setForm(prev => ({ ...prev, image: null })); // Clear the file input state after successful upload
      }

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