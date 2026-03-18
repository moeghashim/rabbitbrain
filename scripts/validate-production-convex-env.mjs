import fs from "node:fs";

function readRequiredEnv(name, env) {
	const value = env[name];
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value.trim();
}

function parseEnvFile(filePath) {
	const source = fs.readFileSync(filePath, "utf8");
	const env = {};
	for (const line of source.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}
		const equalsIndex = trimmed.indexOf("=");
		if (equalsIndex < 0) {
			continue;
		}
		const key = trimmed.slice(0, equalsIndex).trim();
		let value = trimmed.slice(equalsIndex + 1).trim();
		if (value.startsWith('"') && value.endsWith('"')) {
			value = value.slice(1, -1);
		}
		env[key] = value;
	}
	return env;
}

function main() {
	const filePath = process.argv[2] ?? ".vercel/.env.production.local";
	const env = parseEnvFile(filePath);
	const deployment = readRequiredEnv("CONVEX_DEPLOYMENT", env);
	const convexUrl = readRequiredEnv("NEXT_PUBLIC_CONVEX_URL", env);

	if (deployment.startsWith("dev:")) {
		throw new Error(
			`Invalid production Convex deployment target in ${filePath}: ${deployment}. Production must not use a dev deployment.`,
		);
	}

	const deploymentName = deployment.includes(":") ? deployment.slice(deployment.indexOf(":") + 1) : deployment;
	if (!convexUrl.includes(`${deploymentName}.`)) {
		throw new Error(`Convex URL/deployment mismatch in ${filePath}: deployment=${deployment}, url=${convexUrl}`);
	}

	console.log(`Validated production Convex target: ${deploymentName}`);
}

try {
	main();
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}
