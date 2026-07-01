"use client";

import React, { useState } from "react";
import Link from "next/link";
import LanguageSwitcher from "@/components/language-switcher";
import FocusMatchButton from "@/components/focus-match-button";
import { getLocalizedPath, type Dictionary, type Locale } from "@/lib/i18n";
import { WORLD_CUP_SEASON } from "@/lib/thesportsdb";

interface HeaderProps {
  locale: Locale;
  dictionary: Dictionary;
  nextMatchId?: string;
  isKnockout: boolean;
}

export default function Header({
  locale,
  dictionary,
  nextMatchId,
  isKnockout,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isVi = locale === "vi";

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-900/80 transition-all duration-200 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div>
            <p className="text-[10px] font-semibold uppercase text-emerald-300 tracking-wider select-none">
              {dictionary.home.eyebrow} {WORLD_CUP_SEASON}
            </p>
            <h1 className="text-lg font-bold text-slate-50 tracking-tight leading-none mt-0.5 select-none">
              <Link href={`/${locale}?stage=${isKnockout ? "knockout" : "group"}`}>
                {dictionary.home.title}
              </Link>
            </h1>
          </div>

          {/* Right Desktop: Tabs + Actions */}
          <div className="hidden md:flex items-center gap-6">
            {/* Segmented Control Tabs */}
            <div className="flex gap-0.5 p-0.5 bg-slate-900/65 rounded-full border border-slate-850">
              <Link
                href={`/${locale}?stage=group`}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150 ${
                  !isKnockout
                    ? "bg-emerald-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {dictionary.home.groupStage}
              </Link>
              <Link
                href={`/${locale}?stage=knockout`}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150 ${
                  isKnockout
                    ? "bg-emerald-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {dictionary.home.knockoutStage}
              </Link>
            </div>

            <div className="h-5 w-px bg-slate-800" />

            {/* Actions */}
            <div className="flex items-center gap-4">
              {nextMatchId && (
                <FocusMatchButton matchId={nextMatchId} locale={locale} />
              )}
              <Link
                href={getLocalizedPath(locale, "/fifa-rankings")}
                className="text-xs sm:text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {dictionary.fifaRankings.title} →
              </Link>
              <LanguageSwitcher
                currentPath="/"
                dictionary={dictionary.common}
                locale={locale}
              />
            </div>
          </div>

          {/* Mobile Hamburger Button Toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                // X Close Icon
                <svg className="block h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger Menu Icon
                <svg className="block h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-900/80 flex flex-col gap-4.5 animate-fade-in">
            {/* View Mode selection */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                {isVi ? "Chế độ xem" : "View Mode"}
              </span>
              <div className="flex gap-0.5 p-0.5 bg-slate-900/65 rounded-full border border-slate-850 w-full">
                <Link
                  href={`/${locale}?stage=group`}
                  onClick={() => setIsOpen(false)}
                  className={`px-3 py-2 text-xs font-semibold rounded-full transition-all duration-150 flex-1 text-center ${
                    !isKnockout
                      ? "bg-emerald-400 text-slate-950 shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {dictionary.home.groupStage}
                </Link>
                <Link
                  href={`/${locale}?stage=knockout`}
                  onClick={() => setIsOpen(false)}
                  className={`px-3 py-2 text-xs font-semibold rounded-full transition-all duration-150 flex-1 text-center ${
                    isKnockout
                      ? "bg-emerald-400 text-slate-950 shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {dictionary.home.knockoutStage}
                </Link>
              </div>
            </div>

            <div className="h-[1px] bg-slate-900/80" />

            {/* Links and Actions */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                {isVi ? "Tiện ích & Liên kết" : "Actions & Links"}
              </span>
              {nextMatchId && (
                <div onClick={() => setIsOpen(false)} className="w-full">
                  <FocusMatchButton matchId={nextMatchId} locale={locale} />
                </div>
              )}
              <Link
                href={getLocalizedPath(locale, "/fifa-rankings")}
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors py-2 px-1 flex items-center justify-between bg-slate-900/30 border border-slate-900/60 rounded-lg hover:bg-slate-900/50"
              >
                <span>{dictionary.fifaRankings.title}</span>
                <span>→</span>
              </Link>
            </div>

            <div className="h-[1px] bg-slate-900/80" />

            {/* Language Selection */}
            <div className="flex flex-col gap-2 pb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                {isVi ? "Ngôn ngữ" : "Language"}
              </span>
              <div onClick={() => setIsOpen(false)}>
                <LanguageSwitcher
                  currentPath="/"
                  dictionary={dictionary.common}
                  locale={locale}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
