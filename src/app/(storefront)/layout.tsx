"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { wishlistService } from "@/services/wishlistService";
import { Category, categoryService } from "@/services/categoryService";
import { brandService } from "@/services/brandService";

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

interface CategoryTreeProps {
  node: CategoryNode;
  depth: number;
  onCloseMenu: () => void;
}

const CategoryTreeLink: React.FC<CategoryTreeProps> = ({ node, depth, onCloseMenu }) => {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col">
      {depth === 0 ? (
        <h4 className="font-body text-[13px] font-bold text-primary uppercase tracking-widest mb-sm">
          <Link
            href={`/collections?category=${node._id}`}
            className="hover:underline hover:opacity-80 transition-opacity"
            onClick={onCloseMenu}
          >
            {node.name}
          </Link>
        </h4>
      ) : (
        <Link
          href={`/collections?category=${node._id}`}
          className="font-body text-[13px] text-on-surface-variant hover:text-primary transition-colors py-1 flex items-center group"
          style={{ paddingLeft: `${(depth - 1) * 12}px` }}
          onClick={onCloseMenu}
        >
          <span className="h-px w-0 bg-primary mr-0 group-hover:w-3 group-hover:mr-1.5 transition-all duration-300"></span>
          {node.name}
        </Link>
      )}

      {hasChildren && (
        <div className="flex flex-col space-y-1 mt-1">
          {node.children.map((child) => (
            <CategoryTreeLink
              key={child._id}
              node={child}
              depth={depth + 1}
              onCloseMenu={onCloseMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface MobileCategoryProps {
  node: CategoryNode;
  depth: number;
  onClose: () => void;
}

const MobileCategoryItem: React.FC<MobileCategoryProps> = ({ node, depth, onClose }) => {
  const hasChildren = node.children && node.children.length > 0;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center py-2 border-b border-outline-variant/5">
        <Link
          href={`/collections?category=${node._id}`}
          onClick={onClose}
          className="text-on-surface-variant hover:text-primary font-medium text-[15px]"
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          {node.name}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="material-symbols-outlined text-[20px] text-on-surface-variant/70 p-1 cursor-pointer"
          >
            {isOpen ? "expand_less" : "expand_more"}
          </button>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="flex flex-col pl-sm">
          {node.children.map((child) => (
            <MobileCategoryItem
              key={child._id}
              node={child}
              depth={depth + 1}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const cartItems = useCartStore((state) => state.items);

  // Fetch wishlist dynamically from backend if user is logged in
  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistService.getWishlist(),
    enabled: !!token,
  });

  // Fetch categories dynamically from backend
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
  });

  // Fetch brands dynamically from backend
  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: () => brandService.getBrands(),
  });

  const desktopBrands = useMemo(() => {
    return (brands.length > 0 ? brands : [
      { _id: "loro-piana", name: "Loro Piana" },
      { _id: "brunello-cucinelli", name: "Brunello Cucinelli" },
      { _id: "hermes", name: "Hermes" },
      { _id: "bottega-veneta", name: "Bottega Veneta" },
      { _id: "jil-sander", name: "Jil Sander" },
      { _id: "prada", name: "Prada" },
    ]) as any[];
  }, [brands]);

  const mobileBrands = useMemo(() => {
    return (brands.length > 0 ? brands : [
      { _id: "loro-piana", name: "Loro Piana" },
      { _id: "brunello-cucinelli", name: "Brunello Cucinelli" },
      { _id: "hermes", name: "Hermes" },
      { _id: "bottega-veneta", name: "Bottega Veneta" },
    ]) as any[];
  }, [brands]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [activeTopCatId, setActiveTopCatId] = useState<string | null>(null);

  const categoryTree = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  useEffect(() => {
    if (hoveredMenu === "collections" && categoryTree.length > 0 && !activeTopCatId) {
      setActiveTopCatId(categoryTree[0]._id);
    }
  }, [hoveredMenu, categoryTree, activeTopCatId]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/collections?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const navLinks = [
    { label: "Collections", href: "/collections" },
    { label: "Dresses", href: "/collections?category=Dresses" },
    { label: "Outerwear", href: "/collections?category=Outerwear" },
    { label: "Knitwear", href: "/collections?category=Knitwear" },
    { label: "Brand Story", href: "/brand-story" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background">
      {/* TopNavBar */}
      <header className="bg-white/80 backdrop-blur-xl fixed top-0 w-full z-50 h-20 shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center px-gutter max-w-container-max mx-auto h-full relative">
          
          {/* Logo - Centered on Desktop, Left on Mobile */}
          <div className="md:absolute md:left-1/2 md:-translate-x-1/2">
            <Link href="/" className="font-display text-[28px] font-bold tracking-tighter text-primary">
              AURORA
            </Link>
          </div>

          {/* Desktop Left Nav Links */}
          <nav className="hidden md:flex gap-lg items-center h-full">
            <div
              className="h-full flex items-center relative cursor-pointer"
              onMouseEnter={() => setHoveredMenu("collections")}
              onMouseLeave={() => setHoveredMenu(null)}
            >
              <Link
                href="/collections"
                className={`font-body text-[13px] font-semibold uppercase tracking-wider transition-all duration-200 py-6 border-b-2 ${
                  pathname === "/collections"
                    ? "text-primary border-primary"
                    : "text-on-surface-variant/80 border-transparent hover:text-primary"
                }`}
              >
                Collections
              </Link>
            </div>

            <Link
              href="/brand-story"
              className={`font-body text-[13px] font-semibold uppercase tracking-wider transition-all duration-200 py-6 border-b-2 ${
                pathname === "/brand-story"
                  ? "text-primary border-primary"
                  : "text-on-surface-variant/80 border-transparent hover:text-primary hover:border-primary/50"
              }`}
            >
              Brand Story
            </Link>
          </nav>

          {/* Right Utilities (Search, Favorites, Cart, Account, Menu) */}
          <div className="flex items-center gap-md ml-auto md:ml-0">
            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="material-symbols-outlined text-primary hover:opacity-75 transition-opacity cursor-pointer flex items-center justify-center p-1"
            >
              search
            </button>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="relative hover:opacity-75 transition-opacity p-1 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-primary">favorite</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Link */}
            <Link
              href="/cart"
              className="relative hover:opacity-75 transition-opacity p-1 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-primary">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account Icon */}
            <Link
              href="/account"
              className="hover:opacity-75 transition-opacity p-1 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-primary">person</span>
            </Link>

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="material-symbols-outlined md:hidden text-primary p-1"
            >
              {mobileMenuOpen ? "close" : "menu"}
            </button>
          </div>
        </div>

        {/* Search Overlay Panel */}
        {searchOpen && (
          <div className="absolute top-20 left-0 w-full bg-white border-b border-outline-variant/30 py-4 px-gutter shadow-md z-40 transition-all duration-300">
            <div className="max-w-xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="flex items-center border-b border-primary py-2">
                <input
                  type="text"
                  placeholder="SEARCH FOR CAMPAIGNS, SILKS, COATS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[13px] font-body uppercase tracking-wider text-primary placeholder-on-surface-variant/50"
                  autoFocus
                />
                <button type="submit" className="material-symbols-outlined text-primary ml-2">
                  arrow_forward
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Mega Menu Panel */}
        {hoveredMenu === "collections" && (
          <div
            className="absolute top-20 left-0 w-full bg-white/95 backdrop-blur-2xl border-b border-outline-variant/30 shadow-[0_20px_40px_rgba(15,23,42,0.08)] z-40 transition-all duration-300 origin-top"
            onMouseEnter={() => setHoveredMenu("collections")}
            onMouseLeave={() => setHoveredMenu(null)}
          >
            <div className="max-w-full mx-auto px-6 md:px-12 py-lg flex flex-col gap-lg">
              <div className="flex gap-xl w-full">
                
                {/* Left Column: Top-Level Categories (Roots) */}
                <div className="w-56 flex-shrink-0 border-r border-outline-variant/20 pr-md flex flex-col gap-xs max-h-[350px] overflow-y-auto">
                  {categoryTree.map((root) => (
                    <button
                      key={root._id}
                      className={`font-body text-[13px] font-semibold uppercase tracking-wider text-left py-2 px-3 transition-colors rounded cursor-pointer ${
                        activeTopCatId === root._id
                          ? "bg-primary text-white"
                          : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                      }`}
                      onMouseEnter={() => setActiveTopCatId(root._id)}
                      onClick={() => {
                        window.location.href = `/collections?category=${root._id}`;
                        setHoveredMenu(null);
                      }}
                    >
                      {root.name}
                    </button>
                  ))}
                </div>

                {/* Right Area: Category Tree (Columns of Children & Sub-children) */}
                <div className="flex-grow flex gap-lg min-h-[250px]">
                  {activeTopCatId && (
                    <>
                      {(() => {
                        const activeTopNode = categoryTree.find(n => n._id === activeTopCatId);
                        if (!activeTopNode) return null;
                        
                        if (activeTopNode.children && activeTopNode.children.length > 0) {
                          return (
                            <div className="flex-grow grid grid-cols-3 gap-xl overflow-y-auto max-h-[350px] pr-sm">
                              {activeTopNode.children.map((child) => (
                                <CategoryTreeLink
                                  key={child._id}
                                  node={child}
                                  depth={0}
                                  onCloseMenu={() => setHoveredMenu(null)}
                                />
                              ))}
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex-grow flex flex-col justify-center items-center py-xl text-center">
                              <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40 mb-xs">info</span>
                              <p className="font-body text-[13px] text-on-surface-variant">No nested categories. Browse all items in this category.</p>
                              <Link
                                href={`/collections?category=${activeTopNode._id}`}
                                className="mt-sm bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-2.5 px-5 hover:opacity-90 transition-opacity"
                                onClick={() => setHoveredMenu(null)}
                              >
                                Browse {activeTopNode.name}
                              </Link>
                            </div>
                          );
                        }
                      })()}
                    </>
                  )}
                </div>

                {/* Promotional Banner on the right */}
                <div className="w-64 flex-shrink-0 relative overflow-hidden group rounded-lg h-[260px] ml-md">
                  <Link href="/brand-story" onClick={() => setHoveredMenu(null)}>
                    <img
                      alt="High fashion editorial banner"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-md">
                      <h3 className="font-display text-[18px] text-white font-semibold mb-1">The Atelier</h3>
                      <div className="flex items-center text-white/95 font-body text-[11px] font-bold uppercase tracking-widest group-hover:text-white transition-colors">
                        Explore Campaign
                        <span className="material-symbols-outlined ml-1 text-[14px] transform group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>

              </div>

              {/* Bottom Brands Strip */}
              <div className="border-t border-outline-variant/20 pt-md mt-sm flex flex-col gap-sm w-full">
                <span className="font-body text-[11px] font-bold text-primary uppercase tracking-widest block">Top Brands</span>
                <div className="flex flex-wrap gap-xs">
                  {desktopBrands.slice(0, 10).map((b) => (
                    <Link
                      key={b._id}
                      href={`/collections?brand=${b._id}`}
                      className="flex items-center justify-center p-2 bg-white hover:bg-surface-container-low border border-outline-variant/30 hover:border-primary transition-all rounded w-24 h-12"
                      onClick={() => setHoveredMenu(null)}
                      title={b.name}
                    >
                      {b.image?.secure_url ? (
                        <img
                          src={b.image.secure_url}
                          alt={b.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block text-center truncate w-full">
                          {b.name}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-20 bg-white border-b border-outline-variant shadow-lg z-50 flex flex-col p-lg gap-md font-body overflow-y-auto max-h-[calc(100vh-80px)]">
            <Link
              href="/collections"
              onClick={() => setMobileMenuOpen(false)}
              className="text-primary hover:opacity-85 font-semibold text-lg border-b border-outline-variant/10 pb-2 uppercase tracking-wide"
            >
              All Collections
            </Link>

            {/* Mobile Categories list (Recursive Tree) */}
            {categoryTree.length > 0 && (
              <div className="flex flex-col pl-md gap-sm border-b border-outline-variant/10 pb-2">
                <span className="text-on-surface-variant/60 font-bold text-[11px] uppercase tracking-wider mb-xs">Shop by Category</span>
                <div className="flex flex-col">
                  {categoryTree.map((root) => (
                    <MobileCategoryItem
                      key={root._id}
                      node={root}
                      depth={0}
                      onClose={() => setMobileMenuOpen(false)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Brands list */}
            <div className="flex flex-col pl-md gap-sm border-b border-outline-variant/10 pb-4">
              <span className="text-on-surface-variant/60 font-bold text-[11px] uppercase tracking-wider mb-xs">Top Brands</span>
              <div className="flex flex-wrap gap-xs">
                {mobileBrands.slice(0, 8).map((b) => (
                  <Link
                    key={b._id}
                    href={`/collections?brand=${b._id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center p-1.5 bg-white border border-outline-variant/20 hover:border-primary transition-all rounded w-20 h-10"
                    title={b.name}
                  >
                    {b.image?.secure_url ? (
                      <img
                        src={b.image.secure_url}
                        alt={b.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider truncate w-full text-center">
                        {b.name}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/brand-story"
              onClick={() => setMobileMenuOpen(false)}
              className="text-on-background hover:text-primary font-medium text-lg border-b border-outline-variant/10 pb-2"
            >
              Brand Story
            </Link>

          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* Storefront Footer */}
      <footer className="bg-surface dark:bg-tertiary-container w-full py-16 border-t border-outline-variant mt-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-xl px-gutter max-w-container-max mx-auto">
          <div>
            <h3 className="font-display text-[20px] font-bold text-primary mb-md">AURORA</h3>
            <p className="font-body text-[14px] text-on-surface-variant leading-relaxed mb-md">
              Quiet Luxury for the discerning few. Impeccably tailored, contemporary silhouettes crafted from the world's finest fabrics.
            </p>
          </div>
          <div>
            <h4 className="font-body text-[12px] text-primary font-bold mb-md uppercase tracking-widest">Explore</h4>
            <ul className="space-y-sm font-body text-[13px]">
              <li>
                <Link href="/brand-story" className="text-on-surface-variant hover:text-primary transition-colors">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link href="/brand-story" className="text-on-surface-variant hover:text-primary transition-colors">
                  Brand Story
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-on-surface-variant hover:text-primary transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-body text-[12px] text-primary font-bold mb-md uppercase tracking-widest">Support</h4>
            <ul className="space-y-sm font-body text-[13px]">
              <li>
                <Link href="/brand-story" className="text-on-surface-variant hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="#" className="text-on-surface-variant hover:text-primary transition-colors">
                  Shipping & Returns
                </a>
              </li>
              <li>
                <a href="#" className="text-on-surface-variant hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-body text-[12px] text-primary font-bold mb-md uppercase tracking-widest">Connect</h4>
            <div className="flex gap-sm text-on-surface-variant">
              <a href="#" className="hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full border border-outline-variant/30">
                <span className="material-symbols-outlined text-[18px]">share</span>
              </a>
              <a href="#" className="hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full border border-outline-variant/30">
                <span className="material-symbols-outlined text-[18px]">mail</span>
              </a>
            </div>
          </div>
        </div>
        <div className="px-gutter max-w-container-max mx-auto mt-xl pt-lg border-t border-outline-variant/30 flex flex-col sm:flex-row justify-between items-center text-on-surface-variant font-body text-[11px] gap-sm">
          <span>© 2026 AURORA Luxury Group. All rights reserved.</span>
          <span className="tracking-widest uppercase cursor-pointer hover:text-primary">Global / English</span>
        </div>
      </footer>
    </div>
  );
}
