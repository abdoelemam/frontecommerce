"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!token || !user) {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, [token, user, router]);

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to sign out?")) {
      logout();
      router.push("/login");
    }
  };

  if (!isMounted || !authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-primary">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-body text-[13px] uppercase tracking-wider text-slate-400">Verifying session...</p>
      </div>
    );
  }

  const accountLinks = [
    { label: "Dashboard", href: "/account", icon: "dashboard" },
    { label: "Order History", href: "/account/orders", icon: "local_mall" },
    { label: "Wishlist", href: "/wishlist", icon: "favorite" },
    { label: "Saved Addresses", href: "/account/addresses", icon: "location_on" },
    { label: "Account Settings", href: "/account/settings", icon: "settings" },
  ];

  return (
    <div className="flex-grow w-full max-w-container-max mx-auto px-md md:px-gutter py-xxl grid grid-cols-1 md:grid-cols-12 gap-gutter">
      {/* Account Navigation Sidebar */}
      <aside className="hidden md:block md:col-span-3">
        <nav className="flex flex-col gap-sm sticky top-[120px]">
          {accountLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`font-body text-[14px] font-semibold tracking-wider uppercase py-2 px-4 rounded-lg transition-colors flex items-center gap-sm ${
                  isActive
                    ? "bg-surface-container-low text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
          
          <div className="h-[1px] bg-outline-variant my-md mx-md"></div>
          
          <button
            onClick={handleSignOut}
            className="w-full text-left font-body text-[14px] font-semibold tracking-wider uppercase py-2 px-4 hover:bg-surface-container-low rounded-lg transition-colors flex items-center gap-sm text-error cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="col-span-1 md:col-span-9 flex flex-col gap-xl">
        {children}
      </div>
    </div>
  );
}
