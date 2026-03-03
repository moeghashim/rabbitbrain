"use client";

import type { AnalyzeTweetResult } from "@pi-starter/contracts";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface TweetPreview {
	id: string;
	text: string;
	authorId?: string;
	authorUsername?: string;
	authorName?: string;
	authorAvatarUrl?: string;
}

interface AnalyzeResponseSuccess {
	tweet: TweetPreview;
	analysis: AnalyzeTweetResult;
}

interface AnalyzeResponseError {
	error?: {
		code?: string;
		message?: string;
	};
	redirectTo?: string;
}

export interface HeroTweetAnalyzerProps {
	initialTweetUrlOrId?: string;
	autoAnalyze?: boolean;
}

function cleanAnalyzeFlagInUrl(): void {
	if (typeof window === "undefined") {
		return;
	}
	const nextUrl = new URL(window.location.href);
	nextUrl.searchParams.delete("analyze");
	window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
}

function defaultAvatarLabel(tweet: TweetPreview): string {
	if (tweet.authorName && tweet.authorName.trim().length > 0) {
		return tweet.authorName.trim().charAt(0).toUpperCase();
	}
	if (tweet.authorUsername && tweet.authorUsername.trim().length > 0) {
		return tweet.authorUsername.trim().charAt(0).toUpperCase();
	}
	return "X";
}

export function HeroTweetAnalyzer({
	initialTweetUrlOrId = "",
	autoAnalyze = false,
}: Readonly<HeroTweetAnalyzerProps>) {
	const [tweetUrlOrId, setTweetUrlOrId] = useState(initialTweetUrlOrId);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [tweet, setTweet] = useState<TweetPreview | null>(null);
	const [analysis, setAnalysis] = useState<AnalyzeTweetResult | null>(null);
	const hasAutoRunRef = useRef(false);

	const canSubmit = useMemo(() => tweetUrlOrId.trim().length > 0 && !isLoading, [isLoading, tweetUrlOrId]);

	async function runAnalysis(value: string): Promise<void> {
		const trimmedValue = value.trim();
		if (trimmedValue.length === 0) {
			setErrorMessage("Enter a tweet URL or tweet ID before analyzing.");
			return;
		}

		setIsLoading(true);
		setErrorMessage(null);

		try {
			const response = await fetch("/api/analyze", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					tweetUrlOrId: trimmedValue,
				}),
			});
			const payload = (await response.json()) as AnalyzeResponseSuccess | AnalyzeResponseError;

			if (response.status === 401) {
				const redirectTo = "redirectTo" in payload ? payload.redirectTo : undefined;
				if (redirectTo && redirectTo.startsWith("/")) {
					window.location.href = redirectTo;
					return;
				}
				setErrorMessage("Please sign in with Twitter to analyze tweets.");
				return;
			}

			if (!response.ok) {
				const fallbackMessage = "Unable to analyze this tweet right now.";
				const message = "error" in payload && payload.error?.message ? payload.error.message : fallbackMessage;
				setErrorMessage(message);
				return;
			}

			if (!("tweet" in payload) || !("analysis" in payload)) {
				setErrorMessage("Unexpected response while analyzing tweet.");
				return;
			}

			setTweet(payload.tweet);
			setAnalysis(payload.analysis);
			setTweetUrlOrId(trimmedValue);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unexpected network failure while analyzing tweet.");
		} finally {
			setIsLoading(false);
			cleanAnalyzeFlagInUrl();
		}
	}

	useEffect(() => {
		if (!autoAnalyze || hasAutoRunRef.current) {
			return;
		}
		if (initialTweetUrlOrId.trim().length === 0) {
			return;
		}

		hasAutoRunRef.current = true;
		void runAnalysis(initialTweetUrlOrId);
	}, [autoAnalyze, initialTweetUrlOrId]);

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-5xl border border-white/10 bg-charcoal/70 p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md md:p-8">
			<h2 className="font-serif text-4xl leading-tight text-white sm:text-5xl">Analyze any tweet instantly.</h2>
			<p className="max-w-2xl text-sm leading-relaxed text-peach/70 md:text-base">
				Paste a tweet URL, then RabbitBrain will mimic the tweet card and generate a concise analysis you can reuse in your learning tracks.
			</p>

			<form
				onSubmit={(event) => {
					event.preventDefault();
					void runAnalysis(tweetUrlOrId);
				}}
				className="flex w-full flex-col gap-3 sm:flex-row"
			>
				<label htmlFor="hero-tweet-url" className="sr-only">
					Tweet URL
				</label>
				<input
					id="hero-tweet-url"
					name="tweetUrlOrId"
					type="text"
					value={tweetUrlOrId}
					onChange={(event) => setTweetUrlOrId(event.target.value)}
					required
					placeholder="https://x.com/username/status/123456789"
					className="w-full rounded-[20px] border border-white/20 bg-ink/70 px-5 py-4 text-sm text-white placeholder:text-peach/40 focus:border-coral focus:outline-none md:text-base"
				/>
				<button
					id="hero-analyze-button"
					type="submit"
					disabled={!canSubmit}
					className="inline-flex min-w-[180px] items-center justify-center rounded-[20px] bg-coral px-7 py-4 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-coral-hover md:text-base"
				>
					{isLoading ? "Analyzing..." : "Analyze Tweet"}
				</button>
			</form>

			{errorMessage ? (
				<p role="alert" className="rounded-3xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-peach">
					{errorMessage}
				</p>
			) : null}

			{tweet && analysis ? (
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<section className="rounded-4xl border border-white/10 bg-ink/70 p-5">
						<div className="mb-4 flex items-start gap-3">
							{tweet.authorAvatarUrl ? (
								<img
									src={tweet.authorAvatarUrl}
									alt={tweet.authorName ? `${tweet.authorName} avatar` : "Tweet author avatar"}
									className="h-10 w-10 rounded-full border border-white/20 object-cover"
								/>
							) : (
								<div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-charcoal text-sm font-semibold text-white">
									{defaultAvatarLabel(tweet)}
								</div>
							)}
							<div>
								<p className="text-sm font-semibold text-white">{tweet.authorName ?? "Unknown author"}</p>
								<p className="text-xs text-peach/60">@{tweet.authorUsername ?? "unknown"}</p>
							</div>
						</div>
						<p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{tweet.text}</p>
						<p className="mt-4 text-xs uppercase tracking-widest text-peach/50">Tweet ID: {tweet.id}</p>
					</section>
					<section className="rounded-4xl border border-coral/30 bg-coral/10 p-5">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Analysis</p>
						<h3 className="mt-3 font-serif text-2xl text-white">{analysis.topic}</h3>
						<p className="mt-3 text-sm leading-relaxed text-peach/90">{analysis.summary}</p>
						<p className="mt-4 text-sm text-peach/70">
							<span className="font-semibold text-white">Intent:</span> {analysis.intent}
						</p>
						<ul className="mt-4 space-y-2">
							{analysis.novelConcepts.map((concept) => (
								<li key={concept.name} className="rounded-3xl border border-white/10 bg-ink/40 px-3 py-2 text-xs leading-relaxed text-peach/90">
									<span className="font-semibold text-white">{concept.name}:</span> {concept.whyItMattersInTweet}
								</li>
							))}
						</ul>
					</section>
				</div>
			) : null}
		</div>
	);
}
