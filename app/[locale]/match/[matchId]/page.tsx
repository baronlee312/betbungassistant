import { notFound } from "next/navigation";
import MatchDetailClient from "@/components/match-detail-client";
import {
  getDictionary,
  getLocaleLanguageTag,
  isLocale,
  type Locale,
} from "@/lib/i18n";
import {
  createTeamRecentEventsPayload,
  getEventById,
  getTeamRecentEvents,
  getFifaRankingByTeam,
} from "@/lib/thesportsdb";
import { getFootballDataTeamMatches } from "@/lib/football-data";

export const dynamic = "force-dynamic";

interface MatchPageProps {
  params: Promise<{
    locale: string;
    matchId: string;
  }>;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { locale: localeParam, matchId } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const dictionary = getDictionary(locale);
  const match = await getEventById(matchId);

  if (!match) {
    notFound();
  }

  const [homeEvents, awayEvents, homeRanking, awayRanking] = await Promise.all([
    match.homeTeam.name 
      ? getFootballDataTeamMatches(match.homeTeam.name).then((events) => 
          events.length > 0 ? events : (match.homeTeam.id ? getTeamRecentEvents(match.homeTeam.id) : [])
        ) 
      : Promise.resolve([]),
    match.awayTeam.name 
      ? getFootballDataTeamMatches(match.awayTeam.name).then((events) => 
          events.length > 0 ? events : (match.awayTeam.id ? getTeamRecentEvents(match.awayTeam.id) : [])
        ) 
      : Promise.resolve([]),
    getFifaRankingByTeam(match.homeTeam.name),
    getFifaRankingByTeam(match.awayTeam.name)
  ]);

  return (
    <MatchDetailClient
      dictionary={{
        common: dictionary.common,
        dateTime: dictionary.dateTime,
        matchDetail: dictionary.matchDetail,
        recentForm: dictionary.recentForm,
        status: dictionary.status,
        matchStats: dictionary.matchStats,
        fifaRankings: dictionary.fifaRankings,
      }}
      initialAwayForm={createTeamRecentEventsPayload(
        match.awayTeam.id,
        match.awayTeam.name,
        awayEvents,
        dictionary.recentForm.freeTierLimitReason,
        dictionary.recentForm.missingTeamReason,
      )}
      initialHomeForm={createTeamRecentEventsPayload(
        match.homeTeam.id,
        match.homeTeam.name,
        homeEvents,
        dictionary.recentForm.freeTierLimitReason,
        dictionary.recentForm.missingTeamReason,
      )}
      languageTag={getLocaleLanguageTag(locale)}
      locale={locale}
      match={match}
      homeRanking={homeRanking}
      awayRanking={awayRanking}
    />
  );
}
