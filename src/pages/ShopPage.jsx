import React, { useEffect, useState } from "react";
import { apiFetch } from "../Context/apiFetch"; //
import Navbar from "../components/self/Navbar"; //
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; //
import { Button } from "@/components/ui/button"; //
import { toast, Toaster } from "sonner"; // Using sonner for notifications

// Helper function to add item to cart in localStorage
const addToCart = (product) => {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existingItemIndex = cart.findIndex((item) => item.id === product.id);

  if (existingItemIndex > -1) {
    // Increase quantity if item already exists
    cart[existingItemIndex].quantity += 1;
  } else {
    // Add new item with quantity 1
    cart.push({ ...product, quantity: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  toast.success(`${product.name} added to cart!`); // Use toast notification
};


export default function ShopPage() { // Renamed component for clarity
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch("http://localhost:3000/api/products"); //
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Could not load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-yellow-50 to-pink-50 dark:from-zinc-900 dark:to-pink-950">
      <Navbar /> {/* */}
      <Toaster richColors position="top-center" /> {/* Add Toaster component */}
      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center text-pink-700 dark:text-pink-300 mb-10">
          Our Delights
        </h1>

        {loading && <p className="text-center text-zinc-500">Loading goodies...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {products.length > 0 ? (
              products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow duration-300 dark:bg-zinc-800 flex flex-col">
                  <CardHeader className="p-0">
                    <img
                      src={product.image || 'https://via.placeholder.com/400x300?text=No+Image'}
                      alt={product.name}
                      className="rounded-t-lg w-full h-48 object-cover"
                    />
                  </CardHeader>
                  <CardContent className="p-4 flex flex-col flex-grow">
                    <CardTitle className="text-lg font-semibold mb-1 text-zinc-900 dark:text-zinc-100 flex-grow">
                      {product.name}
                    </CardTitle>
                    <p className="text-pink-600 dark:text-pink-400 font-bold my-2">
                      ₹{product.price}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                      {product.description || 'Deliciously baked item.'}
                    </p>
                    <Button
                      onClick={() => addToCart(product)}
                      className="w-full mt-auto bg-pink-600 hover:bg-pink-700 text-white dark:bg-pink-500 dark:hover:bg-pink-600"
                    >
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-zinc-500 col-span-full">No products available right now.</p>
            )}
          </div>
        )}
      </main>
      {/* Optional Footer can be added here */}
    </div>
  );
}