// src/components/self/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search, User, ChevronLeft, LogOut, ShoppingBag, Loader2 } from "lucide-react";
import CartButton from "../cart/CartButton";
import { useAuth } from "../../Context/AuthProvider";

// Use your existing API Base
const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:3000";

export default function Navbar() {
  // --- Hooks ---
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // --- State ---
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchRef = useRef(null); // To detect clicks outside

  // --- Logic ---
  const isHome = location.pathname === "/";

  const navLinks = [
    { label: "HOME", path: "/" },
    { label: "Shop", path: "/shop" },
    // { label: "Gallery", path: "/gallery" }, // Uncomment if needed
  ];

  // --- Search Functionality ---

  // 1. Effect to handle Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setLoadingSearch(true);
        try {
            // Fetch all products and filter client side for smoother suggestions
            // Or replace with specific search endpoint: `${API_BASE}/api/products?search=${searchQuery}`
            const res = await fetch(`${API_BASE}/api/products`);
            if (res.ok) {
                const allProducts = await res.json();
                const filtered = allProducts.filter(p => 
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, 5); // Limit to 5 suggestions
                setSuggestions(filtered);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoadingSearch(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 2. Handle "Enter" Key
  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      setIsSearchOpen(false);
      setSuggestions([]);
      // Redirect to ShopPage with query param
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // 3. Handle Click Outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]); // Close suggestions but keep search bar open if desired
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <>
      <nav className="sticky top-0 z-[999] w-full bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* --- LEFT: Logo OR Back Button --- */}
            <div className="flex items-center">
              {isHome ? (
                <Link to="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-orange-700 rounded-full flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm group-hover:bg-orange-800 transition-colors">
                    B
                  </div>
                  <span className="text-2xl font-serif font-bold text-stone-900 tracking-tight group-hover:text-orange-800 transition-colors">
                    Bakery
                  </span>
                </Link>
              ) : (
                <button 
                  onClick={() => navigate(-1)} 
                  className="flex items-center gap-2 text-stone-500 hover:text-orange-700 transition-colors px-2 py-1 rounded-lg hover:bg-stone-100"
                >
                  <ChevronLeft size={20} />
                  <span className="font-bold text-sm uppercase tracking-wide">Go Back</span>
                </button>
              )}
            </div>

            {/* --- CENTER: Desktop Links --- */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.label} 
                  to={link.path} 
                  className="text-stone-600 hover:text-orange-700 font-medium transition-colors text-sm uppercase tracking-wide"
                >
                  {link.label}
                </Link>
              ))}

               {user?.role === "admin" && (
                   <Link to="/admin" className="text-stone-600 hover:text-orange-700 font-medium transition-colors text-sm uppercase tracking-wide">
                      ADMIN
                   </Link>
                )}
                {user && (
                   <Link to="/orders" className="text-stone-600 hover:text-orange-700 font-medium transition-colors text-sm uppercase tracking-wide">
                      ORDERS
                   </Link>
                )}
            </div>

            {/* --- RIGHT: Actions --- */}
            <div className="hidden md:flex items-center gap-5">
              
              {/* === SEARCH COMPONENT === */}
              <div className="relative" ref={searchRef}>
                <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'w-72 bg-stone-100 px-3 rounded-full border border-stone-200' : 'w-auto'}`}>
                    <button onClick={() => { setIsSearchOpen(!isSearchOpen); setTimeout(() => document.getElementById("global-search")?.focus(), 100); }} className="text-stone-500 hover:text-stone-800 py-2">
                        <Search size={20} />
                    </button>
                    {isSearchOpen && (
                        <input 
                            id="global-search"
                            type="text" 
                            placeholder="Search menu..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchSubmit}
                            className="ml-2 bg-transparent border-none outline-none text-sm w-full h-10 text-stone-700Xx placeholder-stone-400"
                        />
                    )}
                    {isSearchOpen && loadingSearch && <Loader2 size={16} className="animate-spin text-orange-500" />}
                </div>

                {/* Suggestions Dropdown */}
                {isSearchOpen && suggestions.length > 0 && (
                    <div className="absolute top-full mt-2 right-0 w-72 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden py-2 z-50">
                        {suggestions.map((prod) => {
                            // Handle different image structures
                            const imgUrl = prod.product_images?.[0]?.url || prod.images?.[0] || prod.image;
                            return (
                                <Link 
                                    key={prod.id} 
                                    to={`/product/${prod.id}`}
                                    onClick={() => { setIsSearchOpen(false); setSuggestions([]); setSearchQuery(""); }}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-stone-100 rounded-md overflow-hidden shrink-0 border border-stone-100">
                                        {imgUrl ? (
                                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs">🥐</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-stone-800 truncate group-hover:text-orange-700">{prod.name}</p>
                                        <p className="text-xs text-stone-400 truncate">{prod.category}</p>
                                    </div>
                                </Link>
                            );
                        })}
                        <div 
                            onClick={() => handleSearchSubmit({ key: "Enter" })}
                            className="px-4 py-2 text-center text-xs text-orange-600 font-bold border-t border-stone-100 cursor-pointer hover:bg-orange-50"
                        >
                            View all results for "{searchQuery}"
                        </div>
                    </div>
                )}
              </div>
              {/* === END SEARCH COMPONENT === */}


              {/* Auth & Cart */}
              <div className="flex items-center gap-3 border-l border-stone-200 pl-5">
                <CartButton className="pr-6" />

                {user ? (
                  <div className="flex items-center gap-4">
                     <Link to="/profile" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-medium text-sm">
                        <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center border border-orange-200">
                          <User size={16} />
                        </div>
                        <span>{user.name}</span>
                     </Link>
                     <button onClick={logout} title="Logout" className="text-stone-400 hover:text-red-500 transition-colors">
                        <LogOut size={18} />
                     </button>
                  </div>
                ) : (
                  <Link to="/login" className="text-stone-600 hover:text-orange-700 font-bold text-sm transition-colors">
                    Login
                  </Link>
                )}
              </div>
            </div>

            {/* --- Mobile Toggle --- */}
            <button onClick={() => setIsMobileOpen(true)} className="md:hidden text-stone-800 p-2">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* --- Mobile Menu Drawer --- */}
      <div className={`fixed inset-0 z-[999] md:hidden transition-opacity duration-300 ${isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
        <div className={`absolute top-0 right-0 w-3/4 max-w-xs h-full bg-white shadow-2xl transition-transform duration-300 ${isMobileOpen ? "translate-x-0" : "translate-x-full"}`}>
           <div className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                 <span className="font-serif font-bold text-xl text-stone-900">Menu</span>
                 <button onClick={() => setIsMobileOpen(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                   <X size={24} className="text-stone-500" />
                 </button>
              </div>

              <div className="space-y-6 flex-1">
                 {/* Mobile Search */}
                 <form onSubmit={(e) => { e.preventDefault(); navigate(`/shop?search=${searchQuery}`); setIsMobileOpen(false); }} className="relative">
                     <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-stone-100 border-none rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                     />
                     <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                 </form>

                 {navLinks.map(link => (
                   <Link key={link.label} to={link.path} onClick={() => setIsMobileOpen(false)} className="block text-lg font-medium text-stone-700 hover:text-orange-700">
                     {link.label}
                   </Link>
                 ))}
                 <div className="h-px bg-stone-100 my-4" />
                 <Link to="/cart" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-3 text-lg font-medium text-stone-700 hover:text-orange-700">
                    <ShoppingBag size={20} /> Cart
                 </Link>
                 
                 {user ? (
                   <>
                     <Link to="/profile" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-3 text-lg font-medium text-stone-700 hover:text-orange-700">
                        <User size={20} /> Profile
                     </Link>
                     <button onClick={() => { logout(); setIsMobileOpen(false); }} className="flex items-center gap-3 text-lg font-medium text-stone-400 hover:text-red-500 w-full text-left">
                        <LogOut size={20} /> Logout
                     </button>
                   </>
                 ) : (
                   <Link to="/login" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-3 text-lg font-medium text-stone-700 hover:text-orange-700">
                     <User size={20} /> Login / Sign Up
                   </Link>
                 )}
              </div>
           </div>
        </div>
      </div>
    </>
  );
}