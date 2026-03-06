const MAX_TAG_COUNT = 8;
const MAX_TAG_LENGTH = 24;

function normalizeTag(tag: string): string {
	return tag.trim().toLowerCase();
}

function areSimplePluralVariants(left: string, right: string): boolean {
	return `${left}s` === right || `${right}s` === left;
}

export function parseBookmarkTags(input: string): string[] {
	const tags = input
		.split(",")
		.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0);
	const seen = new Set<string>();
	const deduped: string[] = [];

	for (const tag of tags) {
		const key = normalizeTag(tag);
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		deduped.push(tag);
	}

	return deduped;
}

export function validateBookmarkTags(tags: readonly string[]): string | null {
	if (tags.length === 0) {
		return "Add at least one tag.";
	}

	if (tags.length > MAX_TAG_COUNT) {
		return "Use up to 8 tags per tweet.";
	}

	const normalizedTags = tags.map((tag) => normalizeTag(tag));

	for (let index = 0; index < tags.length; index += 1) {
		const normalizedTag = normalizedTags[index];
		if (normalizedTag.length === 0) {
			return "Add at least one tag.";
		}

		if (normalizedTag.length > MAX_TAG_LENGTH) {
			return "Each tag must be 24 characters or fewer.";
		}

		for (let compareIndex = index + 1; compareIndex < normalizedTags.length; compareIndex += 1) {
			const compareTag = normalizedTags[compareIndex];
			if (compareTag === normalizedTag || areSimplePluralVariants(normalizedTag, compareTag)) {
				return 'Tags must be unique, including simple singular/plural pairs like "agent" and "agents".';
			}
		}
	}

	return null;
}
