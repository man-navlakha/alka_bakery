import React, { useEffect,useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from "../Context/apiFetch";
import Aurora from '@/components/Aurora';
import SplitText from '@/components/SplitText';
import ContactForm from '../components/self/ContactForm';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, User, Menu, X, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from "../Context/AuthProvider";

// --- Shared Components for Main Page ---


const Footer = () => (
  <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4 text-white">
            <div className="w-8 h-8 bg-orange-700 rounded-full flex items-center justify-center font-serif font-bold">B</div>
            <span className="text-xl font-serif font-bold">Bakery</span>
        </div>
        <p className="text-sm leading-relaxed max-w-xs">
          Freshly baked artisanal breads, cookies, and cakes crafted with passion and premium ingredients daily.
        </p>
      </div>
      <div>
        <h4 className="text-white font-serif font-bold mb-4">Quick Links</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/shop" className="hover:text-orange-500 transition">Full Menu</Link></li>
          <li><Link to="/tracking" className="hover:text-orange-500 transition">Track Order</Link></li>
          <li><a href="#contact" className="hover:text-orange-500 transition">Contact Us</a></li>
        </ul>
      </div>
      <div>
         <h4 className="text-white font-serif font-bold mb-4">Visit Us</h4>
         <p className="text-sm mb-2">123 Baker Street, Food District</p>
         <p className="text-sm text-orange-500 font-medium">Open Daily: 8 AM - 9 PM</p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-stone-800 text-center text-xs">
      &copy; {new Date().getFullYear()} Alka Bakery. All rights reserved.
    </div>
  </footer>
);

const ProductCardMain = ({ product }) => {
     const displayPrice = useMemo(() => {
        if (product.unit === "gm") return `₹${product.price_per_100g}/100g`;
        if (product.unit === "pc") return `₹${product.price_per_pc}`;
        if (product.unit === "variant") return `From ₹${product.unit_options?.[0]?.price}`;
        return "";
      }, [product]);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white rounded-xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="relative h-56 overflow-hidden bg-stone-100">
          <img src={product.product_images?.[0].url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide shadow-sm text-stone-800">
          {product.categories?.name || 'Featured'}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-serif font-bold text-lg text-stone-900 leading-tight group-hover:text-orange-700 transition-colors">
            {product.name}
          </h3>
          <div className="font-bold text-orange-800">
            {displayPrice}
          </div>
        </div>
        <p className="text-sm text-stone-500 line-clamp-2 mb-4 flex-grow">
          {product.description || 'A delicious artisanal treat baked fresh for you.'}
        </p>
        <Link to={`/product/${product.id}`} className="mt-auto">
          <Button variant="outline" className="w-full border-stone-200 text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all">
            View Details
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

// --- Main Page Component ---

export default function Main() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const allProducts = await apiFetch('http://localhost:3000/api/products/');
        // Just take first 3 items for a clean featured row
        setFeaturedProducts(allProducts ? allProducts.slice(0, 3) : []);
      } catch (error) {
        console.error("Featured fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 font-sans text-stone-800 selection:bg-orange-100 selection:text-orange-900">
      
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Warm Aurora Background */}
        <div className="absolute inset-0 z-0 opacity-60">
            <Aurora colorStops={['#ffedd5', '#fff7ed', '#fed7aa']} amplitude={0.5} blend={0.7} />
        </div>
        
        <div className="relative z-10 container px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className="inline-block mb-4 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold tracking-widest uppercase">
                    Est. 2025
                </div>
                <SplitText 
                    text="Baked with Joy" 
                    tag="h1" 
                    className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-stone-900 mb-6 tracking-tight" 
                    splitType="words" 
                    delay={40} 
                />
                <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Artisanal sourdough, rich cookies, and decadent cakes. <br className="hidden md:block"/>
                    Crafted daily with premium ingredients and traditional methods.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/shop">
                        <Button size="lg" className="bg-stone-900 text-white hover:bg-orange-700 h-14 px-8 rounded-full text-base shadow-xl shadow-stone-200 transition-all transform hover:-translate-y-1">
                            Browse Menu
                        </Button>
                    </Link>
                    <a href="#featured">
                        <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-base border-stone-300 text-stone-700 hover:bg-white hover:text-orange-700">
                            View Favorites
                        </Button>
                    </a>
                </div>
            </motion.div>
        </div>
      </section>


      {/* "Our Promise" Section */}
      <section className="py-20 bg-white border-y border-stone-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
              <Star className="w-8 h-8 text-orange-500 mx-auto mb-6 fill-current opacity-80" />
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-6">The Bakery Promise</h2>
              <p className="text-lg text-stone-600 leading-relaxed">
                  We believe that real baking requires real patience. Our sourdough is fermented for 48 hours, 
                  our butter is pure, and we never use preservatives. Every bite you take is a testament to 
                  the craft we've perfected over years of dedication.
              </p>
          </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
              <div>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900">Daily Favorites</h2>
                  <p className="text-stone-500 mt-2">Fresh from the oven this morning.</p>
              </div>
              <Link to="/shop" className="hidden md:flex items-center text-orange-700 font-medium hover:text-stone-900 transition">
                  View Full Menu <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
          </div>

          {loading ? (
              <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {featuredProducts.length > 0 ? (
                      featuredProducts.map((p) => <ProductCardMain key={p.id} product={p} />)
                  ) : (
                      <div className="col-span-3 text-center py-10 bg-stone-100 rounded-xl border border-dashed border-stone-300 text-stone-500">
                          Items are currently sold out. Check back tomorrow!
                      </div>
                  )}
              </div>
          )}

          <div className="mt-12 text-center md:hidden">
              <Link to="/shop">
                  <Button variant="outline" className="w-full border-stone-300">View All Products</Button>
              </Link>
          </div>
      </section>

      {/* Contact / CTA Section */}
      <section id="contact" className="py-24 bg-orange-50 border-t border-orange-100">
          <div className="max-w-3xl mx-auto px-6">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-serif font-bold text-stone-900 mb-4">Get in Touch</h2>
                  <p className="text-stone-600">
                      Need a custom cake for a special occasion? Or just want to say hi?
                      <br />Drop us a message below.
                  </p>
              </div>
                 <ContactForm />
          </div>
      </section>

      <Footer />
    </div>
  );
}