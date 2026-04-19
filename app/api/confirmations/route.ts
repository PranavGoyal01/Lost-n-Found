// app/api/confirmations/route.ts

import { sendPhoneNotification } from "@/lib/photon";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

type UserContact = { id: string; name: string | null; phone_number: string | null };

async function getUserContact(userId: string): Promise<UserContact | null> {
	const { data } = await supabase.from("users").select("id, name, phone_number").eq("id", userId).single();

	return data;
}

async function notifyIfPhoneExists(phoneNumber: string | null, message: string) {
	if (!phoneNumber) return;

	try {
		await sendPhoneNotification(phoneNumber, message);
	} catch (error) {
		console.error("Photon notification failed:", error);
	}
}

export async function POST(req: NextRequest) {
	const token = req.headers.get("Authorization")?.replace("Bearer ", "");
	const {
		data: { user },
	} = await supabase.auth.getUser(token);
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { current_post_id, other_post_id } = await req.json();

	// 1. Verify similarity > 0.7 still holds
	// 2. Check pending confirmation
	const { data: existing } = await supabase.from("confirmations").select("*").or(`moment_a_id.eq.${current_post_id},moment_b_id.eq.${current_post_id}`).single();

	if (existing) {
		// Write true on their side
		const isUserA = existing.user_a_id === user.id;
		await supabase
			.from("confirmations")
			.update({ [isUserA ? "user_a_confirmed" : "user_b_confirmed"]: true })
			.eq("id", existing.id);

		// If both true, create Match
		const { data: updated } = await supabase.from("confirmations").select("*").eq("id", existing.id).single();
		if (updated?.user_a_confirmed && updated?.user_b_confirmed) {
			await supabase.from("matches").insert([{ user_a_id: updated.user_a_id, user_b_id: updated.user_b_id, moment_a_id: updated.moment_a_id, moment_b_id: updated.moment_b_id }]);

			const [userA, userB] = await Promise.all([getUserContact(updated.user_a_id), getUserContact(updated.user_b_id)]);

			const userAName = userA?.name?.trim() || "Someone";
			const userBName = userB?.name?.trim() || "Someone";

			await Promise.all([notifyIfPhoneExists(userA?.phone_number ?? null, `Lost n Found: ${userBName} confirmed your moment match. You are now connected.`), notifyIfPhoneExists(userB?.phone_number ?? null, `Lost n Found: ${userAName} confirmed your moment match. You are now connected.`)]);
		}
	} else {
		// Fetch the other user's ID
		const { data: otherPost } = await supabase.from("moments").select("user_id").eq("id", other_post_id).single();

		const { data: created } = await supabase
			.from("confirmations")
			.insert([
				{
					user_a_id: user.id,
					user_b_id: otherPost?.user_id,
					moment_a_id: current_post_id,
					moment_b_id: other_post_id,
					user_a_confirmed: true,
					confidence_score: 0.85, // Mocked score
				},
			])
			.select("*")
			.single();

		if (created?.user_a_id && created?.user_b_id) {
			const [requester, recipient] = await Promise.all([getUserContact(created.user_a_id), getUserContact(created.user_b_id)]);

			const requesterName = requester?.name?.trim() || "Someone";

			await notifyIfPhoneExists(recipient?.phone_number ?? null, `Lost n Found: ${requesterName} thinks your moments match. Open the app to confirm this connection.`);
		}
	}
	return NextResponse.json({ success: true });
}
