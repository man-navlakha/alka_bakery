import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../Context/apiFetch";
import { Button } from "@/components/ui/button";
import Navbar from "./Navbar";
import { toast } from "sonner";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const data = await apiFetch(`http://localhost:3000/api/products/${id}`);
      setProduct(data);
    };
    fetchProduct();
  }, [id]);

  if (!product) return <p className="text-center py-10">Loading...</p>;

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((i) => i.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-pink-50 dark:from-zinc-900 dark:to-pink-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-8">
        <img
          src={product.image || "https://via.placeholder.com/600x400?text=No+Image"}
          alt={product.name}
          className="rounded-lg shadow-lg object-cover w-full h-96"
        />
        <div>
          <h1 className="text-3xl font-bold mb-4 text-pink-700">{product.name}</h1>
          <p className="text-lg mb-4 text-gray-700 dark:text-gray-300">{product.description}</p>
          <p className="text-2xl font-semibold text-pink-600 mb-6">₹{product.price}</p>
          <Button onClick={addToCart} className="bg-pink-600 hover:bg-pink-700 text-white">
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
