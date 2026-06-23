"use client";

interface FocusMatchButtonProps {
  matchId: string;
  locale: string;
}

export default function FocusMatchButton({ matchId, locale }: FocusMatchButtonProps) {
  const label = locale === "vi" ? "Xem trận sắp diễn ra" : "Jump to upcoming match";

  const handleFocus = () => {
    const element = document.getElementById(`match-${matchId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus({ preventScroll: true });
    }
  };

  return (
    <button
      onClick={handleFocus}
      type="button"
      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4.5 py-2 text-sm font-semibold text-emerald-300 hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:text-emerald-200 hover:shadow-[0_0_20px_rgba(52,211,153,0.15)] transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        className="h-4 w-4 animate-pulse text-emerald-400"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21m-9-6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"
        />
      </svg>
      {label}
    </button>
  );
}
