import Link from "next/link";
import React from "react";

const dataPractices = [
	"Rabbitbrain for X only runs on https://x.com/* and only when you choose to analyze or save a tweet.",
	"To provide analysis and bookmarks, the extension sends the selected tweet URL or tweet text, your bookmark tags, and the minimum account identifiers needed to confirm sign-in to Rabbitbrain.",
	"Analyzed or bookmarked tweets are stored in Rabbitbrain's backend so they can appear in your workspace and bookmarks view.",
	"Rabbitbrain fetches tweet metadata from X's API on the server side. The extension does not execute remote code and does not sell personal data.",
	"The extension stores only lightweight local state in Chrome, such as pending sign-in resume data and the latest extension auth check needed to finish an in-progress action.",
];

export default function PrivacyPage() {
	return (
		<main className="min-h-screen bg-ink px-6 py-16 text-peach">
			<div className="mx-auto flex max-w-5xl flex-col gap-10">
				<header className="rounded-5xl border border-white/10 bg-charcoal/90 p-8">
					<p className="text-sm uppercase tracking-[0.24em] text-coral">Privacy Policy</p>
					<h1 className="mt-3 font-serif text-5xl text-white">Rabbitbrain for X</h1>
					<p className="mt-4 max-w-3xl text-base leading-relaxed text-peach/75">
						This policy explains the data handled by the Rabbitbrain for X Chrome extension and the Rabbitbrain web app when you analyze public X posts and save tagged insights to your workspace.
					</p>
				</header>

				<section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
					<div className="rounded-5xl border border-white/10 bg-charcoal/80 p-8">
						<h2 className="font-serif text-3xl text-white">What the extension does</h2>
						<ul className="mt-6 flex list-disc flex-col gap-4 pl-5 text-sm leading-relaxed text-peach/80">
							{dataPractices.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</div>
					<div className="rounded-5xl border border-white/10 bg-charcoal/80 p-8">
						<h2 className="font-serif text-3xl text-white">Contact</h2>
						<p className="mt-4 text-sm leading-relaxed text-peach/75">
							Questions about this policy or Chrome Web Store review can be sent to{" "}
							<a className="text-coral transition-colors hover:text-coral-hover" href="mailto:support@rabbitbrain.app">
								support@rabbitbrain.app
							</a>
							.
						</p>
						<div className="mt-6 flex flex-col gap-3 text-sm">
							<Link href="/support" className="rounded-[48px] border border-white/20 px-5 py-3 text-white transition-colors hover:bg-white/10">
								Open Support
							</Link>
							<Link href="/app" className="rounded-[48px] bg-coral px-5 py-3 font-semibold text-white transition-colors hover:bg-coral-hover">
								Open Rabbitbrain
							</Link>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
