import React, { useEffect, useState } from "react";
import { apiFetch } from "../Context/apiFetch";
import FilterSidebar from "../components/self/shop/FilterSidebar";
import ProductGrid from "../components/self/shop/ProductGrid";
import ProductQuickView from "../components/self/shop/ProductQuickView";
// import CartPreview from "../components/self/CartPage";
import Navbar from "../components/self/Navbar";
import { Toaster } from "sonner";

  export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]); // Will store fetched categories {id, name}
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  // Quick view modal
  const [quickId, setQuickId] = useState(null);

  // Cart drawer
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingProducts(true);
      setLoadingCategories(true);
      try {
        const [productsData, categoriesData] = await Promise.all([
           apiFetch("http://localhost:3000/api/products"),
           apiFetch("http://localhost:3000/api/categories") // Fetch categories
        ]);

        setProducts(productsData || []);
        setFiltered(productsData || []);
        setCategories(categoriesData || []); // Set fetched categories

      } catch (err) {
        console.error("Failed to load initial shop data", err);
        toast.error("Failed to load shop data. Please refresh.");
      } finally {
        setLoadingProducts(false);
        setLoadingCategories(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleFilter = (filters) => {
    let result = [...products];

    if (filters.category) {
        result = result.filter((p) => p.category_id === parseInt(filters.category));
    }
    
    if (filters.priceRange) {
      result = result.filter(
        (p) => Number(p.price) >= filters.priceRange[0] && Number(p.price) <= filters.priceRange[1]
      );
    }
   if (filters.sort) {
      if (filters.sort === "low") result.sort((a, b) => Number(a.price) - Number(b.price));
      if (filters.sort === "high") result.sort((a, b) => Number(b.price) - Number(a.price));
      if (filters.sort === "new") result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Ensure created_at exists
    }
     if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || (p.description||"").toLowerCase().includes(q));
    }


    setFiltered(result);
  };

  const isLoading = loadingProducts || loadingCategories;
return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-pink-50 dark:from-zinc-900 dark:to-pink-950">
      {/* Remove onOpenCart from Navbar */}
      <Navbar />
      <Toaster richColors position="top-center" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12"> {/* Added pt-24 */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-72">
            <FilterSidebar categories={categories} onFilterChange={handleFilter} />
          </div>
          <div className="flex-1">
             {/* Remove onOpenCart from ProductGrid */}
            <ProductGrid
                products={filtered}
                loading={loadingProducts}
                onQuickView={(id) => setQuickId(id)}
            />
          </div>
        </div>
      </main>

       {/* Remove onAddToCart prop from ProductQuickView if it only opened the cart */}
      {quickId && <ProductQuickView id={quickId} onClose={() => setQuickId(null)} />}

      {/* Remove CartPreview component */}
    </div>
  );
}