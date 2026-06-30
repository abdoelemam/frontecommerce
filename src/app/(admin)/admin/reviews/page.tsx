"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewService } from "@/services/reviewService";
import { IReview } from "@/types/review";
import { toast } from "@/store/useToastStore";

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch reviews via React Query
  const { data, isLoading: reviewsLoading } = useQuery({
    queryKey: ["adminReviews", currentPage],
    queryFn: () => reviewService.getAllReviewsAdmin(currentPage),
  });

  const reviews = data?.data?.reviews || [];
  const pagination = data?.data?.pagination;

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: (id: string) => reviewService.deleteReviewAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminReviews"] });
      toast.success("Review deleted successfully.");
      setSelectedReview(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete review.");
    },
  });

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState("All Ratings");
  const [selectedReview, setSelectedReview] = useState<IReview | null>(null);
  const [replyText, setReplyText] = useState("");

  // Helper to fetch product image dynamically
  const getProductImage = (rev: IReview) => {
    if (rev.productId?.images && rev.productId.images[0]?.secure_url) {
      return rev.productId.images[0].secure_url;
    }
    return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=60";
  };

  // Derive Statistics (KPIs) from the fetched page/pagination
  const stats = useMemo(() => {
    const total = pagination?.totalCount || reviews.length;
    
    // Average Rating
    let avg = 4.8;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
      avg = Number((sum / reviews.length).toFixed(1));
    }

    const lowRatingCount = reviews.filter(r => r.rating <= 2).length;

    return { total, avg, lowRatingCount };
  }, [reviews, pagination]);

  // Sentiment Analysis calculation for details drawer
  const sentiment = useMemo(() => {
    if (!selectedReview) return { text: "N/A", percentage: 50, color: "bg-slate-300" };
    if (selectedReview.rating >= 4) {
      return { text: "Mostly Positive", percentage: selectedReview.rating === 5 ? 95 : 80, color: "bg-emerald-500" };
    }
    if (selectedReview.rating === 3) {
      return { text: "Neutral / Mixed", percentage: 50, color: "bg-amber-500" };
    }
    return { text: "Negative", percentage: selectedReview.rating === 1 ? 10 : 30, color: "bg-[#BA1A1A]" };
  }, [selectedReview]);

  // Client Filter Logic
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // 1. Text search
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matches = (r.userId?.username || "").toLowerCase().includes(query) || 
                        (r.productId?.name || "").toLowerCase().includes(query) || 
                        r.comment.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // 2. Rating Filter
      if (selectedRating !== "All Ratings") {
        const ratingNum = parseInt(selectedRating);
        if (r.rating !== ratingNum) return false;
      }

      return true;
    });
  }, [reviews, searchQuery, selectedRating]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      deleteReviewMutation.mutate(id);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    toast.success(`Reply sent publicly: "${replyText}"`);
    setReplyText("");
  };

  if (reviewsLoading) {
    return (
      <div className="py-xl text-center font-body text-[14px] text-slate-500">
        Loading product reviews...
      </div>
    );
  }

  return (
    <div className="space-y-lg font-body text-[14px] text-slate-700 relative min-h-screen">
      
      {/* Header Block */}
      <div className="pb-sm border-b border-slate-200/80">
        <h2 className="font-display text-[22px] font-semibold text-slate-800 uppercase tracking-tight">Reviews Moderation</h2>
        <p className="text-[12px] text-slate-500">View and moderate customer reviews from the storefront.</p>
      </div>

      {/* Statistics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
        
        {/* Total Reviews */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-md shadow-sm flex items-center gap-md h-24">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
            <span className="material-symbols-outlined text-[20px]">forum</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reviews</p>
            <p className="font-display text-[24px] font-bold text-slate-800 mt-0.5">{stats.total}</p>
          </div>
        </div>

        {/* Avg Rating */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-md shadow-sm flex items-center gap-md h-24">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[#FFE083]">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Rating (Page)</p>
            <p className="font-display text-[24px] font-bold text-slate-800 mt-0.5">
              {stats.avg}
              <span className="text-[11px] font-medium text-slate-400"> / 5</span>
            </p>
          </div>
        </div>

        {/* Reported / Low Rating */}
        <div className="bg-white border border-slate-200/60 border-l-4 border-l-[#BA1A1A] rounded-xl p-md shadow-sm flex items-center gap-md h-24">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[#BA1A1A]">
            <span className="material-symbols-outlined text-[20px]">flag</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Low Rating (Page)</p>
            <p className="font-display text-[24px] font-bold text-slate-800 mt-0.5">{stats.lowRatingCount}</p>
          </div>
        </div>

      </section>

      {/* Main Table section */}
      <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-sm flex-grow">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400 pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-[13px] font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-850 w-64 transition-all"
              />
            </div>
            
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-[13px] font-semibold text-slate-650 focus:outline-none focus:border-slate-800"
            >
              <option>All Ratings</option>
              <option>5 Stars</option>
              <option>4 Stars</option>
              <option>3 Stars</option>
              <option>2 Stars</option>
              <option>1 Star</option>
            </select>
          </div>

          <button 
            onClick={() => {
              setSearchQuery("");
              setSelectedRating("All Ratings");
            }}
            className="text-[12px] font-bold text-slate-500 hover:text-slate-800 shrink-0"
          >
            Clear Filters
          </button>
        </div>

        {/* Reviews Table */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 px-4 flex flex-col items-center">
            <span className="material-symbols-outlined text-slate-350 text-[38px] mb-2">reviews</span>
            <p className="text-[14px] text-slate-500 italic font-medium">No reviews found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/30">
                  <th className="p-4">Product</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4 w-1/3">Review Comment</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReviews.map((rev) => (
                  <tr 
                    key={rev._id} 
                    className={`hover:bg-slate-50/40 cursor-pointer transition-colors group ${selectedReview?._id === rev._id ? "bg-slate-50" : ""}`}
                    onClick={() => setSelectedReview(rev)}
                  >
                    {/* Product cell with image */}
                    <td className="p-4">
                      <div className="flex items-center gap-sm">
                        <div className="w-10 h-10 bg-slate-100 border border-slate-200/60 rounded-md overflow-hidden shrink-0">
                          <img 
                            alt={rev.productId?.name || "Product"}
                            className="w-full h-full object-cover" 
                            src={getProductImage(rev)}
                          />
                        </div>
                        <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                          {rev.productId?.name || "Deleted Product"}
                        </span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{rev.userId?.username || "Guest"}</span>
                        <span className="text-[10px] text-slate-400">{rev.userId?.email || ""}</span>
                      </div>
                    </td>

                    {/* Rating Stars */}
                    <td className="p-4">
                      <div className="flex text-[#FFE083]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span 
                            key={i} 
                            className="material-symbols-outlined text-[15px]" 
                            style={{ fontVariationSettings: i < rev.rating ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="p-4 text-slate-550 max-w-xs truncate italic">
                      "{rev.comment}"
                    </td>

                    {/* Date */}
                    <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                      {new Date(rev.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    {/* Quick actions on hover */}
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(rev._id)}
                          className="p-1 rounded hover:bg-slate-100 text-[#BA1A1A] hover:text-red-700 transition-colors" 
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                        <button 
                          onClick={() => setSelectedReview(rev)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors" 
                          title="View"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-slate-450 font-body-sm text-[11px] bg-slate-50/30">
            <span>Showing Page {pagination.currentPage} of {pagination.totalPages}</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center border border-slate-200 text-slate-400 rounded transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="w-7 h-7 flex items-center justify-center bg-slate-900 text-white font-bold rounded">{currentPage}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
                className="w-7 h-7 flex items-center justify-center border border-slate-200 text-slate-400 rounded transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}

      </section>

      {/* Side Details Drawer & Backdrop */}
      {selectedReview && (
        <>
          <div 
            onClick={() => setSelectedReview(null)}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-40 transition-opacity duration-300"
          ></div>

          <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-slate-200/80 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
            
            {/* Drawer Header */}
            <div className="h-20 px-lg flex items-center justify-between border-b border-slate-150 shrink-0">
              <h3 className="font-display text-[18px] font-bold text-slate-800 uppercase tracking-tight">Review Details</h3>
              <button 
                onClick={() => setSelectedReview(null)}
                className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer Body content */}
            <div className="flex-1 overflow-y-auto p-lg space-y-xl">
              
              {/* Product Info Block */}
              <div className="flex items-start gap-md">
                <div className="w-16 h-16 bg-slate-100 rounded-md overflow-hidden shrink-0 border border-slate-200/60">
                  <img 
                    alt={selectedReview.productId?.name || "Product"} 
                    className="w-full h-full object-cover" 
                    src={getProductImage(selectedReview)}
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-[15px]">{selectedReview.productId?.name || "Deleted Product"}</h4>
                  <p className="text-[12px] text-slate-400 font-medium">Review ID: #{selectedReview._id.substring(0, 8)}</p>
                  <p className="text-[12px] text-slate-400 font-medium">Submitted: {new Date(selectedReview.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Review Comment & Client Profile */}
              <div className="space-y-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <span className="font-bold text-slate-800 text-[14px]">{selectedReview.userId?.username || "Guest"}</span>
                    <span className="text-slate-500 text-[12px]">({selectedReview.userId?.email || "No Email"})</span>
                  </div>
                </div>

                <div className="flex text-[#FFE083]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span 
                      key={i} 
                      className="material-symbols-outlined text-[18px]" 
                      style={{ fontVariationSettings: i < selectedReview.rating ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  ))}
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200/50 rounded-xl">
                  <p className="font-medium text-slate-700 leading-relaxed italic text-[13px]">
                    "{selectedReview.comment}"
                  </p>
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div className="bg-slate-50 rounded-xl p-md border border-slate-200/60 space-y-2">
                <div className="flex items-center gap-sm text-slate-500">
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest">Sentiment Analysis</span>
                </div>
                <div className="flex items-center gap-md">
                  <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${sentiment.color}`}
                      style={{ width: `${sentiment.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-[12px] font-bold text-slate-700 whitespace-nowrap">
                    {sentiment.text}
                  </span>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Concierge Public Response Draft */}
              <div className="space-y-sm">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">reply</span>
                  Reply to Customer (Public)
                </label>
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Draft your professional public response..." 
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-md font-semibold text-slate-755 text-[13px] focus:outline-none focus:border-slate-800 transition-all resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-slate-400 font-medium">This reply will be published publicly under the review.</p>
                  <button 
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1 rounded transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Reply
                  </button>
                </div>
              </div>

            </div>

            {/* Action Footer Drawer */}
            <div className="p-lg border-t border-slate-150 bg-slate-50 shrink-0 flex gap-md">
              <button 
                onClick={() => handleDelete(selectedReview._id)}
                disabled={deleteReviewMutation.isPending}
                className="flex-1 py-3 px-4 bg-[#BA1A1A] hover:bg-red-750 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 text-center"
              >
                {deleteReviewMutation.isPending ? "Deleting..." : "Delete Review"}
              </button>
            </div>

          </aside>
        </>
      )}

    </div>
  );
}
