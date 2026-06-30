"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { reviewService } from "@/services/reviewService";
import { wishlistService } from "@/services/wishlistService";
import { brandService } from "@/services/brandService";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import { ProductVariant } from "@/types/product";

export default function ProductDetailClient({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const addItem = useCartStore((state) => state.addItem);
  const token = useAuthStore((state) => state.token);

  // States
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [openAccordion, setOpenAccordion] = useState<string>("description");
  
  // Review form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Fetch product details
  const { data: product, isLoading: productLoading, error: productError } = useQuery({
    queryKey: ["productDetail", id],
    queryFn: () => productService.getProductById(id),
  });

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ["allBrands"],
    queryFn: () => brandService.getBrands(),
  });

  // Fetch product reviews
  const { data: productReviews = [] } = useQuery({
    queryKey: ["productReviews", id],
    queryFn: () => reviewService.getProductReviews(id),
    enabled: !!product,
  });

  // Fetch related products
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["relatedProducts", product?.categoryId],
    queryFn: () => productService.getRelatedProducts(product?.categoryId),
    enabled: !!product?.categoryId,
  });

  // Fetch wishlist if logged in to see if favorited
  const { data: userWishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistService.getWishlist(),
    enabled: !!token,
  });

  // Extract unique colors and sizes from backend variants
  const colorsList = useMemo(() => {
    if (!product?.variants) return [];
    const colorMap = new Map<string, { name: string, image?: string, hex: string }>();
    product.variants.forEach((v) => {
      if (v.color) {
        if (!colorMap.has(v.color)) {
          let hex = "#e2e8f0";
          const lower = v.color.toLowerCase();
          if (lower.includes("black")) hex = "#000000";
          else if (lower.includes("white")) hex = "#ffffff";
          else if (lower.includes("navy") || lower.includes("blue")) hex = "#1e3a8a";
          else if (lower.includes("charcoal") || lower.includes("gray") || lower.includes("grey")) hex = "#4b5563";
          else if (lower.includes("ivory") || lower.includes("cream")) hex = "#fefcbf";
          else if (lower.includes("alabaster") || lower.includes("beige")) hex = "#f5f5dc";
          else if (lower.includes("red")) hex = "#dc2626";
          else if (lower.includes("green")) hex = "#16a34a";
          else if (lower.includes("brown") || lower.includes("tan")) hex = "#78350f";
          
          colorMap.set(v.color, { 
            name: v.color, 
            image: v.images?.[0]?.secure_url, 
            hex 
          });
        } else {
          // Update image if previous variant of this color didn't have one
          const current = colorMap.get(v.color)!;
          if (!current.image && v.images?.[0]?.secure_url) {
            current.image = v.images[0].secure_url;
          }
        }
      }
    });
    return Array.from(colorMap.values());
  }, [product]);

  const sizesList = useMemo(() => {
    if (!product?.variants) return [];
    const set = new Set<string>();
    product.variants.forEach((v) => {
      if (v.size) set.add(v.size);
    });
    return Array.from(set);
  }, [product]);

  // Find the selected variant based on selected color and size
  const selectedVariant = useMemo(() => {
    if (!product?.variants) return null;
    return product.variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    ) || null;
  }, [product, selectedColor, selectedSize]);

  // Determine active images (variant images first, fallback to product level)
  const displayImages = useMemo(() => {
    if (!product) return [];
    
    // First, try to get images specifically for the selected variant (color + size)
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }

    // If not found, try to find ANY variant that matches the selected color and has images
    if (selectedColor) {
      const variantWithImagesForColor = product.variants?.find(
        (v) => v.color === selectedColor && v.images && v.images.length > 0
      );
      if (variantWithImagesForColor) {
        return variantWithImagesForColor.images!;
      }
    }

    // Fallback to main product images
    return product.images || [];
  }, [product, selectedVariant, selectedColor]);

  // Calculate current price based on variant priceDiff
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    const base = product.finalPrice;
    const diff = selectedVariant?.priceDiff || 0;
    return base + diff;
  }, [product, selectedVariant]);

  // Set default color and size selection when product loads
  useEffect(() => {
    if (product) {
      if (colorsList.length > 0) setSelectedColor(colorsList[0].name);
      if (sizesList.length > 0) setSelectedSize(sizesList[0]);
      setActiveImageIndex(0);
    }
  }, [product, colorsList, sizesList]);

  // Wishlist toggle mutation
  const toggleWishlistMutation = useMutation({
    mutationFn: () => wishlistService.toggleWishlist(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(`Garment ${data.action === "added" ? "added to" : "removed from"} your wishlist.`);
    },
    onError: () => {
      toast.error("Failed to toggle wishlist. Please check your connection.");
    }
  });

  // Review creation mutation
  const addReviewMutation = useMutation({
    mutationFn: (payload: { rating: number; comment: string }) =>
      reviewService.addReview(id, payload),
    onSuccess: () => {
      setReviewSuccess(true);
      setReviewComment("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ["productReviews", id] });
      setTimeout(() => setReviewSuccess(false), 5000);
    },
    onError: (err: any) => {
      setReviewError(err?.response?.data?.message || "Failed to submit review. Make sure you purchased the item.");
      setTimeout(() => setReviewError(""), 5000);
    }
  });

  const handleToggleWishlist = () => {
    if (!token) {
      toast.error("Please sign in to manage your wishlist.");
      window.location.href = "/login";
      return;
    }
    toggleWishlistMutation.mutate();
  };

  const handleAddToBag = () => {
    if (!product) return;
    
    addItem({
      productId: product._id,
      name: product.name,
      price: currentPrice,
      image: displayImages[0]?.secure_url || "/placeholder.jpg",
      quantity,
      variant: selectedVariant,
    });
    toast.success(`${product.name} has been added to your shopping bag.`);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please sign in to submit a review.");
      window.location.href = "/login";
      return;
    }
    if (!reviewComment.trim()) {
      toast.error("Please write a comment.");
      return;
    }
    addReviewMutation.mutate({
      rating: reviewRating,
      comment: reviewComment,
    });
  };

  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? "" : section);
  };

  const isFavorited = useMemo(() => {
    if (!product || !userWishlist) return false;
    return userWishlist.some((item) => item._id === product._id);
  }, [product, userWishlist]);

  if (productLoading) {
    return (
      <div className="max-w-container-max mx-auto px-gutter py-xxl text-center font-body">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-surface-container-highest w-1/3 mx-auto"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
            <div className="lg:col-span-7 bg-surface-container-highest aspect-[3/4] w-full"></div>
            <div className="lg:col-span-5 space-y-6">
              <div className="h-8 bg-surface-container-highest w-3/4"></div>
              <div className="h-6 bg-surface-container-highest w-1/2"></div>
              <div className="h-12 bg-surface-container-highest w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="max-w-container-max mx-auto px-gutter py-xxl text-center font-body">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-md">warning</span>
        <h2 className="font-display text-[24px] font-semibold text-primary mb-sm">Piece Not Found</h2>
        <p className="font-body text-[14px] text-on-surface-variant mb-md">
          The luxury garment you are looking for does not exist or has been removed from our collection catalog.
        </p>
        <Link href="/collections" className="bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-3 px-6">
          Return to Collections
        </Link>
      </div>
    );
  }

  // Get color hex value for color name
  const getColorHex = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("black")) return "#000000";
    if (lower.includes("white")) return "#ffffff";
    if (lower.includes("navy") || lower.includes("blue")) return "#1e3a8a";
    if (lower.includes("charcoal") || lower.includes("gray") || lower.includes("grey")) return "#4b5563";
    if (lower.includes("ivory") || lower.includes("cream")) return "#fefcbf";
    if (lower.includes("alabaster") || lower.includes("beige")) return "#f5f5dc";
    if (lower.includes("red")) return "#dc2626";
    if (lower.includes("green")) return "#16a34a";
    if (lower.includes("brown") || lower.includes("tan")) return "#78350f";
    return "#e2e8f0";
  };

  return (
    <div className="max-w-container-max mx-auto px-gutter py-xl">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-xl flex text-on-surface-variant font-body text-[11px] uppercase tracking-widest mt-sm">
        <ol className="inline-flex items-center space-x-2">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="material-symbols-outlined text-[12px] mx-1">chevron_right</span>
              <Link href="/collections" className="hover:text-primary transition-colors">
                Collections
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <span className="material-symbols-outlined text-[12px] mx-1">chevron_right</span>
              <span className="text-primary font-semibold truncate max-w-[150px] md:max-w-xs">{product.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Main product details block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 flex flex-col md:flex-row gap-md">
          {/* Thumbnails list */}
          {displayImages.length > 1 && (
            <div className="flex md:flex-col gap-sm order-2 md:order-1 overflow-x-auto md:overflow-x-visible">
              {displayImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-20 md:w-20 md:h-24 flex-shrink-0 relative bg-white flex items-center justify-center border transition-all cursor-pointer rounded overflow-hidden ${
                    activeImageIndex === idx ? "border-primary ring-1 ring-primary" : "border-outline-variant/30 opacity-75 hover:opacity-100"
                  }`}
                >
                  <img src={img.secure_url} alt={`${product.name} thumb ${idx + 1}`} className="max-w-full max-h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}

          {/* Main active image */}
          <div className="flex-grow aspect-[4/5] bg-white relative order-1 md:order-2 overflow-hidden rounded-lg max-h-[600px] flex items-center justify-center p-md">
            {displayImages.length > 0 ? (
              <img
                src={displayImages[activeImageIndex]?.secure_url || "/placeholder.jpg"}
                alt={product.name}
                className="max-w-full max-h-full object-contain transition-all duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-body text-on-surface-variant">No Image Available</div>
            )}
          </div>
        </div>

        {/* Right Column: Checkout choices */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="pb-md border-b border-outline-variant/20">
            <span className="font-body text-[11px] tracking-widest text-secondary font-bold uppercase block mb-2">
              {product.brandId 
                ? (typeof product.brandId === 'object' ? (product.brandId as any).name : brands.find(b => b._id === product.brandId)?.name || "QUIET LUXURY") 
                : "QUIET LUXURY"}
            </span>
            <h1 className="font-display text-[26px] md:text-[32px] text-primary font-bold leading-tight mb-2">
              {product.name}
            </h1>
            <p className="font-body text-[13px] text-on-surface-variant mb-md">{product.slug}</p>

            <div className="flex items-center gap-md">
              <div className="flex flex-col">
                <p className="font-body text-[20px] font-semibold text-primary">
                  ${currentPrice.toLocaleString()}
                </p>
                {product.discount > 0 && (
                  <p className="font-body text-[12px] text-on-surface-variant/65 line-through">
                    Original Price: ${(product.price + (selectedVariant?.priceDiff || 0)).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="w-px h-5 bg-outline/20"></div>
              <div className="flex items-center text-primary gap-0.5">
                <span className="material-symbols-outlined text-[18px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-body text-[13px] font-bold">
                  {productReviews.length > 0 
                    ? (productReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / productReviews.length).toFixed(1) 
                    : "0.0"}
                </span>
                <span className="font-body text-[13px] text-on-surface-variant/80 ml-1">
                  ({productReviews.length} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Color Selection */}
          {colorsList.length > 0 && (
            <div className="py-md border-b border-outline-variant/15">
              <h4 className="font-body text-[12px] font-bold text-primary mb-3 uppercase tracking-wider">
                Color: <span className="font-normal text-on-surface-variant">{selectedColor}</span>
              </h4>
              <div className="flex flex-wrap gap-sm">
                {colorsList.map((colorObj) => {
                  const isSelected = selectedColor === colorObj.name;
                  return (
                    <button
                      key={colorObj.name}
                      onClick={() => {
                        setSelectedColor(colorObj.name);
                        setActiveImageIndex(0);
                      }}
                      title={colorObj.name}
                      className={`w-14 h-18 rounded-md transition-all cursor-pointer relative overflow-hidden bg-white flex items-center justify-center ${
                        isSelected 
                          ? "ring-2 ring-offset-2 ring-primary border-none" 
                          : "border border-outline-variant/40 hover:border-primary/60"
                      }`}
                    >
                      {colorObj.image ? (
                        <img 
                          src={colorObj.image} 
                          alt={colorObj.name} 
                          className="max-w-full max-h-full object-contain p-0.5"
                        />
                      ) : (
                        <div 
                          className="w-full h-full" 
                          style={{ backgroundColor: colorObj.hex }}
                        ></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {sizesList.length > 0 && (
            <div className="py-md border-b border-outline-variant/15">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-body text-[12px] font-bold text-primary uppercase tracking-wider">
                  Size: <span className="font-normal text-on-surface-variant">{selectedSize}</span>
                </h4>
                <button className="font-body text-[11px] text-on-surface-variant hover:text-primary underline uppercase tracking-widest cursor-pointer">
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-sm">
                {sizesList.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`border px-5 py-2.5 font-body text-[12px] font-bold tracking-wider transition-colors cursor-pointer min-w-[56px] text-center ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="py-lg flex flex-col gap-sm">
            <div className="flex items-center gap-md">
              <span className="font-body text-[12px] font-bold text-primary uppercase tracking-wider">
                Quantity
              </span>
              <div className="flex items-center border border-outline-variant rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 font-semibold text-primary hover:bg-surface-container cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 font-body text-[14px] font-semibold text-primary">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 font-semibold text-primary hover:bg-surface-container cursor-pointer"
                >
                  +
                </button>
              </div>
              
              {selectedVariant ? (
                selectedVariant.stock <= 5 ? (
                  <span className="font-body text-[12px] text-error font-semibold uppercase tracking-wider">
                    Only {selectedVariant.stock} left in stock
                  </span>
                ) : (
                  <span className="font-body text-[12px] text-secondary-fixed-dim font-semibold uppercase tracking-wider">
                    In Stock ({selectedVariant.stock} available)
                  </span>
                )
              ) : (
                <span className="font-body text-[12px] text-error font-semibold uppercase tracking-wider">
                  Combination Unavailable
                </span>
              )}
            </div>

            <div className="flex gap-md mt-md">
              {/* Add to Cart Button */}
              <button
                onClick={handleAddToBag}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className="flex-grow bg-primary text-white font-body text-[13px] font-semibold py-4 px-8 uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedVariant && selectedVariant.stock === 0 ? "Out of Stock" : "Add to Bag"}
              </button>

              {/* Wishlist Button */}
              <button
                onClick={handleToggleWishlist}
                className={`border p-4 flex items-center justify-center transition-all cursor-pointer ${
                  isFavorited
                    ? "border-primary text-primary bg-primary/5"
                    : "border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}>
                  favorite
                </span>
              </button>
            </div>
          </div>

          {/* Accordion Blocks */}
          <div className="border-t border-outline-variant/30 mt-md">
            {/* Description */}
            <div className="border-b border-outline-variant/30">
              <button
                onClick={() => toggleAccordion("description")}
                className="w-full py-4 flex justify-between items-center font-body text-[13px] font-semibold tracking-wider uppercase text-primary text-left cursor-pointer"
              >
                <span>Description</span>
                <span className="material-symbols-outlined text-[18px]">
                  {openAccordion === "description" ? "expand_less" : "expand_more"}
                </span>
              </button>
              {openAccordion === "description" && (
                <div className="pb-4 text-[14px] text-on-surface-variant leading-relaxed font-body">
                  <p className="mb-2">{product.description}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Designed for a relaxed but structured profile</li>
                    <li>Tailored accents with premium stitch finishing</li>
                    <li>Editorial aesthetic matching "Quiet Luxury" standards</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Care instructions */}
            <div className="border-b border-outline-variant/30">
              <button
                onClick={() => toggleAccordion("materials")}
                className="w-full py-4 flex justify-between items-center font-body text-[13px] font-semibold tracking-wider uppercase text-primary text-left cursor-pointer"
              >
                <span>Materials & Care</span>
                <span className="material-symbols-outlined text-[18px]">
                  {openAccordion === "materials" ? "expand_less" : "expand_more"}
                </span>
              </button>
              {openAccordion === "materials" && (
                <div className="pb-4 text-[14px] text-on-surface-variant leading-relaxed font-body">
                  <p className="mb-2"><strong>Craftsmanship:</strong> Premium Italian / Egyptian Fabrics</p>
                  <p>Dry clean only. Store on wide hangers to preserve shape. Keep away from moisture and direct sunlight during storage.</p>
                </div>
              )}
            </div>

            {/* Shipping & Returns */}
            <div className="border-b border-outline-variant/30">
              <button
                onClick={() => toggleAccordion("shipping")}
                className="w-full py-4 flex justify-between items-center font-body text-[13px] font-semibold tracking-wider uppercase text-primary text-left cursor-pointer"
              >
                <span>Complimentary Shipping & Returns</span>
                <span className="material-symbols-outlined text-[18px]">
                  {openAccordion === "shipping" ? "expand_less" : "expand_more"}
                </span>
              </button>
              {openAccordion === "shipping" && (
                <div className="pb-4 text-[14px] text-on-surface-variant leading-relaxed font-body">
                  <p className="mb-2">We provide complimentary express shipping globally. Delivery takes 2-4 business days.</p>
                  <p>Complimentary returns are accepted on all unworn items within 14 days of delivery. Returns tags must remain attached.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product reviews section */}
      <section className="py-xl mt-xl border-t border-outline-variant/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
          {/* Reviews list */}
          <div className="lg:col-span-7">
            <h3 className="font-display text-[20px] font-semibold text-primary mb-lg">
              Customer Reviews ({productReviews.length})
            </h3>
            
            {productReviews.length === 0 ? (
              <p className="font-body text-[14px] text-on-surface-variant italic">
                No verified reviews exist yet for this item. Be the first to share your thoughts.
              </p>
            ) : (
              <div className="space-y-lg">
                {productReviews.map((rev) => (
                  <div key={rev._id} className="pb-lg border-b border-outline-variant/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-body text-[14px] font-semibold text-primary">
                          {rev.userId?.username || "Anonymous Customer"}
                        </h5>
                        <span className="font-body text-[11px] text-on-surface-variant">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: i < rev.rating ? "'FILL' 1" : "'FILL' 0" }}>
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="font-body text-[14px] text-on-surface-variant leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review form */}
          <div className="lg:col-span-5 bg-surface-container-low p-lg border border-outline-variant/20 rounded-lg">
            <h4 className="font-display text-[20px] font-semibold text-primary mb-md">Write a Review</h4>
            
            {reviewSuccess ? (
              <div className="bg-secondary/10 text-secondary border border-secondary/25 p-md font-body text-[14px]">
                Thank you! Your review has been submitted and is live.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-md font-body">
                {reviewError && (
                  <div className="bg-red-50 text-red-800 border border-red-200 p-3 text-sm">
                    {reviewError}
                  </div>
                )}
                <div>
                  <label className="block text-[12px] font-bold text-primary uppercase mb-2">Rating</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary bg-transparent focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  >
                    <option value={5}>5 Stars - Perfect</option>
                    <option value={4}>4 Stars - Great</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2}>2 Stars - Poor</option>
                    <option value={1}>1 Star - Unacceptable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-primary uppercase mb-2">Review Comment</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                    placeholder="Describe your experience with this item..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={addReviewMutation.isPending}
                  className="w-full bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {addReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="py-xl border-t border-outline-variant/20 mt-xl">
          <h3 className="font-display text-[22px] font-semibold text-primary text-center mb-lg">
            You May Also Like
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
            {relatedProducts.slice(0, 4).map((p) => (
              <div key={p._id} className="product-card group relative">
                <Link href={`/product/${p._id}`} className="block relative w-full aspect-square bg-surface-container-low mb-md overflow-hidden image-hover-zoom rounded-lg">
                  <img src={p.images?.[0]?.secure_url || "/placeholder.jpg"} alt={p.name} className="absolute inset-0 w-full h-full object-cover product-img-main" />
                  {p.images?.[1] && (
                    <img src={p.images[1]?.secure_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover product-img-alt opacity-0" />
                  )}
                </Link>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-display text-[14px] font-semibold text-primary">
                      <Link href={`/product/${p._id}`} className="hover:opacity-80">
                        {p.name}
                      </Link>
                    </h4>
                    <p className="font-body text-[12px] text-on-surface-variant/80">{p.slug}</p>
                  </div>
                  <p className="font-body text-[13px] font-semibold">${p.finalPrice.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
