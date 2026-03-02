import type { TweetLearningConcept } from "./tweet-analysis.js";

export interface ConceptRating {
	concept: TweetLearningConcept;
	familiarity: number;
	interest: number;
}

export interface PrioritizedConcept extends ConceptRating {
	novelty: number;
	priority: number;
	rank: number;
}

function assertRatingRange(value: number, field: "familiarity" | "interest", index: number): void {
	if (!Number.isInteger(value) || value < 1 || value > 5) {
		throw new Error(`Invalid concept rating at index ${index}: \`${field}\` must be an integer between 1 and 5.`);
	}
}

export function prioritizeConcepts(ratings: ConceptRating[]): PrioritizedConcept[] {
	const scored = ratings.map((rating, index) => {
		assertRatingRange(rating.familiarity, "familiarity", index);
		assertRatingRange(rating.interest, "interest", index);
		const novelty = 6 - rating.familiarity;
		const priority = novelty * 0.7 + rating.interest * 0.3;
		return {
			...rating,
			novelty,
			priority,
			rank: 0,
		};
	});

	scored.sort((left, right) => {
		if (right.priority !== left.priority) {
			return right.priority - left.priority;
		}
		return left.concept.name.localeCompare(right.concept.name);
	});

	return scored.map((item, index) => ({
		...item,
		rank: index + 1,
	}));
}
