import React, { useEffect, useState } from "react";
import { apiFetch } from "../Context/apiFetch";
import { 
    Loader2, Package, MapPin, Calendar, Tag, Truck, XCircle, 
    RefreshCw, Download, Star 
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewForm } from "../components/Reviews"; // Ensure this import path is correct based on your project structure
import { useCartDrawer } from "../Context/CartDrawerContext"; 
import { useCart } from "../Context/CartContext"; 
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    // Loading states for actions
    const [cancellingId, setCancellingId] = useState(null);
    const [reorderingId, setReorderingId] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    
    // Review Modal State
    const [reviewedProductIds, setReviewedProductIds] = useState(new Set());
    const [reviewProduct, setReviewProduct] = useState(null); // { id, name }
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const { openCart } = useCartDrawer();
    const { reloadCart } = useCart();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Fetch Orders, Products, AND User's Reviewed IDs in parallel
            const [ordersData, productsData, reviewedIds] = await Promise.all([
                apiFetch(`${API_BASE}/api/orders`),
                fetch(`${API_BASE}/api/products`).then((r) => r.json()),
                apiFetch(`${API_BASE}/api/me/products`).catch(() => []) // Catch error if not logged in or fails
            ]);

            setOrders(ordersData || []);
            setProducts(productsData || []);
            setReviewedProductIds(new Set(reviewedIds || [])); // Convert array to Set for O(1) lookup
        } catch (error) {
            console.error("Failed to load data", error);
            toast.error("Could not load orders");
        } finally {
            setLoading(false);
        }
    };

    // --- ACTIONS ---

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        setCancellingId(orderId);
        try {
            await apiFetch(`${API_BASE}/api/orders/${orderId}/cancel`, { method: "PUT" });
            toast.success("Order cancelled successfully");
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
        } catch (error) {
            toast.error(error.message || "Failed to cancel");
        } finally {
            setCancellingId(null);
        }
    };

    const handleReorder = async (orderId) => {
        setReorderingId(orderId);
        try {
            await apiFetch(`${API_BASE}/api/cart/merge-order`, {
                method: "POST",
                body: JSON.stringify({ orderId })
            });
            toast.success("Items added to cart!");
            await reloadCart();
            openCart();
        } catch (error) {
            console.error(error);
            toast.error("Failed to re-order items");
        } finally {
            setReorderingId(null);
        }
    };

    const handleDownloadInvoice = async (orderId) => {
        setDownloadingId(orderId);
        const token = localStorage.getItem("accessToken");
        try {
            const res = await fetch(`${API_BASE}/api/orders/${orderId}/invoice`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error("Failed");
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${orderId.slice(0,8)}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Invoice Downloaded");
        } catch (e) {
            toast.error("Could not download invoice");
        } finally {
            setDownloadingId(null);
        }
    };

    // --- HELPERS ---

    const getItemDetails = (orderItem) => {
        const product = products.find((p) => p.id === orderItem.product_id);
        const name = product ? product.name : (orderItem.product_name || "Unknown Product");
        let image = null;
        if (product) {
            if (product.product_images?.length > 0) image = product.product_images[0].url;
            else if (product.images?.length > 0) image = typeof product.images[0] === "string" ? product.images[0] : product.images[0].url;
            else if (product.image) image = product.image;
        }
        if (!image) image = "https://placehold.co/100x100?text=No+Img";

        let label = "";
        if (orderItem.unit === "gm") label = orderItem.grams ? `${orderItem.grams}g` : "100g";
        else if (orderItem.unit === "variant") label = orderItem.variant_label;
        else label = "Pc";

        return { name, image, label, id: orderItem.product_id, category: product?.category }; 
    };

    const fmt = (n) => `₹${Math.round(Number(n || 0)).toLocaleString("en-IN")}`;
    const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

    if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin w-8 h-8 text-orange-600" /></div>;

    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">Your Orders</h1>

                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 shadow-sm">
                        <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-stone-800">No orders yet</h3>
                        <Link to="/shop"><Button className="mt-4 bg-orange-600">Start Shopping</Button></Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {orders.map((order) => {
                            const canCancel = !["shipped", "delivered", "cancelled"].includes(order.status);
                            const isDelivered = order.status === 'delivered';

                            return (
                                <div key={order.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                    {/* Header */}
                                    <div className="bg-stone-50/80 p-5 flex flex-wrap justify-between items-center gap-4 border-b border-stone-100">
                                        <div>
                                            <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">Order #{order.id.slice(0, 8)}</div>
                                            <div className="flex items-center gap-2 text-stone-700 font-medium text-sm mt-1">
                                                <Calendar size={14} className="text-orange-600" /> {formatDate(order.created_at)}
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-xl font-serif font-bold text-stone-900">{fmt(order.grand_total)}</div>
                                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${order.status === "delivered" ? "bg-green-100 text-green-700" : order.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                                                    {order.status}
                                                </span>
                                                
                                                {/* ACTION BUTTONS */}
                                                {order.status !== 'cancelled' && (
                                                    <Link to={`/track/${order.id}`}>
                                                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 border-stone-300 hover:bg-white">
                                                            <Truck size={12} className="mr-1"/> Track
                                                        </Button>
                                                    </Link>
                                                )}
                                                {canCancel && (
                                                    <Button size="sm" variant="destructive" className="h-7 text-xs px-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" onClick={() => handleCancelOrder(order.id)} disabled={cancellingId === order.id}>
                                                        {cancellingId === order.id ? <Loader2 size={12} className="animate-spin mr-1" /> : <XCircle size={12} className="mr-1"/>} Cancel
                                                    </Button>
                                                )}
                                                {isDelivered && (
                                                    <>
                                                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 hover:bg-blue-50 text-blue-600 border-blue-200" onClick={() => handleDownloadInvoice(order.id)} disabled={downloadingId === order.id}>
                                                            {downloadingId === order.id ? <Loader2 size={12} className="animate-spin mr-1" /> : <Download size={12} className="mr-1" />} Invoice
                                                        </Button>
                                                        <Button size="sm" className="h-7 text-xs px-3 bg-stone-800 hover:bg-orange-600 text-white" onClick={() => handleReorder(order.id)} disabled={reorderingId === order.id}>
                                                            {reorderingId === order.id ? <Loader2 size={12} className="animate-spin mr-1" /> : <RefreshCw size={12} className="mr-1"/>} Re-order
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="p-6">
                                        <div className="space-y-4 mb-6">
                                            {order.order_items.map((item) => {
                                                const details = getItemDetails(item);
                            const hasReviewed = reviewedProductIds.has(item.product_id);

                                                return (
                                                    <div key={item.id} className="flex gap-4 items-start">
                                                        <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden border border-stone-100 shrink-0">
                                                            <img src={details.image} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between">
                                                                <div>
                                                                    <h4 className="font-bold text-stone-800 text-sm">{details.name}</h4>
                                                                    <div className="text-xs text-stone-500 mt-0.5">
                                                                        {details.label} 
                                                                        <span className="mx-1">•</span>
                                                                        Qty: {item.quantity}
                                                                    </div>
                                                                </div>
                                                                <span className="font-bold text-stone-900 text-sm">{fmt(item.line_total)}</span>
                                                            </div>
                                                            
                                                            {/* REVIEW BUTTON PER ITEM */}
                                                           {isDelivered && !hasReviewed && (
                                                                    <button 
                                                                        onClick={() => { 
                                                                            setReviewProduct({ id: details.id, name: details.name }); 
                                                                            setIsReviewOpen(true); 
                                                                        }}
                                                                        className="text-[11px] font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                                                                    >
                                                                        <Star size={12} /> Write Review
                                                                    </button>
                                                                )}

                                                                {/* OPTIONAL: Show 'Reviewed' status */}
                                                                {isDelivered && hasReviewed && (
                                                                    <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                                                                         <CheckCircle2 size={10} /> Reviewed
                                                                    </span>
                                                                )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* REVIEW MODAL */}
                <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Review {reviewProduct?.name}</DialogTitle>
                        </DialogHeader>
                        {reviewProduct && (
                            <ReviewForm 
                                productId={reviewProduct.id} 
                                onSaved={() => {
                                    toast.success("Review submitted successfully!");
                                    setIsReviewOpen(false);
                                }} 
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}