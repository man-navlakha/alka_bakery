import { Routes, Route } from "react-router-dom"; // Remove BrowserRouter from imports
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Main from "./pages/Main";
import ShopPage from "./pages/ShopPage";
import TrackingPage from "./components/self/TrackingPage";
import AdminRoute from "./AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProductManagement from "./pages/admin/AdminProductManagement";
import ProductPage from "./components/self/shop/ProductPage";
import AdminReviews from "./pages/admin/AdminReviews";

export default function App() {
  return (
    // <BrowserRouter>  <-- REMOVE THIS WRAPPER
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Main />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/shop" element={<ShopPage />} />

        {/* User Routes */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/tracking" element={<TrackingPage />} />

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProductManagement />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    // </BrowserRouter> <-- REMOVE THIS WRAPPER
  );
}