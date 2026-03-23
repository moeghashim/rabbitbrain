import Link from "next/link";
import React from "react";

const collectedData = [
	"X post URLs, post text, and public tweet metadata needed to analyze a post, save a bookmark, or build an account takeaway snapshot.",
	"Bookmark tags, followed creators, followed subjects, and followed takeaway accounts that you create inside Rabbit Brain.",
	"Account details needed for sign-in and ownership checks, such as your X user id, username, name, and avatar when those are available through the auth flow or X API.",
	"Provider configuration you explicitly set, such as model preferences and encrypted provider API keys stored for your account.",
];

const storageDetails = [
	"Saved analyses, bookmarks, follows, preferences, provider credential records, and takeaway snapshots are stored in Rabbit Brain so they can appear across the web app and related workflows.",
	"The extension keeps lightweight browser state needed for sign-in resume and in-progress actions. It does not execute remote code inside x.com.",
	"CLI takeaway state is stored locally on the machine where you run the CLI, alongside your local Rabbit Brain configuration.",
];

const serviceUsage = [
	"Rabbit Brain fetches public X metadata on the server side to analyze posts and refresh account takeaways.",
	"AI providers are used to produce structured tweet analysis and account-takeaway summaries from the posts you ask Rabbit Brain to process.",
	"Rabbit Brain does not sell personal data.",
];

const controlsAndRetention = [
	"You control what gets saved by choosing which posts to analyze, which bookmarks to keep, and which creators, subjects, or accounts to follow.",
	"Takeaway history is stored so you can inspect prior daily snapshots and the exact posts behind them.",
	"If you remove bookmarks, follows, or provider credentials from the product, Rabbit Brain stops using those records for future workflows.",
];

export default function PrivacyPage() {
	return (
		<main className="min-h-screen bg-ink px-6 py-16 text-peach">
			<div className="mx-auto flex max-w-5xl flex-col gap-10">
				<header className="rounded-5xl border border-white/10 bg-charcoal/90 p-8">
					<p className="text-sm uppercase tracking-[0.24em] text-coral">Privacy Policy</p>
					<h1 className="mt-3 font-serif text-5xl text-white">Rabbit Brain for X</h1>
					<p className="mt-4 max-w-3xl text-base leading-relaxed text-peach/75">
						This policy explains the data handled by the Rabbit Brain extension, web app, and related CLI workflows when you
						analyze X posts, save bookmarks, and track daily account takeaways.
					</p>
				</header>

				<section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
					<div className="rounded-5xl border border-white/10 bg-charcoal/80 p-8">
						<h2 className="font-serif text-3xl text-white">Overview</h2>
						<p className="mt-6 text-sm leading-relaxed text-peach/80">
							Rabbit Brain for X only runs on https://x.com/* when you choose to analyze a post or save it into your
							workspace. The product is built to help you capture useful posts, keep research trails, and generate daily
							account takeaways without scraping unrelated browsing activity.
						</p>
						<p className="mt-4 text-sm leading-relaxed text-peach/80">
							The extension, web app, and CLI share one product model, but they do not all store the same data in the same
							place. The sections below explain what is collected, where it lives, and which third-party services are involved.
						</p>
					</div>
					<div className="rounded-5xl border border-white/10 bg-charcoal/80 p-8">
						<h2 className="font-serif text-3xl text-white">Contact</h2>
						<p className="mt-4 text-sm leading-relaxed text-peach/75">
							Questions about this policy, Chrome Web Store review, or account-takeaway data handling can be sent to{" "}
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
								Open Rabbit Brain
							</Link>
						</div>
					</div>
				</section>

				<section className="grid gap-6 md:grid-cols-2">
					<div className="rounded-5xl border border-white/10 bg-charcoal/80 p-8">
						<h2 className="font-serif text-3xl text-white">Data Collected</h2>
						<ul className="mt-6 flex list-disc flex-col gap-4 pl-5 text-sm leading-relaxed text-peach/80">
							{collectedData.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</div>
					<div className="rounded-5xl border border-white/10 bg-charcoal/80 p-8">
						<h2 className="font-serif text-3xl text-white">Where Data Lives</h2>
						<ul className="mt-6 flex list-disc flex-col gap-4 pl-5 text-sm leading-relaxed text-peach/80">
							{storageDetails.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</div>
				</section>

				<section className="grid gap-6 md:grid-cols-2">
					<div className="rounded-5xl border border-white/10 bg-charcoal/80 p-8">
						<h2 className="font-serif text-3xl text-white">Third-Party Services</h2>
						<ul className="mt-6 flex list-disc flex-col gap-4 pl-5 text-sm leading-relaxed text-peach/80">
							{serviceUsage.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</div>
					<div className="rounded-5xl border border-white/10 bg-charcoal/80 p-8">
						<h2 className="font-serif text-3xl text-white">Retention and Control</h2>
						<ul className="mt-6 flex list-disc flex-col gap-4 pl-5 text-sm leading-relaxed text-peach/80">
							{controlsAndRetention.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</div>
				</section>
			</div>
		</main>
	);
}
