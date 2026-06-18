import type { PoolPick } from "@/config/picks";

export type UsgaValue<T = number> = {
  value: T;
  format?: string;
  displayValue: string;
};

export type UsgaLeaderboardPlayer = {
  identifier: string;
  firstName: string;
  lastName: string;
  isAmateur?: boolean;
};

export type UsgaLeaderboardStanding = {
  player: UsgaLeaderboardPlayer;
  position?: UsgaValue<number>;
  toPar?: UsgaValue<number>;
  holesThrough?: UsgaValue<number>;
  toParToday?: UsgaValue<number>;
  totalScore?: UsgaValue<number>;
  roundScores?: {
    score?: UsgaValue<number>;
  }[];
};

export type UsgaLeaderboardResponse = {
  championship: string;
  round: number;
  cutLine?: {
    position: number;
    score: string;
    projected: boolean;
  };
  standings: UsgaLeaderboardStanding[];
};

export type UsgaCourseStatsResponse = {
  currentRound: number;
  courseStats: {
    roundsInfo?: {
      rounds?: {
        number: number;
        total?: {
          par?: number;
        };
      }[];
    };
  }[];
};

export type UsgaPlayerDetailResponse = {
  player: UsgaLeaderboardPlayer;
  roundsInfo?: {
    number: number;
    name: string;
    scorecard?: {
      holeResults?: {
        score?: UsgaValue<number>;
        hole?: {
          identifier: number;
          par: number;
          yards: number;
        };
      }[];
      out?: {
        score?: UsgaValue<number>;
        par?: number;
        yards?: number;
      };
      in?: {
        score?: UsgaValue<number>;
        par?: number;
        yards?: number;
      };
      total?: {
        score?: UsgaValue<number>;
        par?: number;
        yards?: number;
      };
    };
  }[];
};

export type ScorecardHole = {
  hole: number;
  par: number;
  yards: number;
  score: number | null;
  display: string;
  relationToPar: number | null;
};

export type ScorecardRound = {
  round: number;
  name: string;
  holes: ScorecardHole[];
  out: string;
  in: string;
  total: string;
};

export type GolferTournamentScorecard = {
  playerId: string;
  rounds: ScorecardRound[];
};

export type GolferRoundStatus = "complete" | "live" | "pending" | "cut";

export type GolferRound = {
  round: number;
  toPar: number | null;
  display: string;
  thru: string | null;
  status: GolferRoundStatus;
};

export type GolferScore = {
  id: string;
  name: string;
  position: string;
  holes: string;
  status: "active" | "missedCut" | "withdrawn" | "missing";
  rounds: GolferRound[];
  scorecard: GolferTournamentScorecard | null;
};

export type ParticipantRound = {
  round: number;
  good: GolferRound;
  bad: GolferRound;
  diff: number | null;
  diffDisplay: string;
  status: "complete" | "live" | "pending" | "cutPenalty";
};

export type ParticipantLeaderboardRow = {
  participant: string;
  pick: PoolPick;
  goodGolfer: GolferScore;
  badGolfer: GolferScore;
  rounds: ParticipantRound[];
  total: number;
  totalDisplay: string;
  rank: number;
  hasCutPenalty: boolean;
};

export type PoolLeaderboard = {
  generatedAt: string;
  tournamentRound: number;
  cutLine: string | null;
  rows: ParticipantLeaderboardRow[];
  warnings: string[];
};
