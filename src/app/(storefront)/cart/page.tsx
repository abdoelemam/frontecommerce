"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { couponService } from "@/services/couponService";
import { cartSyncService } from "@/services/cartSyncService";
import { toast } from "@/store/useToastStore";

export default function ShoppingCartPage() {
  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const setAppliedCoupon = useCartStore((state) => state.setAppliedCoupon);
  
  const token = useAuthStore((state) => state.token);

  // States
  const [promoCode, setPromoCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountValue = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, subtotal - discountValue);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setPromoLoading(true);
    const code = promoCode.trim();

    try {
      if (cartItems.length === 0) {
        setCouponError("Cart is empty.");
        setPromoLoading(false);
        return;
      }
      
      // Sync local cart to backend first so backend knows the cart has items
      await cartSyncService.syncCartBeforeCheckout(cartItems);

      // Apply coupon on backend
      const data = await couponService.applyCoupon(code);
      
      // Calculate discount amount from response or calculate it
      // Let's store the coupon in the Zustand store
      setAppliedCoupon({
        code: data.couponCode,
        discountAmount: data.discount,
      });
      setPromoCode("");
    } catch (err: any) {
      setCouponError(err?.response?.data?.message || "Invalid or expired coupon code.");
      setAppliedCoupon(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await couponService.removeCoupon();
    } catch (e) {
      // Silently ignore or catch
    }
    setAppliedCoupon(null);
  };

  const handleCheckoutClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please sign in to proceed to checkout.");
      window.location.href = "/login";
      return;
    }

    setSyncing(true);
    try {
      // Sync client cart to backend database before checkout
      await cartSyncService.syncCartBeforeCheckout(cartItems);
      window.location.href = "/checkout";
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to sync cart with database. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-container-max mx-auto px-gutter py-xl">
      <div className="mb-xl text-center mt-sm">
        <h1 className="font-display text-[36px] md:text-[48px] text-primary uppercase font-bold">
          Your Shopping Bag
        </h1>
        <p className="font-body text-[14px] text-on-surface-variant mt-1">
          Review your selections before proceeding to secure checkout.
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="py-xxl text-center max-w-md mx-auto flex flex-col items-center">
          <span className="material-symbols-outlined text-[64px] text-on-surface-variant/40 mb-md">
            shopping_bag
          </span>
          <h2 className="font-display text-[22px] font-semibold text-primary mb-xs">Your bag is empty</h2>
          <p className="font-body text-[14px] text-on-surface-variant mb-lg">
            You haven't added any luxury pieces to your cart yet. Explore our latest collections.
          </p>
          <Link
            href="/collections"
            className="bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-4 px-8 hover:opacity-90 w-full text-center block"
          >
            Explore Collections
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-md">
            <div className="hidden md:grid grid-cols-12 gap-sm pb-sm border-b border-outline-variant/30 text-[11px] font-bold font-body uppercase tracking-wider text-on-surface-variant">
              <div className="col-span-6">Item</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {cartItems.map((item) => (
              <div
                key={`${item.productId}-${item.variant?._id || "default"}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-sm py-md border-b border-outline-variant/15 items-center relative"
              >
                {/* Product details */}
                <div className="col-span-12 md:col-span-6 flex gap-md">
                  <div className="w-20 h-24 bg-surface-container-low relative flex-shrink-0 overflow-hidden rounded">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-display text-[16px] font-semibold text-primary">
                      <Link href={`/product/${item.productId}`} className="hover:underline">
                        {item.name}
                      </Link>
                    </h3>
                    <div className="flex gap-md mt-2 font-body text-[12px] text-on-surface-variant/80">
                      {item.variant?.size && <span>Size: <strong>{item.variant.size}</strong></span>}
                      {item.variant?.color && <span>Color: <strong>{item.variant.color}</strong></span>}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="col-span-6 md:col-span-2 flex justify-start md:justify-center items-center mt-2 md:mt-0">
                  <div className="flex items-center border border-outline-variant rounded bg-white">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant?._id)}
                      className="px-2.5 py-1 text-primary hover:bg-surface-container cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 font-body text-[13px] font-semibold text-primary">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant?._id)}
                      className="px-2.5 py-1 text-primary hover:bg-surface-container cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-3 md:col-span-2 text-right md:text-right font-body text-[14px] text-on-surface-variant mt-2 md:mt-0">
                  <span className="md:hidden text-[10px] uppercase font-bold block text-left">Unit Price</span>
                  ${item.price.toLocaleString()}
                </div>

                {/* Total per Item */}
                <div className="col-span-3 md:col-span-2 text-right font-body text-[14px] font-semibold text-primary mt-2 md:mt-0">
                  <span className="md:hidden text-[10px] uppercase font-bold block text-left">Subtotal</span>
                  ${(item.price * item.quantity).toLocaleString()}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeItem(item.productId, item.variant?._id)}
                  className="absolute top-2 right-2 md:relative md:top-auto md:right-auto text-on-surface-variant hover:text-error transition-colors p-1 md:col-span-12 md:flex md:justify-end"
                  title="Remove item"
                >
                  <span className="material-symbols-outlined text-[20px] cursor-pointer">delete</span>
                </button>
              </div>
            ))}

            <div className="pt-md flex justify-between items-center">
              <Link
                href="/collections"
                className="font-body text-[13px] font-semibold text-primary uppercase border-b border-primary pb-1 hover:opacity-85"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Sidebar Summary & Promo Code */}
          <div className="lg:col-span-4 bg-surface-container-low/65 p-lg border border-outline-variant/20 rounded-lg">
            <h2 className="font-display text-[20px] font-semibold text-primary mb-lg">Order Summary</h2>

            <div className="space-y-md font-body text-[14px] text-on-surface-variant/90 border-b border-outline-variant/20 pb-lg mb-lg">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-primary font-medium">${subtotal.toLocaleString()}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-secondary">
                  <span className="flex items-center gap-1">
                    Coupon ({appliedCoupon.code})
                    <button
                      onClick={handleRemoveCoupon}
                      className="material-symbols-outlined text-[14px] leading-none hover:opacity-75 cursor-pointer"
                    >
                      close
                    </button>
                  </span>
                  <span>-${discountValue.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-secondary font-medium uppercase tracking-wider text-[11px] font-bold">
                  Complimentary
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Taxes</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            {/* Promo Code Form */}
            <form onSubmit={handleApplyPromo} className="mb-lg font-body">
              <label className="block text-[11px] font-bold text-primary uppercase mb-2 tracking-wider">
                Promo Code
              </label>
              <div className="flex gap-sm">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="ENTER CODE"
                  disabled={promoLoading}
                  className="flex-grow border border-outline-variant bg-white px-3 py-2 text-[12px] uppercase font-bold tracking-wider placeholder-on-surface-variant/40 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={promoLoading}
                  className="bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest px-4 hover:opacity-90 cursor-pointer disabled:opacity-50"
                >
                  {promoLoading ? "..." : "Apply"}
                </button>
              </div>
              {couponError && <p className="text-[12px] text-error mt-1.5">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-[12px] text-secondary mt-1.5 font-medium">Promo code applied successfully!</p>
              )}
            </form>

            {/* Total Block */}
            <div className="flex justify-between items-baseline mb-lg pb-md border-b border-outline-variant/15">
              <span className="font-display text-[18px] font-semibold text-primary">Total</span>
              <span className="font-body text-[24px] font-bold text-primary">${total.toLocaleString()}</span>
            </div>

            {/* Proceed to Checkout */}
            <button
              onClick={handleCheckoutClick}
              disabled={syncing}
              className="bg-primary text-white font-body text-[13px] font-semibold py-4 px-8 uppercase tracking-widest hover:opacity-90 w-full block text-center shadow-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {syncing ? "Syncing bag..." : "Secure Checkout"}
            </button>

            <div className="mt-md text-center text-on-surface-variant/50 text-[11px] font-body">
              <span>🔒 128-bit SSL Encrypted secure checkout</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
