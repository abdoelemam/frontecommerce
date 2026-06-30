import Link from "next/link";
import React from "react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-gutter font-body text-center bg-white">
      {/* Abstract/Minimalist Icon */}
      <div className="w-16 h-16 mb-xl flex items-center justify-center border border-outline-variant/40 rounded-full bg-surface-container-lowest">
        <span className="material-symbols-outlined text-[28px] text-on-surface-variant font-light">
          search_off
        </span>
      </div>

      <h1 className="font-display text-[80px] md:text-[120px] font-bold text-primary leading-none tracking-tight mb-md">
        404
      </h1>
      
      <h2 className="font-display text-[24px] md:text-[32px] font-semibold text-slate-800 mb-lg tracking-wide">
        Page Not Found
      </h2>

      <div className="w-12 h-[1px] bg-outline-variant/50 mb-lg mx-auto"></div>

      <p className="max-w-md text-[14px] md:text-[16px] text-on-surface-variant leading-relaxed mb-xxl">
        The page or item you are looking for does not exist, has been removed, or is temporarily unavailable. 
      </p>

      <div className="flex flex-col sm:flex-row gap-md items-center">
        <Link 
          href="/" 
          className="bg-primary text-white border border-primary px-xl py-[14px] font-bold text-[11px] uppercase tracking-widest hover:bg-primary/90 transition-colors w-full sm:w-auto min-w-[200px]"
        >
          Return Home
        </Link>
        <Link 
          href="/collections" 
          className="bg-transparent text-primary border border-outline-variant/60 px-xl py-[14px] font-bold text-[11px] uppercase tracking-widest hover:border-primary transition-colors w-full sm:w-auto min-w-[200px]"
        >
          Explore Collections
        </Link>
      </div>
    </div>
  );
}
