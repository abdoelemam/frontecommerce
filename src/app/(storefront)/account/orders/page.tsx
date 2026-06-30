"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import { useAuthStore } from "@/store/useAuthStore";
import { OrderStatus } from "@/types/order";
import { toast } from "@/store/useToastStore";

export default function OrderHistoryPage() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Fetch real order history
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["myOrders"],
    queryFn: () => orderService.getMyOrders(),
    enabled: !!token,
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => orderService.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      toast.success("Order cancelled successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to cancel order.");
    }
  });

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleCancelOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to cancel this order?")) {
      cancelOrderMutation.mutate(id);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-outline-variant/20 shadow-sm">
        <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant/40">lock</span>
        </div>
        <h2 className="font-display text-[24px] font-bold text-primary mb-2">Sign In Required</h2>
        <p className="font-body text-[14px] text-on-surface-variant mb-8 max-w-md">
          Please log in to your account to view and manage your order history.
        </p>
        <Link
          href="/login"
          className="bg-primary text-white font-body text-[12px] font-bold uppercase tracking-widest py-3.5 px-8 rounded hover:bg-primary/90 transition-colors w-full max-w-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-surface-container-low w-48 rounded-md mb-2 animate-pulse"></div>
          <div className="h-4 bg-surface-container-low w-64 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full">
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 border border-outline-variant/20 shadow-sm">
        <nav aria-label="Breadcrumb" className="flex text-on-surface-variant font-body text-[11px] uppercase tracking-widest mb-4">
          <ol className="inline-flex items-center space-x-2">
            <li><Link href="/account" className="hover:text-primary transition-colors">Account</Link></li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-[14px] mx-1">chevron_right</span>
                <span className="text-primary font-semibold">Orders</span>
              </div>
            </li>
          </ol>
        </nav>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display text-[28px] md:text-[32px] font-bold text-primary mb-1">
              Order History
            </h1>
            <p className="font-body text-[14px] text-on-surface-variant">
              Track, manage and view details of your past purchases.
            </p>
          </div>
          <div className="bg-primary/5 text-primary font-body text-[12px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg border border-primary/10">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
          </div>
        </div>
      </div>

      {/* ═══════════════════ ORDERS LIST ═══════════════════ */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-outline-variant/20 shadow-sm">
          <div className="w-24 h-24 bg-surface-container-lowest rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">inventory_2</span>
          </div>
          <h2 className="font-display text-[22px] font-bold text-primary mb-2">No Orders Yet</h2>
          <p className="font-body text-[14px] text-on-surface-variant mb-8 max-w-sm">
            Looks like you haven't made any purchases yet. Discover our latest collections.
          </p>
          <Link
            href="/collections"
            className="bg-primary text-white font-body text-[12px] font-bold uppercase tracking-widest py-3.5 px-8 rounded hover:bg-primary/90 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order._id;
            const primaryItem = order.items[0];
            const dateObj = new Date(order.createdAt);
            const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const totalAmount = order.priceAfterDiscount !== undefined ? order.priceAfterDiscount : order.totalPrice;

            // Status styling
            const statusStyles: Record<string, { bg: string, text: string, border: string, icon: string }> = {
              pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "schedule" },
              processing: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "autorenew" },
              shipped: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: "local_shipping" },
              delivered: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "check_circle" },
              cancelled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "cancel" },
            };
            
            const currentStatus = order.status.toLowerCase();
            const statusConfig = statusStyles[currentStatus] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", icon: "info" };

            return (
              <div key={order._id} className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden group hover:border-outline-variant/40 transition-colors">
                
                {/* ── Order Summary Card (Always Visible) ── */}
                <div 
                  onClick={() => toggleExpand(order._id)}
                  className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row gap-5 items-start sm:items-center relative"
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${statusConfig.bg.replace('bg-', 'bg-').replace('-50', '-500')}`}></div>
                  
                  {/* Image Thumbnail */}
                  <div className="shrink-0 w-20 h-24 sm:w-24 sm:h-28 bg-surface-container-low rounded-lg border border-outline-variant/20 overflow-hidden relative group-hover:shadow-md transition-all">
                    {primaryItem?.productId?.images?.[0] ? (
                      <img
                        alt={primaryItem.productId.name}
                        className="w-full h-full object-cover"
                        src={primaryItem.productId.images[0].secure_url}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant/40 text-[32px]">image</span>
                      </div>
                    )}
                    {order.items.length > 1 && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                        +{order.items.length - 1}
                      </div>
                    )}
                  </div>

                  {/* Core Details */}
                  <div className="flex-grow flex flex-col justify-between self-stretch py-1">
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <p className="font-body text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                          Order #{order._id.slice(-6).toUpperCase()}
                        </p>
                        <span className={`flex items-center gap-1 font-body text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                          <span className="material-symbols-outlined text-[12px]">{statusConfig.icon}</span>
                          {order.status}
                        </span>
                      </div>
                      <h3 className="font-display text-[18px] sm:text-[20px] font-bold text-primary mb-1 line-clamp-1">
                        {primaryItem?.productId?.name || "Garment Item"}
                      </h3>
                      <p className="font-body text-[13px] text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                        {formattedDate}
                      </p>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto self-stretch py-1 sm:pl-6 sm:border-l border-outline-variant/20">
                    <div className="text-left sm:text-right">
                      <p className="font-body text-[11px] text-on-surface-variant uppercase tracking-wider mb-0.5">Total</p>
                      <p className="font-body text-[18px] font-bold text-primary">
                        ${totalAmount.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 text-primary font-body text-[12px] font-bold uppercase tracking-widest bg-surface-container-lowest px-3 py-1.5 rounded-lg group-hover:bg-primary/5 transition-colors">
                      {isExpanded ? "Hide Details" : "View Details"}
                      <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>expand_more</span>
                    </div>
                  </div>
                </div>

                {/* ── Expanded Details Panel ── */}
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <div className="bg-surface-container-lowest border-t border-outline-variant/20 p-5 sm:p-6 sm:pl-[120px]">
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Items List */}
                        <div>
                          <h4 className="font-body text-[12px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 border-b border-outline-variant/20 pb-2">
                            Items in this order
                          </h4>
                          <div className="space-y-4">
                            {order.items.map((item) => (
                              <div key={item._id} className="flex gap-4 items-center">
                                {item.productId?.images?.[0] ? (
                                  <img src={item.productId.images[0].secure_url} alt={item.productId.name} className="w-12 h-16 object-cover rounded bg-white border border-outline-variant/10" />
                                ) : (
                                  <div className="w-12 h-16 bg-white border border-outline-variant/10 rounded flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant/30">image</span>
                                  </div>
                                )}
                                <div className="flex-grow">
                                  <p className="font-body text-[14px] font-semibold text-primary line-clamp-1">{item.productId?.name || "Product Item"}</p>
                                  <div className="flex items-center gap-3 mt-1 font-body text-[12px] text-on-surface-variant">
                                    <span>Qty: {item.quantity}</span>
                                    {(item as any).color && <span><span className="w-2 h-2 rounded-full inline-block mr-1 align-middle border border-outline-variant" style={{backgroundColor: (item as any).color}}></span>{(item as any).color}</span>}
                                    {(item as any).size && <span>Size: {(item as any).size}</span>}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-body text-[14px] font-bold text-primary">
                                    ${(item.price * item.quantity).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right: Shipping & Payment */}
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-body text-[12px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant/20 pb-2">
                              Delivery Information
                            </h4>
                            <div className="font-body text-[13px] text-primary bg-white p-4 rounded-xl border border-outline-variant/20">
                              <p className="flex items-start gap-2 mb-1">
                                <span className="material-symbols-outlined text-[16px] text-on-surface-variant mt-0.5">location_on</span>
                                <span>{order.shippingAddress.street}, {order.shippingAddress.city}</span>
                              </p>
                              <p className="flex items-center gap-2 text-on-surface-variant">
                                <span className="material-symbols-outlined text-[16px]">call</span>
                                {order.shippingAddress.phone}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-body text-[12px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant/20 pb-2">
                              Payment Summary
                            </h4>
                            <div className="bg-white p-4 rounded-xl border border-outline-variant/20 font-body text-[13px] space-y-2">
                              <div className="flex justify-between items-center text-on-surface-variant">
                                <span className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px]">credit_card</span>
                                  Method
                                </span>
                                <span className="uppercase font-semibold text-primary">{order.paymentMethod}</span>
                              </div>
                              <div className="flex justify-between items-center text-on-surface-variant">
                                <span className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px]">payments</span>
                                  Status
                                </span>
                                <span className={`font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider ${order.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                  {order.isPaid ? "Paid" : "Pending"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {order.status === OrderStatus.pending && (
                            <div className="pt-2">
                              <button
                                onClick={(e) => handleCancelOrder(order._id, e)}
                                disabled={cancelOrderMutation.isPending}
                                className="w-full py-2.5 border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 font-body text-[12px] font-bold rounded-lg transition-all duration-200 uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[18px]">cancel</span>
                                Cancel Order
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
