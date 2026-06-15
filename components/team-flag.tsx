"use client";

import { getFlagEmoji } from "@/lib/flags";

interface TeamFlagProps {
  teamName: string;
}

export default function TeamFlag({ teamName }: TeamFlagProps) {
  return (
    <span className="text-xl select-none leading-none" role="img" aria-label={teamName}>
      {getFlagEmoji(teamName)}
    </span>
  );
}
