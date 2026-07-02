"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { userService } from "@/services/userService";
import { orderService } from "@/services/orderService";

export default function CheckoutPage() {
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const token = useAuthStore((state) => state.token);

  // Form States
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("Egypt");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");

  // Redirecting to Paymob loading state
  const [redirectingPaymob, setRedirectingPaymob] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // Get user profile if logged in
  const { data: profileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => userService.getProfile(),
    enabled: !!token,
  });

  // Pre-fill profile details
  useEffect(() => {
    if (profileData?.user) {
      const user = profileData.user;
      setEmail(user.email || "");
      setFirstName(user.fname || "");
      setLastName(user.lname || "");
      setPhone(user.phone || "");
    }
  }, [profileData]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, subtotal - discount);

  // Order creation mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderPayload: any) => orderService.createOrder(orderPayload),
    onSuccess: async (response) => {
      const orderId = response.data?.order?._id || response.data?.order?.id;
      
      // Save orderId BEFORE clearing cart so confirmation page can find it
      if (orderId) {
        localStorage.setItem("lastOrderId", orderId);
      }

      // Clear Zustand cart
      clearCart();

      if (paymentMethod === "card") {
        setRedirectingPaymob(true);
        try {
          const sessionUrl = await orderService.createPaymobCheckoutSession(orderId);
          window.location.href = sessionUrl;
        } catch (err: any) {
          setErrorMessage(err?.response?.data?.message || "Failed to generate Paymob payment page. Please check your order in account space.");
          setRedirectingPaymob(false);
        } 
      } else {
        window.location.href = `/order-confirmation?orderId=${orderId}`;
      }
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.message || "Failed to place order. Please check details and try again.");
    }
  });

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (cartItems.length === 0) {
      setErrorMessage("Your shopping bag is empty.");
      return;
    }

    if (phone.length < 10) {
      setErrorMessage("Please enter a valid phone number (minimum 10 digits).");
      return;
    }

    const orderPayload = {
      shippingAddress: {
        street,
        city,
        phone,
      },
      paymentMethod,
    };

    createOrderMutation.mutate(orderPayload);
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-container-max mx-auto px-gutter py-xxl text-center font-body">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-sm">shopping_cart</span>
        <h2 className="font-display text-[22px] font-semibold text-primary mb-xs">Your bag is empty</h2>
        <p className="font-body text-[14px] text-on-surface-variant mb-md">
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link href="/collections" className="bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-3 px-6">
          Return to Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-gutter py-xl">
      <div className="mb-xl text-center mt-sm">
        <h1 className="font-display text-[36px] text-primary uppercase font-bold">Checkout</h1>
        <p className="font-body text-[14px] text-on-surface-variant">Complete your shipment and billing details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
        {/* Checkout Forms Column */}
        <div className="lg:col-span-8">
          {errorMessage && (
            <div className="p-4 mb-6 rounded text-sm font-body bg-red-50 text-red-800 border border-red-200">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCheckoutSubmit} className="space-y-lg font-body">
            {/* Contact Information */}
            <div className="bg-white p-lg border border-outline-variant/20 rounded-lg space-y-md">
              <h3 className="font-display text-[18px] font-semibold text-primary pb-sm border-b border-outline-variant/15">
                1. Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div>
                  <label className="block text-[11px] font-bold text-primary uppercase mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    disabled
                    className="w-full border border-outline-variant px-3 py-2 text-[14px] text-on-surface-variant/70 bg-surface-container-low focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-primary uppercase mb-2">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 01012345678"
                    className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white p-lg border border-outline-variant/20 rounded-lg space-y-md">
              <h3 className="font-display text-[18px] font-semibold text-primary pb-sm border-b border-outline-variant/15">
                2. Shipping Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div>
                  <label className="block text-[11px] font-bold text-primary uppercase mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-primary uppercase mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-primary uppercase mb-2">Street Address</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Building No, Street Name, District"
                  className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-primary uppercase mb-2">City / Governorate</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cairo, Giza, Alexandria..."
                    className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-primary uppercase mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="Optional"
                    className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-primary uppercase mb-2">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none bg-transparent"
                >
                  <option value="Egypt">Egypt</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="France">France</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                </select>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white p-lg border border-outline-variant/20 rounded-lg space-y-md">
              <h3 className="font-display text-[18px] font-semibold text-primary pb-sm border-b border-outline-variant/15">
                3. Payment Method
              </h3>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex-1 py-3.5 border font-body text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    paymentMethod === "cash"
                      ? "border-primary bg-primary text-white"
                      : "border-outline-variant hover:border-primary text-on-surface-variant"
                  }`}
                >
                  Cash On Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex-1 py-3.5 border font-body text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary text-white"
                      : "border-outline-variant hover:border-primary text-on-surface-variant"
                  }`}
                >
                  Credit Card (Online)
                </button>
              </div>

              {paymentMethod === "card" && (
                <div className="pt-3 border-t border-outline-variant/15 flex items-center gap-2 text-[12px] text-on-surface-variant/70 font-medium animate-fade-in">
                  <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                  <span>You will be securely redirected to the Paymob acceptance portal to enter your card details and finalize your payment.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={createOrderMutation.isPending || redirectingPaymob}
              className="w-full bg-primary text-white font-body text-[13px] font-semibold py-4 px-8 uppercase tracking-widest hover:opacity-90 transition-opacity shadow-md cursor-pointer disabled:opacity-50"
            >
              {createOrderMutation.isPending
                ? "Placing Order..."
                : redirectingPaymob
                  ? "Redirecting to Paymob..."
                  : `Complete Order ($${total.toLocaleString()})`}
            </button>
          </form>
        </div>

        {/* Side Bag Overview Column */}
        <div className="lg:col-span-4 bg-surface-container-low/65 p-lg border border-outline-variant/20 rounded-lg font-body h-fit">
          <h2 className="font-display text-[20px] font-semibold text-primary mb-lg">Bag Details</h2>
          
          <div className="space-y-md border-b border-outline-variant/20 pb-lg mb-lg">
            {cartItems.map((item) => (
              <div key={`${item.productId}-${item.variant?._id || "default"}`} className="flex gap-md items-center">
                <div className="w-12 h-16 bg-surface-container-low relative overflow-hidden rounded flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-display text-[14px] font-semibold text-primary truncate">{item.name}</h4>
                  <span className="text-[12px] text-on-surface-variant block">
                    Qty: {item.quantity} {item.variant?.size ? `| Size: ${item.variant.size}` : ""}
                  </span>
                </div>
                <span className="font-semibold text-[14px] text-primary flex-shrink-0">
                  ${(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-sm text-on-surface-variant text-[14px] border-b border-outline-variant/15 pb-md mb-md">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-secondary">
                <span>Coupon Discount ({appliedCoupon.code})</span>
                <span>-${discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-secondary uppercase text-[11px] font-bold">Complimentary</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="font-display text-[16px] font-semibold text-primary">Total</span>
            <span className="text-[20px] font-bold text-primary">${total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
