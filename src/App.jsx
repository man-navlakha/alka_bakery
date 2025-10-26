import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Main from "./pages/Main";
// Remove AdminProducts import if combining
// import AdminProducts from "./pages/AdminProducts";
import ShopPage from "./pages/ShopPage";
import CartPage from "./components/self/CartPage";
import CheckoutPage from "./components/self/CheckoutPage";
import ThankYouPage from "./components/self/ThankYouPage";
import TrackingPage from "./components/self/TrackingPage";

// Import Admin components
import AdminRoute from "./AdminRoute"; // Import the protector component
import AdminDashboard from "./pages/admin/AdminDashboard"; // New Dashboard
import AdminProductManagement from "./pages/admin/AdminProductManagement"; // Renamed/Refactored
import AdminOrderManagement from "./pages/admin/AdminOrderManagement"; // Renamed/Refactored
import ProductPage from "./components/self/ProductPage";
import Cart from "./components/self/Cart";
import AdminCategoryManagement from "./pages/admin/AdminCategoryManagement";
import AdminUnitManagement from "./pages/admin/AdminUnitManagement";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Main />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/thankyou" element={<ThankYouPage />} />

        {/* Logged In User Routes (Example - Profile & Tracking) */}
        {/* You might want a similar 'ProtectedRoute' for these */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/tracking" element={<TrackingPage />} />

        {/* Admin Routes - Protected */}
        <Route element={<AdminRoute />}> {/* Wrap admin routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProductManagement />} />
          <Route path="/admin/orders" element={<AdminOrderManagement />} />
          <Route path="/admin/categories" element={<AdminCategoryManagement />} />
          <Route path="/admin/units" element={<AdminUnitManagement />} />
           {/* Redirect /admin to dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Optional: Add a 404 Not Found Route */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}