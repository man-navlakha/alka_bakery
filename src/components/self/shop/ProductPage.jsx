import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../../Context/apiFetch";
import { Button } from "@/components/ui/button";
import Navbar from "../Navbar";
import { Loader2, X } from "lucide-react"; // Added Icons
import { toast } from "sonner";


export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`http://localhost:3000/api/products/${id}`);
        setProduct(data);
      } catch (err) {
          console.error("Failed to fetch product:", err);
          toast.error("Could not load product details.");
          // Optional: navigate back or show error message
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

   const addToCart = async (productToAdd) => { // Updated to use async/await from ProductCard
    if (!productToAdd) return;
    try {
      await apiFetch("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: productToAdd.id, quantity: 1 }),
        headers: { "Content-Type": "application/json" }
      });
      toast.success(`${productToAdd.name} added to cart`);
      // You might want to trigger the cart preview to open here if Navbar has a prop for it
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to cart");
    }
  };


  if (loading) return (
      <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
  );

  if (!product) return <p className="text-center py-10">Product not found.</p>;


  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-pink-50 dark:from-zinc-900 dark:to-pink-950">
      <Navbar /> {/* Assuming Navbar handles cart opening itself */}
      <div className="max-w-5xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-10 items-start">
        <img
          src={product.image || "https://via.placeholder.com/600x400?text=No+Image"}
          alt={product.name}
          className="rounded-lg shadow-lg object-cover w-full aspect-[4/3]" // Use aspect ratio
        />
        <div className="pt-4 md:pt-0">
          {/* Display Category */}
          <p className="text-sm text-pink-500 dark:text-pink-400 font-medium mb-2">{product.categories?.name || 'Uncategorized'}</p>
          <h1 className="text-3xl font-bold mb-4 text-pink-700 dark:text-pink-300">{product.name}</h1>
          <p className="text-lg mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">{product.description}</p>
          <p className="text-2xl font-semibold text-pink-600 mb-6">
            ₹{product.price}
             {/* Display unit */}
             {product.units?.name && (
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/{product.units.name}</span>
              )}
          </p>
          <Button onClick={() => addToCart(product)} size="lg" className="bg-pink-600 hover:bg-pink-700 text-white px-8">
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}