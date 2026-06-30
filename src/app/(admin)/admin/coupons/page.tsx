"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { couponService } from "@/services/couponService";
import { Coupon } from "@/types/coupon";
import { toast } from "@/store/useToastStore";

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  // Fetch coupons
  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ["adminCoupons"],
    queryFn: () => couponService.getAllCoupons(),
  });

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: (payload: Partial<Coupon>) => couponService.createCoupon(payload),
    onSuccess: (newCoupon) => {
      queryClient.invalidateQueries({ queryKey: ["adminCoupons"] });
      toast.success(`Coupon code ${newCoupon.code} added successfully!`);
      // Reset form states
      setCode("");
      setDiscount(10);
      setDiscountType("percentage");
      setMinOrderAmount("");
      setUsageLimit("100");
      setExpiresAt(getDefaultExpiryDate());
      setShowModal(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create coupon.");
    },
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => couponService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCoupons"] });
      toast.success("Coupon deleted successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete coupon.");
    },
  });

  // Form States
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixedAmount">("percentage");
  const [discount, setDiscount] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("100");
  
  // Set default expiry date to 30 days from now
  const getDefaultExpiryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };
  const [expiresAt, setExpiresAt] = useState(getDefaultExpiryDate());

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const payload: Partial<Coupon> = {
      code: code.trim().toUpperCase(),
      discountType,
      discount: Number(discount),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      usageLimit: usageLimit ? Number(usageLimit) : 100,
      expiresAt: new Date(expiresAt).toISOString(),
    };

    createCouponMutation.mutate(payload);
  };

  const handleDelete = (id: string, codeStr: string) => {
    if (confirm(`Are you sure you want to delete coupon code ${codeStr}?`)) {
      deleteCouponMutation.mutate(id);
    }
  };

  if (couponsLoading) {
    return (
      <div className="py-xl text-center font-body text-[14px] text-slate-500">
        Loading coupon campaigns...
      </div>
    );
  }

  // Calculate dynamic stats
  const activeCount = coupons.length;
  const totalLimit = coupons.reduce((acc, c) => acc + (c.usageLimit || 0), 0);
  const totalUsed = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);

  return (
    <div className="space-y-lg font-body text-[14px] text-slate-700 animate-fade-in-up">
      
      {/* Page Header */}
      <div className="pb-sm border-b border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-[22px] font-semibold text-slate-800">Coupons & Discounts</h2>
          <p className="text-[12px] text-slate-500">Create promotional discount codes and active campaigns.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[#0F172A] hover:bg-slate-800 text-white text-[13px] font-bold px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Promo Code
          </button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        
        {/* Active Coupons Card */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-md shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Coupons</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined text-[18px]">sell</span>
            </div>
          </div>
          <div className="mt-auto">
            <span className="font-display text-[28px] font-bold text-slate-800 leading-tight block">{activeCount}</span>
            <span className="text-[11px] text-slate-400 font-semibold block mt-1">
              Currently active in store
            </span>
          </div>
        </div>

        {/* Total Usage / Used Card */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-md shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Redemptions</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
            </div>
          </div>
          <div className="mt-auto">
            <span className="font-display text-[28px] font-bold text-slate-800 leading-tight block">{totalUsed}</span>
            <span className="text-[11px] text-slate-400 font-semibold block mt-1">
              Total times coupons used
            </span>
          </div>
        </div>

        {/* Total Usage Limit Card */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-md shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Global Stock Limit</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined text-[18px]">inventory</span>
            </div>
          </div>
          <div className="mt-auto">
            <span className="font-display text-[28px] font-bold text-slate-800 leading-tight block">{totalLimit}</span>
            <span className="text-[11px] text-slate-400 font-semibold block mt-1">
              Sum of usage limits
            </span>
          </div>
        </div>

        {/* Avg Discount Value Card */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-md shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Campaign Types</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined text-[18px]">campaign</span>
            </div>
          </div>
          <div className="mt-auto">
            <span className="font-display text-[28px] font-bold text-slate-800 leading-tight block">
              {coupons.filter(c => c.discountType === "percentage").length}% / {coupons.filter(c => c.discountType === "fixedAmount").length}$
            </span>
            <span className="text-[11px] text-slate-400 font-semibold block mt-1">
              Percentage vs Fixed Amount
            </span>
          </div>
        </div>

      </div>

      {/* Main List: Active Coupons */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-md space-y-md w-full">
        <h3 className="font-display text-[16px] font-bold text-slate-800 pb-sm border-b border-slate-100 uppercase tracking-tight">
          Active Campaigns
        </h3>

        {coupons.length === 0 ? (
          <p className="text-slate-500 italic py-2">No active coupon codes found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2">Code</th>
                  <th className="py-2">Discount</th>
                  <th className="py-2 text-center">Min. Spend</th>
                  <th className="py-2 text-center">Limit / Used</th>
                  <th className="py-2 text-center">Expiry</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono font-bold text-primary tracking-wider">{c.code}</td>
                    <td className="py-3 font-semibold text-slate-800">
                      {c.discountType === "percentage" ? `${c.discount}% Off` : `$${c.discount} Off`}
                    </td>
                    <td className="py-3 text-center text-slate-500">
                      {c.minOrderAmount ? `$${c.minOrderAmount}` : "None"}
                    </td>
                    <td className="py-3 text-center text-slate-500">
                      {c.usedCount} / {c.usageLimit}
                    </td>
                    <td className="py-3 text-center text-[12px] text-slate-500">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDelete(c._id, c.code)}
                        className="font-bold text-[11px] uppercase text-red-500 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Coupon Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-gutter animate-fade-in">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          ></div>
          
          {/* Modal Card container */}
          <div className="relative w-full max-w-lg bg-white shadow-xl overflow-hidden border border-outline-variant/30 rounded-xl animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="p-lg border-b border-outline-variant/30 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-display text-[22px] font-bold text-primary">Create Promo Code</h2>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleAddCoupon} className="p-lg space-y-md">
              <div>
                <label className="block text-[11px] font-bold text-slate-650 uppercase mb-2">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. LUXURY20"
                  className="w-full border border-slate-200 px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-slate-800 uppercase font-mono font-bold tracking-wider rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-[11px] font-bold text-slate-655 uppercase mb-2">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full border border-slate-200 px-3 py-2 text-[14px] text-slate-850 focus:outline-none focus:border-slate-800 bg-white rounded"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixedAmount">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-655 uppercase mb-2">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full border border-slate-200 px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-slate-800 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-[11px] font-bold text-slate-655 uppercase mb-2">Minimum Spend ($)</label>
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    placeholder="e.g. 500 (optional)"
                    className="w-full border border-slate-200 px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-slate-800 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-655 uppercase mb-2">Usage Limit</label>
                  <input
                    type="number"
                    required
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full border border-slate-200 px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-slate-800 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-655 uppercase mb-2">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full border border-slate-200 px-3 py-2 text-[14px] text-slate-800 focus:outline-none focus:border-slate-800 bg-white rounded"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-md flex items-center justify-end gap-lg border-t border-outline-variant/10">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="font-semibold tracking-wider text-[12px] uppercase text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createCouponMutation.isPending}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white px-xl py-2.5 font-semibold tracking-wider text-[12px] uppercase rounded shadow-md hover:-translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
                >
                  {createCouponMutation.isPending ? "Activating..." : "Activate Coupon"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
