import { Spectrum, text } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

let spectrumInstance: Awaited<ReturnType<typeof Spectrum>> | null = null;

export class PhotonSendError extends Error {
	readonly reason: "target_not_allowed" | "send_failed";

	constructor(reason: "target_not_allowed" | "send_failed", message: string) {
		super(message);
		this.reason = reason;
	}
}

function getPhotonCredentials() {
	return { projectId: process.env.PHOTON_PROJECT_ID, projectSecret: process.env.PHOTON_API_KEY };
}

function maskProjectId(projectId: string | undefined): string {
	if (!projectId) return "unknown";
	if (projectId.length <= 8) return projectId;
	return `${projectId.slice(0, 4)}...${projectId.slice(-4)}`;
}

function normalizePhoneNumber(phone: string): string {
	const trimmed = phone.trim();
	if (trimmed.startsWith("+")) {
		return `+${trimmed.slice(1).replace(/\D/g, "")}`;
	}

	const digits = trimmed.replace(/\D/g, "");
	if (!digits) return "+";

	// Common case for this app: US/Canada local input like 8608940138.
	if (digits.length === 10) {
		return `+1${digits}`;
	}

	// NANP with explicit country code but no plus.
	if (digits.length === 11 && digits.startsWith("1")) {
		return `+${digits}`;
	}

	// International prefix 00XXXXXXXX -> +XXXXXXXX
	if (digits.startsWith("00") && digits.length > 2) {
		return `+${digits.slice(2)}`;
	}

	return `+${digits}`;
}

function isTargetNotAllowedError(error: unknown): boolean {
	if (!(error instanceof Error)) return false;

	const message = error.message.toLowerCase();
	const maybeCause = (error as Error & { cause?: { details?: string } }).cause;
	const causeDetails = maybeCause?.details?.toLowerCase() ?? "";

	return message.includes("target not allowed") || causeDetails.includes("target not allowed");
}

function getCandidateAddresses(rawPhone: string, normalizedPhone: string): string[] {
	const rawDigits = rawPhone.replace(/\D/g, "");
	const candidates = [normalizedPhone, `tel:${normalizedPhone}`];

	// Try non-country-code variant when users type a 10-digit local number.
	if (rawDigits.length === 10) {
		const localE164 = `+${rawDigits}`;
		candidates.push(localE164, `tel:${localE164}`);
	}

	// Try leading-country-code variant without plus, e.g. 18608940138.
	if (rawDigits.length === 11 && rawDigits.startsWith("1")) {
		candidates.push(rawDigits, `tel:${rawDigits}`);
	}

	return Array.from(new Set(candidates));
}

async function getSpectrumClient() {
	if (spectrumInstance) {
		return spectrumInstance;
	}

	const { projectId, projectSecret } = getPhotonCredentials();
	if (!projectId || !projectSecret) {
		throw new Error("Photon credentials are not configured");
	}

	spectrumInstance = await Spectrum({ projectId, projectSecret, providers: [imessage.config()] });

	return spectrumInstance;
}

export async function sendPhoneNotification(phoneNumber: string, message: string) {
	const normalizedPhone = normalizePhoneNumber(phoneNumber);
	if (!normalizedPhone || normalizedPhone === "+") {
		throw new Error("Invalid phone number");
	}

	const candidateAddresses = getCandidateAddresses(phoneNumber, normalizedPhone);
	if (candidateAddresses.length === 0) {
		throw new Error("Invalid phone number");
	}

	const spectrum = await getSpectrumClient();
	const iMessage = imessage(spectrum);

	const primaryTarget = candidateAddresses[0] ?? normalizedPhone;

	let lastError: unknown;
	let sawTargetNotAllowed = false;

	for (const address of candidateAddresses) {
		try {
			const recipient = await iMessage.user(address);
			const space = await iMessage.space([recipient]);
			await space.send(text(message));
			return;
		} catch (error) {
			lastError = error;
			if (isTargetNotAllowedError(error)) {
				sawTargetNotAllowed = true;
				continue;
			}
			throw new PhotonSendError("send_failed", `Photon send failed for ${primaryTarget}`);
		}
	}

	if (sawTargetNotAllowed) {
		const { projectId } = getPhotonCredentials();
		const projectHint = maskProjectId(projectId);
		throw new PhotonSendError("target_not_allowed", `Photon project (${projectHint}) does not allow recipient ${primaryTarget}. Tried: ${candidateAddresses.join(", ")}`);
	}

	throw new PhotonSendError("send_failed", `Photon send failed for ${normalizedPhone}: ${String(lastError)}`);
}
