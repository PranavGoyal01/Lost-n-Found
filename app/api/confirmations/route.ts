// app/api/confirmations/route.ts

import { PhotonSendError, sendPhoneNotification } from "@/lib/photon";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type UserContact = { id: string; name: string | null; phone_number: string | null };

async function getUserContact(userId: string): Promise<UserContact | null> {
	const { data } = await supabase.from("users").select("id, name, phone_number").eq("id", userId).single();

	return data;
}

async function notifyUser(contact: UserContact | null, message: string) {
	if (!contact) return;
	if (!contact.phone_number?.trim()) {
		console.warn(`Notification skipped for user ${contact.id}: missing phone_number in users table.`);
		return;
	}

	try {
		await sendPhoneNotification(contact.phone_number, message);
	} catch (error) {
		if (error instanceof PhotonSendError && error.reason === "target_not_allowed") {
			console.warn(`Photon phone target not allowed for user ${contact.id}. ${error.message}`);
			return;
		}

		console.error("Photon notification failed:", error);
	}
}

export async function POST(req: NextRequest) {
	const token = req.headers.get("Authorization")?.replace("Bearer ", "");
	if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Use an authenticated Supabase client so RLS can evaluate the current user.
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
	const supabaseAuthenticated = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: `Bearer ${token}` } } });

	const {
		data: { user },
		error: authError,
	} = await supabaseAuthenticated.auth.getUser();
	if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { current_post_id, other_post_id } = await req.json();

	// 1. Fetch any confirmations involving the current post
	const { data: existingRecords, error: fetchError } = await supabaseAuthenticated.from("confirmations").select("*").or(`moment_a_id.eq.${current_post_id},moment_b_id.eq.${current_post_id}`);

	if (fetchError) {
		console.error("Error fetching confirmations:", fetchError);
		return NextResponse.json({ error: fetchError.message }, { status: 500 });
	}

	// 2. Find the exact interaction in JS
	const existing = existingRecords?.find((c) => c.moment_a_id === other_post_id || c.moment_b_id === other_post_id);

	if (existing) {
		// Write true on their side
		const isUserA = existing.user_a_id === user.id;
		await supabaseAuthenticated
			.from("confirmations")
			.update({ [isUserA ? "user_a_confirmed" : "user_b_confirmed"]: true })
			.eq("id", existing.id);

		// If both true, create Match
		const { data: updated } = await supabaseAuthenticated.from("confirmations").select("*").eq("id", existing.id).single();
		if (updated?.user_a_confirmed && updated?.user_b_confirmed) {
			await supabaseAuthenticated.from("matches").insert([{ user_a_id: updated.user_a_id, user_b_id: updated.user_b_id, moment_a_id: updated.moment_a_id, moment_b_id: updated.moment_b_id }]);

			const [userA, userB] = await Promise.all([getUserContact(updated.user_a_id), getUserContact(updated.user_b_id)]);

			const userAName = userA?.name?.trim() || "Someone";
			const userBName = userB?.name?.trim() || "Someone";

			await Promise.all([notifyUser(userA, `Lost n Found: ${userBName} confirmed your moment match. You are now connected.`), notifyUser(userB, `Lost n Found: ${userAName} confirmed your moment match. You are now connected.`)]);
		}
	} else {
		// Fetch the other user's ID
		const { data: otherPost } = await supabaseAuthenticated.from("moments").select("user_id").eq("id", other_post_id).single();

		const { data: created } = await supabaseAuthenticated
			.from("confirmations")
			.insert([{ user_a_id: user.id, user_b_id: otherPost?.user_id, moment_a_id: current_post_id, moment_b_id: other_post_id, user_a_confirmed: true, confidence_score: 0.85 }])
			.select("*")
			.single();

		if (created?.user_a_id && created?.user_b_id) {
			const [requester, recipient] = await Promise.all([getUserContact(created.user_a_id), getUserContact(created.user_b_id)]);
			const requesterName = requester?.name?.trim() || "Someone";

			await notifyUser(recipient, `Lost n Found: ${requesterName} thinks your moments match. Open the app to confirm this connection.`);
		}
	}

	return NextResponse.json({ success: true });
}
