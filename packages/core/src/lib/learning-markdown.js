export function renderAnalysisMarkdown(analysis) {
    return ["## Topic", analysis.topic, "", "## Summary", analysis.summary, "", "## Intent", analysis.intent].join("\n");
}
export function renderConceptAssessmentMarkdown(concepts) {
    const rows = concepts.map((item) => {
        return [
            `### ${item.rank}. ${item.concept.name}`,
            `- Why it matters: ${item.concept.whyItMattersInTweet}`,
            `- Familiarity: ${item.familiarity}/5`,
            `- Interest: ${item.interest}/5`,
            `- Novelty: ${item.novelty.toFixed(1)}`,
            `- Priority score: ${item.priority.toFixed(2)}`,
        ].join("\n");
    });
    return ["## Novel Concepts Assessment", ...rows].join("\n\n");
}
export function renderLearningTrackMarkdown(track) {
    const daySections = track.days.map((day) => {
        return [
            `### Day ${day.day}: ${day.title}`,
            `- Focus: ${day.focus}`,
            `- Time budget: ${day.minutes} minutes`,
            `- Learn: ${day.tasks.learn}`,
            `- Explain: ${day.tasks.explain}`,
            `- Check: ${day.tasks.check}`,
        ].join("\n");
    });
    return [`## 7-Day Feynman Learning Track (${track.minutesPerDay} min/day)`, ...daySections].join("\n\n");
}
