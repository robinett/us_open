import { NextResponse } from "next/server";
import { getPoolLeaderboard } from "@/lib/usga";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leaderboard = await getPoolLeaderboard();
    return NextResponse.json(leaderboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown leaderboard error";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
