import React, { useEffect, useState } from "react";
import AddProductForm from "../../components/self/AddProductForm"; // Adjust path
import { Button } from "@/components/ui/button"; // Adjust path
import { apiFetch } from "../../Context/apiFetch"; // Use apiFetch for consistency
import { toast, Toaster } from "sonner"; // For notifications
import { Edit, Trash2, PlusCircle, Loader2 } from 'lucide-react'; // Icons

export default function AdminProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalProduct, setModalProduct] = useState(null); // null = closed, {} = add, object = edit

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      // Use apiFetch (GET is default, no options needed for public route)
      const data = await apiFetch("http://localhost:3000/api/products");
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Could not load products. Please try again.");
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []); // Fetch on component mount

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      // apiFetch automatically includes Auth token for DELETE
      await apiFetch(`http://localhost:3000/api/products/${id}`, {
        method: "DELETE",
      });
      setProducts(products.filter((p) => p.id !== id));
      toast.success("Product deleted successfully!");
    } catch (err) {
      console.error("Failed to delete product:", err);
      toast.error(err.message || "Failed to delete product.");
      setError(err.message || "Failed to delete product.");
    }
  };

  // Called when AddProductForm successfully adds or updates
  const handleProductAddedOrUpdated = (newOrUpdatedProduct) => {
    const exists = products.find((p) => p.id === newOrUpdatedProduct.id);
    if (exists) {
      // Update existing product in the list
      setProducts(
        products.map((p) => (p.id === newOrUpdatedProduct.id ? newOrUpdatedProduct : p))
      );
    } else {
      // Add new product to the beginning of the list
      setProducts([newOrUpdatedProduct, ...products]);
    }
    setModalProduct(null); // Close the modal
    // Toast notification is handled within AddProductForm on success
  };

  return (
    <div className="relative">
      <Toaster richColors position="top-center" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <Button
          onClick={() => setModalProduct({})} // Open modal in "add new" mode
          className="bg-pink-600 hover:bg-pink-700 text-white"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          <p className="ml-2 text-zinc-600">Loading products...</p>
        </div>
      )}
      {error && <p className="text-center py-10 text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.length > 0 ? products.map((product) => (
            <div
              key={product.id}
              className="border rounded-xl p-4 shadow bg-white flex flex-col justify-between hover:shadow-lg transition-shadow"
            >
              <div>
                <img
                  src={product.image || 'https://via.placeholder.com/400x300?text=No+Image'} // Placeholder
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
                <h3 className="text-md font-semibold text-gray-800">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.category}</p>
                <p className="text-pink-600 font-bold mt-1">₹{product.price}</p>
                <p className="text-gray-600 text-xs mt-2 line-clamp-3">{product.description}</p>
              </div>

              {/* Edit & Delete Buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalProduct(product)} // Open modal in "edit" mode
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  aria-label={`Edit ${product.name}`}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  aria-label={`Delete ${product.name}`}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          )) : <p className="col-span-full text-center text-gray-500">No products found. Add one!</p>}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {modalProduct !== null && (
        <AddProductForm
          // Pass null if adding, or the product object if editing
          product={Object.keys(modalProduct).length === 0 ? null : modalProduct}
          onProductAdded={handleProductAddedOrUpdated}
          onCancel={() => setModalProduct(null)} // Function to close the modal
        />
      )}
    </div>
  );
}