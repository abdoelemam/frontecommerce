"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { brandService } from "@/services/brandService";
import { Product } from "@/types/product";
import { toast } from "@/store/useToastStore";

export default function AdminProductsPage() {
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["adminProducts"],
    queryFn: () => productService.getProducts(),
  });

  // Fetch categories to map categoryId -> categoryName
  const { data: categories = [] } = useQuery({
    queryKey: ["adminCategories"],
    queryFn: () => categoryService.getCategories(),
  });

  // Fetch brands to map brandId -> brandName
  const { data: brands = [] } = useQuery({
    queryKey: ["adminBrands"],
    queryFn: () => brandService.getBrands(),
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      toast.success("Product deleted successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete product.");
    }
  });

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  // Map categoryId to category name
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => {
      map.set(c._id, c.name);
    });
    return map;
  }, [categories]);

  // Map brandId to brand name
  const brandMap = useMemo(() => {
    const map = new Map<string, string>();
    brands.forEach((b) => {
      map.set(b._id, b.name);
    });
    return map;
  }, [brands]);

  // Helper to get status based on stock level
  const getProductStatus = (stock: number) => {
    if (stock === 0) return "Inactive";
    if (stock <= 5) return "Low Stock";
    return "Active";
  };

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const totalStock = p.variants?.reduce((acc, v) => acc + v.stock, 0) || 0;
      const categoryName = categoryMap.get(p.categoryId) || "Uncategorized";

      // 1. Text Search
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesText = p.name.toLowerCase().includes(query) || 
                            p.slug.toLowerCase().includes(query);
        if (!matchesText) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== "All Categories") {
        if (p.categoryId !== selectedCategory) return false;
      }

      // 3. Status Filter
      if (selectedStatus !== "All Statuses") {
        const status = getProductStatus(totalStock);
        if (status !== selectedStatus) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus, categoryMap]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this product from the catalog?")) {
      deleteProductMutation.mutate(id);
    }
  };

  if (productsLoading) {
    return (
      <div className="py-xl text-center font-body text-[14px] text-slate-500">
        Loading product catalog...
      </div>
    );
  }

  return (
    <div className="space-y-lg font-body text-[14px] text-slate-700 animate-fade-in-up">
      
      {/* Header Block */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pb-4 border-b border-slate-200/60 bg-transparent">
        <div>
          <h2 className="font-display text-[26px] font-bold text-slate-800 uppercase tracking-tight">Products</h2>
          <p className="text-[12px] text-slate-500 font-medium">Manage your storefront inventory, catalog pricing, and fabric variants.</p>
        </div>
        <div className="flex items-center gap-md shrink-0">
          <button 
            onClick={() => toast.info("Simulating catalog export...")}
            className="flex items-center gap-sm px-5 py-2.5 border border-slate-300 text-slate-700 hover:border-slate-800 transition-colors font-bold text-[11px] uppercase tracking-wider rounded-lg cursor-pointer bg-white"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
          <Link 
            href="/admin/products/new"
            className="flex items-center gap-sm px-5 py-2.5 bg-[#0F172A] text-white hover:bg-slate-800 transition-all font-bold text-[11px] uppercase tracking-wider rounded-lg shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add New Product
          </Link>
        </div>
      </header>

      {/* Main Table section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Toolbar (Filters/Search) */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-md bg-slate-50/50">
          
          {/* Search box */}
          <div className="relative flex items-center w-full md:max-w-xs shrink-0">
            <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400 pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-[13px] font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all"
            />
          </div>

          {/* Quick Select Filters */}
          <div className="flex flex-wrap items-center gap-sm overflow-x-auto">
            
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-200 rounded-full px-3 py-1 text-[12px] font-bold text-slate-650 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 cursor-pointer"
            >
              <option value="All Categories">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-full px-3 py-1 text-[12px] font-bold text-slate-650 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 cursor-pointer"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Inactive">Inactive</option>
            </select>

            {(searchQuery || selectedCategory !== "All Categories" || selectedStatus !== "All Statuses") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Categories");
                  setSelectedStatus("All Statuses");
                }}
                className="text-[12px] font-bold text-[#735C00] hover:underline px-2 cursor-pointer"
              >
                Clear
              </button>
            )}

          </div>

        </div>

        {/* Table */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 px-4 flex flex-col items-center">
            <span className="material-symbols-outlined text-slate-300 text-[40px] mb-2">inventory_2</span>
            <p className="text-[14px] text-slate-500 italic font-medium">No garments match the current criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-[13px] text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 font-body text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">
                    <div className="w-4 h-4 border border-slate-300 rounded flex items-center justify-center mx-auto"></div>
                  </th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-body">
                {filteredProducts.map((p) => {
                  const totalStock = p.variants?.reduce((acc, v) => acc + v.stock, 0) || 0;
                  const status = getProductStatus(totalStock);
                  const catName = p.categoryId 
                    ? (typeof p.categoryId === 'object' ? (p.categoryId as any).name : categoryMap.get(p.categoryId as string)) 
                    : "Uncategorized";
                  const brandName = p.brandId 
                    ? (typeof p.brandId === 'object' ? (p.brandId as any).name : brandMap.get(p.brandId as string)) 
                    : "No Brand";
                  return (
                    <tr 
                      key={p._id} 
                      className="hover:bg-slate-50/40 transition-colors group cursor-pointer"
                      onClick={() => {
                        toast.info(`Viewing details for: ${p.name}. Total pieces: ${totalStock}`);
                      }}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="w-4 h-4 border border-slate-300 rounded flex items-center justify-center mx-auto group-hover:border-slate-500 transition-colors"></div>
                      </td>

                      {/* Details block */}
                      <td className="p-4">
                        <div className="flex items-center gap-md">
                          <div className="w-12 h-16 bg-slate-100 border border-slate-200/50 rounded overflow-hidden flex-shrink-0">
                            <img 
                              alt={p.name} 
                              className="w-full h-full object-cover" 
                              src={p.images?.[0]?.secure_url || "/placeholder.jpg"}
                            />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-850 block text-[14px] group-hover:text-slate-950 transition-colors">{p.name}</span>
                            <span className="text-[11px] text-slate-400 block font-medium mt-0.5">
                              {p.rateCount > 0 ? (
                                <>
                                  {p.rateAvg}
                                  <span className="text-amber-400 mx-0.5">★</span> 
                                  ({p.rateCount} reviews)
                                </>
                              ) : "No reviews"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="p-4 font-mono text-[11px] tracking-wider text-slate-500">
                        {p.slug}
                      </td>

                      {/* Category */}
                      <td className="p-4 text-slate-600 font-medium">
                        {catName}
                      </td>

                      {/* Brand */}
                      <td className="p-4 text-slate-600 font-medium">
                        {brandName}
                      </td>

                      {/* Price */}
                      <td className="p-4 font-bold text-slate-850 text-[14px]">
                        ${p.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Stock Level with color dots */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className={`w-2 h-2 rounded-full ${
                              totalStock === 0
                                ? "bg-[#BA1A1A]"
                                : totalStock <= 10
                                ? "bg-[#EEC200]"
                                : "bg-emerald-500"
                            }`}
                          ></span>
                          <span className={`font-semibold ${totalStock <= 5 ? "text-[#BA1A1A]" : "text-slate-700"}`}>
                            {totalStock === 0 ? "Out of stock" : `${totalStock} units`}
                          </span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <span 
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider leading-none ${
                            status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : status === "Low Stock"
                              ? "bg-[#FFE083]/20 text-[#735C00] border border-[#FFE083]/40"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/admin/products/${p._id}/edit`}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </Link>
                          <button 
                            onClick={(e) => handleDelete(p._id, e)}
                            disabled={deleteProductMutation.isPending}
                            className="p-1.5 rounded hover:bg-slate-100 text-[#BA1A1A] hover:text-red-700 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-slate-450 font-body-sm text-[11px] bg-slate-50/20">
            <p>Showing 1-{filteredProducts.length} of {filteredProducts.length} entries</p>
            <div className="flex gap-1">
              <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-800 transition-colors" disabled>
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded bg-slate-900 text-white font-bold">1</button>
              <button className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-800 transition-colors" disabled>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
