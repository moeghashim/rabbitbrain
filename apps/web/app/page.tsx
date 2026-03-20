import {
	ArrowUpRight,
	AudioLines,
	BrainCircuit,
	Orbit,
	ScanSearch,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { HeroTweetAnalyzer } from "../components/hero-tweet-analyzer.js";
import { RabbitBrandMark } from "../components/rabbit-brand-mark.js";
import { Reveal } from "../components/reveal.js";
import { getServerAuthSession } from "../src/auth/auth.js";

const twitterLoginPath = "/auth/popup-start?redirect_url=%2Fapp";

const architectureCards = [
	{
		title: "Tone",
		description:
			"Acoustic fingerprinting of digital voice to keep authorship coherent across fragmented threads.",
		icon: AudioLines,
		iconClassName: "text-primary",
	},
	{
		title: "Context",
		description:
			"Historical signal mapping that threads live posts into prior narratives, references, and intent.",
		icon: Orbit,
		iconClassName: "text-secondary",
	},
	{
		title: "Semantic",
		description:
			"Lexical decomposition of latent meaning so the analysis survives irony, jargon, and subtext.",
		icon: BrainCircuit,
		iconClassName: "text-primary",
	},
	{
		title: "Flow",
		description:
			"Real-time synthesis that turns captured signal into structured notes, follows, and reusable insight.",
		icon: ScanSearch,
		iconClassName: "text-secondary",
	},
];

interface LandingPageProps {
	searchParams?: Promise<{
		tweetUrlOrId?: string | string[];
		analyze?: string | string[];
	}>;
}

function firstQueryValue(value?: string | string[]): string | undefined {
	if (Array.isArray(value)) {
		return value[0];
	}
	return value;
}

async function resolveIsAuthenticated(): Promise<boolean> {
	try {
		const session = await getServerAuthSession();
		const userId = session?.user?.id?.trim() ?? "";
		return userId.length > 0;
	} catch {
		return false;
	}
}

export default async function LandingPage({ searchParams }: Readonly<LandingPageProps>) {
	const resolvedSearchParams = (await searchParams) ?? {};
	const initialTweetUrlOrId = firstQueryValue(resolvedSearchParams.tweetUrlOrId) ?? "";
	const autoAnalyze = firstQueryValue(resolvedSearchParams.analyze) === "1";
	const isAuthenticated = await resolveIsAuthenticated();
	const navCtaHref = isAuthenticated ? "/account" : twitterLoginPath;
	const navCtaLabel = isAuthenticated ? "Account" : "Connect";
	const footerCtaLabel = isAuthenticated ? "Open Workspace" : "Authenticate with X";
	const footerCtaHref = isAuthenticated ? "/app" : twitterLoginPath;

	return (
		<div className="min-h-screen bg-surface text-on-surface">
			<div className="pointer-events-none fixed inset-0 opacity-60">
				<div className="obsidian-grid absolute inset-0" />
				<div className="obsidian-radial absolute inset-0" />
			</div>

			<nav className="fixed top-0 z-50 w-full border-b border-outline-variant/10 bg-surface/95 backdrop-blur-md">
				<div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-4 sm:px-10 lg:px-16">
					<Link href="/" className="flex items-center gap-3">
						<RabbitBrandMark className="h-8 w-8 text-primary" />
						<span className="font-headline text-2xl font-bold tracking-tight text-primary">Rabbit Brain</span>
					</Link>
					<div className="hidden items-center gap-12 md:flex">
						<Link
							href="/app"
							className="border-b border-primary pb-1 font-mono text-sm uppercase tracking-[0.35em] text-primary"
						>
							Terminal
						</Link>
						<Link
							href="/app/bookmarks"
							className="font-mono text-sm uppercase tracking-[0.35em] text-secondary transition-colors hover:text-primary"
						>
							Bookmarks
						</Link>
						<Link
							href="/support"
							className="font-mono text-sm uppercase tracking-[0.35em] text-secondary transition-colors hover:text-primary"
						>
							Support
						</Link>
					</div>
					<Link
						href={navCtaHref}
						id="nav-cta"
						className="bg-primary-container px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-on-primary-container transition-transform hover:scale-[1.02]"
					>
						{navCtaLabel}
					</Link>
				</div>
			</nav>

			<main className="relative z-10 pt-20">
				<section className="relative overflow-hidden px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
					<div className="mx-auto flex min-h-[640px] w-full max-w-[1440px] flex-col items-center justify-center text-center">
						<Reveal className="flex w-full flex-col items-center">
							<div className="mb-6 flex items-center gap-4">
								<span className="h-2 w-2 bg-primary" />
								<p className="font-label text-[11px] uppercase tracking-[0.5em] text-secondary/70">
									Neural ingestion terminal
								</p>
							</div>
							<h1 className="max-w-5xl font-headline text-[3.25rem] font-bold uppercase leading-[0.95] tracking-[-0.04em] text-on-surface sm:text-[5rem] lg:text-[6.4rem]">
								Transform the <span className="text-glow text-primary">signal</span>
							</h1>
							<p className="mt-6 max-w-2xl font-body text-base leading-7 text-on-surface-variant sm:text-lg">
								Capture any X thread, extract the operative idea, and route it into a structured intelligence workflow built
								for repeatable thinking.
							</p>
							<div className="mt-10 w-full max-w-4xl">
								<HeroTweetAnalyzer
									initialTweetUrlOrId={initialTweetUrlOrId}
									autoAnalyze={autoAnalyze}
									showProviderSelector={false}
									showModelSelector={false}
									theme="obsidian"
								/>
							</div>
							<p className="mt-4 font-label text-[10px] uppercase tracking-[0.45em] text-secondary/40">
								Awaiting neural ingestion sequences
							</p>
						</Reveal>
					</div>
				</section>

				<section className="border-y border-outline-variant/10 bg-surface-container-low px-6 py-20 sm:px-10 lg:px-16 lg:py-32">
					<div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-16">
						<Reveal className="space-y-8">
							<div className="flex items-center gap-4">
								<span className="h-2 w-2 bg-secondary/30" />
								<h2 className="font-label text-[11px] uppercase tracking-[0.5em] text-secondary">Raw ingest</h2>
							</div>
							<div className="bg-surface-container-lowest p-8 font-label text-sm leading-7 text-secondary/70">
								<p className="mb-4 text-[10px] uppercase tracking-[0.38em] text-primary/50">
									0x4F2... received from x.com
								</p>
								<p>
									&quot;Just deployed the new neural mesh for decentralised data routing. The latency is down by 40% but
									we&apos;re seeing some semantic drift in high-concurrency clusters. #Build #Web3&quot;
								</p>
							</div>
						</Reveal>

						<Reveal className="relative space-y-8">
							<div className="flex items-center gap-4">
								<span className="h-2 w-2 bg-primary" />
								<h2 className="font-label text-[11px] uppercase tracking-[0.5em] text-primary">Refined intelligence</h2>
							</div>
							<div className="emerald-glow relative overflow-hidden bg-surface-container-high p-8">
								<div className="absolute right-6 top-6 font-label text-[10px] uppercase tracking-[0.35em] text-primary/70">
									Verified
								</div>
								<div className="space-y-6">
									<div>
										<p className="mb-2 font-label text-[10px] uppercase tracking-[0.35em] text-primary/60">Core insight</p>
										<p className="font-headline text-2xl italic leading-tight text-on-surface">
											Optimization of decentralized routing confirmed; semantic stability issues emerging at scale.
										</p>
									</div>
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div className="border-l border-primary/30 pl-4">
											<p className="mb-1 font-label text-[10px] uppercase tracking-[0.35em] text-secondary/40">Impact score</p>
											<p className="font-label text-2xl text-primary">8.42/10</p>
										</div>
										<div className="border-l border-primary/30 pl-4">
											<p className="mb-1 font-label text-[10px] uppercase tracking-[0.35em] text-secondary/40">
												Sentiment vector
											</p>
											<p className="font-label text-2xl text-primary">Stable</p>
										</div>
									</div>
								</div>
							</div>
						</Reveal>
					</div>
				</section>

				<section className="px-6 py-20 sm:px-10 lg:px-16 lg:py-32">
					<div className="mx-auto flex w-full max-w-[1440px] flex-col gap-16">
						<Reveal className="flex flex-col gap-6 border-b border-outline-variant/10 pb-8 md:flex-row md:items-end md:justify-between">
							<div>
								<h2 className="font-headline text-4xl uppercase tracking-[-0.03em] text-on-surface sm:text-5xl">
									Engine Architecture
								</h2>
								<p className="mt-4 max-w-2xl font-body text-base leading-7 text-on-surface-variant">
									The analysis stack is designed as a hard-edged technical instrument: no soft cards, no ornamental noise,
									just layered surfaces and high-signal readouts.
								</p>
							</div>
							<p className="font-label text-[10px] uppercase tracking-[0.45em] text-secondary/40">Protocol version 4.0.1</p>
						</Reveal>

						<div className="grid grid-cols-1 gap-px bg-outline-variant/10 md:grid-cols-2 lg:grid-cols-4">
							{architectureCards.map((card) => {
								const Icon = card.icon;
								return (
									<Reveal key={card.title} className="group bg-surface p-10 transition-colors hover:bg-surface-container-low">
										<div className="flex h-14 w-14 items-center justify-center border border-outline-variant/20 bg-surface-container-lowest">
											<Icon className={`h-8 w-8 transition-colors group-hover:text-primary ${card.iconClassName}`} />
										</div>
										<div className="mt-8">
											<h3 className="mb-4 font-mono text-sm uppercase tracking-[0.28em] text-secondary">{card.title}</h3>
											<p className="font-label text-xs uppercase leading-7 tracking-[0.2em] text-secondary/50">
												{card.description}
											</p>
										</div>
									</Reveal>
								);
							})}
						</div>
					</div>
				</section>

				<section className="px-6 pb-24 sm:px-10 lg:px-16 lg:pb-32">
					<Reveal className="mx-auto flex w-full max-w-[1440px] flex-col items-center overflow-hidden bg-surface-container-low px-8 py-16 text-center sm:px-12 lg:px-20 lg:py-20">
						<div className="obsidian-noise pointer-events-none absolute inset-0 opacity-15" />
						<div className="relative z-10 flex max-w-4xl flex-col items-center">
							<h2 className="font-headline text-[3rem] uppercase tracking-[-0.04em] text-on-surface sm:text-[4.5rem] lg:text-[5.5rem]">
								Enter the protocol
							</h2>
							<p className="mt-6 max-w-2xl font-label text-xs uppercase tracking-[0.34em] text-secondary/60 sm:text-[13px]">
								Access is restricted to verified nodes. Authenticate to begin neural signal synthesis and route captured
								tweets into your private reasoning system.
							</p>
							<Link
								href={footerCtaHref}
								id="final-cta"
								className="mt-10 inline-flex items-center gap-3 bg-primary-container px-10 py-5 font-mono text-xs font-bold uppercase tracking-[0.38em] text-on-primary-container transition-shadow hover:shadow-[0_0_30px_rgba(110,229,145,0.3)]"
							>
								{footerCtaLabel}
								<ArrowUpRight className="h-4 w-4 text-on-primary-container/80" />
							</Link>
							<div className="mt-10 flex items-center gap-6 opacity-40">
								<div className="h-px w-16 bg-secondary" />
								<span className="font-label text-[10px] uppercase tracking-[0.45em] text-secondary">System ready</span>
								<div className="h-px w-16 bg-secondary" />
							</div>
						</div>
					</Reveal>
				</section>
			</main>

			<footer className="relative z-10 border-t border-outline-variant/10 bg-surface px-6 py-10 sm:px-10 lg:px-16 lg:py-12">
				<div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 md:flex-row md:items-center md:justify-between">
					<div className="font-label text-[10px] uppercase tracking-[0.24em] text-secondary/60">
						© 2026 Rabbit Brain. All rights reserved.
					</div>
					<div className="flex flex-wrap gap-8">
						<Link
							href="/app"
							className="font-mono text-[10px] uppercase tracking-[0.24em] text-secondary/60 transition-colors hover:text-primary"
						>
							Terminal
						</Link>
						<Link
							href="/app/bookmarks"
							className="font-mono text-[10px] uppercase tracking-[0.24em] text-secondary/60 transition-colors hover:text-primary"
						>
							Bookmarks
						</Link>
						<Link
							href="/privacy"
							className="font-mono text-[10px] uppercase tracking-[0.24em] text-secondary/60 transition-colors hover:text-primary"
						>
							Privacy
						</Link>
						<Link
							href="/support"
							className="font-mono text-[10px] uppercase tracking-[0.24em] text-secondary/60 transition-colors hover:text-primary"
						>
							Support
						</Link>
					</div>
					<div className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Rabbit Brain</div>
				</div>
			</footer>
		</div>
	);
}
