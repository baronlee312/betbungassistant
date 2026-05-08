"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { defaultLocale, getDictionary, isLocale, type Locale } from "@/lib/i18n";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const params = useParams<{ locale?: string }>();
  const locale: Locale = params.locale && isLocale(params.locale)
    ? params.locale
    : defaultLocale;
  const dictionary = getDictionary(locale);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-lg rounded-lg border border-rose-400/30 bg-rose-500/10 p-6 text-center">
        <p className="text-xs font-semibold uppercase text-rose-200">
          {dictionary.errors.dataError}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">
          {dictionary.errors.scheduleCouldNotLoad}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {dictionary.errors.scheduleErrorDescription}
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-6 h-11 rounded-lg bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition-colors duration-200 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          {dictionary.errors.tryAgain}
        </button>
      </section>
    </main>
  );
}
