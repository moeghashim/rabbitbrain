import Link from "next/link";
import React from "react";

const installSteps = [
	"Sign in with X to open the Rabbit Brain workspace on the web.",
	"Paste an X post URL or status ID to analyze a single post into topic, summary, intent, and five novel concepts.",
	"Save important posts to bookmarks, or follow creators and subjects from the web workflow to keep a research trail.",
	"Use the takeaway workspace or CLI commands to follow accounts, refresh daily takeaways, and inspect the source posts behind each snapshot.",
];

const troubleshootingSteps = [
	"If sign-in opens repeatedly, confirm that cookies are allowed for rabbitbrain.app and that the X authentication flow completed successfully.",
	"If analysis fails, retry on a public X post and confirm that both rabbitbrain.app and x.com are reachable from your network.",
	"If extension controls do not appear on x.com, reload the tab after installing or updating the extension.",
	"If a takeaway refresh fails, include the Request ID, the followed account, and whether the failure happened on the web app or CLI when you contact support.",
];

export default function SupportPage() {
	return (
		<main className="min-h-screen bg-ink px-6 py-16 text-peach">
			<div className="mx-auto flex max-w-5xl flex-col gap-10">
				<header className="rounded-5xl border border-white/10 bg-charcoal/90 p-8">
					<p className="text-sm uppercase tracking-[0.24em] text-coral">Support</p>
					<h1 className="mt-3 font-serif text-5xl text-white">Rabbit Brain Help Center</h1>
					<p className="mt-4 max-w-3xl text-base leading-relaxed text-peach/75">
						Rabbit Brain supports X post analysis, bookmarks, creator follows, and daily account takeaways across the web app,
						CLI, and extension. Support requests are monitored at{" "}
						<a className="text-coral transition-colors hover:text-coral-hover" href="mailto:support@rabbitbrain.app">
							support@rabbitbrain.app
						</a>
						.
					</p>
				</header>

				<section className="grid gap-6 md:grid-cols-2">
					<div className="rounded-5xl border border-white/10 bg-charcoal/80 p-8">
						<h2 className="font-serif text-3xl text-white">Install and Use</h2>
						<ol className="mt-6 flex list-decimal flex-col gap-4 pl-5 text-sm leading-relaxed text-peach/80">
							{installSteps.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ol>
						<div className="mt-6 flex flex-col gap-3 text-sm">
							<Link href="/privacy" className="rounded-[48px] border border-white/20 px-5 py-3 text-white transition-colors hover:bg-white/10">
								Read Privacy Policy
							</Link>
							<Link href="/auth/popup-start?redirect_url=%2Fapp" className="rounded-[48px] bg-coral px-5 py-3 font-semibold text-white transition-colors hover:bg-coral-hover">
								Sign in with X
							</Link>
						</div>
					</div>

					<div className="rounded-5xl border border-white/10 bg-charcoal/80 p-8">
						<h2 className="font-serif text-3xl text-white">Troubleshooting</h2>
						<ul className="mt-6 flex list-disc flex-col gap-4 pl-5 text-sm leading-relaxed text-peach/80">
							{troubleshootingSteps.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
						<p className="mt-6 text-sm leading-relaxed text-peach/70">
							Response expectations: Rabbit Brain reviews support requests during normal business hours and aims to reply within
							two business days.
						</p>
					</div>
				</section>
			</div>
		</main>
	);
}
