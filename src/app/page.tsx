import { getPoolLeaderboard } from "@/lib/usga";
import { Leaderboard } from "@/app/Leaderboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  let leaderboard;
  let error: string | null = null;

  try {
    leaderboard = await getPoolLeaderboard();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Unable to load leaderboard.";
  }

  return (
    <main className="pageShell">
      <section className="topBar" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">2026 U.S. Open pool</p>
          <h1 id="page-title">Good golfer, bad golfer leaderboard</h1>
        </div>
        {leaderboard ? (
          <dl className="metaGrid" aria-label="Tournament status">
            <div>
              <dt>Round</dt>
              <dd>{leaderboard.tournamentRound}</dd>
            </div>
            <div>
              <dt>Current cut</dt>
              <dd>{leaderboard.cutLine ?? "--"}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatTimestamp(leaderboard.generatedAt)}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      {error ? (
        <section className="notice errorNotice" role="alert">
          <strong>Leaderboard unavailable.</strong>
          <span>{error}</span>
        </section>
      ) : null}

      {leaderboard?.warnings.length ? (
        <section className="notice" aria-label="Configuration warnings">
          <strong>Check picks:</strong>
          <span>{leaderboard.warnings.join(" ")}</span>
        </section>
      ) : null}

      {leaderboard ? (
        <Leaderboard rows={leaderboard.rows} />
      ) : null}
    </main>
  );
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  }).format(new Date(value));
}
