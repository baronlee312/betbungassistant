import Link from "next/link";
import {
  getLocalizedPath,
  type Dictionary,
  type Locale,
  locales,
} from "@/lib/i18n";

interface LanguageSwitcherProps {
  currentPath: string;
  dictionary: Dictionary["common"];
  locale: Locale;
}

export default function LanguageSwitcher({
  currentPath,
  dictionary,
  locale,
}: LanguageSwitcherProps) {
  const labels: Record<Locale, string> = {
    en: dictionary.english,
    vi: dictionary.vietnamese,
  };

  return (
    <nav
      aria-label={dictionary.languageSwitcherLabel}
      className="flex w-fit rounded-lg border border-slate-800 bg-slate-950/80 p-1"
    >
      {locales.map((targetLocale) => {
        const isActive = targetLocale === locale;

        return (
          <Link
            key={targetLocale}
            href={getLocalizedPath(targetLocale, currentPath)}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 ${
              isActive
                ? "bg-emerald-400 text-slate-950"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            }`}
          >
            {labels[targetLocale]}
          </Link>
        );
      })}
    </nav>
  );
}
