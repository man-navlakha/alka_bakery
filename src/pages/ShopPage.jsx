import React, { useEffect, useState } from "react";
import { apiFetch } from "../Context/apiFetch";
import FilterSidebar from "../components/self/FilterSidebar";
import ProductGrid from "../components/self/ProductGrid";
import ProductQuickView from "../components/self/ProductQuickView";
import CartPreview from "../components/self/CartPage";
import Navbar from "../components/self/Navbar";
import { Toaster } from "sonner";

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick view modal
  const [quickId, setQuickId] = useState(null);

  // Cart drawer
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("http://localhost:3000/api/products");
        setProducts(data);
        setFiltered(data);

        // build categories dynamically
        const cats = Array.from(new Set((data || []).map((p) => p.category).filter(Boolean)));
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleFilter = (filters) => {
    let result = [...products];

    if (filters.category) result = result.filter((p) => p.category === filters.category);
    if (filters.priceRange) {
      result = result.filter(
        (p) => Number(p.price) >= filters.priceRange[0] && Number(p.price) <= filters.priceRange[1]
      );
    }
    if (filters.sort) {
      if (filters.sort === "low") result.sort((a, b) => Number(a.price) - Number(b.price));
      if (filters.sort === "high") result.sort((a, b) => Number(b.price) - Number(a.price));
      if (filters.sort === "new") result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || (p.description||"").toLowerCase().includes(q));
    }

    setFiltered(result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-pink-50 dark:from-zinc-900 dark:to-pink-950">
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <Toaster richColors position="top-center" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-8">
          <div className="w-72 hidden lg:block">
            <FilterSidebar categories={categories} onFilterChange={handleFilter} />
          </div>

          <div className="flex-1">
            <ProductGrid products={filtered} loading={loading} onQuickView={(id) => setQuickId(id)} onOpenCart={() => setCartOpen(true)} />
          </div>
        </div>
      </main>

      {quickId && <ProductQuickView id={quickId} onClose={() => setQuickId(null)} onAddToCart={() => setCartOpen(true)} />}

      <CartPreview open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
