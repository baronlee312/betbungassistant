"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button if page is scrolled beyond 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    
    // Check initial scroll position on mount
    toggleVisibility();

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      type="button"
      aria-label="Scroll to top"
      className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-800 bg-slate-900/60 text-slate-400 backdrop-blur-md transition-all duration-300 ease-in-out shadow-[0_4px_12px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 group ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto hover:border-emerald-500/50 hover:bg-slate-800/80 hover:text-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.25)]"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        className="h-5 w-5 transition-transform duration-300 ease-in-out group-hover:-translate-y-0.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
        />
      </svg>
    </button>
  );
}
