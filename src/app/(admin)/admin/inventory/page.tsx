"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { Product, ProductVariant } from "@/types/product";
import { toast } from "@/store/useToastStore";

export default function AdminInventoryPage() {
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

  // Category Map
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => {
      map.set(c._id, c.name);
    });
    return map;
  }, [categories]);

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      productService.updateProduct(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      toast.success("Inventory updated successfully!");
      setSelectedProduct(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update inventory.");
    },
  });

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Track stock changes per variant ID (key is variant index or color-size string)
  const [variantStocks, setVariantStocks] = useState<{ [key: string]: number }>({});

  // When a product is selected, initialize the stock editor state
  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    const initialStocks: { [key: string]: number } = {};
    p.variants?.forEach((v, index) => {
      const key = v._id || `${v.color || ""}-${v.size || ""}-${index}`;
      initialStocks[key] = v.stock;
    });
    setVariantStocks(initialStocks);
  };

  // Helper to generate elegant SKU
  const getProductSku = (p: Product, v?: ProductVariant) => {
    const nameCode = p.name.substring(0, 3).toUpperCase();
    const colorCode = v?.color ? v.color.substring(0, 2).toUpperCase() : "GE";
    const sizeCode = v?.size ? v.size.toUpperCase() : "NA";
    return `AU-${nameCode}-${colorCode}-${sizeCode}`;
  };

  // Helper to calculate total stock of a product
  const getProductTotalStock = (p: Product) => {
    return p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
  };

  // Derive Statistics
  const stats = useMemo(() => {
    let totalStockPieces = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const totalStock = getProductTotalStock(p);
      totalStockPieces += totalStock;
      if (totalStock === 0) outOfStockCount++;
      else if (totalStock <= 10) lowStockCount++;
    });

    return {
      inStockPieces: totalStockPieces,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const totalStock = getProductTotalStock(p);
      const categoryName = categoryMap.get(p.categoryId) || "Uncategorized";

      // 1. Text Search (Name, Category, or SKU)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesText = 
          p.name.toLowerCase().includes(query) || 
          categoryName.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query);
        if (!matchesText) return false;
      }

      // 2. Status dropdown filter
      if (statusFilter !== "All") {
        if (statusFilter === "Healthy" && totalStock <= 10) return false;
        if (statusFilter === "Low Stock" && (totalStock === 0 || totalStock > 10)) return false;
        if (statusFilter === "Out of Stock" && totalStock > 0) return false;
      }

      return true;
    });
  }, [products, searchQuery, statusFilter, categoryMap]);

  const getStatusBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold border border-red-100">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
          Out of Stock
        </span>
      );
    }
    if (stock <= 10) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFE083]/20 text-[#735C00] rounded-lg text-xs font-semibold border border-[#FFE083]/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EEC200]"></span>
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        Healthy
      </span>
    );
  };

  const handleStockChange = (key: string, value: number) => {
    setVariantStocks((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

  const handleSaveInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // Build the updated variants array
    const updatedVariants = selectedProduct.variants.map((v, index) => {
      const key = v._id || `${v.color || ""}-${v.size || ""}-${index}`;
      return {
        color: v.color,
        size: v.size,
        stock: variantStocks[key] !== undefined ? variantStocks[key] : v.stock,
        priceDiff: v.priceDiff || 0,
      };
    });

    const formData = new FormData();
    formData.append("name", selectedProduct.name);
    formData.append("description", selectedProduct.description || "Updated inventory.");
    formData.append("price", String(selectedProduct.price));
    formData.append("discount", String(selectedProduct.discount || 0));
    formData.append("categoryId", selectedProduct.categoryId);
    formData.append("variants", JSON.stringify(updatedVariants));

    updateProductMutation.mutate({ id: selectedProduct._id, formData });
  };

  if (productsLoading) {
    return (
      <div className="py-xl text-center font-body text-[14px] text-slate-500">
        Loading product inventory catalog...
      </div>
    );
  }

  return (
    <div className="space-y-lg font-body text-[14px] text-slate-700 relative min-h-screen">
      
      {/* Header Title Block */}
      <div className="pb-sm border-b border-slate-200/80">
        <h2 className="font-display text-[22px] font-semibold text-slate-800 uppercase tracking-tight">Inventory Overview</h2>
        <p className="text-[12px] text-slate-500">Monitor stock levels, SKU allocations, and update variant quantities directly.</p>
      </div>

      {/* Bento Grid Metrics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
        
        {/* Total In Stock */}
        <div className="bg-white rounded-xl p-md shadow-sm border border-slate-200/60 flex flex-col relative overflow-hidden h-28 group">
          <div className="flex justify-between items-start mb-md">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">In Stock Pieces</p>
              <h3 className="font-display text-[24px] font-bold text-slate-850 mt-0.5">{stats.inStockPieces.toLocaleString()}</h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
              <span className="material-symbols-outlined text-[18px]">inventory</span>
            </div>
          </div>
          <div className="mt-auto text-[11px] text-slate-400 font-semibold">
            Across all products and variations
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl p-md shadow-sm border border-slate-200/60 flex flex-col relative overflow-hidden h-28 group">
          <div className="flex justify-between items-start mb-md">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Low Stock Products</p>
              <h3 className="font-display text-[24px] font-bold text-slate-850 mt-0.5">{stats.lowStockCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#FFE083]/15 flex items-center justify-center text-[#735C00]">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
          </div>
          <div className="mt-auto text-[11px] text-slate-400 font-semibold">
            Products with 10 or fewer units in stock
          </div>
        </div>

        {/* Out of Stock Alert */}
        <div className="bg-white rounded-xl p-md shadow-sm border border-slate-200/60 flex flex-col relative overflow-hidden h-28 group border-l-4 border-l-[#BA1A1A]">
          <div className="flex justify-between items-start mb-md">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-[#BA1A1A]">Out of Stock</p>
              <h3 className="font-display text-[24px] font-bold text-[#BA1A1A] mt-0.5">{stats.outOfStockCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-[#BA1A1A]">
              <span className="material-symbols-outlined text-[18px]">block</span>
            </div>
          </div>
          <div className="mt-auto text-[11px] text-slate-400 font-semibold">
            Inactive storefront listings
          </div>
        </div>

      </section>

      {/* Product Inventory Table Section */}
      <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-display text-[16px] font-bold text-slate-800 uppercase tracking-tight">Product Inventory Sheet</h3>
          </div>
          <div className="flex items-center gap-sm">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${showFilters ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-250 text-slate-700 hover:border-slate-850"}`}
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              Filters
            </button>
          </div>
        </div>

        {/* Collapsible Filter Bar */}
        {showFilters && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/20 grid grid-cols-1 sm:grid-cols-2 gap-md items-end">
            <div className="space-y-xs">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Search Query</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400 pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Product name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-[13px] font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-800 w-full transition-all"
                />
              </div>
            </div>
            <div className="space-y-xs">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Stock Status</label>
              <div className="flex gap-sm">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-[13px] font-semibold text-slate-650 focus:outline-none focus:border-slate-800 w-full"
                >
                  <option value="All">All Statuses</option>
                  <option value="Healthy">Healthy (Stock &gt; 10)</option>
                  <option value="Low Stock">Low Stock (Stock &le; 10)</option>
                  <option value="Out of Stock">Out of Stock (Stock = 0)</option>
                </select>
                {(searchQuery || statusFilter !== "All") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("All");
                    }}
                    className="text-[12px] font-bold text-slate-500 hover:text-slate-800 whitespace-nowrap px-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table layout */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 px-4 flex flex-col items-center">
            <span className="material-symbols-outlined text-slate-350 text-[38px] mb-2">package_2</span>
            <p className="text-[14px] text-slate-500 italic font-medium">No items found matching the filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">Product Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Global Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const totalStock = getProductTotalStock(p);
                  const categoryName = categoryMap.get(p.categoryId) || "Uncategorized";
                  return (
                    <tr 
                      key={p._id} 
                      className="hover:bg-slate-50/40 transition-colors group cursor-pointer"
                      onClick={() => handleSelectProduct(p)}
                    >
                      {/* Product details */}
                      <td className="p-4">
                        <div className="flex items-center gap-md">
                          <div className="w-12 h-16 bg-slate-100 border border-slate-200/50 rounded overflow-hidden flex-shrink-0">
                            <img 
                              alt={p.name} 
                              className="w-full h-full object-cover" 
                              src={p.images?.[0]?.secure_url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=60"}
                            />
                          </div>
                          <div>
                            <span className="font-headline text-[15px] font-semibold text-slate-800 block mb-0.5 group-hover:text-slate-950">{p.name}</span>
                            <span className="text-[11px] text-slate-400 block font-medium capitalize">
                              {p.variants?.length || 0} variations available
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="font-semibold text-slate-600 capitalize">
                          {categoryName}
                        </span>
                      </td>

                      {/* Global stock quantity */}
                      <td className="p-4">
                        <div className="flex items-end gap-0.5">
                          <span className={`text-[16px] font-bold ${totalStock === 0 ? "text-[#BA1A1A]" : "text-slate-850"}`}>{totalStock}</span>
                          <span className="text-[10px] text-slate-400 font-semibold mb-0.5">units</span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="p-4">
                        {getStatusBadge(totalStock)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleSelectProduct(p)}
                          className="text-slate-400 hover:text-slate-950 material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          edit
                        </button>
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
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/20 text-[11px] text-slate-400 font-semibold">
            <span>Showing {filteredProducts.length} products</span>
          </div>
        )}

      </section>

      {/* Side Replenish Drawer & Backdrop */}
      {selectedProduct && (
        <>
          <div 
            onClick={() => setSelectedProduct(null)}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-40 transition-opacity"
          ></div>

          <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-slate-200/80 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
            
            {/* Header */}
            <div className="h-20 px-lg flex items-center justify-between border-b border-slate-150 shrink-0">
              <h3 className="font-display text-[18px] font-bold text-slate-800 uppercase tracking-tight">Edit Variant Stock</h3>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSaveInventory} className="flex-1 flex flex-col justify-between overflow-hidden">
              
              <div className="p-lg space-y-lg overflow-y-auto flex-1">
                {/* Product Detail Card */}
                <div className="flex items-start gap-md bg-slate-50 p-4 border border-slate-200/50 rounded-xl">
                  <div className="w-16 h-20 bg-white border border-slate-200/80 rounded overflow-hidden shrink-0">
                    <img 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-cover" 
                      src={selectedProduct.images?.[0]?.secure_url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=60"}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-850 text-[15px]">{selectedProduct.name}</h4>
                    <span className="text-[12px] text-slate-450 block mt-1">
                      {categoryMap.get(selectedProduct.categoryId) || "Uncategorized"}
                    </span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[12px] font-semibold text-slate-500">Total Stock:</span>
                      <span className="font-bold">{getProductTotalStock(selectedProduct)} units</span>
                    </div>
                  </div>
                </div>

                {/* Variants List Section */}
                <div className="space-y-sm">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Stock Levels By Variant</label>
                  
                  {selectedProduct.variants?.length === 0 ? (
                    <p className="text-slate-500 italic">No variations defined for this product.</p>
                  ) : (
                    <div className="space-y-sm divide-y divide-slate-100">
                      {selectedProduct.variants?.map((v, index) => {
                        const key = v._id || `${v.color || ""}-${v.size || ""}-${index}`;
                        const sku = getProductSku(selectedProduct, v);
                        const currentVal = variantStocks[key] !== undefined ? variantStocks[key] : v.stock;
                        return (
                          <div key={key} className="pt-3 first:pt-0 flex items-center justify-between gap-md">
                            <div className="flex-grow">
                              <div className="flex items-center gap-sm font-semibold text-slate-800 text-[14px]">
                                {v.color && <span className="capitalize">Color: {v.color}</span>}
                                {v.size && <span className="uppercase">Size: {v.size}</span>}
                              </div>
                              <span className="font-mono text-[10px] text-slate-400 block tracking-wider mt-0.5">{sku}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStockChange(key, currentVal - 10)}
                                className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center font-bold text-[12px] hover:bg-slate-50 text-slate-600 transition-colors"
                              >
                                -10
                              </button>
                              <input
                                type="number"
                                required
                                min={0}
                                value={currentVal}
                                onChange={(e) => handleStockChange(key, Number(e.target.value))}
                                className="bg-slate-50 border border-slate-200 rounded text-center py-1.5 text-[13px] font-bold text-slate-850 w-20 focus:outline-none focus:border-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => handleStockChange(key, currentVal + 10)}
                                className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center font-bold text-[12px] hover:bg-slate-50 text-slate-600 transition-colors"
                              >
                                +10
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Submit button footer */}
              <div className="p-lg border-t border-slate-150 bg-slate-50 shrink-0">
                <button
                  type="submit"
                  disabled={updateProductMutation.isPending}
                  className="w-full py-3.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {updateProductMutation.isPending ? "Saving changes..." : "Save Variant Stock Levels"}
                </button>
              </div>

            </form>

          </aside>
        </>
      )}

    </div>
  );
}
