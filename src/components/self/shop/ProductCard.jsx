import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "../../../Context/apiFetch"; // updated import

export default function ProductCard({ product, onQuickView, onOpenCart }) {
  const navigate = useNavigate();
  const addToCart = async (product) => {
    try {
      // Call backend to add item to cart
      await apiFetch("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      toast.success(`${product.name} added to cart`);

      // Optionally, refresh cart sidebar
      onOpenCart?.();

    } catch (err) {
      console.error(err);
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col">
      <div className="relative overflow-hidden cursor-pointer group" onClick={() => navigate(`/product/${product.id}`)}>
        <img src={product.image || "https://via.placeholder.com/400x300?text=No+Image"} alt={product.name} className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105" />
        {/* Optional: Add overlay on hover */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-grow">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium text-sm leading-snug">{product.name}</h3>
          <div className="text-pink-600 font-semibold text-sm whitespace-nowrap">₹{product.price}</div>
        </div>
        {/* Display Category Name */}
        <p className="text-xs text-gray-500 dark:text-gray-400">{product.categories?.name || 'Uncategorized'}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 flex-grow">{product.description}</p>

        <div className="mt-auto flex gap-2 pt-2">
          <Button onClick={() => addToCart(product)} size="sm" className="flex-1 bg-pink-600 text-white hover:bg-pink-700">Add</Button>
          <Button onClick={() => onQuickView(product.id)} size="sm" variant="outline" className="flex-1">Quick View</Button>
        </div>
      </div>
    </div>
  );
}