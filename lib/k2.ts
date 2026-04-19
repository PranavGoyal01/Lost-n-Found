type K2DateIdeaInput = { userAProfile: string; userBProfile: string; commonMeetingLocation: string; locationContext: string };

function sanitizeK2DateIdea(content: string): string | null {
	const compact = content.replace(/\s+/g, " ").trim();
	if (!compact) return null;

	// If the model echoes prompt scaffolding, discard it and let caller fallback.
	const looksLikePromptEcho = [
		"you are planning one concise first-date idea",
		"return only one sentence",
		"person a profile:",
		"person b profile:",
		"common meeting location:",
		"location context from both moments:",
	].some((marker) => compact.toLowerCase().includes(marker));

	if (looksLikePromptEcho) return null;

	const firstSentence = compact.match(/^[^.!?]+[.!?]?/)?.[0]?.trim() || compact;
	const cleaned = firstSentence.replace(/^['"`\s]+|['"`\s]+$/g, "").trim();

	if (!cleaned) return null;
	if (cleaned.length < 20 || cleaned.length > 220) return null;

	return cleaned;
}

function getK2Config() {
	return { apiKey: process.env.K2_THINK_V2_API_KEY, apiUrl: process.env.K2_THINK_V2_API_URL || "https://api.k2think.ai/v1/chat/completions", model: process.env.K2_THINK_V2_MODEL || "MBZUAI-IFM/K2-Think-v2" };
}

function toChatCompletionsUrl(url: string): string {
	const trimmed = url.trim().replace(/\/+$/, "");
	if (trimmed.endsWith("/chat/completions")) {
		return trimmed;
	}

	if (trimmed.endsWith("/v1")) {
		return `${trimmed}/chat/completions`;
	}

	return `${trimmed}/v1/chat/completions`;
}

export async function generateIdealDateFromK2(input: K2DateIdeaInput): Promise<string | null> {
	const { apiKey, apiUrl, model } = getK2Config();
	if (!apiKey) {
		return null;
	}

	const completionsUrl = toChatCompletionsUrl(apiUrl);

	const prompt = ["You are planning one concise first-date idea for two people who just matched.", "Use BOTH full profiles and the moment location data.", "The date should be realistic and near the provided common meeting area.", "Return only one sentence, no bullets, no labels.", `Person A profile: ${input.userAProfile}`, `Person B profile: ${input.userBProfile}`, `Common meeting location: ${input.commonMeetingLocation}`, `Location context from both moments: ${input.locationContext}`].join("\n");

	try {
		const response = await fetch(completionsUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
			body: JSON.stringify({
				model,
				messages: [
					{ role: "system", content: "You generate thoughtful but practical date ideas." },
					{ role: "user", content: prompt },
				],
				temperature: 0.4,
				max_tokens: 80,
				stop: ["\n"],
			}),
		});

		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };

		const content = data.choices?.[0]?.message?.content?.trim();
		if (!content) {
			return null;
		}

		return sanitizeK2DateIdea(content);
	} catch {
		return null;
	}
}
