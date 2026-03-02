import type { PrioritizedConcept } from "./concept-assessment.js";

export interface LearningTrackTaskSet {
	learn: string;
	explain: string;
	check: string;
}

export interface LearningTrackDay {
	day: number;
	title: string;
	focus: string;
	minutes: number;
	tasks: LearningTrackTaskSet;
}

export interface LearningTrack {
	minutesPerDay: number;
	days: LearningTrackDay[];
}

const MINUTES_PER_DAY = 10;

function dayForConcept(day: number, conceptName: string, conceptContext: string): LearningTrackDay {
	return {
		day,
		title: `${conceptName}: Learn, Explain, Check`,
		focus: conceptName,
		minutes: MINUTES_PER_DAY,
		tasks: {
			learn: `Read a short source on ${conceptName} and extract one key mechanism relevant to this tweet context: ${conceptContext}.`,
			explain: `In plain language, teach ${conceptName} in 4-6 sentences to a beginner with no jargon.`,
			check: `Write one question that tests your understanding of ${conceptName}, then answer it from memory.`,
		},
	};
}

export function buildFeynmanTrack(prioritizedConcepts: PrioritizedConcept[]): LearningTrack {
	if (prioritizedConcepts.length < 5) {
		throw new Error(
			`At least 5 prioritized concepts are required to build the track, got ${prioritizedConcepts.length}.`,
		);
	}

	const topFive = prioritizedConcepts.slice(0, 5);
	const conceptDays = topFive.map((item, index) =>
		dayForConcept(index + 1, item.concept.name, item.concept.whyItMattersInTweet),
	);

	const synthesisFocus = topFive.map((item) => item.concept.name).join(", ");
	const daySix: LearningTrackDay = {
		day: 6,
		title: "Synthesis Across Concepts",
		focus: synthesisFocus,
		minutes: MINUTES_PER_DAY,
		tasks: {
			learn: `Map how these concepts interact in the tweet's idea: ${synthesisFocus}.`,
			explain:
				"Create a single beginner-friendly explanation that connects all five concepts as one coherent story.",
			check: "List two gaps or weak spots in your explanation and note one concrete fix for each.",
		},
	};

	const daySeven: LearningTrackDay = {
		day: 7,
		title: "Teach-Back and Gap Closure",
		focus: "Full teach-back",
		minutes: MINUTES_PER_DAY,
		tasks: {
			learn: "Review your notes from days 1-6 and select the two hardest ideas to reinforce.",
			explain: "Deliver a full 90-second teach-back that covers all concepts and the tweet's core claim.",
			check: "Score your teach-back (clarity, correctness, confidence) from 1-5 and write one improvement for tomorrow.",
		},
	};

	return {
		minutesPerDay: MINUTES_PER_DAY,
		days: [...conceptDays, daySix, daySeven],
	};
}
