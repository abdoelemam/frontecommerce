"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!token || !user || user.role !== "admin") {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, [token, user, router]);

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      logout();
      router.push("/login");
    }
  };

  if (!isMounted || !authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F172A] text-white">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-body text-[14px] uppercase tracking-wider text-slate-400">Verifying authorization...</p>
      </div>
    );
  }

  // Get user initials
  const initials = user
    ? (user.username || `${user.fname || ""} ${user.lname || ""}`).split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
    : "AD";

  const adminName = user
    ? (user.username || `${user.fname || ""} ${user.lname || ""}`)
    : "Admin User";

  const adminLinks = [
    { label: "Overview", href: "/admin", icon: "dashboard" },
    { label: "Products", href: "/admin/products", icon: "apparel" },
    { label: "Orders", href: "/admin/orders", icon: "order_approve" },
    { label: "Inventory", href: "/admin/inventory", icon: "inventory" },
    { label: "Customers", href: "/admin/customers", icon: "group" },
    { label: "Coupons", href: "/admin/coupons", icon: "confirmation_number" },
    { label: "Reviews", href: "/admin/reviews", icon: "reviews" },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-body overflow-hidden">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-[#0F172A] text-white flex-shrink-0 relative">
        {/* Sidebar Header Logo */}
        <div className="h-20 flex items-center px-lg border-b border-slate-800">
          <Link href="/admin" className="font-display text-[22px] font-bold tracking-widest text-white">
            AURORA <span className="text-[#FACC15] text-[11px] font-body tracking-wider uppercase ml-1">Admin</span>
          </Link>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 py-lg space-y-xs overflow-y-auto px-md">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center gap-sm px-4 py-3 text-[13px] font-semibold tracking-wide transition-all relative rounded ${
                  isActive
                    ? "bg-slate-800 text-white font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {/* Gold vertical line active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-[4px] bg-[#FACC15] rounded-r"></div>
                )}
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Return to Storefront & Logout */}
        <div className="p-lg border-t border-slate-800 space-y-xs">
          <Link
            href="/"
            className="flex items-center gap-sm px-4 py-2.5 rounded text-[13px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">store</span>
            <span>View Storefront</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-sm px-4 py-2.5 rounded text-[13px] font-semibold text-red-400 hover:text-red-300 hover:bg-slate-800/50 transition-all text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        ></div>
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-[280px] bg-[#0F172A] text-white z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-20 flex items-center justify-between px-lg border-b border-slate-800">
          <span className="font-display text-[20px] font-bold tracking-widest text-white">AURORA Admin</span>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="material-symbols-outlined text-white p-1"
          >
            close
          </button>
        </div>
        <nav className="flex-grow py-lg space-y-xs overflow-y-auto px-md">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-sm px-4 py-3 text-[13px] font-semibold relative rounded ${
                  isActive ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/4 bottom-1/4 w-[4px] bg-[#FACC15] rounded-r"></div>}
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-lg border-t border-slate-800 space-y-xs">
          <Link
            href="/"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-sm px-4 py-2.5 rounded text-[13px] font-semibold text-slate-400"
          >
            <span className="material-symbols-outlined text-[20px]">store</span>
            <span>View Storefront</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-sm px-4 py-2.5 rounded text-[13px] font-semibold text-red-400 text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Right Area */}
      <div className="flex-grow flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200/80 flex items-center justify-between px-lg flex-shrink-0 z-30">
          <div className="flex items-center gap-md">
            {/* Mobile Menu button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="material-symbols-outlined lg:hidden text-slate-700 p-1"
            >
              menu
            </button>

            {/* Breadcrumb / Title display */}
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Management System
              </span>
              <h2 className="text-[16px] font-bold text-slate-800 uppercase tracking-tight">
                {pathname.split("/").filter(Boolean)[1] || "Dashboard Overview"}
              </h2>
            </div>
          </div>

          {/* User profile actions */}
          <div className="flex items-center gap-md">
            <span className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-slate-800">notifications</span>
            <div className="w-px h-6 bg-slate-200"></div>
            <div onClick={handleLogout} className="flex items-center gap-xs cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-yellow-400 border border-slate-700 flex items-center justify-center font-bold text-[12px]">
                {initials}
              </div>
              <div className="hidden sm:block text-left leading-none">
                <span className="text-[12px] font-bold text-slate-800 block">{adminName}</span>
                <span className="text-[10px] text-slate-550 capitalize">{user?.role} Profile</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Box */}
        <main className="flex-1 overflow-y-auto p-lg min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
