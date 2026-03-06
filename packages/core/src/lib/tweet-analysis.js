function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function readRequiredString(value, field) {
    if (typeof value !== "string") {
        throw new Error(`Invalid analysis output: \`${field}\` must be a string.`);
    }
    const normalized = value.trim();
    if (!normalized) {
        throw new Error(`Invalid analysis output: \`${field}\` cannot be empty.`);
    }
    return normalized;
}
function parseJsonObject(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
        throw new Error("OpenAI API returned an empty analysis response.");
    }
    let candidate = trimmed;
    if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
        const newlineIndex = trimmed.indexOf("\n");
        if (newlineIndex > -1) {
            candidate = trimmed.slice(newlineIndex + 1, -3).trim();
        }
    }
    let parsed;
    try {
        parsed = JSON.parse(candidate);
    }
    catch {
        throw new Error("Invalid analysis output: expected JSON object from model response.");
    }
    if (!isRecord(parsed)) {
        throw new Error("Invalid analysis output: top-level JSON must be an object.");
    }
    return parsed;
}
export function parseTweetLearningAnalysisText(rawText) {
    const parsed = parseJsonObject(rawText);
    const topic = readRequiredString(parsed.topic, "topic");
    const summary = readRequiredString(parsed.summary, "summary");
    const intent = readRequiredString(parsed.intent, "intent");
    const conceptsValue = parsed.novelConcepts;
    if (!Array.isArray(conceptsValue)) {
        throw new Error("Invalid analysis output: `novelConcepts` must be an array.");
    }
    if (conceptsValue.length !== 5) {
        throw new Error(`Invalid analysis output: expected exactly 5 novel concepts, got ${conceptsValue.length}.`);
    }
    const novelConcepts = conceptsValue.map((concept, index) => {
        if (!isRecord(concept)) {
            throw new Error(`Invalid analysis output: concept at index ${index} must be an object.`);
        }
        return {
            name: readRequiredString(concept.name, `novelConcepts[${index}].name`),
            whyItMattersInTweet: readRequiredString(concept.whyItMattersInTweet, `novelConcepts[${index}].whyItMattersInTweet`),
        };
    });
    return {
        topic,
        summary,
        intent,
        novelConcepts,
    };
}
