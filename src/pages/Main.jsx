import React, { useEffect, useState } from 'react';
import Navbar from '../components/self/Navbar'; //
import ContactForm from '../components/self/ContactForm'; //
import { Button } from '@/components/ui/button'; //
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; //
import { Link } from 'react-router-dom';
import { apiFetch } from "../Context/apiFetch"; //
import Aurora from '@/components/Aurora'; //
import SplitText from '@/components/SplitText'; //
import { motion } from 'framer-motion'; // Assuming framer-motion is installed (it's in package.json)

// Simple Footer Component (Reusing from original)
const Footer = () => (
    <footer className="bg-pink-100 dark:bg-zinc-800 text-center p-6 mt-20">
        <p className="text-sm text-pink-700 dark:text-pink-300">
            &copy; {new Date().getFullYear()} Alka Bakery. Freshly Baked Happiness. ✨
        </p>
        {/* Add social media links or other info if desired */}
    </footer>
);

// --- Redesigned Main Home Page ---
const Main = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            setLoading(true);
            try {
                const allProducts = await apiFetch("http://localhost:3000/api/products");
                setFeaturedProducts(allProducts.slice(0, 4));
            } catch (error) {
                console.error("Failed to fetch featured products:", error);
                // Optionally set an error state here
            } finally {
                setLoading(false);
            }
        };
        fetchFeatured();
    }, []);

    // Animation variants for Framer Motion
    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.5,
                ease: "easeOut"
            }
        })
    };

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-yellow-50 via-white to-pink-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-pink-950">
           {/* ... (Navbar, Hero, Promise sections remain the same) ... */}
           <Navbar />

            {/* Hero Section */}
            <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center text-center overflow-hidden px-4">
                {/* ... Aurora and motion.div ... */}
                 <div className="absolute inset-0 z-0 opacity-40 dark:opacity-60">
                    <Aurora colorStops={['#FFDAB9', '#FFC0CB', '#FFFACD', '#FFB6C1']} amplitude={0.3} blend={0.8} />
                </div>
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative z-10 max-w-3xl">
                    <SplitText text="Baked Fresh, Just For You 🍰" tag="h1" className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-pink-800 dark:text-pink-200 mb-5 leading-tight" splitType="chars" delay={30} duration={0.5} ease="back.out(1.7)" from={{ opacity: 0, scale: 0.5, y: 50 }} to={{ opacity: 1, scale: 1, y: 0 }} />
                    <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-10 mx-auto max-w-xl">
                        Experience the warmth and delight of Alka Bakery. Every bite is crafted with passion and the finest ingredients.
                    </p>
                    <Link to="/shop">
                        <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white dark:bg-pink-500 dark:hover:bg-pink-600 shadow-lg transform hover:scale-105 transition-transform duration-200 px-8 py-3">
                            Explore Our Menu
                        </Button>
                    </Link>
                </motion.div>
            </section>

             {/* "Our Promise" Section */}
             <section className="py-16 md:py-24 bg-white dark:bg-zinc-800 px-4 sm:px-6 lg:px-8 shadow-inner">
                {/* ... content ... */}
                 <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">Our Promise</h2>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        At Alka Bakery, we believe in the magic of baking. We use traditional recipes, quality ingredients, and a sprinkle of love in everything we create. From celebratory cakes to everyday treats, freshness and flavor are guaranteed. 💖
                    </p>
                </div>
            </section>


            {/* Featured Products Section */}
            <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center text-zinc-800 dark:text-zinc-100 mb-12">
                    Taste Our Favorites
                </h2>
                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
                    </div>
                ) : featuredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                        {featuredProducts.map((product, index) => (
                            <motion.div
                                key={product.id}
                                custom={index}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.3 }}
                                variants={cardVariants}
                            >
                                {/* Using Card component structure */}
                                <Card className="overflow-hidden h-full flex flex-col hover:shadow-xl transition-shadow duration-300 dark:bg-zinc-800 border border-pink-100 dark:border-zinc-700 rounded-xl">
                                    <CardHeader className="p-0">
                                        <img
                                            src={product.image || 'https://via.placeholder.com/400x300?text=Alka+Bakery'}
                                            alt={product.name}
                                            className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                                        />
                                    </CardHeader>
                                    <CardContent className="p-4 flex flex-col flex-grow">
                                         {/* Display Category */}
                                        <p className="text-xs text-pink-500 dark:text-pink-400 font-medium mb-1 uppercase tracking-wide">{product.categories?.name || 'Featured'}</p>
                                        <CardTitle className="text-md font-semibold mb-1 text-zinc-900 dark:text-zinc-100 line-clamp-2">
                                            {product.name}
                                        </CardTitle>
                                        <p className="text-pink-600 dark:text-pink-400 font-bold my-2 text-lg">
                                            ₹{product.price}
                                             {/* Display unit */}
                                             {product.units?.name && (
                                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/{product.units.name}</span>
                                              )}
                                        </p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2 flex-grow min-h-[30px]">
                                            {product.description || 'A delicious treat from Alka Bakery.'}
                                        </p>
                                        <Link to={`/product/${product.id}`} className="mt-auto block"> {/* Link to product page */}
                                            <Button variant="outline" className="w-full border-pink-500 text-pink-500 hover:bg-pink-50 hover:text-pink-600 dark:border-pink-400 dark:text-pink-400 dark:hover:bg-zinc-700 dark:hover:text-pink-300">
                                                View Details
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-zinc-500 dark:text-zinc-400">No featured products available right now. Check back soon!</p>
                )}
                 {/* ... (See Full Menu link remains the same) ... */}
                 <div className="text-center mt-16">
                   <Link to="/shop">
                       <Button variant="link" size="lg" className="text-pink-600 dark:text-pink-400 text-lg hover:underline">
                           See Full Menu &rarr;
                       </Button>
                   </Link>
                </div>
            </section>

             {/* ... (Contact and Footer remain the same) ... */}
             <section id="contact" className="pt-16 md:pt-24">
                 <ContactForm />
            </section>
            <Footer />
        </div>
    );
}


export default Main;