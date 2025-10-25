import React, { useEffect, useState } from 'react';
import Navbar from '../components/self/Navbar'; //
import ContactForm from '../components/self/ContactForm'; //
import { Button } from '@/components/ui/button'; // Assuming you have this
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming you have this
import { apiFetch } from "../Context/apiFetch"; //
// Optional: Use one of your cool background components
// import GradientBlinds from '@/components/GradientBlinds'; //
// import Aurora from '@/components/Aurora'; //

// Simple Footer Component (You can create this in a separate file)
const Footer = () => (
  <footer className="bg-pink-100 dark:bg-zinc-800 text-center p-4 mt-12">
    <p className="text-sm text-pink-700 dark:text-pink-300">
      &copy; {new Date().getFullYear()} Alka Bakery. All rights reserved.
    </p>
  </footer>
);

// --- Redesigned Main Home Page ---
const Main = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Fetch all products and take the first few as featured
        const allProducts = await apiFetch("http://localhost:3000/api/products"); //
        setFeaturedProducts(allProducts.slice(0, 3)); // Show first 3 products
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar /> {/* */}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 text-center bg-gradient-to-br from-yellow-50 to-pink-100 dark:from-zinc-900 dark:to-pink-950 overflow-hidden">
        {/* Optional Background Animation */}
        {/* <div className="absolute inset-0 opacity-30 z-0">
          <GradientBlinds gradientColors={['#FFDAB9', '#FFC0CB', '#FFFACD']} />
        </div> */}
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-pink-700 dark:text-pink-300 mb-4">
            Welcome to Alka Bakery 🍰
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
            Freshly baked delights made with love, delivered right to your doorstep.
          </p>
          <Link to="/shop">
            <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white dark:bg-pink-500 dark:hover:bg-pink-600">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-10">
          Our Best Sellers
        </h2>
        {loading ? (
          <p className="text-center text-zinc-500">Loading goodies...</p>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow duration-300 dark:bg-zinc-800">
                <CardHeader className="p-0">
                  <img
                    src={product.image || 'https://via.placeholder.com/400x300?text=No+Image'} // Fallback image
                    alt={product.name}
                    className="rounded-t-lg w-full h-48 object-cover"
                  />
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg font-semibold mb-1 text-zinc-900 dark:text-zinc-100">
                    {product.name}
                  </CardTitle>
                  <p className="text-pink-600 dark:text-pink-400 font-bold mb-3">
                    ₹{product.price}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                    {product.description || 'Deliciously baked item.'}
                  </p>
                  <Link to={`/shop`}> {/* Link to shop, ideally later to product page */}
                    <Button variant="outline" className="w-full border-pink-500 text-pink-500 hover:bg-pink-50 dark:border-pink-400 dark:text-pink-400 dark:hover:bg-zinc-700">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-zinc-500">No featured products available right now.</p>
        )}
        <div className="text-center mt-12">
           <Link to="/shop">
               <Button variant="link" className="text-pink-600 dark:text-pink-400">
                   View All Products &rarr;
               </Button>
           </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact">
         <ContactForm /> {/* */}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Main;