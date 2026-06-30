"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import { useAuthStore } from "@/store/useAuthStore";
import { OrderStatus, IOrder } from "@/types/order";
import { toast } from "@/store/useToastStore";

// Helper: get the real total (handles priceAfterDiscount=0 bug from backend)
function getOrderTotal(order: IOrder): number {
  if (order.priceAfterDiscount !== undefined && order.priceAfterDiscount > 0) {
    return order.priceAfterDiscount;
  }
  return order.totalPrice;
}

export default function AdminOrdersPage() {
  const token = useAuthStore((state) => state.token);
  
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const statusTabs = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

  // Fetch all orders admin
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: () => orderService.getAllOrdersAdmin(),
    enabled: !!token,
  });

  // Fetch full order details when one is selected (this endpoint populates images)
  const { data: selectedOrder } = useQuery({
    queryKey: ["adminOrderDetail", selectedOrderId],
    queryFn: () => orderService.getOrderById(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  // Calculate metrics dynamically
  const metrics = useMemo(() => {
    const pendingCount = orders.filter(o => o.status === OrderStatus.pending).length;
    const processingCount = orders.filter(o => o.status === OrderStatus.processing).length;
    const shippedCount = orders.filter(o => o.status === OrderStatus.shipped).length;
    const deliveredCount = orders.filter(o => o.status === OrderStatus.delivered).length;
    const cancelledCount = orders.filter(o => o.status === OrderStatus.cancelled).length;

    return [
      { label: "Total Orders", value: orders.length, desc: "Active database count", icon: "shopping_bag", isGreenDesc: true },
      { label: "Pending", value: pendingCount, desc: "Awaiting preparation", icon: "schedule" },
      { label: "Processing", value: processingCount, desc: "In fulfillment", icon: "sync" },
      { label: "Shipped", value: shippedCount, desc: "In transit", icon: "local_shipping" },
      { label: "Delivered", value: deliveredCount, desc: "Completed orders", icon: "check_circle" },
      { label: "Cancelled", value: cancelledCount, desc: "Voided orders", icon: "cancel" },
    ];
  }, [orders]);

  // Combine filters
  const filteredOrders = useMemo(() => {
    let result = orders;
    
    if (selectedStatusTab !== "All") {
      result = result.filter((o) => o.status.toLowerCase() === selectedStatusTab.toLowerCase());
    }
    
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const custName = (o.userId as any)?.username || `${(o.userId as any)?.fname || ""} ${(o.userId as any)?.lname || ""}`.trim() || "";
        const custEmail = (o.userId as any)?.email || "";
        return (
          o._id.toLowerCase().includes(query) ||
          custName.toLowerCase().includes(query) ||
          custEmail.toLowerCase().includes(query)
        );
      });
    }
    
    return result;
  }, [orders, selectedStatusTab, searchQuery]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-xl font-body text-[14px] text-slate-500">
        Loading orders console...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body pb-10 relative">
      
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="font-display text-[26px] font-bold text-slate-800 uppercase tracking-tight">Orders Management</h1>
          <p className="text-[12px] text-slate-500 font-medium">Manage, process, track, and fulfill customer orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => toast.success("Orders exported successfully.")}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[13px] font-bold px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Orders
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid (6 columns) */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((card, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
              <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-105/50 border-amber-100 flex items-center justify-center text-amber-500">
                <span className="material-symbols-outlined text-[15px]">
                  {card.icon}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-[22px] font-bold text-slate-800 leading-tight">{card.value}</h3>
              <p className={`text-[10px] mt-1 font-medium ${card.isGreenDesc ? "text-emerald-600 font-bold" : "text-slate-450 text-slate-450"}`}>
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Orders Filter & Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Filters and Search Bar Container */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white">
          {/* Status Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto self-start lg:self-auto max-w-full">
            {statusTabs.map((tab) => {
              const isActive = selectedStatusTab === tab;
              const count = tab === "All" 
                ? orders.length 
                : orders.filter((o) => o.status.toLowerCase() === tab.toLowerCase()).length;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedStatusTab(tab)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    isActive ? "bg-white text-slate-800 shadow-sm font-extrabold" : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Field */}
          <div className="relative flex items-center w-full lg:max-w-xs shrink-0">
            <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400 pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-[13px] font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Table Content */}
        {filteredOrders.length === 0 ? (
          <p className="text-center py-10 text-[14px] text-slate-500 italic font-medium">
            No orders found matching the filter criteria.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/50 font-body text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4 text-center">Items</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-body">
                {filteredOrders.map((order) => {
                  const itemCount = order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
                  const isSelected = selectedOrderId === order._id;
                  const custName = (order.userId as any)?.username || `${(order.userId as any)?.fname || ""} ${(order.userId as any)?.lname || ""}`.trim() || "Guest Customer";
                  const custEmail = (order.userId as any)?.email || "No email available";
                  const totalAmount = getOrderTotal(order);

                  return (
                    <tr 
                      key={order._id} 
                      onClick={() => setSelectedOrderId(order._id)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? "bg-slate-50" : "hover:bg-slate-55 hover:bg-slate-50/30"
                      }`}
                    >
                      <td className="p-4 font-bold text-slate-900" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/admin/orders/${order._id}`} className="hover:underline text-primary">
                          #{order._id.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="p-4 text-slate-500">{formatDate(order.createdAt)}</td>
                      <td className="p-4">
                        <div>
                          <span className="font-semibold text-slate-800 block">{custName}</span>
                          <span className="text-[11px] text-slate-400 block">{custEmail}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col leading-tight">
                          <span className={`text-[12px] font-bold ${
                            order.isPaid ? "text-emerald-600" : "text-amber-600"
                          }`}>
                            {order.isPaid ? "Paid" : "Pending Payment"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase">{order.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-slate-600 font-medium">
                        {itemCount} {itemCount === 1 ? "unit" : "units"}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                          order.status === OrderStatus.delivered || order.status === OrderStatus.shipped
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                            : order.status === OrderStatus.cancelled
                            ? "bg-red-50 text-red-800 border border-red-100"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900 text-right">
                        ${totalAmount.toLocaleString()}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="font-bold text-[11px] uppercase tracking-wider text-amber-700 hover:underline"
                        >
                          Fulfill
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-In side details drawer */}
      {selectedOrder && (
        <div 
          onClick={() => setSelectedOrderId(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity duration-300 animate-fade-in"
        />
      )}

      <div className={`fixed right-0 top-0 bottom-0 w-full max-w-[450px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transition-transform duration-300 ease-out ${
        selectedOrder ? "translate-x-0" : "translate-x-full"
      }`}>
        {selectedOrder && (
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-[24px] font-bold text-slate-800">
                    #{selectedOrder._id.slice(-8).toUpperCase()}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedOrder.status === OrderStatus.delivered || selectedOrder.status === OrderStatus.shipped
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                      : selectedOrder.status === OrderStatus.cancelled
                      ? 'bg-red-50 text-red-800 border border-red-100'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-[12px] text-slate-450 mt-1">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()} at {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrderId(null)} 
                className="material-symbols-outlined text-slate-400 hover:text-slate-800 cursor-pointer p-1"
              >
                close
              </button>
            </div>

            {/* Customer Profile Info */}
            <div className="p-6 border-b border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Customer Information</h4>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhclOeCcM-y-DmuUnu6ENzMBngpFB99qFODS-mnqT2DzQ8k0CBMS09brPib-mqV7ASSfBlyLDyrxDZqGKQsZBUz50qeSB8ALqFbsQNFCwphtnjyakRwYxxMnryKyy8UyFIYNsd47y5AptHAK3Eq-nbmqsflrE2Po-xlNXYaijGnEIDG3nuQV1IEaMTOPj-srzU_I3c07DCCzwcFzuPz-frt5eF7YsbbLbZpMCIJUIpLK2ORhbLrMe-fspg2-qqkbu-miCMl9JOBNw" 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-800 text-[15px]">
                    {(selectedOrder.userId as any)?.username || `${(selectedOrder.userId as any)?.fname || ""} ${(selectedOrder.userId as any)?.lname || ""}`.trim() || "Guest Customer"}
                  </h5>
                  <p className="text-[12px] text-slate-400 leading-tight">
                    {(selectedOrder.userId as any)?.email || "No email available"}
                  </p>
                  <div className="flex gap-2 mt-1.5 items-center">
                    <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      {(selectedOrder.userId as any)?.role || "User"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items list */}
            <div className="p-6 border-b border-slate-100 flex-grow overflow-y-auto space-y-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Order Items</h4>
              <div className="space-y-4">
                {selectedOrder.items?.map((item) => {
                  const prod = typeof item.productId === "object" ? item.productId : null;
                  const imgUrl = prod?.images?.[0]?.secure_url;
                  const prodName = prod?.name || "Product Item";
                  
                  return (
                    <div key={item._id} className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        {imgUrl ? (
                          <img src={imgUrl} alt={prodName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[24px] text-slate-300">image</span>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h5 className="font-semibold text-slate-850 text-[14px] truncate">{prodName}</h5>
                        <p className="text-[13px] text-slate-700 mt-1 font-semibold">
                          {item.quantity} x ${item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <div className="space-y-2.5 font-body text-[13px] text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    ${getOrderTotal(selectedOrder).toLocaleString()}
                  </span>
                </div>
                {selectedOrder.discount !== undefined && selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-secondary">
                    <span>Discount</span>
                    <span className="font-semibold">
                      -${selectedOrder.discount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping (Express Compl.)</span>
                  <span className="font-semibold text-slate-800">$0.00</span>
                </div>
                <div className="w-full border-t border-slate-200 my-2"></div>
                <div className="flex justify-between text-[16px] font-bold text-slate-900">
                  <span>Total Price</span>
                    ${getOrderTotal(selectedOrder).toLocaleString()}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
