"use client";

import React from "react";
import { useToastStore } from "@/store/useToastStore";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => {
        // Define colors and icons based on toast type
        let bgStyle = "bg-white/95 dark:bg-slate-900/95 border-l-4";
        let textStyle = "text-slate-800 dark:text-slate-100";
        let iconName = "info";
        let iconColor = "text-blue-500";
        let borderStyle = "border-l-blue-500";

        if (t.type === "success") {
          iconName = "check_circle";
          iconColor = "text-emerald-500";
          borderStyle = "border-l-emerald-500";
        } else if (t.type === "error") {
          iconName = "error";
          iconColor = "text-red-500";
          borderStyle = "border-l-red-500";
        }

        return (
          <div
            key={t.id}
            className={`${bgStyle} ${borderStyle} ${textStyle} pointer-events-auto flex items-start gap-3 p-4 rounded-r-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md animate-toast-in w-full transition-all`}
          >
            {/* Icon */}
            <span className={`material-symbols-outlined ${iconColor} shrink-0 mt-0.5`} style={{ fontSize: "20px" }}>
              {iconName}
            </span>

            {/* Message */}
            <div className="flex-1 text-[13px] font-semibold leading-relaxed font-body">
              {t.message}
            </div>

            {/* Close button */}
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0 p-0.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                close
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
