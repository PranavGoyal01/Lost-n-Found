// app/api/confirmations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ✨ THE FIX: Create an authenticated client so Postgres knows who you are
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseAuthenticated = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabaseAuthenticated.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { current_post_id, other_post_id } = await req.json();

  // 1. Fetch any confirmations involving the current post
  const { data: existingRecords, error: fetchError } =
    await supabaseAuthenticated
      .from("confirmations")
      .select("*")
      .or(
        `moment_a_id.eq.${current_post_id},moment_b_id.eq.${current_post_id}`,
      );

  if (fetchError) {
    console.error("Error fetching confirmations:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // 2. Find the exact interaction in JS
  const existing = existingRecords?.find(
    (c) => c.moment_a_id === other_post_id || c.moment_b_id === other_post_id,
  );

  if (existing) {
    const isUserA = existing.user_a_id === user.id;

    // Just write true to our side. The database trigger will handle the rest!
    const { error: updateError } = await supabaseAuthenticated
      .from("confirmations")
      .update({ [isUserA ? "user_a_confirmed" : "user_b_confirmed"]: true })
      .eq("id", existing.id);

    if (updateError) throw updateError;
  } else {
    // 3. Create new confirmation
    const { data: otherPost } = await supabaseAuthenticated
      .from("moments")
      .select("user_id")
      .eq("id", other_post_id)
      .single();

    const { error: insertError } = await supabaseAuthenticated
      .from("confirmations")
      .insert([
        {
          user_a_id: user.id,
          user_b_id: otherPost?.user_id,
          moment_a_id: current_post_id,
          moment_b_id: other_post_id,
          user_a_confirmed: true,
          confidence_score: 0.85,
        },
      ]);

    if (insertError) {
      console.error("CRITICAL CONFIRMATION INSERT ERROR:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
