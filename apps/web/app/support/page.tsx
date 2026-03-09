import Link from "next/link";
import React from "react";

const installSteps = [
	"Install Rabbitbrain for X from the Chrome Web Store on desktop Chrome.",
	"Open x.com and click Analyze on any public post you want to capture.",
	"Sign in with X when Rabbitbrain opens the authentication tab.",
	"Return to x.com after sign-in. The extension resumes automatically and can save tagged bookmarks to Rabbitbrain.",
];

const troubleshootingSteps = [
	"If Analyze or Save opens a sign-in tab repeatedly, confirm that cookies are allowed for rabbitbrain.app and that you completed the X sign-in flow.",
	"If no Rabbitbrain controls appear on x.com, reload the tab after installing or updating the extension.",
	"If analysis fails, retry on a public post and confirm Rabbitbrain and X are both reachable from your network.",
	"If review or production issues remain, email support with the affected tweet URL, browser version, and a short description of the problem.",
];

export default function SupportPage() {
	return (
		<main className="min-h-screen bg-ink px-6 py-16 text-peach">
			<div className="mx-auto flex max-w-5xl flex-col gap-10">
				<header className="rounded-5xl border border-white/10 bg-charcoal/90 p-8">
					<p className="text-sm uppercase tracking-[0.24em] text-coral">Support</p>
					<h1 className="mt-3 font-serif text-5xl text-white">Rabbitbrain for X Help Center</h1>
					<p className="mt-4 max-w-3xl text-base leading-relaxed text-peach/75">
						Rabbitbrain for X analyzes public X posts and saves tagged insights to your Rabbitbrain workspace. Support requests are monitored at{" "}
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
							Response expectations: Rabbitbrain reviews support requests during normal business hours and aims to reply within two business days.
						</p>
					</div>
				</section>
			</div>
		</main>
	);
}
