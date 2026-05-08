import {
  FREE_TIER_LIMIT_REASON,
  createTeamRecentEventsPayload,
} from "@/lib/thesportsdb";
import type { TeamHistoryRouteResponse } from "@/lib/thesportsdb-types";

export const dynamic = "force-dynamic";

interface TeamHistoryRouteContext {
  params: Promise<{
    teamId: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: TeamHistoryRouteContext,
) {
  const { teamId } = await params;
  const payload: TeamHistoryRouteResponse = {
    ...createTeamRecentEventsPayload(teamId, "", []),
    limitReason: FREE_TIER_LIMIT_REASON,
  };

  return Response.json(payload);
}
