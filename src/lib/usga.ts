import { picks } from "@/config/picks";
import { buildPoolLeaderboard } from "@/lib/scoring";
import type {
  PoolLeaderboard,
  UsgaCourseStatsResponse,
  UsgaLeaderboardResponse,
  UsgaPlayerDetailResponse,
} from "@/lib/types";

const CHAMPIONSHIP = "uso";
const CHAMPIONSHIP_YEAR = "2026";
const PUBLIC_USGA_KEY = "0f679e1117d348d6b586d4888ea13559";
const API_KEY = process.env.USGA_SUBSCRIPTION_KEY || PUBLIC_USGA_KEY;
const API_BASE = "https://ace-api.usga.org/scoring/v1";

export async function getPoolLeaderboard(): Promise<PoolLeaderboard> {
  const [leaderboard, courseStats] = await Promise.all([
    fetchUsga<UsgaLeaderboardResponse>(
      `${API_BASE}/leaderboard.json?championship=${CHAMPIONSHIP}&championship-year=${CHAMPIONSHIP_YEAR}`,
    ),
    fetchUsga<UsgaCourseStatsResponse>(
      `${API_BASE}/course-statistics.json?championship=${CHAMPIONSHIP}&championship-year=${CHAMPIONSHIP_YEAR}`,
    ),
  ]);
  const playerDetails = await fetchPickedPlayerDetails();

  return buildPoolLeaderboard(picks, leaderboard, courseStats, undefined, playerDetails);
}

async function fetchPickedPlayerDetails(): Promise<Map<string, UsgaPlayerDetailResponse>> {
  const playerIds = Array.from(
    new Set(picks.flatMap((pick) => [pick.goodGolfer.id, pick.badGolfer.id])),
  );
  const entries = await Promise.all(
    playerIds.map(async (playerId) => {
      try {
        const detail = await fetchUsga<UsgaPlayerDetailResponse>(
          `${API_BASE}/player/${playerId}.json?championship=${CHAMPIONSHIP}&championship-year=${CHAMPIONSHIP_YEAR}`,
        );
        return [playerId, detail] as const;
      } catch {
        return [playerId, null] as const;
      }
    }),
  );

  return new Map(
    entries.filter((entry): entry is readonly [string, UsgaPlayerDetailResponse] =>
      Boolean(entry[1]),
    ),
  );
}

async function fetchUsga<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Ocp-Apim-Subscription-Key": API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`USGA request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
