import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const allowedFields = new Set([
  "home_score",
  "away_score",
  "period",
  "clock_seconds",
  "clock_running",
  "clock_started_at",
  "possession",
  "down",
  "distance",
  "yard_side",
  "yard_line",
  "last_play",
  "drive_plays",
  "drive_yards",
  "drive_seconds",
  "status",
  "stream_url",
]);

export async function PATCH(request: NextRequest) {
  const suppliedPin = request.headers.get("x-admin-pin") || "";
  const expectedPin = process.env.SETN_ADMIN_PIN || "";

  if (!expectedPin || suppliedPin !== expectedPin) {
    return NextResponse.json({ error: "Invalid admin PIN." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Server Supabase variables are missing." }, { status: 500 });
  }

  const body = await request.json();
  const gameId = body?.gameId;
  const rawPatch = body?.patch;

  if (!gameId || !rawPatch || typeof rawPatch !== "object") {
    return NextResponse.json({ error: "gameId and patch are required." }, { status: 400 });
  }

  const safePatch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawPatch)) {
    if (allowedFields.has(key)) safePatch[key] = value;
  }

  if (Object.keys(safePatch).length === 0) {
    return NextResponse.json({ error: "No allowed fields supplied." }, { status: 400 });
  }

  safePatch.updated_at = new Date().toISOString();

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin
    .from("games")
    .update(safePatch)
    .eq("id", gameId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ game: data });
}
