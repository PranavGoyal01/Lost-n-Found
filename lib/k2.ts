type K2DateIdeaInput = { userALikes: string; userBLikes: string; locationContext: string };

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

	const prompt = ["You are planning one concise first-date idea for two people.", "Use their likes and where the moment happened.", "Return only one sentence, no bullets, no labels.", `Person A likes: ${input.userALikes}`, `Person B likes: ${input.userBLikes}`, `Moment location context: ${input.locationContext}`].join("\n");

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
				temperature: 0.7,
				max_tokens: 120,
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

		return content.replace(/\s+/g, " ").trim();
	} catch {
		return null;
	}
}
