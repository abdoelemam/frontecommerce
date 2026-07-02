"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import Cookies from "js-cookie";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderIdResolved, setOrderIdResolved] = useState(false);

  // Get orderId from URL or cookie (fallback for Paymob redirect which doesn't pass orderId)
  useEffect(() => {
    const urlOrderId = searchParams.get("orderId");
    if (urlOrderId) {
      setOrderId(urlOrderId);
    } else {
      // Paymob redirects without orderId in URL, so we saved it in a cookie before redirecting
      const saved = Cookies.get("lastOrderId");
      if (saved) {
        setOrderId(saved);
        Cookies.remove("lastOrderId"); // Clean up after use
      }
    }
    // Mark as resolved ONLY after checking both URL and cookie
    setOrderIdResolved(true);
  }, [searchParams]);

  // Fetch real order by ID
  const { data: order, isLoading, error } = useQuery({
    queryKey: ["orderDetails", orderId],
    queryFn: () => orderService.getOrderById(orderId || ""),
    enabled: !!orderId,
  });

  // Still determining orderId (reading from cookie) — show loading
  if (!orderIdResolved || isLoading) {
    return (
      <div className="max-w-container-max mx-auto px-gutter py-xxl text-center font-body text-[14px]">
        <div className="animate-pulse space-y-4 max-w-md mx-auto">
          <div className="h-16 bg-surface-container-highest rounded-full w-16 mx-auto" />
          <div className="h-6 bg-surface-container-highest rounded w-3/4 mx-auto" />
          <div className="h-4 bg-surface-container-highest rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-container-max mx-auto px-gutter py-xxl text-center font-body">
        <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
        <h2 className="font-display text-[24px] font-semibold text-primary mb-sm">Order Not Found</h2>
        <p className="font-body text-[14px] text-on-surface-variant mb-md">
          The order number you are querying could not be verified in our records.
        </p>
        <Link href="/" className="bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-3 px-6">
          Return to Homepage
        </Link>
      </div>
    );
  }

  const finalTotal = order.priceAfterDiscount !== undefined && order.priceAfterDiscount !== order.totalPrice
    ? order.priceAfterDiscount
    : order.totalPrice;

  return (
    <div className="max-w-md md:max-w-2xl mx-auto px-gutter py-xxl font-body">
      <div className="bg-white p-lg border border-outline-variant/20 rounded-lg shadow-sm text-center flex flex-col items-center">
        <span className="material-symbols-outlined text-[64px] text-secondary mb-md" style={{ fontVariationSettings: "'FILL' 1" }}>
          check_circle
        </span>
        <span className="text-[11px] font-bold text-secondary uppercase tracking-widest block mb-2">Order Confirmed</span>
        <h1 className="font-display text-[28px] md:text-[36px] text-primary font-bold mb-xs">
          Thank you for your order!
        </h1>
        <p className="font-body text-[14px] text-on-surface-variant max-w-md mb-lg">
          Your order <strong>{order._id}</strong> has been received and is currently being processed.
        </p>

        {/* Order Details box */}
        <div className="w-full border-t border-b border-outline-variant/25 py-lg my-md text-left space-y-md">
          <h3 className="font-display text-[18px] font-semibold text-primary">Summary Details</h3>
          
          <div className="grid grid-cols-2 gap-sm text-[13px] text-on-surface-variant">
            <div>
              <span className="text-on-surface-variant/65 block">Date</span>
              <span className="text-primary font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-on-surface-variant/65 block">Shipping Status</span>
              <span className="text-secondary font-bold uppercase tracking-wider text-[11px]">{order.status}</span>
            </div>
            <div>
              <span className="text-on-surface-variant/65 block">Payment Method</span>
              <span className="text-primary font-medium uppercase text-[12px]">{order.paymentMethod}</span>
            </div>
            <div>
              <span className="text-on-surface-variant/65 block">Payment Status</span>
              <span className={`font-bold uppercase tracking-wider text-[11px] ${order.isPaid ? "text-secondary" : "text-error"}`}>
                {order.isPaid ? "Paid" : "Pending"}
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-outline-variant/10">
              <span className="text-on-surface-variant/65 block">Shipping Address</span>
              <span className="text-primary font-medium">
                {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.phone}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/10">
            <h4 className="text-[12px] font-bold text-primary uppercase mb-3 tracking-wider">Ordered Items</h4>
            <div className="space-y-sm">
              {order.items.map((item) => (
                <div key={item._id} className="flex justify-between items-center">
                  <div className="flex gap-sm items-center">
                    {item.productId?.images?.[0] && (
                      <img
                        src={item.productId.images[0].secure_url}
                        alt={item.productId.name}
                        className="w-8 h-10 object-cover rounded bg-surface-container-low"
                      />
                    )}
                    <span className="text-[13px] text-primary font-medium truncate max-w-[150px] sm:max-w-xs">
                      {item.productId?.name || "Product Item"}
                    </span>
                  </div>
                  <span className="text-[13px] text-primary font-semibold">
                    {item.quantity} × ${item.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full flex justify-between items-baseline py-md border-b border-outline-variant/15 mb-lg">
          <span className="font-display text-[16px] font-semibold text-primary">Total Amount</span>
          <span className="text-[22px] font-bold text-primary">${finalTotal.toLocaleString()}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-md w-full">
          <Link
            href="/collections"
            className="flex-1 bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-3.5 px-6 hover:opacity-90 text-center"
          >
            Continue Shopping
          </Link>
          <Link
            href="/account"
            className="flex-1 border border-outline-variant/60 text-on-surface-variant font-body text-[11px] font-bold uppercase tracking-widest py-3.5 px-6 hover:border-primary hover:text-primary text-center"
          >
            Go to Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="py-xxl text-center font-body text-[14px]">Loading confirmation details...</div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
