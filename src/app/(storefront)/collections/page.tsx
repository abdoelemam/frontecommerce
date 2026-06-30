"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { useFilterStore } from "@/store/useFilterStore";
import { useCartStore } from "@/store/useCartStore";
import { Product, FacetFilter, BrandFacet, FacetedFilters } from "@/types/product";
import { toast } from "@/store/useToastStore";

/* ─── Category Tree Builder ───────────────────────────────── */
interface CategoryNode extends Category {
  children: CategoryNode[];
}

function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  categories.forEach((cat) => {
    map.set(cat._id, { ...cat, children: [] });
  });

  const roots: CategoryNode[] = [];
  map.forEach((node) => {
    let parentIdStr: string | null = null;
    if (node.parentId) {
      if (typeof node.parentId === "string") {
        parentIdStr = node.parentId;
      } else if (typeof node.parentId === "object" && "_id" in node.parentId) {
        parentIdStr = node.parentId._id;
      }
    }

    if (parentIdStr) {
      const parent = map.get(parentIdStr);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function getAllDescendantIds(node: CategoryNode): string[] {
  let ids = [node._id];
  node.children.forEach((child) => {
    ids = [...ids, ...getAllDescendantIds(child)];
  });
  return ids;
}

/* ─── Sidebar Category Tree Item ────────────────────────── */
function SidebarCategoryItem({
  node,
  depth,
  selectedCategories,
  onToggle,
  // Accordion props (only used at depth=0)
  isRootOpen,
  onRootToggle,
}: {
  node: CategoryNode;
  depth: number;
  selectedCategories: string[];
  onToggle: (id: string) => void;
  isRootOpen?: boolean;
  onRootToggle?: () => void;
}) {
  // For nested items (depth > 0), manage open/close locally
  const [localOpen, setLocalOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedCategories.includes(node._id);

  // Determine if this node is open:
  // - At root level (depth=0): controlled by accordion (isRootOpen)
  // - At nested levels: controlled locally
  const isOpen = depth === 0 ? (isRootOpen ?? false) : localOpen;

  // Auto-expand nested children (depth > 0) if any descendant is selected
  // Root-level (depth=0) expansion is handled by DynamicSidebar's openRootId state
  useEffect(() => {
    if (hasChildren && depth > 0) {
      const allIds = getAllDescendantIds(node);
      if (selectedCategories.some((id) => allIds.includes(id))) {
        setLocalOpen(true);
      }
    }
  }, [selectedCategories, hasChildren, node, depth]);

  const handleToggleOpen = () => {
    if (depth === 0 && onRootToggle) {
      onRootToggle();
    } else {
      setLocalOpen(!localOpen);
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 group"
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        {hasChildren ? (
          <button
            onClick={handleToggleOpen}
            className="w-5 h-5 flex items-center justify-center text-on-surface-variant/60 hover:text-primary cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isOpen ? "remove" : "add"}
            </span>
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}

        <button
          onClick={() => onToggle(node._id)}
          className={`font-body text-[13px] text-left flex-grow transition-colors cursor-pointer capitalize truncate ${
            isSelected
              ? "text-primary font-bold"
              : "text-on-surface-variant hover:text-primary"
          }`}
        >
          {node.name}
        </button>
      </div>

      {hasChildren && isOpen && (
        <div>
          {node.children.map((child) => (
            <SidebarCategoryItem
              key={child._id}
              node={child}
              depth={depth + 1}
              selectedCategories={selectedCategories}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Collapsible Filter Section ────────────────────────── */
function FilterSection({
  title,
  defaultOpen = true,
  children,
  count,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  count?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-outline-variant/20 pb-3 mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-1.5 cursor-pointer group"
      >
        <h3 className="font-body text-[13px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          {title}
          {count !== undefined && count > 0 && (
            <span className="bg-primary text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {count}
            </span>
          )}
        </h3>
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant/60 group-hover:text-primary transition-colors">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  );
}

/* ─── Color hex helper ────────────────────────────────────── */
function getColorHex(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("black")) return "#000000";
  if (lower.includes("white")) return "#ffffff";
  if (lower.includes("navy") || lower.includes("blue")) return "#1e3a8a";
  if (lower.includes("charcoal") || lower.includes("gray") || lower.includes("grey")) return "#4b5563";
  if (lower.includes("ivory") || lower.includes("cream")) return "#fefcbf";
  if (lower.includes("beige") || lower.includes("alabaster")) return "#f5f5dc";
  if (lower.includes("red") || lower.includes("burgundy")) return "#dc2626";
  if (lower.includes("green") || lower.includes("forest")) return "#16a34a";
  if (lower.includes("brown") || lower.includes("tan") || lower.includes("camel")) return "#78350f";
  if (lower.includes("oatmeal")) return "#F5F5DC";
  if (lower.includes("midnight")) return "#2C3E50";
  return "#94a3b8";
}

/* ═══════════════════ DYNAMIC SIDEBAR ═══════════════════ */
function DynamicSidebar({
  filters,
  categoryTree,
  categories,
}: {
  filters: FacetedFilters | null;
  categoryTree: CategoryNode[];
  categories: Category[];
}) {
  const store = useFilterStore();

  // Accordion state: only one root category open at a time
  const [openRootId, setOpenRootId] = useState<string | null>(null);

  // Auto-set openRootId when selectedCategories change
  useEffect(() => {
    if (store.selectedCategories.length > 0 && categoryTree.length > 0) {
      const selectedId = store.selectedCategories[0];
      // Find which root category contains this selected category
      for (const root of categoryTree) {
        const allIds = getAllDescendantIds(root);
        if (allIds.includes(selectedId)) {
          setOpenRootId(root._id);
          return;
        }
      }
    }
  }, [store.selectedCategories, categoryTree]);

  // Filter out empty string values from colors and sizes
  const validColors = useMemo(
    () => (filters?.colors || []).filter((c) => c && c.trim() !== ""),
    [filters?.colors]
  );
  const validSizes = useMemo(
    () => (filters?.sizes || []).filter((s) => s && s.trim() !== ""),
    [filters?.sizes]
  );
  const validAttributes = useMemo(
    () => (filters?.attributes || []).filter((a) => a.values && a.values.filter(v => v && String(v).trim() !== "").length > 0).map(a => ({
      ...a,
      values: a.values.filter(v => v && String(v).trim() !== "")
    })),
    [filters?.attributes]
  );

  const hasActiveFilters =
    store.selectedCategories.length > 0 ||
    store.selectedBrands.length > 0 ||
    store.selectedColors.length > 0 ||
    store.selectedSizes.length > 0 ||
    Object.keys(store.selectedAttributes).length > 0 ||
    store.priceRange[0] > 0 ||
    store.priceRange[1] < 99999 ||
    store.search;

  // Determine which root tree to show based on selection
  const activeCategoryRoot = useMemo(() => {
    if (store.selectedCategories.length === 0) return null;
    const selectedId = store.selectedCategories[0];
    // Check if the selected ID IS a root
    const directRoot = categoryTree.find(r => r._id === selectedId);
    if (directRoot) return directRoot;
    // Otherwise, find which root contains it
    for (const root of categoryTree) {
      const allIds = getAllDescendantIds(root);
      if (allIds.includes(selectedId)) return root;
    }
    return null;
  }, [store.selectedCategories, categoryTree]);

  return (
    <aside className="w-full lg:w-60 flex-shrink-0">
      <div className="sticky top-24 bg-white rounded-lg border border-outline-variant/20 p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 mb-2 border-b border-outline-variant/20">
          <h2 className="font-body text-[13px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Filters
          </h2>
          {hasActiveFilters && (
            <button
              onClick={store.clearAll}
              className="font-body text-[10px] text-red-500 hover:text-red-700 cursor-pointer uppercase tracking-wider font-bold"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Category Filter */}
        <FilterSection title="Category" defaultOpen={true} count={store.selectedCategories.length}>
          {categoryTree.length > 0 ? (
            <div className="max-h-[250px] overflow-y-auto">
              {/* When a category is selected: show "Back" + only the active root's subtree */}
              {activeCategoryRoot ? (
                <div>
                  {/* Back to all categories */}
                  <button
                    onClick={() => store.clearAll()}
                    className="flex items-center gap-1 mb-2 font-body text-[11px] text-on-surface-variant hover:text-primary cursor-pointer transition-colors group"
                  >
                    <span className="material-symbols-outlined text-[14px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                    All Categories
                  </button>
                  
                  {/* Active root category name (as header) */}
                  <button
                    onClick={() => store.toggleCategory(activeCategoryRoot._id)}
                    className={`font-body text-[13px] font-bold capitalize mb-1.5 block w-full text-left cursor-pointer transition-colors ${
                      store.selectedCategories.includes(activeCategoryRoot._id)
                        ? "text-primary"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {activeCategoryRoot.name}
                  </button>

                  {/* Show subcategories */}
                  {activeCategoryRoot.children.length > 0 && (
                    <div className="ml-2 border-l-2 border-primary/10 pl-2">
                      {activeCategoryRoot.children.map((child) => (
                        <SidebarCategoryItem
                          key={child._id}
                          node={child}
                          depth={1}
                          selectedCategories={store.selectedCategories}
                          onToggle={store.toggleCategory}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* No category selected: show all root categories */
                categoryTree.map((root) => (
                  <SidebarCategoryItem
                    key={root._id}
                    node={root}
                    depth={0}
                    selectedCategories={store.selectedCategories}
                    onToggle={store.toggleCategory}
                    isRootOpen={openRootId === root._id}
                    onRootToggle={() => setOpenRootId(openRootId === root._id ? null : root._id)}
                  />
                ))
              )}
            </div>
          ) : (
            <p className="font-body text-[12px] text-on-surface-variant/60 italic">No categories</p>
          )}
        </FilterSection>

        {/* Brand Filter (dynamic from API) */}
        {filters && filters.brands.length > 0 && (
          <FilterSection title="Brand" defaultOpen={true} count={store.selectedBrands.length}>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {filters.brands.map((brand) => {
                const isChecked = store.selectedBrands.includes(brand._id);
                return (
                  <label
                    key={brand._id}
                    className="flex items-center gap-2 cursor-pointer group py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => store.toggleBrand(brand._id)}
                      className="rounded border-outline-variant text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                    />
                    <span
                      className={`font-body text-[13px] capitalize transition-colors flex-grow ${
                        isChecked ? "text-primary font-semibold" : "text-on-surface-variant group-hover:text-primary"
                      }`}
                    >
                      {brand.name}
                    </span>
                    <span className="font-body text-[10px] text-on-surface-variant/40 flex-shrink-0">
                      ({brand.count})
                    </span>
                  </label>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Price Filter */}
        <FilterSection title="Price" defaultOpen={false}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={filters ? `${filters.priceRange.min}` : "Min"}
                value={store.priceRange[0] > 0 ? store.priceRange[0] : ""}
                onChange={(e) => store.setPriceRange([Number(e.target.value) || 0, store.priceRange[1]])}
                className="w-full border border-outline-variant/40 rounded px-2 py-1.5 font-body text-[12px] text-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <span className="text-on-surface-variant/40 text-[12px]">—</span>
              <input
                type="number"
                placeholder={filters ? `${filters.priceRange.max}` : "Max"}
                value={store.priceRange[1] < 99999 ? store.priceRange[1] : ""}
                onChange={(e) => store.setPriceRange([store.priceRange[0], Number(e.target.value) || 99999])}
                className="w-full border border-outline-variant/40 rounded px-2 py-1.5 font-body text-[12px] text-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            {filters && (
              <p className="font-body text-[10px] text-on-surface-variant/50">
                Range: ${filters.priceRange.min.toLocaleString()} — ${filters.priceRange.max.toLocaleString()}
              </p>
            )}
          </div>
        </FilterSection>

        {/* Color Filter (dynamic — only rendered if non-empty colors exist) */}
        {validColors.length > 0 && (
          <FilterSection title="Color" defaultOpen={true} count={store.selectedColors.length}>
            <div className="flex flex-wrap gap-2">
              {validColors.map((color) => {
                const isSelected = store.selectedColors.includes(color);
                const hex = getColorHex(color);
                return (
                  <button
                    key={color}
                    onClick={() => store.toggleColor(color)}
                    title={color}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative ${
                      isSelected ? "ring-2 ring-offset-1 ring-primary scale-110" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: hex, border: hex === "#ffffff" ? "1px solid #c6c6cd" : "none" }}
                  >
                    {isSelected && (
                      <span
                        className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                        style={{ color: hex === "#ffffff" || hex === "#fefcbf" || hex === "#f5f5dc" || hex === "#F5F5DC" ? "#000" : "#fff" }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Color names below swatches */}
            {store.selectedColors.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {store.selectedColors.map((c) => (
                  <span key={c} className="bg-primary/5 text-primary text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 capitalize">
                    {c}
                    <button onClick={() => store.toggleColor(c)} className="material-symbols-outlined text-[11px] leading-none cursor-pointer">close</button>
                  </span>
                ))}
              </div>
            )}
          </FilterSection>
        )}

        {/* Size Filter (dynamic — only rendered if non-empty sizes exist) */}
        {validSizes.length > 0 && (
          <FilterSection title="Size" defaultOpen={true} count={store.selectedSizes.length}>
            <div className="flex flex-wrap gap-1.5">
              {validSizes.map((size) => {
                const isSelected = store.selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => store.toggleSize(size)}
                    className={`border px-2.5 py-1 font-body text-[10px] font-bold tracking-wider transition-colors min-w-[36px] text-center cursor-pointer rounded ${
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Dynamic Attribute Filters — only rendered if attribute has valid values */}
        {validAttributes.length > 0 && validAttributes.map((attr) => (
          <FilterSection key={attr.key} title={attr.key} defaultOpen={false} count={(store.selectedAttributes[attr.key] || []).length}>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {attr.values.map((val) => {
                const selectedVals = store.selectedAttributes[attr.key] || [];
                const isChecked = selectedVals.includes(val);
                return (
                  <label
                    key={val}
                    className="flex items-center gap-2 cursor-pointer group py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => store.toggleAttribute(attr.key, val)}
                      className="rounded border-outline-variant text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                    />
                    <span
                      className={`font-body text-[13px] transition-colors ${
                        isChecked ? "text-primary font-semibold" : "text-on-surface-variant group-hover:text-primary"
                      }`}
                    >
                      {val}
                    </span>
                  </label>
                );
              })}
            </div>
          </FilterSection>
        ))}
      </div>
    </aside>
  );
}

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
function CollectionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const addItem = useCartStore((state) => state.addItem);
  const store = useFilterStore();
  const isInitRef = useRef(false);

  // 1. On mount / URL change → hydrate Zustand from URL
  useEffect(() => {
    store.fromQueryParams(searchParams);
    isInitRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 2. When Zustand state changes → update URL
  const prevParamsRef = useRef<string>("");
  useEffect(() => {
    if (!isInitRef.current) return;
    const params = store.toQueryParams();
    const qs = new URLSearchParams(params).toString();
    if (qs !== prevParamsRef.current) {
      prevParamsRef.current = qs;
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [
    store.selectedCategories,
    store.selectedBrands,
    store.selectedColors,
    store.selectedSizes,
    store.selectedAttributes,
    store.priceRange,
    store.search,
    store.sort,
    store.page,
    pathname,
    router,
  ]);

  // 3. Build query params and fetch faceted products
  const queryParams = store.toQueryParams();
  const queryKey = ["facetedProducts", JSON.stringify(queryParams)];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => productService.getFacetedProducts(queryParams),
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });

  const products = data?.products || [];
  const pagination = data?.pagination || { currentPage: 1, totalPages: 1, totalCount: 0, limit: 20, hasNextPage: false, hasPrevPage: false };
  const filters = data?.filters || null;

  // Fetch categories (static, for the tree)
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
    staleTime: 60000 * 5,
  });

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Sort options mapping
  const sortLabels: Record<string, string> = {
    "-createdAt": "New Arrivals",
    "finalPrice": "Price: Low to High",
    "-finalPrice": "Price: High to Low",
    "-rateAvg": "Top Rated",
  };

  const handleQuickAdd = (product: Product) => {
    const firstVariant = product.variants?.[0] || null;
    addItem({
      productId: product._id,
      name: product.name,
      price: product.finalPrice,
      image: product.images?.[0]?.secure_url || "/placeholder.jpg",
      quantity: 1,
      variant: firstVariant,
    });
    toast.success(`${product.name} added to cart!`);
  };

  // Active filters for pills
  const hasActiveFilters =
    store.selectedCategories.length > 0 ||
    store.selectedBrands.length > 0 ||
    store.selectedColors.length > 0 ||
    store.selectedSizes.length > 0 ||
    Object.keys(store.selectedAttributes).length > 0 ||
    store.search;

  return (
    <div className="max-w-full mx-auto px-4 md:px-8 lg:px-12 py-md">
      {/* Breadcrumbs & Header */}
      <div className="mb-md flex flex-col items-start mt-sm">
        <nav aria-label="Breadcrumb" className="flex text-on-surface-variant font-body text-[11px] uppercase tracking-widest mb-sm">
          <ol className="inline-flex items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-[12px] mx-1">chevron_right</span>
                <span className="text-primary font-semibold">Collections</span>
              </div>
            </li>
          </ol>
        </nav>
        <h1 className="font-display text-[24px] md:text-[30px] text-primary leading-tight uppercase font-bold">
          Collections
        </h1>
      </div>

      {/* Search Bar */}
      <div className="mb-md">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant/50">search</span>
          <input
            type="text"
            placeholder="Search products..."
            value={store.search}
            onChange={(e) => store.setSearch(e.target.value)}
            className="w-full border border-outline-variant/30 rounded-lg pl-10 pr-4 py-2.5 font-body text-[13px] text-primary focus:ring-1 focus:ring-primary focus:outline-none focus:border-primary"
          />
          {store.search && (
            <button
              onClick={() => store.setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-on-surface-variant/50 hover:text-primary cursor-pointer"
            >
              close
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-md">
        {/* ═══════════════════ DYNAMIC SIDEBAR ═══════════════════ */}
        <DynamicSidebar
          filters={filters}
          categoryTree={categoryTree}
          categories={categories}
        />

        {/* ═══════════════════ PRODUCT GRID AREA ═══════════════════ */}
        <div className="flex-grow min-w-0">
          {/* Header (Count & Sort) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-md gap-sm pb-3 border-b border-outline-variant/15">
            <span className="font-body text-[13px] text-on-surface-variant">
              Showing{" "}
              <strong className="text-primary">
                {pagination.totalCount}
              </strong>{" "}
              items
              {pagination.totalPages > 1 && (
                <span className="text-on-surface-variant/60">
                  {" "}· Page {pagination.currentPage} of {pagination.totalPages}
                </span>
              )}
            </span>
            <div className="flex items-center gap-sm">
              <span className="font-body text-[11px] text-on-surface-variant uppercase tracking-wider">Sort:</span>
              <select
                value={store.sort}
                onChange={(e) => store.setSort(e.target.value)}
                className="border border-outline-variant/30 bg-transparent font-body text-[11px] font-semibold tracking-wider text-primary focus:ring-0 focus:border-primary cursor-pointer px-2 py-1.5 rounded"
              >
                {Object.entries(sortLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-md">
              {store.search && (
                <span className="bg-primary/5 text-primary text-[11px] font-semibold font-body tracking-wider px-2.5 py-1 rounded flex items-center gap-1">
                  &quot;{store.search}&quot;
                  <button onClick={() => store.setSearch("")} className="material-symbols-outlined text-[13px] leading-none hover:opacity-75 cursor-pointer">close</button>
                </span>
              )}
              {store.selectedCategories.map((catId) => {
                const cat = categories.find((c) => c._id === catId);
                return cat ? (
                  <span key={catId} className="bg-primary/5 text-primary text-[11px] font-semibold font-body px-2.5 py-1 rounded flex items-center gap-1 capitalize">
                    {cat.name}
                    <button onClick={() => store.toggleCategory(catId)} className="material-symbols-outlined text-[13px] leading-none hover:opacity-75 cursor-pointer">close</button>
                  </span>
                ) : null;
              })}
              {store.selectedBrands.map((bId) => {
                const brand = filters?.brands.find((b) => b._id === bId);
                return brand ? (
                  <span key={bId} className="bg-primary/5 text-primary text-[11px] font-semibold font-body px-2.5 py-1 rounded flex items-center gap-1 capitalize">
                    {brand.name}
                    <button onClick={() => store.toggleBrand(bId)} className="material-symbols-outlined text-[13px] leading-none hover:opacity-75 cursor-pointer">close</button>
                  </span>
                ) : null;
              })}
              {store.selectedColors.map((c) => (
                <span key={c} className="bg-primary/5 text-primary text-[11px] font-semibold font-body px-2.5 py-1 rounded flex items-center gap-1 capitalize">
                  <span className="w-3 h-3 rounded-full inline-block mr-0.5" style={{ backgroundColor: getColorHex(c) }}></span>
                  {c}
                  <button onClick={() => store.toggleColor(c)} className="material-symbols-outlined text-[13px] leading-none hover:opacity-75 cursor-pointer">close</button>
                </span>
              ))}
              {store.selectedSizes.map((s) => (
                <span key={s} className="bg-primary/5 text-primary text-[11px] font-semibold font-body px-2.5 py-1 rounded flex items-center gap-1">
                  Size: {s}
                  <button onClick={() => store.toggleSize(s)} className="material-symbols-outlined text-[13px] leading-none hover:opacity-75 cursor-pointer">close</button>
                </span>
              ))}
              {Object.entries(store.selectedAttributes).map(([key, vals]) =>
                vals.map((val) => (
                  <span key={`${key}-${val}`} className="bg-secondary/10 text-secondary text-[11px] font-semibold font-body px-2.5 py-1 rounded flex items-center gap-1">
                    {key}: {val}
                    <button onClick={() => store.toggleAttribute(key, val)} className="material-symbols-outlined text-[13px] leading-none hover:opacity-75 cursor-pointer">close</button>
                  </span>
                ))
              )}
            </div>
          )}

          {/* Product Grid */}
          {isLoading && !data ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, n) => (
                <div key={n} className="animate-pulse space-y-3">
                  <div className="bg-surface-container-highest aspect-[3/4] w-full rounded-lg" />
                  <div className="h-3 bg-surface-container-highest w-3/4 rounded" />
                  <div className="h-3 bg-surface-container-highest w-1/3 rounded" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center bg-surface-container-low/30 rounded-lg border border-dashed border-outline-variant/30 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/40 mb-sm">search_off</span>
              <h3 className="font-display text-[18px] font-semibold text-primary mb-xs">No products found</h3>
              <p className="font-body text-[13px] text-on-surface-variant max-w-sm">
                Try adjusting your filters or search terms to find what you&apos;re looking for.
              </p>
              <button
                onClick={store.clearAll}
                className="mt-md bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-2.5 px-5 hover:opacity-90 cursor-pointer rounded"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product) => (
                  <div key={product._id} className="group relative flex flex-col justify-between bg-white rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                    <div>
                      {/* Image */}
                      <div className="relative w-full aspect-[4/5] bg-surface-container-low mb-2 overflow-hidden cursor-pointer">
                        <Link href={`/product/${product._id}`} className="block w-full h-full">
                          <img
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            src={product.images?.[0]?.secure_url || "/placeholder.jpg"}
                          />
                          {product.images?.[1] && (
                            <img
                              alt={`${product.name} alternate view`}
                              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                              src={product.images[1]?.secure_url}
                            />
                          )}
                        </Link>

                        {/* Quick Add */}
                        <div className="absolute bottom-0 left-0 w-full p-2 translate-y-full group-hover:translate-y-0 transition-all duration-300 ease-in-out bg-gradient-to-t from-black/50 to-transparent flex justify-center z-20">
                          <button
                            onClick={() => handleQuickAdd(product)}
                            className="bg-white/95 backdrop-blur-sm text-primary font-body text-[10px] font-bold py-2 px-3 shadow-lg hover:bg-primary hover:text-white transition-colors w-full uppercase tracking-widest cursor-pointer rounded"
                          >
                            Quick Add
                          </button>
                        </div>

                        {/* Discount Badge */}
                        {product.discount > 0 && (
                          <span className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-sm text-white font-body text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm z-10 shadow-sm">
                            -{product.discount}%
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex flex-col gap-1 mb-1.5 p-3 pb-0">
                        {(product.brandId as any)?.name && (
                          <p className="font-body text-[10px] text-on-surface-variant/60 uppercase tracking-widest">{(product.brandId as any).name}</p>
                        )}
                        <h3 className="font-body text-[13px] font-semibold text-primary block line-clamp-2 leading-tight">
                          <Link href={`/product/${product._id}`} className="hover:text-secondary transition-colors">
                            {product.name}
                          </Link>
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          {product.rateCount > 0 ? (
                            <>
                              <div className="flex items-center text-amber-400 text-[11px]">
                                ★ <span className="text-primary font-bold ml-1">{product.rateAvg}</span>
                              </div>
                              <span className="text-[10px] text-on-surface-variant/50">({product.rateCount})</span>
                            </>
                          ) : (
                            <span className="text-[10px] text-on-surface-variant/40 italic">No reviews</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 p-3 pt-2">
                      <p className="font-body text-[14px] font-bold text-primary">
                        ${product.finalPrice.toLocaleString()}
                      </p>
                      {product.discount > 0 && (
                        <p className="font-body text-[11px] text-on-surface-variant/50 line-through">
                          ${product.price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-xl pt-md border-t border-outline-variant/15">
                  <button
                    onClick={() => store.setPage(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="border border-outline-variant/40 rounded px-3 py-2 font-body text-[12px] font-semibold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: Math.min(pagination.totalPages, 7) }).map((_, i) => {
                    let pageNum: number;
                    const totalPages = pagination.totalPages;
                    const currentPage = pagination.currentPage;
                    
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => store.setPage(pageNum)}
                        className={`w-9 h-9 rounded font-body text-[12px] font-semibold transition-colors cursor-pointer ${
                          pageNum === currentPage
                            ? "bg-primary text-white"
                            : "text-primary hover:bg-primary/5 border border-outline-variant/30"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => store.setPage(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="border border-outline-variant/40 rounded px-3 py-2 font-body text-[12px] font-semibold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={
      <div className="py-16 text-center font-body text-[14px]">Loading collections...</div>
    }>
      <CollectionsContent />
    </Suspense>
  );
}
