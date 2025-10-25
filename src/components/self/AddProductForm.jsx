import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AddProductForm({ product, onProductAdded, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState(null); // image preview
  const token = localStorage.getItem("token");
  const isEdit = Boolean(product);

  // Populate form if editing
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        price: product.price || "",
        category: product.category || "",
        description: product.description || "",
        image: null, // new image will replace old
      });
      setPreview(product.image || null);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm({ ...form, image: files[0] });
      setPreview(files[0] ? URL.createObjectURL(files[0]) : preview);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("category", form.category);
      formData.append("description", form.description);
      if (form.image) formData.append("image", form.image);

      const res = await fetch(
        isEdit
          ? `http://localhost:3000/api/products/${product.id}`
          : "http://localhost:3000/api/products",
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      setSuccess(isEdit ? "Product updated successfully!" : "Product added successfully!");
      onProductAdded?.(data);
      if (!isEdit) setForm({ name: "", price: "", category: "", description: "", image: null });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
        <h2 className="text-2xl font-bold text-pink-600 mb-6 text-center">
          {isEdit ? "Edit Product" : "Add Product"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Chocolate Cake"
              required
            />
          </div>

          <div>
            <Label>Price (₹)</Label>
            <Input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="500"
              required
            />
          </div>

          <div>
            <Label>Category</Label>
            <Input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Cakes"
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Delicious dark chocolate cake"
              rows={4}
              required
            />
          </div>

          <div>
            <Label>Image</Label>
            <Input type="file" name="image" accept="image/*" onChange={handleChange} />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 w-full h-48 object-cover rounded-lg border border-gray-200"
              />
            )}
          </div>

          {error && <p className="text-red-600 text-center">{error}</p>}
          {success && <p className="text-green-600 text-center">{success}</p>}

          <div className="flex justify-between items-center mt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-pink-600 hover:bg-pink-700 text-white w-full"
            >
              {loading ? (isEdit ? "Updating..." : "Adding...") : isEdit ? "Update" : "Add"}
            </Button>
          </div>

          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              className="mt-3 w-full bg-gray-200 hover:bg-gray-300 text-gray-900"
            >
              Cancel
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
