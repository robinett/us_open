import type { PoolPick } from "@/config/picks";
import type {
  GolferRound,
  GolferScore,
  ParticipantLeaderboardRow,
  ParticipantRound,
  PoolLeaderboard,
  ScorecardRound,
  UsgaCourseStatsResponse,
  UsgaLeaderboardResponse,
  UsgaLeaderboardStanding,
  UsgaPlayerDetailResponse,
} from "@/lib/types";

const ROUND_COUNT = 4;
const DEFAULT_ROUND_PAR = 70;

export function formatSigned(value: number): string {
  if (value === 0) {
    return "E";
  }

  return value > 0 ? `+${value}` : String(value);
}

export function buildRoundPars(courseStats: UsgaCourseStatsResponse): Map<number, number> {
  const pars = new Map<number, number>();

  for (const course of courseStats.courseStats ?? []) {
    for (const round of course.roundsInfo?.rounds ?? []) {
      if (typeof round.number === "number" && typeof round.total?.par === "number") {
        pars.set(round.number, round.total.par);
      }
    }
  }

  return pars;
}

export function buildPoolLeaderboard(
  picks: PoolPick[],
  leaderboard: UsgaLeaderboardResponse,
  courseStats: UsgaCourseStatsResponse,
  generatedAt = new Date().toISOString(),
  playerDetails = new Map<string, UsgaPlayerDetailResponse>(),
): PoolLeaderboard {
  const roundPars = buildRoundPars(courseStats);
  const standingsById = new Map(
    leaderboard.standings.map((standing) => [standing.player.identifier, standing]),
  );
  const warnings: string[] = [];

  const rows = picks.map((pick) => {
    const goodStanding = standingsById.get(pick.goodGolfer.id);
    const badStanding = standingsById.get(pick.badGolfer.id);

    if (!goodStanding) {
      warnings.push(`${pick.participant}: missing good golfer ${pick.goodGolfer.name}`);
    }

    if (!badStanding) {
      warnings.push(`${pick.participant}: missing bad golfer ${pick.badGolfer.name}`);
    }

    const goodGolfer = normalizeGolfer(
      pick.goodGolfer.id,
      pick.goodGolfer.name,
      goodStanding,
      roundPars,
      leaderboard.round,
      playerDetails.get(pick.goodGolfer.id),
    );
    const badGolfer = normalizeGolfer(
      pick.badGolfer.id,
      pick.badGolfer.name,
      badStanding,
      roundPars,
      leaderboard.round,
      playerDetails.get(pick.badGolfer.id),
    );
    const hasCutPenalty = [goodGolfer, badGolfer].some(qualifiesForCutPenalty);
    const rounds = buildParticipantRounds(goodGolfer, badGolfer, hasCutPenalty);
    const total = rounds.reduce((sum, round) => sum + (round.diff ?? 0), 0);

    return {
      participant: pick.participant,
      pick,
      goodGolfer,
      badGolfer,
      rounds,
      total,
      totalDisplay: formatSigned(total),
      rank: 0,
      hasCutPenalty,
    } satisfies ParticipantLeaderboardRow;
  });

  rows.sort((left, right) => {
    if (right.total !== left.total) {
      return right.total - left.total;
    }

    return left.participant.localeCompare(right.participant);
  });

  let lastTotal: number | null = null;
  let lastRank = 0;
  rows.forEach((row, index) => {
    if (row.total !== lastTotal) {
      lastRank = index + 1;
      lastTotal = row.total;
    }
    row.rank = lastRank;
  });

  return {
    generatedAt,
    tournamentRound: leaderboard.round,
    cutLine: getCurrentCutLine(leaderboard),
    rows,
    warnings,
  };
}

export function getCurrentCutLine(leaderboard: UsgaLeaderboardResponse): string | null {
  const eligibleScores = leaderboard.standings
    .filter((standing) => {
      const position = standing.position?.displayValue?.toUpperCase();
      return position !== "WD" && typeof standing.toPar?.value === "number";
    })
    .map((standing) => standing.toPar?.value as number)
    .sort((left, right) => left - right);

  if (eligibleScores.length < 60) {
    return leaderboard.cutLine?.score || null;
  }

  return formatSigned(eligibleScores[59]);
}

function normalizeGolfer(
  id: string,
  fallbackName: string,
  standing: UsgaLeaderboardStanding | undefined,
  roundPars: Map<number, number>,
  tournamentRound: number,
  playerDetail?: UsgaPlayerDetailResponse,
): GolferScore {
  if (!standing) {
    return {
      id,
      name: fallbackName,
      position: "Missing",
      holes: "",
      status: "missing",
      scorecard: null,
      rounds: Array.from({ length: ROUND_COUNT }, (_, index) => ({
        round: index + 1,
        toPar: null,
        display: "--",
        thru: null,
        status: "pending",
      })),
    };
  }

  const name = `${standing.player.firstName} ${standing.player.lastName}${
    standing.player.isAmateur ? " (a)" : ""
  }`;
  const position = standing.position?.displayValue || "";
  const status = getGolferStatus(standing);
  const rounds: GolferRound[] = Array.from({ length: ROUND_COUNT }, (_, index) => {
    const round = index + 1;
    const completedScore = standing.roundScores?.[index]?.score?.value;

    if (typeof completedScore === "number") {
      const toPar = completedScore - (roundPars.get(round) ?? DEFAULT_ROUND_PAR);
      return {
        round,
        toPar,
        display: formatSigned(toPar),
        thru: null,
        status: "complete",
      };
    }

    if (round === tournamentRound && hasStartedCurrentRound(standing)) {
      const toPar = standing.toParToday?.value;
      if (typeof toPar === "number") {
        return {
          round,
          toPar,
          display: formatSigned(toPar),
          thru: formatThru(standing.holesThrough?.displayValue),
          status: standing.holesThrough?.displayValue === "F" ? "complete" : "live",
        };
      }
    }

    if (round >= 3 && qualifiesForCutPenaltyStatus(status)) {
      return {
        round,
        toPar: null,
        display: status === "withdrawn" ? "WD" : "MC",
        thru: null,
        status: "cut",
      };
    }

    return {
      round,
      toPar: null,
      display: "--",
      thru: null,
      status: "pending",
    };
  });

  return {
    id: standing.player.identifier,
    name,
    position: position || "--",
    holes: standing.holesThrough?.displayValue || "",
    status,
    scorecard: normalizeScorecard(id, playerDetail),
    rounds,
  };
}

function normalizeScorecard(
  playerId: string,
  playerDetail: UsgaPlayerDetailResponse | undefined,
) {
  if (!playerDetail?.roundsInfo?.length) {
    return null;
  }

  const rounds: ScorecardRound[] = playerDetail.roundsInfo
    .map((round) => {
      const holes = (round.scorecard?.holeResults ?? [])
        .map((result) => {
          const score = result.score?.displayValue === "-" ? null : result.score?.value ?? null;
          const par = result.hole?.par ?? 0;

          return {
            hole: result.hole?.identifier ?? 0,
            par,
            yards: result.hole?.yards ?? 0,
            score,
            display: result.score?.displayValue ?? "--",
            relationToPar: typeof score === "number" && par ? score - par : null,
          };
        })
        .sort((left, right) => left.hole - right.hole);

      return {
        round: round.number,
        name: round.name,
        holes,
        out: round.scorecard?.out?.score?.displayValue ?? "--",
        in: round.scorecard?.in?.score?.displayValue ?? "--",
        total: round.scorecard?.total?.score?.displayValue ?? "--",
      };
    })
    .sort((left, right) => left.round - right.round);

  return { playerId, rounds };
}

function buildParticipantRounds(
  goodGolfer: GolferScore,
  badGolfer: GolferScore,
  hasCutPenalty: boolean,
): ParticipantRound[] {
  return Array.from({ length: ROUND_COUNT }, (_, index) => {
    const round = index + 1;
    const good = goodGolfer.rounds[index];
    const bad = badGolfer.rounds[index];

    if (round >= 3 && hasCutPenalty) {
      return {
        round,
        good,
        bad,
        diff: -5,
        diffDisplay: "-5",
        status: "cutPenalty",
      };
    }

    if (typeof good.toPar === "number" && typeof bad.toPar === "number") {
      const diff = bad.toPar - good.toPar;
      return {
        round,
        good,
        bad,
        diff,
        diffDisplay: formatSigned(diff),
        status: good.status === "live" || bad.status === "live" ? "live" : "complete",
      };
    }

    return {
      round,
      good,
      bad,
      diff: null,
      diffDisplay: "--",
      status: "pending",
    };
  });
}

function getGolferStatus(
  standing: UsgaLeaderboardStanding,
): "active" | "missedCut" | "withdrawn" {
  const position = standing.position?.displayValue?.toUpperCase();

  if (position === "MC") {
    return "missedCut";
  }

  if (position === "WD") {
    return "withdrawn";
  }

  return "active";
}

function qualifiesForCutPenalty(golfer: GolferScore): boolean {
  return qualifiesForCutPenaltyStatus(golfer.status);
}

function qualifiesForCutPenaltyStatus(status: GolferScore["status"]): boolean {
  return status === "missedCut" || status === "withdrawn";
}

function hasStartedCurrentRound(standing: UsgaLeaderboardStanding): boolean {
  return Boolean(
    (standing.holesThrough?.value ?? 0) > 0 || standing.holesThrough?.displayValue === "F",
  );
}

function formatThru(displayValue: string | undefined): string | null {
  if (!displayValue) {
    return null;
  }

  if (displayValue === "F") {
    return "F";
  }

  return displayValue;
}
