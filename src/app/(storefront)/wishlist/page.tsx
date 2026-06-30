"use client";

import React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistService } from "@/services/wishlistService";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Product } from "@/types/product";
import { toast } from "@/store/useToastStore";

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const addItem = useCartStore((state) => state.addItem);

  // Fetch wishlist from backend if logged in
  const { data: wishlistedItems = [], isLoading, error } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistService.getWishlist(),
    enabled: !!token,
  });

  // Toggle wishlist mutation (for removal)
  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistService.toggleWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const handleRemove = (productId: string) => {
    removeMutation.mutate(productId);
  };

  const handleMoveToBag = (product: Product) => {
    const firstVariant = product.variants?.[0] || null;
    addItem({
      productId: product._id,
      name: product.name,
      price: product.finalPrice,
      image: product.images?.[0]?.secure_url || "/placeholder.jpg",
      quantity: 1,
      variant: firstVariant,
    });
    // Remove from wishlist
    removeMutation.mutate(product._id);
    toast.success(`${product.name} moved to bag!`);
  };

  if (!token) {
    return (
      <div className="max-w-container-max mx-auto px-gutter py-xxl text-center font-body">
        <span className="material-symbols-outlined text-[64px] text-on-surface-variant/40 mb-md" style={{ fontVariationSettings: "'FILL' 0" }}>
          favorite
        </span>
        <h2 className="font-display text-[22px] font-semibold text-primary mb-xs">Please Sign In</h2>
        <p className="font-body text-[14px] text-on-surface-variant mb-lg">
          You need to be signed in to view and manage your wishlist.
        </p>
        <Link
          href="/login"
          className="bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-4 px-8 hover:opacity-90 w-full max-w-xs mx-auto block text-center"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-gutter py-xl font-body">
      <div className="mb-xl text-center mt-sm">
        <h1 className="font-display text-[36px] text-primary uppercase font-bold">Your Wishlist</h1>
        <p className="font-body text-[14px] text-on-surface-variant mt-1">
          A curated list of your favorite luxury pieces.
        </p>
      </div>

      {isLoading ? (
        <div className="py-xxl text-center text-[14px] font-body text-on-surface-variant/70">
          Loading your wishlist...
        </div>
      ) : error ? (
        <div className="py-xxl text-center text-[14px] font-body text-error">
          Failed to load wishlist. Please sign out and sign in again.
        </div>
      ) : wishlistedItems.length === 0 ? (
        <div className="py-xxl text-center max-w-md mx-auto flex flex-col items-center">
          <span className="material-symbols-outlined text-[64px] text-on-surface-variant/40 mb-md" style={{ fontVariationSettings: "'FILL' 0" }}>
            favorite
          </span>
          <h2 className="font-display text-[22px] font-semibold text-primary mb-xs">Your wishlist is empty</h2>
          <p className="font-body text-[14px] text-on-surface-variant mb-lg">
            Save pieces you love to your wishlist to keep track of them or buy them later.
          </p>
          <Link
            href="/collections"
            className="bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-4 px-8 hover:opacity-90 w-full text-center block"
          >
            Explore Collections
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-lg">
          {wishlistedItems.map((product) => (
            <div key={product._id} className="product-card group relative border border-outline-variant/15 p-sm rounded-lg flex flex-col justify-between">
              <div>
                <div className="relative w-full aspect-[3/4] bg-surface-container-low mb-md overflow-hidden rounded">
                  <Link href={`/product/${product._id}`} className="block w-full h-full">
                    <img src={product.images?.[0]?.secure_url || "/placeholder.jpg"} alt={product.name} className="w-full h-full object-cover" />
                  </Link>
                  <button
                    onClick={() => handleRemove(product._id)}
                    className="absolute top-4 right-4 bg-white/80 hover:bg-white text-primary p-2 rounded-full shadow transition-colors flex items-center justify-center cursor-pointer"
                    title="Remove from Wishlist"
                  >
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      close
                    </span>
                  </button>
                </div>
                <div className="flex flex-col gap-xs mb-3">
                  <h3 className="font-display text-[15px] md:text-[16px] font-semibold text-primary block truncate">
                    <Link href={`/product/${product._id}`} className="hover:opacity-85">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="font-body text-[11px] text-on-surface-variant/80 block truncate">{product.slug}</p>
                </div>
              </div>

              <div className="space-y-sm">
                <div className="flex justify-between items-baseline mb-2">
                  <p className="font-body text-[14px] font-semibold text-primary">
                    ${product.finalPrice.toLocaleString()}
                  </p>
                  {product.discount > 0 && (
                    <p className="font-body text-[11px] text-on-surface-variant/65 line-through">
                      ${product.price.toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleMoveToBag(product)}
                  className="w-full bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Move to Bag
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
