import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
	if (!fs.existsSync(filePath)) return;
	const content = fs.readFileSync(filePath, "utf8");
	for (const rawLine of content.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		const eq = line.indexOf("=");
		if (eq === -1) continue;
		const key = line.slice(0, eq).trim();
		let value = line.slice(eq + 1).trim();
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		if (!process.env[key]) process.env[key] = value;
	}
}

loadEnvFile(path.resolve(".env"));
loadEnvFile(path.resolve(".env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRole) {
	console.error("Missing env vars. Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });

const DEMO_USERS = [
	{ key: "userA", email: "demo.alex@lostfound.dev", password: "DemoPass123!", name: "Alex Rivera", phone_number: "+18608940138", age: 24, likes: "Coffee shops, indie music, bookstores, long walks", dislikes: "Loud clubs, rushing", profile_picture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600" },
	{ key: "userB", email: "demo.sam@lostfound.dev", password: "DemoPass123!", name: "Sam Patel", phone_number: "+12244715171", age: 25, likes: "Cycling, live music, cafes, kayaking", dislikes: "Crowds, late nights", profile_picture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600" },
	{ key: "userC", email: "demo.jordan@lostfound.dev", password: "DemoPass123!", name: "Jordan Lee", phone_number: "+16402300381", age: 23, likes: "Reading, volleyball, coffee, acoustic music", dislikes: "Early mornings", profile_picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600" },
];

function pointWkt(lng, lat) {
	return `SRID=4326;POINT(${lng} ${lat})`;
}

function toIsoNoMs(date) {
	return new Date(date.getTime() - date.getMilliseconds()).toISOString();
}

function buildDemoMoments(userIdByKey) {
	const now = new Date();
	const base = new Date(now.getTime() - 10 * 60 * 1000);

	return [
		{ user_id: userIdByKey.userA, event_time: toIsoNoMs(new Date(base.getTime() + 2 * 60 * 1000)), description: "I saw someone at Small World Coffee in Princeton around sunset. We both reached for the door at the same time, laughed, and talked briefly about the live music nearby.", location: pointWkt(-74.6595, 40.3493) },
		{ user_id: userIdByKey.userB, event_time: toIsoNoMs(new Date(base.getTime() + 4 * 60 * 1000)), description: "At a coffee shop near Nassau Street, I met someone while holding the door and we had a quick conversation about a music set in town before heading different directions.", location: pointWkt(-74.6592, 40.3491) },
	];
}

let extractor = null;
async function embed(text) {
	if (!extractor) {
		extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
	}
	const output = await extractor(text, { pooling: "mean", normalize: true });
	return Array.from(output.data);
}

async function findUserByEmail(email) {
	let page = 1;
	while (page <= 20) {
		const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
		if (error) throw error;
		const found = data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
		if (found) return found;
		if (data.users.length < 200) break;
		page += 1;
	}
	return null;
}

async function ensureAuthUser(user) {
	const { data, error } = await supabase.auth.admin.createUser({ email: user.email, password: user.password, email_confirm: true, user_metadata: { name: user.name } });

	if (!error && data.user) return data.user;

	const existing = await findUserByEmail(user.email);
	if (existing) return existing;

	throw error || new Error(`Failed to create or find auth user for ${user.email}`);
}

async function upsertProfile(authUserId, profile) {
	const { error } = await supabase.from("users").upsert({ id: authUserId, name: profile.name, email: profile.email, phone_number: profile.phone_number, age: profile.age, likes: profile.likes, dislikes: profile.dislikes, profile_picture: profile.profile_picture }, { onConflict: "id" });

	if (error) throw error;
}

async function resetDemoData(userIds) {
	const { data: demoMoments, error: momentsError } = await supabase.from("moments").select("id").in("user_id", userIds);
	if (momentsError) throw momentsError;

	const momentIds = (demoMoments || []).map((m) => m.id);

	if (momentIds.length > 0) {
		const { error: delMatchesByMomentErr } = await supabase.from("matches").delete().in("moment_a_id", momentIds);
		if (delMatchesByMomentErr) throw delMatchesByMomentErr;

		const { error: delMatchesByMomentBErr } = await supabase.from("matches").delete().in("moment_b_id", momentIds);
		if (delMatchesByMomentBErr) throw delMatchesByMomentBErr;

		const { error: delConfirmByMomentErr } = await supabase.from("confirmations").delete().in("moment_a_id", momentIds);
		if (delConfirmByMomentErr) throw delConfirmByMomentErr;

		const { error: delConfirmByMomentBErr } = await supabase.from("confirmations").delete().in("moment_b_id", momentIds);
		if (delConfirmByMomentBErr) throw delConfirmByMomentBErr;
	}

	const { error: delMatchesByUserErr } = await supabase.from("matches").delete().in("user_a_id", userIds);
	if (delMatchesByUserErr) throw delMatchesByUserErr;
	const { error: delMatchesByUserBErr } = await supabase.from("matches").delete().in("user_b_id", userIds);
	if (delMatchesByUserBErr) throw delMatchesByUserBErr;

	const { error: delConfirmByUserErr } = await supabase.from("confirmations").delete().in("user_a_id", userIds);
	if (delConfirmByUserErr) throw delConfirmByUserErr;
	const { error: delConfirmByUserBErr } = await supabase.from("confirmations").delete().in("user_b_id", userIds);
	if (delConfirmByUserBErr) throw delConfirmByUserBErr;

	const { error: delMomentsErr } = await supabase.from("moments").delete().in("user_id", userIds);
	if (delMomentsErr) throw delMomentsErr;
}

async function seedDemoMoments(userIdByKey) {
	const moments = buildDemoMoments(userIdByKey);
	const rows = [];

	for (const m of moments) {
		const description_embedding = await embed(m.description);
		rows.push({ user_id: m.user_id, event_time: m.event_time, description: m.description, location: m.location, description_embedding });
	}

	const { data, error } = await supabase.from("moments").insert(rows).select("id,user_id,event_time,description");
	if (error) throw error;
	return data || [];
}

async function ensureDemoUsers() {
	const userIdByKey = {};
	for (const user of DEMO_USERS) {
		const authUser = await ensureAuthUser(user);
		await upsertProfile(authUser.id, user);
		userIdByKey[user.key] = authUser.id;
	}
	return userIdByKey;
}

async function run() {
	const mode = (process.argv[2] || "seed").toLowerCase();

	const userIdByKey = await ensureDemoUsers();
	const userIds = Object.values(userIdByKey);

	await resetDemoData(userIds);

	if (mode === "reset") {
		console.log("Demo data reset complete.");
		return;
	}

	const insertedMoments = await seedDemoMoments(userIdByKey);

	console.log("Demo data seeded successfully.");
	console.log("Demo users:");
	for (const u of DEMO_USERS) {
		console.log(`- ${u.email} / ${u.password} (${u.name})`);
	}

	console.log("Inserted moments (2 expected):");
	for (const m of insertedMoments) {
		console.log(`- ${m.id} by ${m.user_id} at ${m.event_time}`);
	}

	console.log("Use the third user (demo.jordan@lostfound.dev) to create a new moment during the demo.");
}

run().catch((err) => {
	console.error("Demo seed/reset failed:", err.message || err);
	process.exit(1);
});
