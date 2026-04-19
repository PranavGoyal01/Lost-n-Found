// app/api/moments/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { vectorizeString } from "@/lib/ai";

function swapPronouns(text: string): string {
  const pronounMap: Record<string, string> = {
    i: "you",
    me: "you",
    my: "your",
    mine: "yours",
    myself: "yourself",
    you: "I", // 'you' could be object or subject, but 'I' is the safest semantic fallback
    your: "my",
    yours: "mine",
    yourself: "myself",
  };

  return text.replace(
    /\b(i|me|my|mine|myself|you|your|yours|yourself)\b/gi,
    (match) => {
      const lowerMatch = match.toLowerCase();
      const replacement = pronounMap[lowerMatch];

      // Preserve original capitalization
      if (match[0] === match[0].toUpperCase()) {
        if (match === "I") return "You";
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }

      return replacement;
    },
  );
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 🛡️ NEW: Check if the user has a profile picture
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("profile_picture")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.profile_picture) {
    return NextResponse.json(
      {
        error: "Profile picture required",
        code: "MISSING_PROFILE_PICTURE",
      },
      { status: 403 }, // 403 Forbidden is appropriate here
    );
  }

  const { description, date, time, latitude, longitude } = await req.json();
  const event_time = `${date}T${time}:00Z`;

  const hasValidLocation =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  // ✨ THE FIX: Format as a PostGIS EWKT (Extended Well-Known Text) string ✨
  // Note: PostGIS ALWAYS expects Longitude first, Latitude second!
  const location = hasValidLocation
    ? `SRID=4326;POINT(${Number(longitude)} ${Number(latitude)})`
    : null;

  // ✨ 1. Vectorize the RAW string to save to the database
  const rawEmbedding = await vectorizeString(description);

  // ✨ 2. Swap the pronouns and vectorize the SWAPPED string to use for searching
  const swappedDescription = swapPronouns(description);
  const searchEmbedding = await vectorizeString(swappedDescription);

  // 1. Fetch matches using the SWAPPED embedding
  const { data: similar, error: rpcError } = await supabase.rpc(
    "match_moments",
    {
      query_embedding: searchEmbedding, // ✨ Use the swapped one here!
      match_threshold: 0.7,
      match_count: 15,
      current_user_id: user.id,
      query_location: location,
      query_event_time: event_time,
    },
  );

  if (rpcError) {
    console.error("CRITICAL RPC ERROR:", rpcError);
  }

  // 2. Fetch moments this user has already confirmed/acted upon
  const { data: pastConfirmations } = await supabase
    .from("confirmations")
    .select("moment_a_id, moment_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  const actedMomentIds = new Set<string>();
  pastConfirmations?.forEach((c) => {
    if (c.moment_a_id) actedMomentIds.add(c.moment_a_id);
    if (c.moment_b_id) actedMomentIds.add(c.moment_b_id);
  });

  // 3. Filter out posts they've already matched with
  const freshMatches = similar
    ? similar.filter((match: { id: string; user_id: string }) => {
        return !actedMomentIds.has(match.id);
      })
    : [];

  // ✨ 4. Insert the moment using the RAW data
  const { data: newMoment } = await supabase
    .from("moments")
    .insert([
      {
        user_id: user.id,
        event_time,
        description, // Raw text
        description_embedding: rawEmbedding, // Raw embedding
        location,
      },
    ])
    .select()
    .single();

  // Return the fully filtered list
  if (freshMatches.length > 0) {
    return NextResponse.json({
      status: "similar_found",
      matches: freshMatches,
      moment: newMoment,
    });
  }

  return NextResponse.json({ status: "saved", moment: newMoment });
}

// ... GET route stays exactly the same

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: moments } = await supabase
    .from("moments")
    .select("*")
    .eq("user_id", user.id);
  return NextResponse.json(moments);
}
