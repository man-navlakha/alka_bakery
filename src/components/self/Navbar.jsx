import React, { useState } from "react";
import { Menu, X, ShoppingCart, User } from "lucide-react"; // Added ShoppingCart, User
import { useAuth } from "../../Context/AuthProvider";
import { useNavigate } from 'react-router-dom';
import { Link, Navigate } from "react-router-dom";
import AuthModal from "./AuthModal"; // Assuming AuthModal is here
import { Button } from "@/components/ui/button"; // Using Button component

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
const navigate = useNavigate();
  const handleAuthSuccess = (userData) => {
    // AuthProvider should handle setting the user state upon successful login
    // This function can be used for any post-login UI updates if needed
    console.log("Auth success in Navbar:", userData);
    setAuthModalOpen(false); // Close modal on success
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/cart", label: "Cart", icon: <ShoppingCart size={18} /> },
    // Conditionally add Admin link
    ...(user?.role === "admin" ? [{ href: "/admin/orders", label: "Admin Orders" }] : []),
    // Conditionally add Tracking link
    ...(user ? [{ href: "/tracking", label: "Track Orders" }] : []),
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg shadow-sm px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16 z-50 border-b border-pink-100 dark:border-zinc-800">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-pink-600 dark:text-pink-400 flex items-center gap-2">
          🍰
          <span className="hidden sm:inline">Alka Bakery</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6 items-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center gap-1"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons / User Info - Desktop */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <>
             <span onClick={() => navigate('/profile')} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1 px-1">
      <User size={16} /> Hi, {user.name?.split(' ')[0] || user.email}
    </span>
              <Button variant="outline" size="sm" onClick={logout} className="border-pink-500 text-pink-500 hover:bg-pink-50 dark:border-pink-400 dark:text-pink-400 dark:hover:bg-zinc-800">
                Logout
              </Button>
            </>
          ) : (
             <AuthModal onAuthSuccess={handleAuthSuccess} /> // Use the modal component directly
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-zinc-700 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)} // Close on overlay click
      />
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-zinc-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 pt-20 flex flex-col space-y-4">
           {/* Close button inside drawer */}
           <button
             className="absolute top-4 right-4 text-zinc-500 dark:text-zinc-400 hover:text-pink-600 dark:hover:text-pink-400"
             onClick={() => setMobileMenuOpen(false)}
           >
             <X size={24} />
           </button>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-zinc-700 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors py-2 flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)} // Close menu on link click
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          <hr className="border-pink-100 dark:border-zinc-700 my-4"/>

          {/* Auth Buttons / User Info - Mobile */}
          <div className="flex flex-col space-y-3 pt-4">
            {user ? (
              <>
                 <span onClick={() => navigate('/profile')} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1 px-1">
      <User size={16} /> Hi, {user.name?.split(' ')[0] || user.email}
    </span>
                <Button variant="outline" onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full justify-start border-pink-500 text-pink-500 hover:bg-pink-50 dark:border-pink-400 dark:text-pink-400 dark:hover:bg-zinc-800">
                  Logout
                </Button>
              </>
            ) : (
                // In mobile, maybe just show the button that opens the modal
                 <Button className="bg-pink-600 hover:bg-pink-700 text-white w-full justify-start" onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}>Login / Register</Button>
            )}
          </div>
        </div>
      </div>

       {/* Conditionally render AuthModal */}
       {authModalOpen && !user && (
         <AuthModal onAuthSuccess={handleAuthSuccess} />
       )}
    </>
  );
}