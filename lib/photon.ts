import { Spectrum, text } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

let spectrumInstance: Awaited<ReturnType<typeof Spectrum>> | null = null;

function getPhotonCredentials() {
  return {
    projectId: process.env.PHOTON_PROJECT_ID,
    projectSecret: process.env.PHOTON_API_KEY,
  };
}

function normalizePhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }

  return `+${trimmed.replace(/\D/g, "")}`;
}

async function getSpectrumClient() {
  if (spectrumInstance) {
    return spectrumInstance;
  }

  const { projectId, projectSecret } = getPhotonCredentials();
  if (!projectId || !projectSecret) {
    throw new Error("Photon credentials are not configured");
  }

  spectrumInstance = await Spectrum({
    projectId,
    projectSecret,
    providers: [imessage.config()],
  });

  return spectrumInstance;
}

export async function sendPhoneNotification(phoneNumber: string, message: string) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone || normalizedPhone === "+") {
    throw new Error("Invalid phone number");
  }

  const spectrum = await getSpectrumClient();
  const iMessage = imessage(spectrum);

  const recipient = await iMessage.user(normalizedPhone);
  const space = await iMessage.space([recipient]);
  await space.send(text(message));
}
