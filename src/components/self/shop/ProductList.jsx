import React, { useEffect, useState } from "react";
import AddProductForm from "../AddProductForm";
import { Button } from "@/components/ui/button";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState(null); // null = add, object = edit
  const token = localStorage.getItem("token");

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`http://localhost:3000/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete product");
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProductAddedOrUpdated = (newProduct) => {
    const exists = products.find((p) => p.id === newProduct.id);
    if (exists) {
      setProducts(products.map((p) => (p.id === newProduct.id ? newProduct : p)));
    } else {
      setProducts([newProduct, ...products]);
    }
    setModalProduct(null);
  };

  if (loading) return <p className="text-center py-10">Loading products...</p>;

  return (
    <div className="relative py-8 max-w-6xl mx-auto">
      {/* Add Product Button */}
      <Button
        onClick={() => setModalProduct({})} // empty object signals "add new"
        className="fixed bottom-8 right-8 bg-pink-600 hover:bg-pink-700 text-white rounded-full shadow-lg px-6 py-3 z-50"
      >
        + Add Product
      </Button>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-xl p-4 shadow hover:shadow-lg transition-all relative"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover rounded-lg mb-3"
            />
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-gray-600">{product.category}</p>
            <p className="text-pink-600 font-bold">₹{product.price}</p>
            <p className="text-gray-700 text-sm mt-2">{product.description}</p>

            {/* Edit & Delete Buttons */}
            <div className="flex justify-between mt-4">
              <Button
                onClick={() => setModalProduct(product)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-1 rounded"
              >
                Edit
              </Button>
              <Button
                onClick={() => handleDelete(product.id)}
                className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Product Modal */}
      {modalProduct !== null && (
        <AddProductForm
          product={Object.keys(modalProduct).length === 0 ? null : modalProduct}
          onProductAdded={handleProductAddedOrUpdated}
          onCancel={() => setModalProduct(null)}
        />
      )}
    </div>
  );
}
