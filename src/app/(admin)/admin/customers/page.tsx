"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { orderService } from "@/services/orderService";
import { authService } from "@/services/authService";
import { IUser } from "@/types/user";
import { toast } from "@/store/useToastStore";

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All"); // All, Blocked, Active, Verified
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Modal States for registering new customer
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [password, setPassword] = useState("TempPassword123!");

  // Fetch users with backend search
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers", currentPage, searchQuery],
    queryFn: () => userService.getAllUsers(currentPage, searchQuery),
    placeholderData: (prev) => prev,
  });

  // Fetch all orders to compute LTV / Order Count dynamically per customer
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: () => orderService.getAllOrdersAdmin(),
  });

  const users = usersData?.data?.users || [];
  const pagination = usersData?.data?.pagination;

  // Toggle Block Status Mutation
  const toggleBlockMutation = useMutation({
    mutationFn: (userId: string) => userService.toggleBlockStatus(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success(data.message || "User block status updated successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update user block status.");
    },
  });

  // Register New User Mutation
  const registerUserMutation = useMutation({
    mutationFn: (payload: any) => authService.register(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("Customer registered successfully! (Verification code sent to their email)");
      setShowModal(false);
      // Reset form
      setUsername("");
      setEmail("");
      setPhone("");
      setGender("male");
      setRole("user");
      setPassword("TempPassword123!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to register customer.");
    },
  });

  // Compute LTV and order stats for each user in the current view
  const customersWithStats = useMemo(() => {
    return users.map((user) => {
      const userOrders = orders.filter((o) => o.userId === user._id);
      const orderCount = userOrders.length;
      const totalSpent = userOrders.reduce((sum, o) => sum + (o.priceAfterDiscount || o.totalPrice), 0);
      const lastOrderDate = userOrders.length > 0 
        ? userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : null;

      return {
        ...user,
        orderCount,
        totalSpent,
        lastOrderDate,
      };
    });
  }, [users, orders]);

  // Derive Statistics (KPIs)
  const stats = useMemo(() => {
    const totalCount = pagination?.totalCount || users.length;
    const blockedCount = users.filter((u) => u.isBlocked).length;
    const verifiedCount = users.filter((u) => u.isVerified).length;
    
    // Sum spent for current paginated customers
    const currentSpent = customersWithStats.reduce((sum, c) => sum + c.totalSpent, 0);

    return {
      totalCount,
      blockedCount,
      verifiedCount,
      currentSpent,
    };
  }, [users, pagination, customersWithStats]);

  // Client-side filtering on top of server paginated results
  const filteredCustomers = useMemo(() => {
    return customersWithStats.filter((c) => {
      if (selectedStatus === "Blocked" && !c.isBlocked) return false;
      if (selectedStatus === "Active" && c.isBlocked) return false;
      if (selectedStatus === "Verified" && !c.isVerified) return false;
      return true;
    });
  }, [customersWithStats, selectedStatus]);

  const getAvatar = (name: string) => {
    const letter = name ? name.charAt(0).toUpperCase() : "U";
    return (
      <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-[#0F172A] font-display font-bold text-[18px] rounded-lg shrink-0 border border-slate-200">
        {letter}
      </div>
    );
  };

  const handleToggleBlock = (userId: string, username: string) => {
    if (confirm(`Are you sure you want to change the block status for ${username}?`)) {
      toggleBlockMutation.mutate(userId);
    }
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !username.trim()) {
      toast.error("Please enter the required customer details.");
      return;
    }

    registerUserMutation.mutate({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      gender: gender,
      role: role,
      password: password,
      cpassword: password,
    });
  };

  if (usersLoading || ordersLoading) {
    return (
      <div className="py-xl text-center font-body text-[14px] text-slate-500">
        Loading customers and order history...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body text-[14px] animate-fade-in-up">
      
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="font-display text-[26px] font-bold text-slate-800 uppercase tracking-tight">Customers Directory</h1>
          <p className="text-[12px] text-slate-500 font-medium">View shopper purchase histories, order metrics, block statuses, and roles.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[#0F172A] hover:bg-slate-800 text-white text-[13px] font-bold px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer animate-pulse-slow"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Customer
          </button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        
        {/* Total Shoppers Card */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-md shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Shoppers</span>
            <span className="font-display text-[28px] font-bold text-slate-800 leading-tight block mt-1">{stats.totalCount}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-auto">
            <span>Global accounts registered</span>
          </div>
          <span className="material-symbols-outlined absolute right-4 top-4 text-slate-300 text-[26px]">group</span>
        </div>

        {/* Verified Accounts */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-md shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Verified Shoppers</span>
            <span className="font-display text-[28px] font-bold text-emerald-600 leading-tight block mt-1">{stats.verifiedCount}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-auto">
            <span>Users who verified email OTP</span>
          </div>
          <span className="material-symbols-outlined absolute right-4 top-4 text-slate-300 text-[26px]">verified</span>
        </div>

        {/* Blocked Accounts */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-md shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Blocked Shoppers</span>
            <span className="font-display text-[28px] font-bold text-[#BA1A1A] leading-tight block mt-1">{stats.blockedCount}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-auto">
            <span>Accounts restricted from purchase</span>
          </div>
          <span className="material-symbols-outlined absolute right-4 top-4 text-slate-300 text-[26px]">block</span>
        </div>

        {/* Dynamic spend calculation */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-md shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">LTV of Page</span>
            <span className="font-display text-[28px] font-bold text-slate-800 leading-tight block mt-1">
              ${stats.currentSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-auto">
            <span>Sum of spending on this page</span>
          </div>
          <span className="material-symbols-outlined absolute right-4 top-4 text-slate-300 text-[26px]">payments</span>
        </div>

      </div>

      {/* Main Table Card (Full Width) */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Header / Summary & Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Users Matching Filters ({filteredCustomers.length})
            </span>
          </div>

          {/* Inline Search & Status Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
            {/* Search Input Box */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-slate-400 pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Search username/email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full sm:w-64 bg-white border-2 border-slate-200 rounded-[10px] pl-10 pr-4 py-2 text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:outline-none transition-all"
              />
            </div>

            {/* Status Selection (Segmented Pills) */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              {[
                { id: "All", label: "All Users" },
                { id: "Blocked", label: "Blocked" },
                { id: "Active", label: "Active" },
                { id: "Verified", label: "Verified" }
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedStatus(tier.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-all cursor-pointer ${
                    selectedStatus === tier.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            {/* Clear Filters Button */}
            {(searchInput !== "" || selectedStatus !== "All") && (
              <button 
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  setSelectedStatus("All");
                }}
                className="px-3 py-1.5 text-[12px] font-bold text-[#BA1A1A] hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-transparent hover:border-red-100 shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table Layout */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 px-4 flex flex-col items-center">
            <span className="material-symbols-outlined text-slate-300 text-[40px] mb-2">person_search</span>
            <p className="text-[14px] text-slate-500 italic font-medium">No user profiles match the current filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/50 font-body text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Orders Count</th>
                  <th className="p-4 text-right">Total Spend</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-body">
                {filteredCustomers.map((c) => (
                  <tr 
                    key={c._id} 
                    className={`hover:bg-slate-50/40 transition-colors cursor-pointer group ${selectedCustomerEmail === c.email ? "bg-slate-50/80" : ""}`}
                    onClick={() => setSelectedCustomerEmail(c.email === selectedCustomerEmail ? null : c.email)}
                  >
                    {/* Profile details */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {getAvatar(c.username || c.fname || "User")}
                        <div>
                          <span className="font-semibold text-slate-800 block text-[14px] group-hover:text-[#0F172A] transition-colors">
                            {c.username || `${c.fname || ""} ${c.lname || ""}` || "Unnamed User"}
                          </span>
                          <span className="text-[11px] text-slate-400 block">{c.email}</span>
                          {c.phone && <span className="text-[10px] text-slate-500 block">Phone: {c.phone}</span>}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      <span className="font-semibold capitalize text-slate-600">{c.role}</span>
                    </td>

                    {/* Status Badges */}
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1 items-center justify-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest leading-none ${
                            c.isBlocked
                              ? "bg-red-50 text-[#BA1A1A] border border-red-200"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          }`}
                        >
                          {c.isBlocked ? "Blocked" : "Active"}
                        </span>
                        {c.isVerified && (
                          <span className="inline-flex items-center text-[9px] font-bold uppercase text-slate-400">
                            Verified
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Order Count */}
                    <td className="p-4 text-center text-slate-600 font-semibold">
                      {c.orderCount} {c.orderCount === 1 ? "purchase" : "purchases"}
                    </td>

                    {/* Total Spend */}
                    <td className="p-4 font-bold text-slate-900 text-right text-[14px]">
                      ${c.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleToggleBlock(c._id, c.username || c.email)}
                        disabled={toggleBlockMutation.isPending}
                        className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded border transition-colors disabled:opacity-50 ${
                          c.isBlocked 
                            ? "border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                            : "border-[#BA1A1A] text-[#BA1A1A] hover:bg-red-50"
                        }`}
                      >
                        {c.isBlocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-[11px] text-slate-400 font-medium">
              Showing Page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 rounded transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="w-7 h-7 flex items-center justify-center bg-slate-900 text-white text-[11.5px] font-bold rounded">
                {currentPage}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
                className="w-7 h-7 flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 rounded transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Add Customer Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-gutter animate-fade-in">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          ></div>
          
          {/* Modal Card container */}
          <div className="relative w-full max-w-2xl bg-white shadow-xl overflow-hidden border border-outline-variant/30 rounded-xl animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="p-lg border-b border-outline-variant/30 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-display text-[22px] font-bold text-primary">Register New Customer</h2>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleSaveCustomer} className="p-lg space-y-lg">
              
              {/* Row 1: Username / Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="space-y-xs">
                  <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Username</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. eleanor_vance" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-md py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold"
                  />
                </div>
                <div className="space-y-xs">
                  <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Email Address</label>
                  <input 
                    type="email"
                    required
                    placeholder="e.vance@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-md py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold"
                  />
                </div>
              </div>
              
              {/* Row 2: Phone / Gender / Role */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                <div className="space-y-xs">
                  <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Phone Number</label>
                  <input 
                    type="tel"
                    placeholder="e.g. 0123456789" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-md py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold"
                  />
                </div>
                <div className="space-y-xs">
                  <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Gender</label>
                  <div className="relative">
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value as "male" | "female")}
                      className="w-full px-md py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer font-bold pr-10"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div className="space-y-xs">
                  <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Role</label>
                  <div className="relative">
                    <select 
                      value={role}
                      onChange={(e) => setRole(e.target.value as "user" | "admin")}
                      className="w-full px-md py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer font-bold pr-10"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Password */}
              <div className="space-y-xs">
                <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Password</label>
                <input 
                  type="text"
                  required
                  placeholder="Set initial password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-md py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                />
                <p className="text-[10px] text-slate-400 font-medium">Must be at least 6 characters, with uppercase and lowercase letters.</p>
              </div>
              
              {/* Row 5: Actions */}
              <div className="pt-lg flex items-center justify-end gap-lg border-t border-outline-variant/10">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="font-semibold tracking-wider text-[12px] uppercase text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={registerUserMutation.isPending}
                  className="bg-primary hover:bg-slate-800 text-white px-xl py-md font-semibold tracking-wider text-[12px] uppercase rounded-lg shadow-md hover:-translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
                >
                  {registerUserMutation.isPending ? "Registering..." : "Register Customer"}
                </button>
              </div>
              
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
