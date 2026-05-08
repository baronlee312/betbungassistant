"use client";

import { useState } from "react";

interface TeamFlagProps {
  src: string;
  alt: string;
}

export default function TeamFlag({ src, alt }: TeamFlagProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="h-6 w-9 flex-shrink-0 flex items-center justify-center rounded shadow-sm border border-slate-700 bg-slate-800 text-[10px]">
        🚩
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={36}
      height={24}
      className="h-6 w-9 flex-shrink-0 object-cover rounded shadow-sm border border-slate-700 bg-slate-800"
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
