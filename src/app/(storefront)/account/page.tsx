"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { orderService } from "@/services/orderService";
import { wishlistService } from "@/services/wishlistService";
import { useAuthStore } from "@/store/useAuthStore";

export default function AccountOverviewPage() {
  const token = useAuthStore((state) => state.token);

  // Fetch real profile details
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => userService.getProfile(),
    enabled: !!token,
  });

  // Fetch user orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["myOrders"],
    queryFn: () => orderService.getMyOrders(),
    enabled: !!token,
  });

  // Fetch user wishlist
  const { data: wishlistItems = [], isLoading: wishlistLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistService.getWishlist(),
    enabled: !!token,
  });

  const user = useMemo(() => {
    if (!profileData?.user) {
      return {
        name: "Valued Customer",
        email: "",
        tier: "Member",
        phone: "",
        initials: "VC",
      };
    }
    const u = profileData.user;
    const fullName = u.username || `${u.fname || ""} ${u.lname || ""}`.trim() || "Customer";
    const initials = fullName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "C";
    
    return {
      name: fullName,
      email: u.email,
      tier: u.role === "admin" ? "AURORA Noir" : "AURORA Gold",
      phone: u.phone || "Not provided",
      initials,
    };
  }, [profileData]);

  // Get recent 2 orders
  const recentOrders = useMemo(() => {
    return orders.slice(0, 2);
  }, [orders]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant/40">lock</span>
        </div>
        <h2 className="font-display text-[24px] font-bold text-primary mb-2">Access Restricted</h2>
        <p className="font-body text-[14px] text-on-surface-variant mb-8 max-w-md">
          Please sign in to view your dashboard, manage orders, and access your curated wishlist.
        </p>
        <Link
          href="/login"
          className="bg-primary text-white font-body text-[12px] font-bold uppercase tracking-widest py-3.5 px-8 rounded hover:bg-primary/90 transition-colors w-full max-w-xs"
        >
          Sign In to Continue
        </Link>
      </div>
    );
  }

  const loadingAll = profileLoading || ordersLoading || wishlistLoading;

  if (loadingAll) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        <div className="h-[200px] bg-surface-container-low rounded-2xl md:col-span-2"></div>
        <div className="h-[300px] bg-surface-container-low rounded-2xl"></div>
        <div className="h-[300px] bg-surface-container-low rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1000px] mx-auto">
      {/* ═══════════════════ WELCOME HERO ═══════════════════ */}
      <div className="bg-primary rounded-2xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-primary font-display text-[32px] font-bold shadow-md shrink-0 border-4 border-white/20 z-10">
          {user.initials}
        </div>
        
        <div className="flex-grow z-10">
          <div className="inline-block bg-white/20 text-white backdrop-blur-sm font-body text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            {user.tier}
          </div>
          <h1 className="font-display text-[28px] md:text-[36px] text-white font-bold mb-1">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="font-body text-[14px] text-white/80 max-w-md">
            Manage your orders, track deliveries, and discover new items tailored for you.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ═══════════════════ MAIN CONTENT (Left 2 columns) ═══════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Recent Orders */}
          <section className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-primary">local_shipping</span>
                </div>
                <h2 className="font-display text-[18px] font-bold text-primary">Recent Orders</h2>
              </div>
              <Link
                href="/account/orders"
                className="font-body text-[12px] font-semibold text-primary hover:text-secondary uppercase tracking-wider flex items-center gap-0.5 transition-colors"
              >
                View All
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-8 text-center bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40 mb-2">inventory_2</span>
                <p className="font-body text-[13px] text-on-surface-variant">No recent orders found.</p>
                <Link href="/collections" className="inline-block mt-4 text-primary font-body text-[12px] font-bold uppercase tracking-widest hover:underline">Start Shopping</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {recentOrders.map((order) => {
                  const primaryItem = order.items[0];
                  const dateObj = new Date(order.createdAt);
                  const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  const totalAmount = order.priceAfterDiscount !== undefined ? order.priceAfterDiscount : order.totalPrice;
                  
                  // Status color mapping
                  const statusColors: Record<string, string> = {
                    pending: "bg-amber-50 text-amber-600 border-amber-200",
                    processing: "bg-blue-50 text-blue-600 border-blue-200",
                    shipped: "bg-indigo-50 text-indigo-600 border-indigo-200",
                    delivered: "bg-emerald-50 text-emerald-600 border-emerald-200",
                    cancelled: "bg-red-50 text-red-600 border-red-200",
                  };
                  const statusClass = statusColors[order.status.toLowerCase()] || "bg-gray-50 text-gray-600 border-gray-200";

                  return (
                    <Link
                      key={order._id}
                      href="/account/orders"
                      className="group bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 hover:border-primary/40 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                    >
                      {primaryItem && (
                        <div className="w-16 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-outline-variant/20 group-hover:scale-105 transition-transform">
                          <img
                            alt={primaryItem.productId?.name || "Product"}
                            className="w-full h-full object-cover"
                            src={primaryItem.productId?.images?.[0]?.secure_url || "/placeholder.jpg"}
                          />
                        </div>
                      )}
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-body text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest">
                            Order #{order._id.slice(-6).toUpperCase()}
                          </p>
                          <span className={`font-body text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusClass}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="font-display text-[15px] text-primary font-bold truncate mb-1">
                          {primaryItem?.productId?.name || "Multiple Items"}
                        </p>
                        <div className="flex items-center gap-3 font-body text-[12px] text-on-surface-variant">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span>{formattedDate}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant/50"></span>
                          <span className="font-semibold text-primary">${totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="hidden sm:flex w-8 h-8 rounded-full bg-primary/5 group-hover:bg-primary items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-primary group-hover:text-white transition-colors">arrow_forward</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Curated Wishlist */}
          <section className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-red-500">favorite</span>
                </div>
                <h2 className="font-display text-[18px] font-bold text-primary">Saved Items</h2>
              </div>
              <Link
                href="/wishlist"
                className="font-body text-[12px] font-semibold text-primary hover:text-secondary uppercase tracking-wider flex items-center gap-0.5 transition-colors"
              >
                View All
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>

            {wishlistItems.length === 0 ? (
              <div className="py-8 text-center bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40 mb-2">heart_broken</span>
                <p className="font-body text-[13px] text-on-surface-variant">Your wishlist is empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {wishlistItems.slice(0, 4).map((item) => (
                  <Link key={item._id} href={`/product/${item._id}`} className="group flex flex-col gap-2">
                    <div className="aspect-[3/4] bg-surface-container-low rounded-xl overflow-hidden relative border border-outline-variant/10">
                      <img
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        src={item.images?.[0]?.secure_url || "/placeholder.jpg"}
                      />
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm text-red-500">
                        <span className="material-symbols-outlined text-[14px] fill-current">favorite</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-body text-[12px] font-semibold text-primary truncate group-hover:text-secondary transition-colors">
                        {item.name}
                      </p>
                      <p className="font-body text-[11px] font-bold text-primary mt-0.5">
                        ${item.finalPrice.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* ═══════════════════ SIDEBAR (Right column) ═══════════════════ */}
        <div className="flex flex-col gap-6">
          
          {/* Profile Settings Bento */}
          <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <h3 className="font-display text-[16px] font-bold text-primary">Account Details</h3>
              </div>
              
              <div className="space-y-4 font-body text-[13px]">
                <div>
                  <span className="text-on-surface-variant/60 text-[11px] uppercase tracking-widest block mb-1">Email Address</span>
                  <span className="text-primary font-medium">{user.email}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant/60 text-[11px] uppercase tracking-widest block mb-1">Phone Number</span>
                  <span className="text-primary font-medium">{user.phone}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant/60 text-[11px] uppercase tracking-widest block mb-1">Password</span>
                  <span className="text-primary tracking-widest">••••••••</span>
                </div>
              </div>

              <Link
                href="/account/settings"
                className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-surface-container-lowest hover:bg-primary hover:text-white border border-outline-variant/30 hover:border-primary rounded-lg font-body text-[12px] font-bold uppercase tracking-widest text-primary transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Security / Help Bento */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20">
            <h3 className="font-display text-[14px] font-bold text-primary uppercase tracking-wider mb-4 border-b border-outline-variant/20 pb-2">Quick Links</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/account/addresses" className="flex items-center justify-between py-2 text-[13px] font-body text-on-surface-variant hover:text-primary transition-colors group">
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-on-surface-variant/50 group-hover:text-primary transition-colors">location_on</span> Shipping Addresses</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center justify-between py-2 text-[13px] font-body text-on-surface-variant hover:text-primary transition-colors group">
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-on-surface-variant/50 group-hover:text-primary transition-colors">payment</span> Payment Methods</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center justify-between py-2 text-[13px] font-body text-on-surface-variant hover:text-primary transition-colors group">
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-on-surface-variant/50 group-hover:text-primary transition-colors">help</span> Help & Support</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
