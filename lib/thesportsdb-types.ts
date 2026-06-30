export interface TheSportsDBEvent {
  idEvent: string | null;
  idLeague: string | null;
  strLeague: string | null;
  strSeason: string | null;
  strSport: string | null;
  strEvent: string | null;
  strEventAlternate: string | null;
  idHomeTeam: string | null;
  idAwayTeam: string | null;
  strHomeTeam: string | null;
  strAwayTeam: string | null;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string | null;
  strProgress: string | null;
  dateEvent: string | null;
  dateEventLocal: string | null;
  strTime: string | null;
  strTimeLocal: string | null;
  strTimestamp: string | null;
  strVenue: string | null;
  strCountry: string | null;
  strThumb: string | null;
  strBanner: string | null;
  strPoster: string | null;
}

export interface TheSportsDBEventsResponse {
  events: TheSportsDBEvent[] | null;
}

export interface TheSportsDBResultsResponse {
  results: TheSportsDBEvent[] | null;
  events?: TheSportsDBEvent[] | null;
}

export interface NormalizedTeam {
  id: string | null;
  name: string;
  score: number | null;
  crestUrl: string | null;
}

export interface NormalizedMatch {
  id: string;
  name: string;
  league: string;
  season: string;
  date: string | null;
  time: string | null;
  timestamp: string | null;
  venue: string | null;
  country: string | null;
  status: string | null;
  progress: string | null;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  statistics?: {
    possession: { home: number | null; away: number | null };
    shots: { home: number | null; away: number | null };
    shotsOnTarget: { home: number | null; away: number | null };
    corners: { home: number | null; away: number | null };
    fouls: { home: number | null; away: number | null };
    yellowCards: { home: number | null; away: number | null };
    redCards: { home: number | null; away: number | null };
    offsides: { home: number | null; away: number | null };
    saves: { home: number | null; away: number | null };
  };
}

export interface TeamRecentEventsPayload {
  teamId: string | null;
  teamName: string;
  events: NormalizedMatch[];
  hasMore: boolean;
  nextCursor: string | null;
  limitReason: string | null;
}

export interface TeamHistoryRouteResponse {
  teamId: string | null;
  teamName: string;
  events: NormalizedMatch[];
  hasMore: boolean;
  nextCursor: string | null;
  limitReason: string | null;
}

export interface TeamHistoryErrorResponse {
  error: string;
}
