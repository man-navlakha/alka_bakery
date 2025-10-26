// src/pages/admin/AdminCategoryManagement.jsx

import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Context/apiFetch"; // Utility for authorized API calls
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw, Edit, Trash2, PlusCircle } from "lucide-react";

// --- Category Form Component (inside the same file or separate) ---
const CategoryForm = ({ category, onSave, onCancel }) => {
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(category && category.id);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
      });
    } else {
      setFormData({ name: "", description: "" }); // Reset for adding
    }
  }, [category]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEdit
        ? `http://localhost:3000/api/categories/${category.id}`
        : "http://localhost:3000/api/categories";
      const method = isEdit ? "PUT" : "POST";

      const result = await apiFetch(url, {
        method: method,
        body: JSON.stringify(formData),
      });

      onSave(result); // Pass the saved/updated category back
      toast.success(
        `Category ${isEdit ? "updated" : "added"} successfully!`
      );
    } catch (err) {
      console.error("Failed to save category:", err);
      setError(err.message || `Failed to ${isEdit ? "update" : "add"} category.`);
      toast.error(err.message || `Failed to ${isEdit ? "update" : "add"} category.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Category" : "Add New Category"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Cakes, Cookies"
            required
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the category"
            rows={3}
            disabled={loading}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading} onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700 text-white">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : isEdit ? (
              "Update Category"
            ) : (
              "Add Category"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

// --- Main Category Management Page ---
export default function AdminCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null for add, object for edit

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("http://localhost:3000/api/categories");
      setCategories(data || []); // Ensure it's an array
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError("Could not load categories. Please try again.");
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await apiFetch(`http://localhost:3000/api/categories/${id}`, {
        method: "DELETE",
      });
      setCategories(categories.filter((cat) => cat.id !== id));
      toast.success("Category deleted successfully!");
    } catch (err) {
      console.error("Failed to delete category:", err);
      toast.error(err.message || "Failed to delete category.");
      setError(err.message || "Failed to delete category.");
    }
  };

  const handleOpenModal = (category = null) => {
    setEditingCategory(category); // null for add, category object for edit
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null); // Clear editing state
  };

  const handleSaveCategory = (savedCategory) => {
    if (editingCategory) {
      // Update existing
      setCategories(
        categories.map((cat) =>
          cat.id === savedCategory.id ? savedCategory : cat
        )
      );
    } else {
      // Add new
      setCategories([savedCategory, ...categories]);
    }
    handleCloseModal();
  };

  return (
    <div className="p-6">
      <Toaster richColors position="top-center" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Categories</h1>
        <div className="flex gap-2">
            <Button onClick={fetchCategories} variant="outline" size="sm" disabled={loading}>
                <RefreshCw
                    className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
            </Button>
            <Button
              onClick={() => handleOpenModal()} // Open modal in "add" mode
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
            </Button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          <p className="ml-2 text-zinc-600">Loading categories...</p>
        </div>
      )}

      {error && <p className="text-center py-10 text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          {categories.length > 0 ? (
            <table className="w-full min-w-[500px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">
                      {cat.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={cat.description || ''}>
                      {cat.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm space-x-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleOpenModal(cat)} // Open modal in "edit" mode
                         className="text-blue-600 border-blue-600 hover:bg-blue-50"
                         aria-label={`Edit ${cat.name}`}
                       >
                         <Edit size={16} />
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleDelete(cat.id)}
                         className="text-red-600 border-red-600 hover:bg-red-50"
                         aria-label={`Delete ${cat.name}`}
                       >
                         <Trash2 size={16} />
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No categories found. Add one!
            </p>
          )}
        </div>
      )}

      {/* Add/Edit Category Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {/*
          Render the form conditionally or always, passing the correct props.
          Passing `key` based on `editingCategory?.id` helps reset form state
          when switching between adding and editing.
        */}
        <CategoryForm
            key={editingCategory?.id || 'new'}
            category={editingCategory}
            onSave={handleSaveCategory}
            onCancel={handleCloseModal}
        />
      </Dialog>
    </div>
  );
}