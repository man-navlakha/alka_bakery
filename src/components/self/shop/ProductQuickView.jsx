// src/components/self/ProductQuickView.jsx
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../Context/apiFetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; // Added Button import
import { Loader2, X } from "lucide-react"; // Added Icons

export default function ProductQuickView({ id, onClose, onAddToCart }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`http://localhost:3000/api/products/${id}`);
        if (mounted) setProduct(data);
      } catch (err) {
        console.error("Failed to load product", err);
        if (mounted) {
           toast.error("Failed to load product details.");
           onClose(); // Close modal on error
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, onClose]); // Added onClose to dependency array

 const addToCartBackend = async () => { // Renamed to avoid conflict, use backend add
    if (!product) return;
    try {
      await apiFetch("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
        headers: { "Content-Type": "application/json" }
      });
      toast.success(`${product.name} added to cart`);
      onAddToCart?.(); // Trigger cart preview update/open
      onClose(); // Close modal after adding
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to cart");
    }
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-3xl mx-auto overflow-hidden">
        {/* Close Button */}
         <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 z-10"
            aria-label="Close quick view"
         >
           <X size={20} />
         </Button>

        {loading ? (
             <div className="flex items-center justify-center h-80 p-8 text-center">
                 <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
             </div>
        ) : !product ? (
             <div className="p-8 text-center text-red-600">Failed to load product.</div>
        ) : (
          <div className="grid md:grid-cols-2">
            <img src={product.image || 'https://via.placeholder.com/600x400?text=No+Image'} alt={product.name} className="object-cover w-full h-full max-h-[400px] md:max-h-none"/>
            <div className="p-6 flex flex-col gap-3">
               {/* Display Category */}
              <p className="text-xs text-pink-500 dark:text-pink-400 font-medium uppercase tracking-wide">{product.categories?.name || 'Uncategorized'}</p>
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <div className="text-pink-600 text-xl font-semibold">
                ₹{product.price}
                 {/* Display unit */}
                 {product.units?.name && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/{product.units.name}</span>
                  )}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-4 flex-grow min-h-[60px]">{product.description}</p>

              <div className="flex gap-2 items-center mt-auto pt-4 border-t dark:border-zinc-700">
                <Button onClick={addToCartBackend} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white">Add to cart</Button>
                <Button onClick={() => { window.location.href = `/product/${product.id}`; onClose(); }} variant="outline" className="flex-1">View Details</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}