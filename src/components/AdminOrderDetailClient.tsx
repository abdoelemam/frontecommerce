"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import { OrderStatus } from "@/types/order";
import { toast } from "@/store/useToastStore";

export default function AdminOrderDetailClient({ id }: { id: string }) {
  const queryClient = useQueryClient();

  // Fetch order detail
  const { data: order, isLoading, error } = useQuery({
    queryKey: ["adminOrderDetail", id],
    queryFn: () => orderService.getOrderById(id),
  });

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => orderService.updateOrderStatusAdmin(id, newStatus),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminOrderDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      toast.success(`Order status updated successfully to ${data.status}!`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update order status.");
    }
  });

  // Status Form States
  const [status, setStatus] = useState("pending");

  // Sync state with order when it loads
  useEffect(() => {
    if (order) {
      setStatus(order.status);
    }
  }, [order]);

  if (isLoading) {
    return (
      <div className="text-center py-xxl font-body text-[14px] text-slate-500">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-xxl font-body">
        <span className="material-symbols-outlined text-[48px] text-slate-400 mb-md">warning</span>
        <h2 className="font-display text-[22px] font-semibold text-slate-800 mb-xs">Order Not Found</h2>
        <p className="text-[14px] text-slate-500 mb-md">The order number requested could not be located.</p>
        <Link href="/admin/orders" className="bg-[#0F172A] text-white font-body text-[11px] font-bold uppercase tracking-widest py-2.5 px-5 shadow">
          Back to Orders
        </Link>
      </div>
    );
  }

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    updateStatusMutation.mutate(status);
  };

  const totalAmount = (order.priceAfterDiscount !== undefined && order.priceAfterDiscount > 0) ? order.priceAfterDiscount : order.totalPrice;
  const customerName = (order.userId as any)?.username || `${(order.userId as any)?.fname || ""} ${(order.userId as any)?.lname || ""}`.trim() || "Guest Customer";
  const customerEmail = (order.userId as any)?.email || "No email available";

  return (
    <div className="space-y-lg font-body text-[14px] text-slate-700">
      {/* Back button */}
      <div className="pb-sm border-b border-slate-200/80 flex justify-between items-center">
        <div>
          <h2 className="font-display text-[22px] font-semibold text-slate-800 flex items-center gap-sm">
            <Link href="/admin/orders" className="material-symbols-outlined text-slate-500 hover:text-slate-800 cursor-pointer">
              arrow_back
            </Link>
            Order Details: #{order._id.slice(-8).toUpperCase()}
          </h2>
          <p className="text-[12px] text-slate-500">
            Placed on {new Date(order.createdAt).toLocaleString()} | Fulfill or edit statuses.
          </p>
        </div>
        <span className="bg-[#0f172a]/5 text-[#0f172a] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left Column: Items details */}
        <div className="lg:col-span-8 space-y-md">
          {/* Order Items Table Card */}
          <div className="bg-white p-md border border-slate-200/80 rounded-xl shadow-sm space-y-md">
            <h3 className="font-display text-[16px] font-bold text-slate-800 pb-sm border-b border-slate-100 uppercase tracking-tight">
              Order Items
            </h3>
            
            <div className="space-y-md">
              {order.items.map((item) => (
                <div key={item._id} className="flex justify-between items-center py-2 border-b border-slate-100/50">
                  <div className="flex gap-md items-center">
                    {item.productId?.images?.[0] && (
                      <img src={item.productId.images[0].secure_url} alt={item.productId?.name} className="w-12 h-16 object-cover rounded bg-slate-50" />
                    )}
                    <div>
                      <h4 className="font-display text-[15px] font-semibold text-slate-800">
                        {item.productId?.name || "Product Item"}
                      </h4>
                      <span className="text-[12px] text-slate-400 block font-mono">
                        ID: {item.productId?._id || "Unavailable"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800 block">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.quantity} × ${item.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-baseline pt-md border-t border-slate-100">
              <span className="font-display text-[15px] font-semibold text-slate-800">Total Order Value</span>
              <span className="text-[20px] font-bold text-slate-800">${totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Shipping details */}
          <div className="bg-white p-md border border-slate-200/80 rounded-xl shadow-sm space-y-md">
            <h3 className="font-display text-[16px] font-bold text-slate-800 pb-sm border-b border-slate-100 uppercase tracking-tight">
              Shipping & Recipient Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Recipient</span>
                <p className="font-semibold text-slate-800">{customerName}</p>
                <p className="text-[13px] text-slate-500">{customerEmail}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Shipping Address</span>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}</p>
                <p>Phone: {order.shippingAddress.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status updates */}
        <div className="lg:col-span-4 bg-white p-md border border-slate-200/80 rounded-xl shadow-sm space-y-md h-fit">
          <h3 className="font-display text-[16px] font-bold text-slate-800 pb-sm border-b border-slate-100 uppercase tracking-tight">
            Fulfillment Controls
          </h3>

          <form onSubmit={handleUpdateStatus} className="space-y-md font-body">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">Order Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-slate-800 bg-white cursor-pointer"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={updateStatusMutation.isPending}
              className="w-full bg-[#0F172A] text-white font-body text-[11px] font-bold uppercase tracking-widest py-3.5 hover:opacity-95 shadow mt-4 cursor-pointer disabled:opacity-50"
            >
              {updateStatusMutation.isPending ? "Updating..." : "Update Fulfillment Status"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
