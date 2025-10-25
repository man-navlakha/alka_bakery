import React, { useEffect, useState } from "react";
import { apiFetch } from "../../Context/apiFetch";
import { toast } from "sonner";

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
        toast.error("Failed to load product");
        onClose();
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    toast.success(`${product.name} added to cart`);
    onAddToCart?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-3xl mx-4 overflow-hidden">
        {loading ? <div className="p-8 text-center">Loading…</div> : (
          <div className="grid md:grid-cols-2">
            <img src={product.image || 'https://via.placeholder.com/600x400?text=No+Image'} alt={product.name} className="object-cover w-full h-80"/>
            <div className="p-6 flex flex-col gap-4">
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <div className="text-pink-600 text-xl font-semibold">₹{product.price}</div>
              <p className="text-sm text-zinc-600 line-clamp-4">{product.description}</p>

              <div className="flex gap-2 items-center mt-auto">
                <button onClick={addToCart} className="bg-pink-600 text-white px-4 py-2 rounded">Add to cart</button>
                <button onClick={() => window.location.href = `/product/${product.id}`} className="border px-4 py-2 rounded">Open product page</button>
                <button onClick={onClose} className="ml-auto text-sm text-zinc-500">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
