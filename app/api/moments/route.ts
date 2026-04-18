// app/api/moments/route.ts
// app/api/moments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { vectorizeString } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { description, date, time } = await req.json();
  const event_time = `${date}T${time}:00Z`;

  const embedding = await vectorizeString(description);

  // 1. Fetch matches (Bump count to 15 to account for the ones we filter out)
  const { data: similar } = await supabase.rpc("match_moments", {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 15, 
  });

  // 2. Fetch moments this user has already confirmed/acted upon
  const { data: pastConfirmations } = await supabase
    .from("confirmations")
    .select("moment_a_id, moment_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  // Create a quick lookup Set of those IDs
  const actedMomentIds = new Set<string>();
  pastConfirmations?.forEach(c => {
    if (c.moment_a_id) actedMomentIds.add(c.moment_a_id);
    if (c.moment_b_id) actedMomentIds.add(c.moment_b_id);
  });

  // 3. Filter out the user's own posts AND posts they've already matched with
  const freshMatches = similar 
    ? similar.filter((match: { id: string; user_id: string }) => {
        const isNotMine = match.user_id !== user.id;
        const isNotAlreadyConfirmed = !actedMomentIds.has(match.id);
        return isNotMine && isNotAlreadyConfirmed;
      })
    : [];

  const { data: newMoment } = await supabase
    .from("moments")
    .insert([
      {
        user_id: user.id,
        event_time,
        description,
        description_embedding: embedding,
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
