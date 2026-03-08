"use client";

import { Agentation } from "agentation";

const agentationEndpoint = process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT;

export function AgentationDevtools() {
	if (process.env.NODE_ENV !== "development") {
		return null;
	}

	if (agentationEndpoint) {
		return <Agentation endpoint={agentationEndpoint} />;
	}

	return <Agentation />;
}
