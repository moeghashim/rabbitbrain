import { Sun } from "lucide-react";
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

const appMenuItems = ["Philosophy", "Platform", "Manifesto"] as const;

export default function AppHomePage() {
	return (
		<div className="min-h-screen bg-ink text-peach">
			<nav className="sticky left-0 top-0 z-40 mx-auto flex w-[95%] max-w-7xl items-center justify-between rounded-[48px] border border-white/10 bg-ink/70 px-8 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl">
				<Link href="/" id="nav-logo" className="group flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral text-white">
						<Sun className="text-lg transition-transform duration-700 ease-redsun group-hover:rotate-90" />
					</div>
					<span className="mt-1 font-serif text-2xl tracking-tight text-white">Red Sun</span>
				</Link>

				<div className="hidden items-center gap-10 md:flex">
					{appMenuItems.map((item) => (
						<Link key={item} href="#" className="text-sm font-medium text-peach/70 transition-colors duration-300 hover:text-white">
							{item}
						</Link>
					))}
				</div>

				<Link
					href="/account"
					id="nav-cta"
					className="rounded-[48px] bg-coral px-7 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(239,70,35,0.4)] transition-all duration-300 ease-redsun hover:-translate-y-0.5 hover:bg-coral-hover hover:shadow-[0_6px_20px_rgba(239,70,35,0.6)]"
				>
					Account Settings
				</Link>
			</nav>
			<main className="px-6 pb-16 pt-10">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-10">

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
		</div>
	);
}
