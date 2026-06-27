"use client";

import Link from "next/link";
import React, { useRef, useState, useSyncExternalStore, useMemo } from "react";
import { getFlagEmoji } from "@/lib/flags";
import {
  DEFAULT_VIEWER_TIME_ZONE,
  formatLocalMatchDate,
  formatLocalMatchTime,
  formatMatchTimeZone,
  getMatchKickoffSortValue,
} from "@/lib/format";
import { getLocalizedPath, type Dictionary, type Locale } from "@/lib/i18n";
import type { NormalizedMatch } from "@/lib/thesportsdb-types";

interface KnockoutBracketProps {
  matches: NormalizedMatch[];
  locale: Locale;
  dictionary: Dictionary;
}

// Fixed Bracket tree match sequence (derived from Sofascore/FIFA bracket mapping)
const ROUND_OF_32_ORDER = [
  "12813000", "12813014", "12813012", "12812995", // Group 1 -> QF 1
  "12812992", "12813004", "12812999", "12813001", // Group 2 -> QF 3
  "12812997", "12813011", "12813020", "12813013", // Group 3 -> QF 2
  "12813018", "12813019", "12812998", "12812989"  // Group 4 -> QF 4
];

const ROUND_OF_16_ORDER = [
  "12813009", "12813010", "12812990", "12812993",
  "12813002", "12813007", "12812991", "12813006"
];

const QUARTER_FINALS_ORDER = [
  "12813016", "12812994", "12813017", "12813015"
];

const SEMI_FINALS_ORDER = [
  "12813008", "12812996"
];

const FINALS_ORDER = [
  "12813005", "12813003" // Final, 3rd Place Match
];

function subscribeToTimeZoneChange() {
  return () => undefined;
}

function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_VIEWER_TIME_ZONE;
}

function getServerTimeZone() {
  return DEFAULT_VIEWER_TIME_ZONE;
}

export default function KnockoutBracket({
  matches,
  locale,
  dictionary,
}: KnockoutBracketProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Panning/drag scroll state (Figma-style)
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);
  const [zoom, setZoom] = useState(1.0);

  const timeZone = useSyncExternalStore(
    subscribeToTimeZoneChange,
    getBrowserTimeZone,
    getServerTimeZone,
  );
  
  const languageTag = locale === "vi" ? "vi-VN" : "en-US";

  // Find the next upcoming match (nearest in time)
  const nextMatch = useMemo(() => {
    if (!matches || matches.length === 0) return null;
    const active = matches.filter((m) => {
      const status = m.status?.toUpperCase();
      return status !== "FINISHED" && status !== "MATCH FINISHED" && status !== "ENDED";
    });
    if (active.length === 0) return null;
    return [...active].sort((a, b) => getMatchKickoffSortValue(a) - getMatchKickoffSortValue(b))[0];
  }, [matches]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setStartY(e.pageY - containerRef.current.offsetTop);
    setScrollLeft(containerRef.current.scrollLeft);
    setScrollTop(containerRef.current.scrollTop);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    const walkX = ((x - startX) / zoom) * 1.5;
    const walkY = ((y - startY) / zoom) * 1.5;
    
    if (Math.abs(walkX) > 3 || Math.abs(walkY) > 3) {
      setDragMoved(true);
    }
    
    containerRef.current.scrollLeft = scrollLeft - walkX;
    containerRef.current.scrollTop = scrollTop - walkY;
  };

  // Build match index map for O(1) access
  const matchMap = new Map<string, NormalizedMatch>();
  matches.forEach((m) => {
    matchMap.set(m.id, m);
  });

  const renderMatchCard = (matchId: string, customLabel?: string, columnIdx?: number) => {
    const match = matchMap.get(matchId);
    if (!match) {
      return (
        <div className="w-[260px] h-[124px] bg-slate-950/20 border border-slate-900/60 rounded-xl flex items-center justify-center text-xs text-slate-600">
          Match TBD ({matchId})
        </div>
      );
    }

    const isFinished = match.status === "FINISHED";
    const statusLabel = isFinished
      ? dictionary.status.matchFinished
      : match.status === "TIMED"
      ? dictionary.status.scheduled
      : match.status;

    // Click handler to prevent navigations on drag
    const handleClick = (e: React.MouseEvent) => {
      if (dragMoved) {
        e.preventDefault();
      }
    };

    const dateLabel = formatLocalMatchDate(match, timeZone, languageTag, dictionary.dateTime.dateTbd);
    const timeLabel = formatLocalMatchTime(match, timeZone, languageTag, dictionary.dateTime.timeTbd);
    const timeZoneLabel = formatMatchTimeZone(match, timeZone);

    const isFinal = matchId === "12813005";
    const isThirdPlace = matchId === "12813003";

    const isNextMatch = nextMatch && match.id === nextMatch.id;
    const isLive = match.status && !["FINISHED", "MATCH FINISHED", "ENDED", "TIMED", "SCHEDULED", "POSTPONED", "CANCELLED", "TBD"].includes(match.status.toUpperCase());
    const shouldHighlight = isNextMatch || isLive;

    return (
      <div className="relative flex items-center h-[124px]" key={match.id}>
        {/* Left connector lines (coming from parents) */}
        {columnIdx === 1 && (
          <>
            <div className="absolute left-[-32px] top-[62px] w-[32px] h-[1px] bg-slate-800" />
            <div className="absolute left-[-32px] top-[calc(62px-81px)] h-[162px] w-[1px] bg-slate-800" />
          </>
        )}
        {columnIdx === 2 && (
          <>
            <div className="absolute left-[-32px] top-[62px] w-[32px] h-[1px] bg-slate-800" />
            <div className="absolute left-[-32px] top-[calc(62px-163px)] h-[326px] w-[1px] bg-slate-800" />
          </>
        )}
        {columnIdx === 3 && (
          <>
            <div className="absolute left-[-32px] top-[62px] w-[32px] h-[1px] bg-slate-800" />
            <div className="absolute left-[-32px] top-[calc(62px-325px)] h-[650px] w-[1px] bg-slate-800" />
          </>
        )}
        {columnIdx === 4 && isFinal && (
          <>
            <div className="absolute left-[-32px] top-[62px] w-[32px] h-[1px] bg-slate-800" />
            <div className="absolute left-[-32px] top-[calc(62px-650px)] h-[1300px] w-[1px] bg-slate-800" />
          </>
        )}

        {/* Card Link */}
        <Link
          href={getLocalizedPath(locale, `/match/${match.id}`)}
          onClick={handleClick}
          className="w-[260px] block group outline-none z-10"
        >
          <div className={`p-3.5 backdrop-blur-md rounded-xl border transition-all duration-200 ${
            shouldHighlight
              ? "bg-slate-900/90 border-emerald-400 shadow-xl shadow-emerald-500/15 ring-1 ring-emerald-400/40 -translate-y-0.5"
              : "bg-slate-900/60 border-slate-800/80 shadow-lg hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/5 hover:-translate-y-0.5"
          }`}>
            {/* Card Header: Round label or match date */}
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-550 uppercase tracking-wider mb-1.5">
              <div className="flex items-center gap-1.5">
                <span>{customLabel || `ID: ${match.id}`}</span>
                {isLive && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                )}
                {isNextMatch && !isLive && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 text-[8px] font-extrabold uppercase tracking-wider scale-90 origin-left">
                    {locale === "vi" ? "SẮP ĐẤU" : "NEXT"}
                  </span>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                isLive
                  ? "bg-red-500/15 text-red-400 font-extrabold"
                  : shouldHighlight
                  ? "bg-emerald-400/20 text-emerald-300"
                  : isFinished
                  ? "bg-slate-800 text-slate-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}>
                {isLive ? (locale === "vi" ? "TRỰC TIẾP" : "LIVE") : statusLabel}
              </span>
            </div>

            {/* Date & Time */}
            <div className="text-[10px] text-slate-400 mb-3 flex flex-wrap items-center gap-1.5 font-medium">
              <span>{dateLabel}</span>
              <span className="text-slate-600 font-normal">•</span>
              <span className="rounded-full bg-slate-950/60 px-1.5 py-0.5 border border-slate-800 text-slate-300 font-mono text-[9px]">
                {timeLabel}
              </span>
              <span className="text-slate-500 font-normal text-[9px]">{timeZoneLabel}</span>
            </div>

            {/* Teams and Scores */}
            <div className="flex flex-col gap-2">
              {/* Home Team */}
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl select-none" role="img" aria-label={match.homeTeam.name}>
                    {getFlagEmoji(match.homeTeam.name)}
                  </span>
                  <span className="truncate text-xs font-bold text-slate-200 group-hover:text-slate-100 transition-colors">
                    {match.homeTeam.name}
                  </span>
                </div>
                <span className={`font-mono text-sm font-bold px-1.5 py-0.5 rounded ${
                  isFinished 
                    ? (match.homeTeam.score !== null && match.awayTeam.score !== null && match.homeTeam.score > match.awayTeam.score
                        ? "text-emerald-400 bg-emerald-500/10" 
                        : "text-slate-500 bg-slate-950/40")
                    : "text-slate-600 bg-slate-950/20"
                }`}>
                  {match.homeTeam.score !== null ? match.homeTeam.score : "-"}
                </span>
              </div>

              {/* Away Team */}
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl select-none" role="img" aria-label={match.awayTeam.name}>
                    {getFlagEmoji(match.awayTeam.name)}
                  </span>
                  <span className="truncate text-xs font-bold text-slate-200 group-hover:text-slate-100 transition-colors">
                    {match.awayTeam.name}
                  </span>
                </div>
                <span className={`font-mono text-sm font-bold px-1.5 py-0.5 rounded ${
                  isFinished 
                    ? (match.homeTeam.score !== null && match.awayTeam.score !== null && match.awayTeam.score > match.homeTeam.score
                        ? "text-emerald-400 bg-emerald-500/10" 
                        : "text-slate-500 bg-slate-950/40")
                    : "text-slate-600 bg-slate-950/20"
                }`}>
                  {match.awayTeam.score !== null ? match.awayTeam.score : "-"}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Right connector lines (going to child) */}
        {columnIdx !== 4 && (
          <div className="absolute left-[260px] top-[62px] w-[32px] h-[1px] bg-slate-800" />
        )}
      </div>
    );
  };

  const isVi = locale === "vi";

  return (
    <div className="relative w-full rounded-2xl border border-slate-900 bg-slate-950/60 overflow-hidden shadow-2xl">
      


      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-full text-xs font-semibold backdrop-blur shadow-lg">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 text-slate-300 transition-colors focus:outline-none"
          title={isVi ? "Thu nhỏ" : "Zoom out"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setZoom(1.0)}
          className="px-2 min-w-12 text-center text-[11px] font-bold text-slate-200 hover:text-emerald-400 transition-colors focus:outline-none"
          title={isVi ? "Đặt lại 100%" : "Reset zoom"}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 text-slate-300 transition-colors focus:outline-none"
          title={isVi ? "Phóng to" : "Zoom in"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Bracket Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`w-full overflow-auto select-none py-10 px-8 h-[calc(100vh-160px)] min-h-[600px] scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Dynamic spacer wrapper corresponding to zoom scale */}
        <div 
          style={{ 
            width: `${1550 * zoom}px`, 
            height: `${2660 * zoom}px`, 
            position: "relative",
            overflow: "hidden" 
          }}
        >
          {/* Zoomable Canvas */}
          <div 
            className="flex gap-16 absolute top-0 left-0"
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: "0 0",
              width: "1550px", 
              height: "2660px" 
            }}
          >
            
            {/* 1. Round of 32 Column */}
          <div className="flex flex-col gap-4 shrink-0 w-[260px]">
            <div className="text-center font-bold text-slate-500 uppercase tracking-widest text-[10px] py-1.5 px-3 bg-slate-900/40 border border-slate-850 rounded-full w-full">
              {isVi ? "Vòng 32 đội" : "Round of 32"}
            </div>
            <div className="flex-1 flex flex-col justify-around py-4 h-[2600px] relative">
              {ROUND_OF_32_ORDER.map((id, idx) => renderMatchCard(id, `${isVi ? "Trận" : "Match"} ${73 + idx}`, 0))}
            </div>
          </div>

          {/* 2. Round of 16 Column */}
          <div className="flex flex-col gap-4 shrink-0 w-[260px]">
            <div className="text-center font-bold text-slate-500 uppercase tracking-widest text-[10px] py-1.5 px-3 bg-slate-900/40 border border-slate-850 rounded-full w-full">
              {isVi ? "Vòng 16 đội" : "Round of 16"}
            </div>
            <div className="flex-1 flex flex-col justify-around py-4 h-[2600px] relative">
              {ROUND_OF_16_ORDER.map((id, idx) => renderMatchCard(id, `${isVi ? "Trận" : "Match"} ${89 + idx}`, 1))}
            </div>
          </div>

          {/* 3. Quarterfinals Column */}
          <div className="flex flex-col gap-4 shrink-0 w-[260px]">
            <div className="text-center font-bold text-slate-500 uppercase tracking-widest text-[10px] py-1.5 px-3 bg-slate-900/40 border border-slate-850 rounded-full w-full">
              {isVi ? "Tứ kết" : "Quarterfinals"}
            </div>
            <div className="flex-1 flex flex-col justify-around py-4 h-[2600px] relative">
              {QUARTER_FINALS_ORDER.map((id, idx) => renderMatchCard(id, `${isVi ? "Tứ kết" : "QF"} ${1 + idx}`, 2))}
            </div>
          </div>

          {/* 4. Semifinals Column */}
          <div className="flex flex-col gap-4 shrink-0 w-[260px]">
            <div className="text-center font-bold text-slate-500 uppercase tracking-widest text-[10px] py-1.5 px-3 bg-slate-900/40 border border-slate-850 rounded-full w-full">
              {isVi ? "Bán kết" : "Semifinals"}
            </div>
            <div className="flex-1 flex flex-col justify-around py-4 h-[2600px] relative">
              {SEMI_FINALS_ORDER.map((id, idx) => renderMatchCard(id, `${isVi ? "Bán kết" : "SF"} ${1 + idx}`, 3))}
            </div>
          </div>

          {/* 5. Finals Column */}
          <div className="flex flex-col gap-4 shrink-0 w-[260px]">
            <div className="text-center font-bold text-slate-500 uppercase tracking-widest text-[10px] py-1.5 px-3 bg-slate-900/40 border border-slate-850 rounded-full w-full">
              {isVi ? "Chung kết" : "Finals"}
            </div>
            <div className="flex-1 h-[2600px] relative py-4">
              {/* Final Card (Centered at 50% height) */}
              <div className="absolute top-[calc(50%-62px)] left-0">
                {renderMatchCard(FINALS_ORDER[0], isVi ? "Chung kết" : "Final", 4)}
              </div>
              
              {/* Third Place Card (Positioned below at 70% height) */}
              <div className="absolute top-[calc(70%-62px)] left-0">
                {renderMatchCard(FINALS_ORDER[1], isVi ? "Tranh hạng ba" : "Third Place", 4)}
              </div>
            </div>
          </div>

          </div>
        </div>
      </div>
    </div>
  );
}
