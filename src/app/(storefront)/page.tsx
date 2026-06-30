"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { brandService } from "@/services/brandService";

/* ─── Slide data for Hero Carousel ────────────────────────────────── */
const heroSlides = [
  {
    img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1920&auto=format&fit=crop",
    title: "New Season Arrivals",
    subtitle: "Discover the latest trends in electronics, fashion & more",
    cta: "Shop Now",
    href: "/collections",
  },
  {
    img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1920&auto=format&fit=crop",
    title: "Mega Deals Up To 50% Off",
    subtitle: "Limited time offers on top brands — don't miss out",
    cta: "View Deals",
    href: "/collections",
  },
  {
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1920&auto=format&fit=crop",
    title: "Top Brands, Best Prices",
    subtitle: "Shop Samsung, Nike, Adidas, MSI and more at unbeatable prices",
    cta: "Explore Brands",
    href: "/collections",
  },
  {
    img: "https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?q=80&w=1920&auto=format&fit=crop",
    title: "Free Shipping Nationwide",
    subtitle: "Complimentary express delivery on all orders",
    cta: "Start Shopping",
    href: "/collections",
  },
];

/* ─── Product Card ────────────────────────────────────────────────── */
function ProductCard({ product }: { product: any }) {
  return (
    <div className="group relative flex flex-col justify-between bg-white rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <Link href={`/product/${product._id}`} className="block relative w-full aspect-[4/5] overflow-hidden bg-surface-container-low">
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
        {product.discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm text-white font-body text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-sm shadow-sm">
            -{product.discount}%
          </span>
        )}
      </Link>
      <div className="p-4 flex flex-col justify-between flex-grow">
        <div className="mb-2">
          {(product.brandId as any)?.name && (
            <p className="font-body text-[10px] text-on-surface-variant/60 uppercase tracking-widest mb-1">{(product.brandId as any).name}</p>
          )}
          <Link href={`/product/${product._id}`} className="font-body text-[14px] font-semibold text-primary hover:text-secondary block line-clamp-2 leading-tight">
            {product.name}
          </Link>
        </div>
        <div className="flex justify-between items-end mt-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              {product.rateCount > 0 ? (
                <>
                  <div className="flex items-center text-amber-400 text-[12px]">
                    ★ <span className="text-primary font-bold ml-1">{product.rateAvg}</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant/50">({product.rateCount})</span>
                </>
              ) : (
                <span className="text-[11px] text-on-surface-variant/40 italic">No reviews</span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-body text-[15px] font-bold text-primary">
                ${product.finalPrice.toLocaleString()}
              </span>
              {product.discount > 0 && (
                <span className="font-body text-[11px] text-on-surface-variant/50 line-through">
                  ${product.price.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function StorefrontHomepage() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => productService.getProducts(),
  });

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: () => brandService.getBrands(),
  });

  /* ── Hero Slider state ───────────────────────────────────────── */
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoSlide = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
  }, []);

  useEffect(() => {
    startAutoSlide();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startAutoSlide]);

  const goToSlide = (idx: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentSlide(idx);
    startAutoSlide();
  };
  const prevSlide = () => goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);
  const nextSlide = () => goToSlide((currentSlide + 1) % heroSlides.length);

  /* ── Derived data ────────────────────────────────────────────── */
  // Root categories (parentId === null)
  const rootCategories = useMemo(() => {
    return categoriesData.filter(
      (cat: Category) => !cat.parentId
    );
  }, [categoriesData]);

  // All categories for the strip (mix of roots + popular children)
  const categoryStrip = useMemo(() => {
    // Show root categories + a few popular child categories
    const roots = categoriesData.filter((cat: Category) => !cat.parentId);
    const children = categoriesData.filter((cat: Category) => cat.parentId);
    // Show roots first, then children — limit to ~8
    return [...roots, ...children].slice(0, 10);
  }, [categoriesData]);

  const bestsellers = products.slice(0, 6);

  const featuredProducts = useMemo(() => {
    const filtered = products.filter((p) => p.rateAvg >= 4);
    return filtered.length > 0 ? filtered.slice(0, 6) : products.slice(6, 12);
  }, [products]);

  const discountedProducts = useMemo(() => {
    return products.filter((p) => p.discount > 0).slice(0, 6);
  }, [products]);

  return (
    <div className="flex flex-col w-full">

      {/* ═══════════════════ HERO SLIDER ═══════════════════ */}
      <section className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px] overflow-hidden bg-primary">
        {heroSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img
              alt={slide.title}
              className="w-full h-full object-cover"
              src={slide.img}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center z-20">
              <div className="max-w-container-max mx-auto px-gutter w-full">
                <div className="max-w-lg">
                  <h2 className="font-display text-[28px] sm:text-[36px] md:text-[44px] lg:text-[52px] text-white font-bold leading-tight mb-2 drop-shadow-lg">
                    {slide.title}
                  </h2>
                  <p className="font-body text-[13px] md:text-[15px] text-white/85 mb-4 max-w-md">
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.href}
                    className="inline-block bg-white text-primary font-body text-[12px] font-bold uppercase tracking-widest py-2.5 px-6 hover:bg-primary hover:text-white border-2 border-white hover:border-primary transition-all duration-300 rounded"
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm hover:bg-white/50 text-white hover:text-primary rounded-full w-10 h-10 flex items-center justify-center transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm hover:bg-white/50 text-white hover:text-primary rounded-full w-10 h-10 flex items-center justify-center transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlide
                  ? "w-6 h-2.5 bg-white"
                  : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════ CATEGORIES STRIP ═══════════════════ */}
      {categoryStrip.length > 0 && (
        <section className="bg-white border-b border-outline-variant/20 py-5">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
              {/* "All" link */}
              <Link
                href="/collections"
                className="flex flex-col items-center gap-2 min-w-[80px] group"
              >
                <div className="w-16 h-16 rounded-full bg-primary/5 border-2 border-primary/20 group-hover:border-primary flex items-center justify-center transition-all">
                  <span className="material-symbols-outlined text-[24px] text-primary">apps</span>
                </div>
                <span className="font-body text-[11px] font-semibold text-on-surface-variant group-hover:text-primary text-center uppercase tracking-wide whitespace-nowrap transition-colors">
                  All
                </span>
              </Link>

              {categoryStrip.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/collections?category=${cat._id}`}
                  className="flex flex-col items-center gap-2 min-w-[80px] group"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-outline-variant/20 group-hover:border-primary transition-all bg-surface-container-low">
                    {cat.image?.secure_url ? (
                      <img
                        src={cat.image.secure_url}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px] text-on-surface-variant/60">category</span>
                      </div>
                    )}
                  </div>
                  <span className="font-body text-[11px] font-semibold text-on-surface-variant group-hover:text-primary text-center capitalize whitespace-nowrap transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ BRANDS STRIP ═══════════════════ */}
      {brands.length > 0 && (
        <section className="bg-surface-container-lowest py-6 border-b border-outline-variant/15">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-body text-[13px] font-bold text-primary uppercase tracking-wider">
                Top Brands
              </h3>
              <Link
                href="/collections"
                className="font-body text-[11px] font-semibold text-on-surface-variant hover:text-primary uppercase tracking-wider flex items-center gap-0.5 transition-colors"
              >
                View All
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {(brands as any[]).map((brand) => (
                <Link
                  key={brand._id}
                  href={`/collections?brand=${brand._id}`}
                  className="flex-shrink-0 w-28 h-16 md:w-32 md:h-18 bg-white rounded-lg border border-outline-variant/25 hover:border-primary hover:shadow-md flex items-center justify-center p-2.5 transition-all group"
                  title={brand.name}
                >
                  {brand.image?.secure_url ? (
                    <img
                      src={brand.image.secure_url}
                      alt={brand.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <span className="font-body text-[12px] font-bold text-primary uppercase tracking-wider">
                      {brand.name}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ BESTSELLERS ═══════════════════ */}
      <section className="py-10 px-gutter max-w-container-max mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-[22px] md:text-[28px] text-primary font-bold">
            Bestsellers
          </h2>
          <Link
            href="/collections"
            className="font-body text-[12px] font-semibold text-primary hover:text-secondary uppercase tracking-wider flex items-center gap-0.5 transition-colors"
          >
            See All
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-md">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="animate-pulse space-y-3">
                <div className="bg-surface-container-highest aspect-[3/4] w-full rounded-lg" />
                <div className="h-3 bg-surface-container-highest w-3/4 rounded" />
                <div className="h-3 bg-surface-container-highest w-1/3 rounded" />
              </div>
            ))}
          </div>
        ) : bestsellers.length === 0 ? (
          <div className="text-center py-16 font-body text-on-surface-variant/70">
            No products found. Please add products from the admin panel.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-md">
            {bestsellers.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════ SHOP BY CATEGORY — NOON-STYLE SHOWCASES ═══════════════════ */}
      {rootCategories.length > 0 && rootCategories.map((cat: Category, catIdx: number) => {
        // Get products belonging to this root category (or its children)
        const childCategoryIds = categoriesData
          .filter((c: Category) => c.parentId === cat._id)
          .map((c: Category) => c._id);
        const allCatIds = [cat._id, ...childCategoryIds];
        const catProducts = products.filter((p: any) => {
          const pCatId = typeof p.categoryId === 'object' ? p.categoryId._id : p.categoryId;
          return allCatIds.includes(pCatId);
        }).slice(0, 6);
        
        if (catProducts.length === 0) return null;

        const isEven = catIdx % 2 === 0;
        
        return (
          <section 
            key={cat._id} 
            className={`py-10 border-t border-outline-variant/15 ${
              isEven ? 'bg-white' : 'bg-surface-container-low/40'
            }`}
          >
            <div className="max-w-container-max mx-auto px-gutter">
              {/* Category Header with banner */}
              <div className={`relative rounded-2xl overflow-hidden mb-8 h-[160px] md:h-[200px] group`}>
                <img
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={cat.image?.secure_url || `https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-center z-10">
                  <div className="px-6 md:px-10">
                    <h2 className="font-display text-[24px] md:text-[34px] text-white font-bold capitalize mb-1 drop-shadow-md">
                      {cat.name}
                    </h2>
                    <p className="font-body text-[12px] md:text-[14px] text-white/75 mb-4 max-w-md">
                      Discover the best {cat.name.toLowerCase()} at unbeatable prices
                    </p>
                    <Link
                      href={`/collections?category=${cat._id}`}
                      className="inline-flex items-center gap-2 bg-white text-primary font-body text-[11px] md:text-[12px] font-bold uppercase tracking-widest py-2.5 px-6 hover:bg-primary hover:text-white border-2 border-white hover:border-primary transition-all duration-300 rounded group/btn"
                    >
                      Shop Now
                      <span className="material-symbols-outlined text-[16px] transform group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Products Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-md">
                {catProducts.map((product: any) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* View All link */}
              <div className="text-center mt-6">
                <Link
                  href={`/collections?category=${cat._id}`}
                  className="inline-flex items-center gap-1.5 font-body text-[12px] font-bold text-primary hover:text-secondary uppercase tracking-wider transition-colors group/link"
                >
                  View All {cat.name}
                  <span className="material-symbols-outlined text-[16px] transform group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </div>
            </div>
          </section>
        );
      })}

      {/* ═══════════════════ SHOP BY BRAND — PREMIUM GRID ═══════════════════ */}
      {brands.length > 0 && (() => {
        // Get brands that have products
        const brandsWithProducts = (brands as any[]).filter((brand: any) => {
          return products.some((p: any) => {
            const pBrandId = typeof p.brandId === 'object' ? p.brandId._id : p.brandId;
            return pBrandId === brand._id;
          });
        });
        if (brandsWithProducts.length === 0) return null;

        return (
          <section className="py-12 bg-gradient-to-b from-primary/[0.03] to-white border-t border-outline-variant/15">
            <div className="max-w-container-max mx-auto px-gutter">
              <div className="text-center mb-8">
                <h2 className="font-display text-[22px] md:text-[30px] text-primary font-bold mb-2">
                  Shop by Brand
                </h2>
                <p className="font-body text-[13px] text-on-surface-variant/70 max-w-md mx-auto">
                  Explore collections from your favorite brands
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {brandsWithProducts.map((brand: any) => {
                  // Get first product image as brand showcase
                  const brandProduct = products.find((p: any) => {
                    const pBrandId = typeof p.brandId === 'object' ? p.brandId._id : p.brandId;
                    return pBrandId === brand._id;
                  });
                  const productCount = products.filter((p: any) => {
                    const pBrandId = typeof p.brandId === 'object' ? p.brandId._id : p.brandId;
                    return pBrandId === brand._id;
                  }).length;

                  return (
                    <Link
                      key={brand._id}
                      href={`/collections?brand=${brand._id}`}
                      className="group relative bg-white rounded-xl border border-outline-variant/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      {/* Brand product image */}
                      <div className="aspect-[4/3] bg-surface-container-low overflow-hidden">
                        {brandProduct?.images?.[0]?.secure_url ? (
                          <img
                            src={brandProduct.images[0].secure_url}
                            alt={brand.name}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : brand.image?.secure_url ? (
                          <img
                            src={brand.image.secure_url}
                            alt={brand.name}
                            className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-display text-[28px] font-bold text-primary/20 uppercase">{brand.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Brand info */}
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-body text-[14px] font-bold text-primary capitalize group-hover:text-secondary transition-colors">
                            {brand.name}
                          </h3>
                          <p className="font-body text-[11px] text-on-surface-variant/60 mt-0.5">
                            {productCount} {productCount === 1 ? 'product' : 'products'}
                          </p>
                        </div>
                        <span className="w-8 h-8 rounded-full bg-primary/5 group-hover:bg-primary flex items-center justify-center transition-all">
                          <span className="material-symbols-outlined text-[16px] text-primary group-hover:text-white transition-colors">arrow_forward</span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ═══════════════════ FEATURED PRODUCTS ═══════════════════ */}
      {featuredProducts.length > 0 && (
        <section className="py-10 px-gutter max-w-container-max mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-[22px] md:text-[28px] text-primary font-bold">
              Featured Products
            </h2>
            <Link
              href="/collections"
              className="font-body text-[12px] font-semibold text-primary hover:text-secondary uppercase tracking-wider flex items-center gap-0.5 transition-colors"
            >
              See All
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-md">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════ SPECIAL OFFERS ═══════════════════ */}
      {discountedProducts.length > 0 && (
        <section className="py-10 bg-gradient-to-b from-red-50/30 to-surface-container-lowest border-t border-outline-variant/15">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-red-500">local_fire_department</span>
                <h2 className="font-display text-[22px] md:text-[28px] text-primary font-bold">
                  Deals & Offers
                </h2>
              </div>
              <Link
                href="/collections"
                className="font-body text-[12px] font-semibold text-primary hover:text-secondary uppercase tracking-wider flex items-center gap-0.5 transition-colors"
              >
                View All
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-md">
              {discountedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ PROMO BANNER ═══════════════════ */}
      <section className="py-10 px-gutter">
        <div className="max-w-container-max mx-auto bg-primary rounded-2xl overflow-hidden relative">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <span className="font-body text-[11px] tracking-widest text-white/60 font-bold uppercase mb-2">
                Free Shipping
              </span>
              <h3 className="font-display text-[24px] md:text-[32px] text-white font-bold leading-tight mb-3">
                Shop With Confidence
              </h3>
              <p className="font-body text-[13px] text-white/75 mb-5 max-w-sm">
                Enjoy free express shipping nationwide. Easy returns within 14 days. Premium quality guaranteed.
              </p>
              <Link
                href="/collections"
                className="inline-block w-fit bg-white text-primary font-body text-[12px] font-bold uppercase tracking-widest py-2.5 px-6 hover:bg-white/90 transition-all rounded"
              >
                Start Shopping
              </Link>
            </div>
            <div className="hidden md:block relative h-[250px]">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop"
                alt="Shopping experience"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
