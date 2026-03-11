import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function deriveKey(secret: string): Buffer {
	return createHash("sha256").update(secret).digest();
}

function readSecretKey(env: NodeJS.ProcessEnv = process.env): string {
	const value = env.USER_SECRETS_ENCRYPTION_KEY;
	if (!value || value.trim().length === 0) {
		throw new Error("Missing required environment variable: USER_SECRETS_ENCRYPTION_KEY");
	}
	return value.trim();
}

export function encryptSecret(secret: string, env: NodeJS.ProcessEnv = process.env): string {
	const iv = randomBytes(12);
	const key = deriveKey(readSecretKey(env));
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string, env: NodeJS.ProcessEnv = process.env): string {
	const buffer = Buffer.from(payload, "base64");
	const iv = buffer.subarray(0, 12);
	const authTag = buffer.subarray(12, 28);
	const encrypted = buffer.subarray(28);
	const key = deriveKey(readSecretKey(env));
	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(authTag);
	return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function buildKeyHint(apiKey: string): string {
	const trimmed = apiKey.trim();
	if (trimmed.length <= 4) {
		return "••••";
	}
	return `••••${trimmed.slice(-4)}`;
}
