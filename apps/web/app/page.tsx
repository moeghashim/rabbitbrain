import {
	ArrowDown,
	ArrowUpRight,
	BrainCircuit,
	PenTool,
	SlidersHorizontal,
	Sparkles,
	Zap,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { HeroTweetAnalyzer } from "../components/hero-tweet-analyzer.js";
import { RabbitBrandMark } from "../components/rabbit-brand-mark.js";
import { Reveal } from "../components/reveal.js";
import { workspaceMenuLinks } from "../components/workspace-menu.js";
import { getServerAuthSession } from "../src/auth/auth.js";

const twitterLoginPath = "/auth/popup-start?redirect_url=%2Fapp";

const featureCards = [
	{
		title: "Tone Mastery",
		description:
			"From philosophical musings to crisp executive summaries, dial in the exact frequency of your voice.",
		icon: SlidersHorizontal,
	},
	{
		title: "Context Aware",
		description:
			"The engine understands nuance, industry jargon, and subtext, ensuring nothing gets lost in translation.",
		icon: BrainCircuit,
	},
	{
		title: "Frictionless",
		description: "Draft, transform, and publish without ever leaving the flow state. The architecture of speed.",
		icon: Zap,
	},
];

interface LandingPageProps {
	searchParams?: {
		tweetUrlOrId?: string | string[];
		analyze?: string | string[];
	};
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
	const initialTweetUrlOrId = firstQueryValue(searchParams?.tweetUrlOrId) ?? "";
	const autoAnalyze = firstQueryValue(searchParams?.analyze) === "1";
	const isAuthenticated = await resolveIsAuthenticated();
	const navCtaHref = isAuthenticated ? "/account" : twitterLoginPath;
	const navCtaLabel = isAuthenticated ? "Account Settings" : "Login with Twitter";

	return (
		<div className="bg-ink text-peach">
			<div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
				<div className="animate-float absolute -left-[10%] -top-[10%] h-[40vw] w-[40vw] rounded-full bg-coral/10 blur-[120px]" />
				<div
					className="animate-float absolute bottom-[20%] right-[-5%] h-[30vw] w-[30vw] rounded-full bg-peach/5 blur-[100px]"
					style={{ animationDelay: "-4s", animationDuration: "8s" }}
				/>
				<div className="absolute left-[20%] top-[40%] h-[20vw] w-[20vw] rounded-full bg-coral/5 blur-[80px]" />
			</div>

			<nav className="fixed left-1/2 top-6 z-50 flex w-[95%] max-w-7xl -translate-x-1/2 items-center justify-between rounded-[48px] border border-white/10 bg-ink/60 px-8 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-500 ease-redsun">
				<Link href="/" id="nav-logo" className="group flex items-center gap-2">
					<RabbitBrandMark className="h-8 w-8 transition-transform duration-700 ease-redsun group-hover:-rotate-12 group-hover:scale-105" />
					<span className="mt-1 font-serif text-2xl tracking-tight text-white">Rabbit Brain</span>
				</Link>

					<div className="hidden items-center gap-10 md:flex">
						{workspaceMenuLinks.map((item) => (
							<Link
								key={item.label}
								href={item.href}
								className="text-sm font-medium text-peach/70 transition-colors duration-300 hover:text-white"
							>
								{item.label}
							</Link>
						))}
					</div>

				<div className="flex items-center">
					<Link
						href={navCtaHref}
						id="nav-cta"
						className="rounded-[48px] bg-coral px-7 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(239,70,35,0.4)] transition-all duration-300 ease-redsun hover:-translate-y-0.5 hover:bg-coral-hover hover:shadow-[0_6px_20px_rgba(239,70,35,0.6)]"
					>
						{navCtaLabel}
					</Link>
				</div>
			</nav>

			<main className="relative z-10 flex w-full flex-col items-center">
				<section className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 pb-20 pt-32">
					<Reveal className="mx-auto flex max-w-6xl flex-col items-center text-center">
						<div className="mb-10 inline-flex items-center gap-2 rounded-full border border-coral/30 bg-coral/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-coral">
							<span className="h-1.5 w-1.5 animate-pulse-slow rounded-full bg-coral" />
							Twitter Signal Lab
						</div>
						<h1 className="text-glow mb-8 font-serif text-[3.4rem] leading-[0.92] tracking-tight text-white sm:text-[5rem] lg:text-[6.5rem]">
							Capture knowledge on X
						</h1>
						<div className="w-full">
							<HeroTweetAnalyzer
								initialTweetUrlOrId={initialTweetUrlOrId}
								autoAnalyze={autoAnalyze}
								showProviderSelector={false}
								showModelSelector={false}
							/>
						</div>
					</Reveal>
					<div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 animate-bounce flex-col items-center gap-2 opacity-50">
						<span className="text-xs uppercase tracking-widest">Scroll</span>
						<ArrowDown className="text-lg" />
					</div>
				</section>

				<section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-32">
					<Reveal className="mb-16 text-center">
						<h2 className="mb-4 font-serif text-5xl tracking-tight text-white md:text-7xl">
							The <span className="italic text-coral">Studio</span>
						</h2>
						<p className="mx-auto max-w-xl text-lg text-peach/60">Tools designed not to distract, but to amplify.</p>
					</Reveal>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<Reveal className="group relative overflow-hidden rounded-5xl border border-white/5 bg-charcoal p-2 transition-colors duration-700 hover:border-coral/20 md:p-8 lg:col-span-2">
							<div className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral/5 opacity-0 blur-[80px] transition-opacity duration-1000 group-hover:opacity-100" />
							<div className="relative z-10 flex h-full min-h-[400px] flex-col rounded-[36px] border border-white/10 bg-ink-dark p-6 shadow-2xl md:p-10">
								<div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
									<div className="flex gap-2">
										<div className="h-3 w-3 rounded-full bg-white/20" />
										<div className="h-3 w-3 rounded-full bg-white/20" />
										<div className="h-3 w-3 rounded-full bg-white/20" />
									</div>
									<div className="text-xs uppercase tracking-widest text-peach/40">AI Transformation</div>
								</div>
								<div className="flex flex-1 flex-col gap-6 md:flex-row">
									<div className="flex-1 rounded-4xl border border-white/5 bg-ink/50 p-6">
										<label className="mb-4 block font-serif text-xl italic text-peach/50">Raw Draft</label>
										<p className="leading-relaxed text-white/80">
											i built this feature over the weekend and it works perfectly. honestly suprised it didn&apos;t break
											everything else lol. going to sleep now.
										</p>
									</div>
									<div className="z-10 -my-2 flex items-center justify-center md:-mx-2">
										<div className="flex h-14 w-14 items-center justify-center rounded-full bg-coral shadow-[0_0_20px_rgba(239,70,35,0.4)] transition-all duration-700 ease-redsun group-hover:scale-110 group-hover:rotate-180">
											<Sparkles className="text-white" />
										</div>
									</div>
									<div className="relative flex-1 overflow-hidden rounded-4xl border border-coral/20 bg-gradient-to-br from-ink to-charcoal p-6">
										<div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-coral/10 blur-[40px]" />
										<label className="relative z-10 mb-4 block font-serif text-xl italic text-coral">Refined Prose</label>
										<p className="relative z-10 font-serif text-2xl leading-tight text-white">
											&quot;Weekend deep dive complete. The new architecture held flawlessly under stress testing. There is a
											profound quiet that comes after executing a perfect deployment. Rest is earned.&quot;
										</p>
									</div>
								</div>
							</div>
						</Reveal>
						<Reveal className="group flex flex-col justify-between rounded-5xl border border-white/5 bg-charcoal p-10 transition-all duration-500 ease-redsun hover:-translate-y-2 hover:border-coral/30 hover:shadow-[0_20px_40px_-15px_rgba(239,70,35,0.15)]">
							<div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/10 bg-ink transition-colors duration-500 group-hover:border-coral group-hover:bg-coral">
								<PenTool className="text-peach transition-colors group-hover:text-white" />
							</div>
							<div>
								<h3 className="mb-3 text-2xl font-semibold text-white">Intentional Design</h3>
								<p className="leading-relaxed text-peach/60">
									Every pixel serves a purpose. We removed the noise so your thoughts can take center stage.
								</p>
							</div>
						</Reveal>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						{featureCards.map((item, index) => {
							const Icon = item.icon;
							return (
								<Reveal
									key={item.title}
									className="group flex flex-col rounded-5xl border border-white/5 bg-charcoal p-10 transition-all duration-500 ease-redsun hover:-translate-y-2 hover:border-coral/30 hover:shadow-[0_20px_40px_-15px_rgba(239,70,35,0.15)]"
								>
									<div className="mb-8 flex items-center justify-between">
										<h3 className="text-2xl font-semibold text-white">{item.title}</h3>
										<Icon className="text-coral/50 transition-opacity group-hover:text-coral group-hover:opacity-100" />
									</div>
									<p className="flex-1 leading-relaxed text-peach/60">{item.description}</p>
									{index === 0 ? (
										<div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-ink">
											<div className="h-full w-[60%] rounded-full bg-coral transition-all duration-1000 ease-redsun group-hover:w-full" />
										</div>
									) : null}
								</Reveal>
							);
						})}
					</div>
				</section>

				<section className="relative w-full overflow-hidden bg-coral bg-dot-pattern bg-[length:32px_32px] px-6 py-40">
					<div className="absolute left-0 top-0 z-0 h-32 w-full bg-gradient-to-b from-ink to-transparent" />
					<div className="absolute bottom-0 left-0 z-0 h-32 w-full bg-gradient-to-t from-ink to-transparent" />
					<Reveal className="relative z-10 mx-auto max-w-4xl text-center">
						<h2 className="mb-8 font-serif text-[4rem] leading-[0.9] tracking-tighter text-white sm:text-[6rem] lg:text-[9rem]">
							Leave <span className="italic">mediocrity</span> <br />behind.
						</h2>
						<p className="mx-auto mb-12 max-w-2xl text-xl font-medium text-white/90">
							Join the vanguard of creators who value the weight of their words. The studio is open.
						</p>
						<Link
							href={twitterLoginPath}
							id="final-cta"
							className="inline-flex items-center gap-3 rounded-[48px] bg-ink px-12 py-6 text-lg font-semibold text-white shadow-2xl transition-all duration-500 ease-redsun hover:scale-105 hover:bg-white hover:text-ink"
						>
							Login with Twitter
							<ArrowUpRight />
						</Link>
					</Reveal>
				</section>
			</main>

			<footer className="relative z-10 w-full border-t border-white/5 bg-ink px-6 pb-10 pt-20">
				<div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 md:flex-row md:items-end">
					<div className="flex flex-col gap-6">
						<Link href="/" className="flex items-center gap-2">
							<RabbitBrandMark className="h-6 w-6" />
							<span className="font-serif text-2xl tracking-tight text-white">Rabbit Brain</span>
						</Link>
						<p className="max-w-xs text-sm text-peach/40">
							The premium standard for digital expression and thought refinement.
						</p>
					</div>
					<div className="flex flex-col gap-12 text-sm sm:flex-row md:gap-24">
						<div className="flex flex-col gap-4">
							<span className="text-xs font-semibold uppercase tracking-widest text-peach">Platform</span>
							<Link href="/" className="text-peach/60 transition-colors hover:text-coral">
								The Studio
							</Link>
							<Link href="/app" className="text-peach/60 transition-colors hover:text-coral">
								Workspace
							</Link>
							<Link href="/app/bookmarks" className="text-peach/60 transition-colors hover:text-coral">
								Bookmarks
							</Link>
						</div>
						<div className="flex flex-col gap-4">
							<span className="text-xs font-semibold uppercase tracking-widest text-peach">Company</span>
							<Link href="/privacy" className="text-peach/60 transition-colors hover:text-coral">
								Privacy
							</Link>
							<Link href="/support" className="text-peach/60 transition-colors hover:text-coral">
								Support
							</Link>
							<Link href="mailto:support@rabbitbrain.app" className="text-peach/60 transition-colors hover:text-coral">
								Contact
							</Link>
						</div>
					</div>
				</div>
				<div className="mx-auto mt-20 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-peach/30 sm:flex-row">
					<p>&copy; 2024 Rabbit Brain Inc. All rights reserved.</p>
					<div className="flex gap-6">
						<Link href="https://x.com" className="transition-colors hover:text-peach">
							X / Twitter
						</Link>
						<Link href="/support" className="transition-colors hover:text-peach">
							Support
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
