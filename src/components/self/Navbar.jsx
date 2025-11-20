import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search, User, ChevronLeft, LogOut, ShoppingBag } from "lucide-react";
import CartButton from "../cart/CartButton";
import { useAuth } from "../../Context/AuthProvider";

export default function Navbar() {
  // --- Hooks ---
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, logout } = useAuth();

  
  // --- Logic ---
  const isHome = location.pathname === "/";

  const navLinks = [
    { label: "HOME", path: "/" },
    { label: "Shop", path: "/shop" },
    { label: "Gallery", path: "/gallery" },

   
  ];

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
                   <Link 
                  to="/admin" 
                  className="text-stone-600 hover:text-orange-700 font-medium transition-colors text-sm uppercase tracking-wide"
                >
                  ADMIN
                </Link>
                )}
                {user && (
                  //  <Link to="/orders" className="hover:text-orange-700 transition-colors">Orders</Link>
                   <Link 
                  to="/orders" 
                  className="text-stone-600 hover:text-orange-700 font-medium transition-colors text-sm uppercase tracking-wide"
                >
                  ORDERS
                </Link>
                )}
            </div>

            {/* --- RIGHT: Actions --- */}
            <div className="hidden md:flex items-center gap-5">
              
              {/* Search Toggle */}
              <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'w-64 bg-stone-100 px-3 rounded-full' : 'w-auto'}`}>
                <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-stone-500 hover:text-stone-800">
                  <Search size={20} />
                </button>
                {isSearchOpen && (
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    autoFocus
                    className="ml-2 bg-transparent border-none outline-none text-sm w-full h-10 text-stone-700 placeholder-stone-400"
                    onBlur={() => setIsSearchOpen(false)}
                  />
                )}
              </div>

              {/* Auth & Cart */}
              <div className="flex items-center gap-3 border-l border-stone-200 pl-5">
                <CartButton className="pr-6" />

                {user ? (
                  <div className="flex items-center gap-4">
                     <Link to="/profile" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-medium text-sm">
                        <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center">
                          <User size={16} />
                        </div>
                        <span>{user.name || "Profile"}</span>
                     </Link>
                     <button onClick={logout} title="Logout" className="text-stone-400 hover:text-red-500">
                        <LogOut size={18} />
                     </button>
                  </div>
                ) : (
                  <Link to="/login" className="text-stone-600 hover:text-orange-700 font-bold text-sm">
                    Login
                  </Link>
                )}

               
              </div>

              {/* Order Now CTA */}
              {/* <Link 
                to="/shop" 
                className="bg-stone-900 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Order Now
              </Link> */}
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
        
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
        
        {/* Drawer */}
        <div className={`absolute top-0 right-0 w-3/4 max-w-xs h-full bg-white shadow-2xl transition-transform duration-300 ${isMobileOpen ? "translate-x-0" : "translate-x-full"}`}>
           <div className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                 <span className="font-serif font-bold text-xl text-stone-900">Menu</span>
                 <button onClick={() => setIsMobileOpen(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                   <X size={24} className="text-stone-500" />
                 </button>
              </div>

              <div className="space-y-6 flex-1">
                 {navLinks.map(link => (
                   <Link 
                     key={link.label} 
                     to={link.path} 
                     onClick={() => setIsMobileOpen(false)}
                     className="block text-lg font-medium text-stone-700 hover:text-orange-700"
                   >
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

              <div className="mt-auto pt-6">
                <Link 
                  to="/shop" 
                  onClick={() => setIsMobileOpen(false)}
                  className="block w-full bg-orange-600 text-white text-center py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
                >
                  Order Now
                </Link>
              </div>
           </div>
        </div>
      </div>
    </>
  );
}