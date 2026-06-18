import { describe, expect, it } from "vitest";
import { buildPoolLeaderboard, formatSigned, getCurrentCutLine } from "./scoring";
import type {
  UsgaCourseStatsResponse,
  UsgaLeaderboardResponse,
  UsgaLeaderboardStanding,
} from "./types";

const courseStats: UsgaCourseStatsResponse = {
  currentRound: 3,
  courseStats: [
    {
      roundsInfo: {
        rounds: [
          { number: 1, total: { par: 70 } },
          { number: 2, total: { par: 70 } },
          { number: 3, total: { par: 70 } },
          { number: 4, total: { par: 70 } },
        ],
      },
    },
  ],
};

describe("formatSigned", () => {
  it("formats golf-style signed values", () => {
    expect(formatSigned(0)).toBe("E");
    expect(formatSigned(4)).toBe("+4");
    expect(formatSigned(-3)).toBe("-3");
  });
});

describe("buildPoolLeaderboard", () => {
  it("calculates completed round differences and sorts higher totals first", () => {
    const leaderboard = buildPoolLeaderboard(
      [
        pick("Alice", "good", "bad"),
        pick("Bob", "better", "worse"),
      ],
      response(2, [
        standing("good", "Good", "Golfer", "T5", [70, 71]),
        standing("bad", "Bad", "Golfer", "T20", [74, 73]),
        standing("better", "Better", "Golfer", "T2", [68, 68]),
        standing("worse", "Worse", "Golfer", "T50", [70, 71]),
      ]),
      courseStats,
      "2026-06-18T12:00:00.000Z",
    );

    expect(leaderboard.rows.map((row) => row.participant)).toEqual(["Alice", "Bob"]);
    expect(leaderboard.rows[0].rounds.map((round) => round.diff)).toEqual([4, 2, null, null]);
    expect(leaderboard.rows[0].total).toBe(6);
    expect(leaderboard.rows[1].total).toBe(5);
  });

  it("uses live current round to-par values before round scores are final", () => {
    const leaderboard = buildPoolLeaderboard(
      [pick("Alice", "good", "bad")],
      response(3, [
        standing("good", "Good", "Golfer", "T5", [70, 71], {
          holesThrough: "9",
          toParToday: -1,
        }),
        standing("bad", "Bad", "Golfer", "T20", [74, 73], {
          holesThrough: "8",
          toParToday: 2,
        }),
      ]),
      courseStats,
    );

    expect(leaderboard.rows[0].rounds.map((round) => round.diff)).toEqual([4, 2, 3, null]);
    expect(leaderboard.rows[0].rounds[2].status).toBe("live");
    expect(leaderboard.rows[0].total).toBe(9);
  });

  it("applies one -5 weekend penalty if either golfer misses the cut", () => {
    const leaderboard = buildPoolLeaderboard(
      [pick("Alice", "good", "bad")],
      response(4, [
        standing("good", "Good", "Golfer", "MC", [77, 78]),
        standing("bad", "Bad", "Golfer", "T20", [72, 73, 70, 71]),
      ]),
      courseStats,
    );

    expect(leaderboard.rows[0].hasCutPenalty).toBe(true);
    expect(leaderboard.rows[0].rounds.map((round) => round.diff)).toEqual([-5, -5, -5, -5]);
    expect(leaderboard.rows[0].total).toBe(-20);
  });

  it("does not double the weekend penalty if both golfers miss the cut", () => {
    const leaderboard = buildPoolLeaderboard(
      [pick("Alice", "good", "bad")],
      response(4, [
        standing("good", "Good", "Golfer", "MC", [76, 77]),
        standing("bad", "Bad", "Golfer", "MC", [78, 78]),
      ]),
      courseStats,
    );

    expect(leaderboard.rows[0].rounds.map((round) => round.diff)).toEqual([2, 1, -5, -5]);
    expect(leaderboard.rows[0].total).toBe(-7);
  });

  it("warns when a configured pick is not present in the API response", () => {
    const leaderboard = buildPoolLeaderboard(
      [pick("Alice", "good", "missing")],
      response(1, [standing("good", "Good", "Golfer", "T1", [])]),
      courseStats,
    );

    expect(leaderboard.warnings).toEqual(["Alice: missing bad golfer Missing"]);
    expect(leaderboard.rows[0].rounds[0].diff).toBeNull();
  });
});

describe("getCurrentCutLine", () => {
  it("uses low 60 and ties scoring position from current to-par values", () => {
    const standings = Array.from({ length: 70 }, (_, index) =>
      standing(String(index), "Player", String(index), String(index + 1), [], {
        totalToPar: index < 58 ? 1 : index < 64 ? 2 : 3,
      }),
    );

    expect(getCurrentCutLine(response(2, standings))).toBe("+2");
  });

  it("falls back to the feed cut line before enough scores are available", () => {
    expect(getCurrentCutLine(response(1, []))).toBe("+5");
  });
});

function pick(participant: string, goodId: string, badId: string) {
  return {
    participant,
    goodGolfer: { id: goodId, name: titleCase(goodId) },
    badGolfer: { id: badId, name: titleCase(badId) },
  };
}

function response(round: number, standings: UsgaLeaderboardStanding[]): UsgaLeaderboardResponse {
  return {
    championship: "uso",
    round,
    cutLine: { position: 60, score: "+5", projected: false },
    standings,
  };
}

function standing(
  id: string,
  firstName: string,
  lastName: string,
  position: string,
  roundScores: number[],
  options: { holesThrough?: string; toParToday?: number; totalToPar?: number } = {},
): UsgaLeaderboardStanding {
  return {
    player: {
      identifier: id,
      firstName,
      lastName,
    },
    position: {
      value: position === "MC" ? 80 : 10,
      displayValue: position,
    },
    holesThrough: {
      value: options.holesThrough ? Number(options.holesThrough) : 0,
      displayValue: options.holesThrough ?? "",
    },
    toParToday: {
      value: options.toParToday ?? 0,
      displayValue: formatSigned(options.toParToday ?? 0),
    },
    toPar: {
      value: options.totalToPar ?? roundScores.reduce((sum, score) => sum + score - 70, 0),
      displayValue: formatSigned(
        options.totalToPar ?? roundScores.reduce((sum, score) => sum + score - 70, 0),
      ),
    },
    roundScores: roundScores.map((score) => ({
      score: {
        value: score,
        displayValue: String(score),
      },
    })),
  };
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
