import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiFetch } from "../../Context/apiFetch"; // updated import

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
      <div className="cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
        <img src={product.image || "https://via.placeholder.com/400x300?text=No+Image"} alt={product.name} className="w-full h-44 object-cover" />
      </div>

      <div className="p-4 flex flex-col gap-2 flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-sm">{product.name}</h3>
          <div className="text-pink-600 font-semibold">₹{product.price}</div>
        </div>
        <p className="text-xs text-zinc-500 line-clamp-2">{product.description}</p>

        <div className="mt-auto flex gap-2">
          <button onClick={() => addToCart(product)} className="flex-1 bg-pink-600 text-white py-2 rounded">Add</button>
          <button onClick={() => onQuickView(product.id)} className="flex-1 border py-2 rounded">Quick View</button>
        </div>
      </div>
    </div>
  );
}
