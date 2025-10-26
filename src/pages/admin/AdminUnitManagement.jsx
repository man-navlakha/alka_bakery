// src/pages/admin/AdminUnitManagement.jsx

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

// --- Unit Form Component ---
const UnitForm = ({ unit, onSave, onCancel }) => {
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(unit && unit.id);

  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name || "",
        description: unit.description || "",
      });
    } else {
      setFormData({ name: "", description: "" }); // Reset for adding
    }
  }, [unit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEdit
        ? `http://localhost:3000/api/units/${unit.id}` // Assuming PUT endpoint exists
        : "http://localhost:3000/api/units";
      const method = isEdit ? "PUT" : "POST";

      const result = await apiFetch(url, {
        method: method,
        body: JSON.stringify(formData),
      });

      onSave(result); // Pass the saved/updated unit back
      toast.success(`Unit ${isEdit ? "updated" : "added"} successfully!`);
    } catch (err) {
      console.error("Failed to save unit:", err);
      setError(err.message || `Failed to ${isEdit ? "update" : "add"} unit.`);
      toast.error(err.message || `Failed to ${isEdit ? "update" : "add"} unit.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Unit" : "Add New Unit"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., kg, pcs, g"
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
            placeholder="e.g., Kilograms, Pieces"
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
              "Update Unit"
            ) : (
              "Add Unit"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

// --- Main Unit Management Page ---
export default function AdminUnitManagement() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null); // null for add, object for edit

  const fetchUnits = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("http://localhost:3000/api/units");
      setUnits(data || []); // Ensure it's an array
    } catch (err) {
      console.error("Failed to fetch units:", err);
      setError("Could not load units. Please try again.");
      toast.error("Failed to load units.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return;

    try {
      // Assuming DELETE endpoint exists
      await apiFetch(`http://localhost:3000/api/units/${id}`, {
        method: "DELETE",
      });
      setUnits(units.filter((unit) => unit.id !== id));
      toast.success("Unit deleted successfully!");
    } catch (err) {
      console.error("Failed to delete unit:", err);
      toast.error(err.message || "Failed to delete unit.");
      setError(err.message || "Failed to delete unit.");
    }
  };

  const handleOpenModal = (unit = null) => {
    setEditingUnit(unit); // null for add, unit object for edit
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUnit(null); // Clear editing state
  };

  const handleSaveUnit = (savedUnit) => {
    if (editingUnit) {
      // Update existing
      setUnits(
        units.map((unit) =>
          unit.id === savedUnit.id ? savedUnit : unit
        )
      );
    } else {
      // Add new
      setUnits([savedUnit, ...units]);
    }
    handleCloseModal();
  };

  return (
    <div className="p-6">
      <Toaster richColors position="top-center" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Units</h1>
         <div className="flex gap-2">
            <Button onClick={fetchUnits} variant="outline" size="sm" disabled={loading}>
                <RefreshCw
                    className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
            </Button>
            <Button
              onClick={() => handleOpenModal()} // Open modal in "add" mode
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Unit
            </Button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          <p className="ml-2 text-zinc-600">Loading units...</p>
        </div>
      )}

      {error && <p className="text-center py-10 text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          {units.length > 0 ? (
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
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">
                      {unit.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                      {unit.name}
                    </td>
                     <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={unit.description || ''}>
                      {unit.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm space-x-2">
                       {/* Assuming Edit/Delete endpoints exist, otherwise remove buttons */}
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleOpenModal(unit)}
                         className="text-blue-600 border-blue-600 hover:bg-blue-50"
                         aria-label={`Edit ${unit.name}`}
                       >
                         <Edit size={16} />
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleDelete(unit.id)}
                         className="text-red-600 border-red-600 hover:bg-red-50"
                         aria-label={`Delete ${unit.name}`}
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
              No units found. Add one!
            </p>
          )}
        </div>
      )}

      {/* Add/Edit Unit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <UnitForm
            key={editingUnit?.id || 'new'}
            unit={editingUnit}
            onSave={handleSaveUnit}
            onCancel={handleCloseModal}
        />
      </Dialog>
    </div>
  );
}