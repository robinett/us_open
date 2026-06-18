"use client";

import { Fragment, useState } from "react";
import type {
  ParticipantLeaderboardRow,
  ParticipantRound,
  ScorecardHole,
  ScorecardRound,
} from "@/lib/types";

type LeaderboardProps = {
  rows: ParticipantLeaderboardRow[];
};

export function Leaderboard({ rows }: LeaderboardProps) {
  const [openParticipant, setOpenParticipant] = useState<string | null>(null);

  function toggleParticipant(participant: string) {
    setOpenParticipant((current) => (current === participant ? null : participant));
  }

  return (
    <>
      <section className="desktopBoard" aria-label="Pool leaderboard">
        <table>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Player</th>
              <th scope="col">Good pick</th>
              <th scope="col">Bad pick</th>
              {[1, 2, 3, 4].map((round) => (
                <th scope="col" key={round}>
                  R{round}
                </th>
              ))}
              <th className="totalHeader" scope="col">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isOpen = openParticipant === row.participant;

              return (
                <Fragment key={row.participant}>
                  <tr
                    className="leaderboardRow"
                    onClick={() => toggleParticipant(row.participant)}
                  >
                    <td className="rankCell">{row.rank}</td>
                    <td>
                      <button
                        className="participantButton"
                        type="button"
                        aria-expanded={isOpen}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleParticipant(row.participant);
                        }}
                      >
                        {row.participant}
                      </button>
                      {row.hasCutPenalty ? <span className="flag">Cut penalty</span> : null}
                    </td>
                    <PickCell name={row.goodGolfer.name} golferStatus={row.goodGolfer.position} />
                    <PickCell name={row.badGolfer.name} golferStatus={row.badGolfer.position} />
                    {row.rounds.map((round) => (
                      <RoundCell key={round.round} round={round} />
                    ))}
                    <td className="totalCell">{row.totalDisplay}</td>
                  </tr>
                  {isOpen ? (
                    <tr className="scorecardRow">
                      <td colSpan={8}>
                        <ScorecardPanel row={row} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="mobileBoard" aria-label="Pool leaderboard">
        {rows.map((row) => {
          const isOpen = openParticipant === row.participant;

          return (
            <MobileRow
              key={row.participant}
              row={row}
              isOpen={isOpen}
              onToggle={() => toggleParticipant(row.participant)}
            />
          );
        })}
      </section>
    </>
  );
}

function PickCell({ name, golferStatus }: { name: string; golferStatus: string }) {
  return (
    <td>
      <span className="pickName">{name}</span>
      <span className="statusText">{golferStatus}</span>
    </td>
  );
}

function RoundCell({ round }: { round: ParticipantRound }) {
  return (
    <td className={round.status === "live" ? "liveRound" : ""}>
      <span className="roundDiff">{round.diffDisplay}</span>
      <span className="roundDetail">
        G {round.good.display} / B {round.bad.display}
      </span>
      <span className="statusText">{formatRoundStatus(round.status)}</span>
    </td>
  );
}

function MobileRow({
  row,
  isOpen,
  onToggle,
}: {
  row: ParticipantLeaderboardRow;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="mobileCard">
      <button className="mobileCardButton" type="button" aria-expanded={isOpen} onClick={onToggle}>
        <header>
          <div>
            <span className="rankLabel">#{row.rank}</span>
            <h2>{row.participant}</h2>
          </div>
          <strong className="mobileTotal">{row.totalDisplay}</strong>
        </header>
      </button>
      <div className="pickGrid">
        <div>
          <span>Good</span>
          <strong>{row.goodGolfer.name}</strong>
          <em>{row.goodGolfer.position}</em>
        </div>
        <div>
          <span>Bad</span>
          <strong>{row.badGolfer.name}</strong>
          <em>{row.badGolfer.position}</em>
        </div>
      </div>
      <div className="mobileRounds">
        {row.rounds.map((round) => (
          <div key={round.round}>
            <span>R{round.round}</span>
            <strong>{round.diffDisplay}</strong>
            <em>
              G {round.good.display} / B {round.bad.display}
            </em>
          </div>
        ))}
      </div>
      {row.hasCutPenalty ? <p className="cardNote">Cut penalty applied for weekend rounds.</p> : null}
      {isOpen ? <ScorecardPanel row={row} /> : null}
    </article>
  );
}

function ScorecardPanel({ row }: { row: ParticipantLeaderboardRow }) {
  return (
    <div className="scorecardPanel">
      <GolferScorecard
        label="Good"
        name={row.goodGolfer.name}
        rounds={row.goodGolfer.scorecard?.rounds ?? []}
      />
      <GolferScorecard
        label="Bad"
        name={row.badGolfer.name}
        rounds={row.badGolfer.scorecard?.rounds ?? []}
      />
    </div>
  );
}

function GolferScorecard({
  label,
  name,
  rounds,
}: {
  label: "Good" | "Bad";
  name: string;
  rounds: ScorecardRound[];
}) {
  return (
    <section className="golferScorecard" aria-label={`${name} scorecard`}>
      <header>
        <span>{label}</span>
        <h3>{name}</h3>
      </header>
      {rounds.length ? (
        rounds.map((round) => <RoundScorecard key={round.round} round={round} />)
      ) : (
        <p className="emptyScorecard">Scorecard not yet available.</p>
      )}
    </section>
  );
}

function RoundScorecard({ round }: { round: ScorecardRound }) {
  return (
    <div className="roundScorecard">
      <div className="roundScorecardTitle">
        <strong>{round.name}</strong>
        <span>Total {round.total}</span>
      </div>
      <div className="holeGrid">
        {round.holes.map((hole) => (
          <div className="holeCell" key={hole.hole}>
            <span className="holeNumber">{hole.hole}</span>
            <ScoreMark hole={hole} />
            <span className="holePar">Par {hole.par}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreMark({ hole }: { hole: ScorecardHole }) {
  const className = ["scoreMark", scoreMarkClass(hole.relationToPar)].filter(Boolean).join(" ");

  return <span className={className}>{hole.display}</span>;
}

function scoreMarkClass(relationToPar: number | null): string {
  if (relationToPar === null || relationToPar === 0) {
    return "";
  }

  if (relationToPar <= -2) {
    return "doubleCircle";
  }

  if (relationToPar === -1) {
    return "circle";
  }

  if (relationToPar === 1) {
    return "square";
  }

  return "doubleSquare";
}

function formatRoundStatus(status: ParticipantRound["status"]): string {
  if (status === "cutPenalty") {
    return "-5 penalty";
  }

  if (status === "live") {
    return "Live";
  }

  if (status === "pending") {
    return "Yet to play";
  }

  return "Final";
}
