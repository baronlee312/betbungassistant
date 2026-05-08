import type { Dictionary } from "@/lib/i18n";
import type { NormalizedMatch } from "@/lib/thesportsdb-types";

interface MatchStatsProps {
  dictionary: Dictionary["matchStats"];
  match: NormalizedMatch;
}

export default function MatchStats({ dictionary, match }: MatchStatsProps) {
  const { statistics } = match;

  if (!statistics) {
    return (
      <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
        {dictionary.noStats}
      </div>
    );
  }

  const statItems: { label: string; key: keyof NonNullable<NormalizedMatch["statistics"]>; suffix?: string }[] = [
    { label: `${dictionary.possession} 📊`, key: "possession", suffix: "%" },
    { label: `${dictionary.shots} ⚽`, key: "shots" },
    { label: `${dictionary.shotsOnTarget} 🎯`, key: "shotsOnTarget" },
    { label: `${dictionary.corners} ⛳`, key: "corners" },
    { label: `${dictionary.fouls} ⚠️`, key: "fouls" },
    { label: `${dictionary.yellowCards} 🟨`, key: "yellowCards" },
    { label: `${dictionary.redCards} 🧧`, key: "redCards" },
    { label: `${dictionary.offsides} 🚩`, key: "offsides" },
    { label: `${dictionary.saves} 🧤`, key: "saves" },
  ];

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-slate-50 mb-6 flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-emerald-400"></span>
        {dictionary.statistics}
      </h2>

      <div className="space-y-6">
        {statItems.map((item) => {
          const homeValue = statistics[item.key]?.home ?? 0;
          const awayValue = statistics[item.key]?.away ?? 0;

          // Hide if both values are 0 (except for possession which is usually always there if stats exist)
          if (item.key !== "possession" && homeValue === 0 && awayValue === 0) {
            return null;
          }

          const total = homeValue + awayValue || 1;
          const homePercent = (homeValue / total) * 100;

          return (
            <div key={item.key} className="group">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-mono font-bold text-emerald-400">
                  {homeValue}{item.suffix ?? ""}
                </span>
                <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  {item.label}
                </span>
                <span className="font-mono font-bold text-emerald-100 text-right">
                  {awayValue}{item.suffix ?? ""}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out group-hover:bg-emerald-400" 
                  style={{ width: `${homePercent}%` }}
                />
                <div 
                  className="h-full bg-emerald-100/20 transition-all duration-500 ease-out" 
                  style={{ width: `${100 - homePercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
