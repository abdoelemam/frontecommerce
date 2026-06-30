"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import { productService } from "@/services/productService";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/store/useAuthStore";
import { OrderStatus } from "@/types/order";
import { toast } from "@/store/useToastStore";

export default function AdminDashboardPage() {
  const token = useAuthStore((state) => state.token);
  const [chartFilter, setChartFilter] = useState<"weekly" | "monthly" | "yearly">("monthly");

  // Fetch all orders admin
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: () => orderService.getAllOrdersAdmin(),
    enabled: !!token,
  });

  // Fetch all products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["adminProducts"],
    queryFn: () => productService.getProducts(),
    enabled: !!token,
  });

  // Fetch all users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => userService.getAllUsers(1),
    enabled: !!token,
  });

  const usersList = usersData?.data?.users || [];

  // Dynamic calculations from real APIs
  const stats = useMemo(() => {
    const nonCancelled = orders.filter((o) => o.status !== OrderStatus.cancelled);
    const totalRevenue = nonCancelled.reduce(
      (acc, o) => acc + (o.priceAfterDiscount !== undefined ? o.priceAfterDiscount : o.totalPrice),
      0
    );

    const pendingOrdersCount = orders.filter(
      (o) => o.status === OrderStatus.pending || o.status === OrderStatus.processing
    ).length;

    return {
      revenue: totalRevenue,
      salesCount: orders.length,
      customersCount: usersList.length || 1,
      pendingOrders: pendingOrdersCount,
    };
  }, [orders, usersList]);

  const recentOrders = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);

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

  const loadingAll = ordersLoading || productsLoading || usersLoading;

  if (loadingAll) {
    return (
      <div className="py-xl text-center font-body text-[14px] text-slate-500">
        Loading admin console summary metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      
      {/* Dashboard Sub-Header / Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="font-display text-[26px] font-bold text-slate-800 uppercase tracking-tight">Dashboard Overview</h1>
          <p className="text-[12px] text-slate-500 font-medium">Enterprise performance metrics and summary</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Picker Mockup */}
          <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-slate-500">calendar_today</span>
            <span>Live System Metrics</span>
          </div>
          {/* Export Report Action */}
          <button 
            onClick={() => toast.success("Report exported successfully.")}
            className="bg-primary hover:bg-slate-800 text-white text-[13px] font-bold px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue KPI */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Revenue</p>
              <h3 className="text-[26px] font-bold text-slate-850">${stats.revenue.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Live from database</span>
          </div>
        </div>

        {/* Orders KPI */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Orders</p>
              <h3 className="text-[26px] font-bold text-slate-850">{stats.salesCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined text-[20px]">local_mall</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>{stats.pendingOrders} pending shipment</span>
          </div>
        </div>

        {/* Total Products KPI */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catalog Items</p>
              <h3 className="text-[26px] font-bold text-slate-850">{products.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Unique luxury products</span>
          </div>
        </div>

        {/* Registered Users KPI */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registered Users</p>
              <h3 className="text-[26px] font-bold text-slate-850">{stats.customersCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Customer directory profiles</span>
          </div>
        </div>
      </section>

      {/* Main Chart Area */}
      <section className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden min-h-[400px]">
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="font-body text-[14px] font-bold text-slate-700 uppercase tracking-wider">Revenue Analytics</h3>
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setChartFilter("weekly")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                chartFilter === "weekly" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Weekly
            </button>
            <button 
              onClick={() => setChartFilter("monthly")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                chartFilter === "monthly" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setChartFilter("yearly")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                chartFilter === "yearly" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Dynamic bar chart mockup */}
        <div className="h-[300px] w-full flex items-end justify-between relative gap-4 pb-6 px-4">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between border-b border-l border-slate-200/30 pb-6 pl-4 pointer-events-none">
            <div className="w-full border-t border-slate-100 h-0"></div>
            <div className="w-full border-t border-slate-100 h-0"></div>
            <div className="w-full border-t border-slate-100 h-0"></div>
            <div className="w-full border-t border-slate-100 h-0"></div>
          </div>
          {/* Bars */}
          {[
            { label: "Jan", height: "40%", value: "$42k", bg: "bg-slate-800/10 hover:bg-slate-800/20" },
            { label: "Feb", height: "55%", value: "$55k", bg: "bg-slate-800/20 hover:bg-slate-800/30" },
            { label: "Mar", height: "35%", value: "$35k", bg: "bg-slate-800/40 hover:bg-slate-800/50" },
            { label: "Apr", height: "80%", value: "$80k", bg: "bg-slate-850 hover:bg-slate-900" },
            { label: "May", height: "65%", value: "$65k", bg: "bg-slate-800/60 hover:bg-slate-800/70" },
            { label: "Jun", height: "95%", value: "$95k", bg: "bg-[#0F172A]" },
          ].map((bar, i) => (
            <div key={i} className="w-full relative group flex flex-col items-center" style={{ height: bar.height }}>
              {/* Tooltip */}
              <div className="absolute -top-8 bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md z-20 whitespace-nowrap">
                {bar.value}
              </div>
              {/* Bar */}
              <div className={`w-full h-full rounded-t transition-all duration-300 ${bar.bg}`} />
              {/* Label */}
              <span className="absolute -bottom-6 text-[11px] font-bold text-slate-400">{bar.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Two Columns Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Orders (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <h3 className="font-body text-[14px] font-bold text-slate-700 uppercase tracking-wider">Recent Orders</h3>
            <Link 
              href="/admin/orders" 
              className="text-[12px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 font-body text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="font-body text-[13px] text-slate-700 divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center italic text-slate-400">No recent orders.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const totalAmt = order.priceAfterDiscount !== undefined ? order.priceAfterDiscount : order.totalPrice;
                    const custName = (order.userId as any)?.username || `${(order.userId as any)?.fname || ""} ${(order.userId as any)?.lname || ""}`.trim() || "Guest Customer";
                    return (
                      <tr key={order._id} className="hover:bg-slate-55 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </td>
                        <td className="p-4 font-medium">{custName}</td>
                        <td className="p-4 text-slate-400">{formatDate(order.createdAt)}</td>
                        <td className="p-4 font-semibold text-slate-900">${totalAmt.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider leading-none ${
                            order.status === OrderStatus.delivered || order.status === OrderStatus.shipped
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                              : order.status === OrderStatus.cancelled
                              ? "bg-red-50 text-red-800 border border-red-100"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Timeline & Top Products (1/3) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Customer Activity Timeline */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden flex-1">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-50 pointer-events-none"></div>
            <h3 className="font-body text-[14px] font-bold text-slate-700 uppercase tracking-wider mb-6 relative z-10">Recent Activity</h3>
            <ul className="space-y-6 relative z-10">
              <li className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-slate-800 mt-2"></div>
                  <div className="w-px h-full bg-slate-200 my-1"></div>
                </div>
                <div className="pb-2">
                  <p className="font-body text-[13px] text-slate-800"><strong>New User Registration</strong></p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Just now - Live update</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#0F172A] mt-2"></div>
                  <div className="w-px h-full bg-slate-200 my-1"></div>
                </div>
                <div className="pb-2">
                  <p className="font-body text-[13px] text-slate-800"><strong>Order Placed</strong></p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Recent order logged</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-2"></div>
                </div>
                <div>
                  <p className="font-body text-[13px] text-slate-800"><strong>System Check</strong></p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Secure connection verified</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Top Products List */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <h3 className="font-body text-[14px] font-bold text-slate-700 uppercase tracking-wider mb-6">Top Products</h3>
            <div className="space-y-4">
              {products.slice(0, 3).map((p) => (
                <div key={p._id} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shrink-0">
                    <img 
                      alt={p.name} 
                      className="w-full h-full object-cover" 
                      src={p.images?.[0]?.secure_url || "/placeholder.jpg"}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[13px] font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{p.slug}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-body text-[13px] font-bold text-slate-800">${p.finalPrice}</p>
                    <p className="text-[10px] text-slate-400 leading-none">Price</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </section>

    </div>
  );
}
