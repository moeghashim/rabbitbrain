import React from "react";

import { AppWorkspaceNav } from "../../components/app-workspace-nav.js";
import { HeroTweetAnalyzer } from "../../components/hero-tweet-analyzer.js";

const recentAnalyses = [
	{ id: "analysis_2", topic: "Deployment confidence update", createdAt: "Today" },
	{ id: "analysis_1", topic: "Incident readiness reflection", createdAt: "Yesterday" },
];

const recentTracks = [
	{ id: "track_1", title: "Feynman Track: Deployment Confidence", progress: "Day 3 of 7" },
];

export default function AppHomePage() {
	return (
		<div className="min-h-screen bg-ink text-peach">
			<AppWorkspaceNav />
			<main className="px-6 pb-16 pt-10">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
					<section className="rounded-5xl border border-white/10 bg-charcoal/90 p-8">
						<h2 className="font-serif text-4xl text-white">Analyze Tweet</h2>
						<div className="mt-6">
							<HeroTweetAnalyzer showProviderSelector={false} showModelSelector={false} />
						</div>
					</section>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<section className="rounded-5xl border border-white/10 bg-charcoal/90 p-8">
							<h2 className="font-serif text-3xl text-white">Recent Analyses</h2>
							<ul className="mt-6 space-y-4">
								{recentAnalyses.map((analysis) => (
									<li key={analysis.id} className="rounded-4xl border border-white/10 bg-ink/70 p-5">
										<p className="text-xs uppercase tracking-widest text-coral">{analysis.createdAt}</p>
										<p className="mt-2 text-lg font-semibold text-white">{analysis.topic}</p>
									</li>
								))}
							</ul>
						</section>
						<section className="rounded-5xl border border-white/10 bg-charcoal/90 p-8">
							<h2 className="font-serif text-3xl text-white">Learning Tracks</h2>
							<ul className="mt-6 space-y-4">
								{recentTracks.map((track) => (
									<li key={track.id} className="rounded-4xl border border-white/10 bg-ink/70 p-5">
										<p className="text-lg font-semibold text-white">{track.title}</p>
										<p className="mt-2 text-peach/70">{track.progress}</p>
									</li>
								))}
							</ul>
						</section>
					</div>
				</div>
			</main>
		</div>
	);
}
