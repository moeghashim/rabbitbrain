import Link from "next/link";
import React from "react";

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
		<main className="min-h-screen bg-ink px-6 py-16 text-peach">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
				<header className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-coral">Workspace</p>
						<h1 className="mt-2 font-serif text-6xl leading-[0.9] text-white">Account Dashboard</h1>
						<p className="mt-4 max-w-2xl text-peach/70">
							Analyze posts, review stored insights, and generate Feynman tracks from saved analysis history.
						</p>
					</div>
					<div className="flex gap-3">
						<Link
							href="/account"
							className="rounded-[48px] border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
						>
							Account Settings
						</Link>
					</div>
				</header>

				<section className="rounded-5xl border border-white/10 bg-charcoal/90 p-8">
					<h2 className="font-serif text-4xl text-white">Analyze Tweet</h2>
					<div className="mt-6">
						<HeroTweetAnalyzer />
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
	);
}
