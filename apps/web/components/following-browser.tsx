"use client";

import type {
	CreateFollowInput,
	CreatorFollow,
	FollowSuggestionsResponse,
	FollowSummary,
	FollowingFeedItem,
	FollowingFeedResponse,
	SubjectFollow,
	SuggestedCreator,
} from "@pi-starter/contracts";
import React, { useEffect, useState } from "react";

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleString();
}

function avatarLabel(name: string | undefined, username: string): string {
	const firstCharacter = (name ?? username).trim().charAt(0);
	return firstCharacter.length > 0 ? firstCharacter.toUpperCase() : "X";
}

function buildAvailableSubjects(creatorFollows: CreatorFollow[], subjectFollows: SubjectFollow[]): string[] {
	const byKey = new Map<string, string>();
	for (const follow of subjectFollows) {
		byKey.set(follow.subjectTag.trim().toLowerCase(), follow.subjectTag);
	}
	for (const follow of creatorFollows) {
		if (!follow.subjectTag) {
			continue;
		}
		const key = follow.subjectTag.trim().toLowerCase();
		if (!byKey.has(key)) {
			byKey.set(key, follow.subjectTag);
		}
	}
	return Array.from(byKey.values()).sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
}

function describeMatch(item: FollowingFeedItem): string {
	const labels = item.matches.map((match) => {
		if (match.type === "creator_all_feed") {
			return `Creator @${match.creatorUsername}`;
		}
		if (match.type === "creator_subject") {
			return `Creator @${match.creatorUsername} + ${match.subjectTag}`;
		}
		return `Subject ${match.subjectTag}`;
	});
	return labels.join(" • ");
}

function bookmarkUrl(item: FollowingFeedItem): string {
	return item.tweetUrlOrId.startsWith("http") ? item.tweetUrlOrId : `https://x.com/i/web/status/${item.tweetId}`;
}

interface ApiErrorPayload {
	error?: {
		message?: string;
	};
}

export function FollowingBrowser() {
	const [creatorFollows, setCreatorFollows] = useState<CreatorFollow[]>([]);
	const [subjectFollows, setSubjectFollows] = useState<SubjectFollow[]>([]);
	const [feedItems, setFeedItems] = useState<FollowingFeedItem[]>([]);
	const [selectedSubject, setSelectedSubject] = useState("");
	const [suggestions, setSuggestions] = useState<SuggestedCreator[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
	const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);

	const availableSubjects = buildAvailableSubjects(creatorFollows, subjectFollows);

	async function loadWorkspace(): Promise<void> {
		setIsLoading(true);
		setErrorMessage(null);
		try {
			const [followsResponse, feedResponse] = await Promise.all([
				fetch("/api/me/follows", { method: "GET", headers: { "content-type": "application/json" } }),
				fetch("/api/me/following-feed", { method: "GET", headers: { "content-type": "application/json" } }),
			]);
			const followsPayload = (await followsResponse.json()) as FollowSummary | ApiErrorPayload;
			const feedPayload = (await feedResponse.json()) as FollowingFeedResponse | ApiErrorPayload;

			if (!followsResponse.ok) {
				throw new Error(followsPayload.error?.message ?? "Unable to load follows.");
			}
			if (!feedResponse.ok) {
				throw new Error(feedPayload.error?.message ?? "Unable to load following feed.");
			}
			if (!("creatorFollows" in followsPayload) || !("bookmarks" in feedPayload)) {
				throw new Error("Unexpected follow response.");
			}

			setCreatorFollows(followsPayload.creatorFollows);
			setSubjectFollows(followsPayload.subjectFollows);
			setFeedItems(feedPayload.bookmarks);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unexpected follow load failure.");
			setCreatorFollows([]);
			setSubjectFollows([]);
			setFeedItems([]);
		} finally {
			setIsLoading(false);
		}
	}

	async function saveFollow(input: CreateFollowInput, successMessage: string, actionKey: string): Promise<void> {
		setPendingActionKey(actionKey);
		setErrorMessage(null);
		setStatusMessage(null);
		try {
			const response = await fetch("/api/me/follows", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(input),
			});
			const payload = (await response.json()) as ApiErrorPayload;
			if (!response.ok) {
				throw new Error(payload.error?.message ?? "Unable to save follow.");
			}
			setStatusMessage(successMessage);
			await loadWorkspace();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unexpected follow save failure.");
		} finally {
			setPendingActionKey(null);
		}
	}

	async function removeFollow(
		input: { kind: "creator" | "subject"; followId: string },
		successMessage: string,
		actionKey: string,
	): Promise<void> {
		setPendingActionKey(actionKey);
		setErrorMessage(null);
		setStatusMessage(null);
		try {
			const response = await fetch("/api/me/follows", {
				method: "DELETE",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(input),
			});
			const payload = (await response.json()) as ApiErrorPayload;
			if (!response.ok) {
				throw new Error(payload.error?.message ?? "Unable to delete follow.");
			}
			setStatusMessage(successMessage);
			await loadWorkspace();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unexpected follow delete failure.");
		} finally {
			setPendingActionKey(null);
		}
	}

	useEffect(() => {
		void loadWorkspace();
	}, []);

	useEffect(() => {
		if (availableSubjects.includes(selectedSubject)) {
			return;
		}
		setSelectedSubject(availableSubjects[0] ?? "");
	}, [availableSubjects, selectedSubject]);

	useEffect(() => {
		if (!selectedSubject) {
			setSuggestions([]);
			return;
		}

		let isCancelled = false;
		async function loadSuggestions(): Promise<void> {
			setIsSuggestionsLoading(true);
			try {
				const url = new URL("/api/me/follows/suggestions", window.location.origin);
				url.searchParams.set("subjectTag", selectedSubject);
				const response = await fetch(url.toString(), {
					method: "GET",
					headers: { "content-type": "application/json" },
				});
				const payload = (await response.json()) as FollowSuggestionsResponse | ApiErrorPayload;
				if (!response.ok) {
					throw new Error(payload.error?.message ?? "Unable to load creator suggestions.");
				}
				if (!("suggestions" in payload)) {
					throw new Error("Unexpected suggestions response.");
				}
				if (!isCancelled) {
					setSuggestions(payload.suggestions);
				}
			} catch (error) {
				if (!isCancelled) {
					setSuggestions([]);
					setErrorMessage(error instanceof Error ? error.message : "Unexpected suggestions failure.");
				}
			} finally {
				if (!isCancelled) {
					setIsSuggestionsLoading(false);
				}
			}
		}

		void loadSuggestions();
		return () => {
			isCancelled = true;
		};
	}, [selectedSubject]);

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="rounded-4xl border border-white/10 bg-ink/60 p-5">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Creator follows</p>
					<p className="mt-3 text-3xl font-serif text-white">{creatorFollows.length}</p>
					<p className="mt-2 text-sm text-peach/70">Blend whole-creator follows with subject-specific creator threads.</p>
				</div>
				<div className="rounded-4xl border border-white/10 bg-ink/60 p-5">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Subjects</p>
					<p className="mt-3 text-3xl font-serif text-white">{subjectFollows.length}</p>
					<p className="mt-2 text-sm text-peach/70">Subjects use your existing bookmark tags as the follow taxonomy.</p>
				</div>
				<div className="rounded-4xl border border-white/10 bg-ink/60 p-5">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Matched posts</p>
					<p className="mt-3 text-3xl font-serif text-white">{feedItems.length}</p>
					<p className="mt-2 text-sm text-peach/70">This feed is assembled from your saved bookmarks and current follow rules.</p>
				</div>
			</div>

			{errorMessage ? (
				<p role="alert" className="rounded-3xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-peach">
					{errorMessage}
				</p>
			) : null}
			{statusMessage ? <p className="text-sm text-peach/80">{statusMessage}</p> : null}

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
				<section className="rounded-5xl border border-white/10 bg-charcoal/80 p-6">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Subjects</p>
							<h2 className="mt-2 font-serif text-3xl text-white">Followed subjects</h2>
						</div>
					</div>
					{isLoading ? (
						<p className="mt-6 text-sm text-peach/70">Loading follows...</p>
					) : availableSubjects.length === 0 ? (
						<div className="mt-6 rounded-4xl border border-white/10 bg-ink/45 p-5">
							<p className="text-sm text-peach/70">
								Follow a subject from a bookmark tag to unlock creator suggestions for that thread.
							</p>
							<a
								href="/app/bookmarks"
								className="mt-4 inline-flex rounded-full bg-coral px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-coral-hover"
							>
								Open bookmarks
							</a>
						</div>
					) : (
						<div className="mt-6 flex flex-wrap gap-3">
							{availableSubjects.map((subjectTag) => {
								const active = subjectTag === selectedSubject;
								const directSubjectFollow = subjectFollows.find(
									(follow) => follow.subjectTag.trim().toLowerCase() === subjectTag.trim().toLowerCase(),
								);
								const actionKey = directSubjectFollow ? `delete-subject-${directSubjectFollow.id}` : `select-subject-${subjectTag}`;
								return (
									<div
										key={subjectTag}
										className={`rounded-3xl border px-4 py-3 ${
											active ? "border-coral bg-coral/10" : "border-white/10 bg-ink/45"
										}`}
									>
										<button
											type="button"
											onClick={() => setSelectedSubject(subjectTag)}
											className="text-left text-sm font-semibold text-white"
										>
											{subjectTag}
										</button>
										<p className="mt-1 text-xs text-peach/60">
											{directSubjectFollow ? "Direct subject follow" : "Referenced by creator-specific follow"}
										</p>
										{directSubjectFollow ? (
											<button
												type="button"
												disabled={pendingActionKey === actionKey}
												onClick={() => {
													void removeFollow(
														{ kind: "subject", followId: directSubjectFollow.id },
														`Removed ${subjectTag} subject follow.`,
														actionKey,
													);
												}}
												className="mt-3 rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
											>
												{pendingActionKey === actionKey ? "Removing..." : "Remove"}
											</button>
										) : null}
									</div>
								);
							})}
						</div>
					)}
				</section>

				<section className="rounded-5xl border border-white/10 bg-charcoal/80 p-6">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Suggestions</p>
					<h2 className="mt-2 font-serif text-3xl text-white">
						{selectedSubject ? `Creators for ${selectedSubject}` : "Creator suggestions"}
					</h2>
					{!selectedSubject ? (
						<div className="mt-6 rounded-4xl border border-white/10 bg-ink/45 p-5">
							<p className="text-sm text-peach/70">Select a followed subject to see recommended creators.</p>
							<a
								href="/app/bookmarks"
								className="mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
							>
								Follow from bookmarks
							</a>
						</div>
					) : isSuggestionsLoading ? (
						<p className="mt-6 text-sm text-peach/70">Loading suggestions...</p>
					) : suggestions.length === 0 ? (
						<div className="mt-6 rounded-4xl border border-white/10 bg-ink/45 p-5">
							<p className="text-sm text-peach/70">
								No suggestion candidates yet. Save more bookmarks for {selectedSubject} or follow creators directly from bookmarks.
							</p>
							<a
								href="/app/bookmarks"
								className="mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
							>
								Review tagged bookmarks
							</a>
						</div>
					) : (
						<div className="mt-6 space-y-3">
							{suggestions.map((suggestion) => {
								const actionKey = `suggestion-${suggestion.creatorUsername}-${suggestion.subjectTag}`;
								return (
									<div key={actionKey} className="rounded-4xl border border-white/10 bg-ink/55 p-4">
										<div className="flex items-start justify-between gap-4">
											<div>
												<p className="text-sm font-semibold text-white">@{suggestion.creatorUsername}</p>
												<p className="mt-1 text-xs text-peach/60">
													{suggestion.creatorName ?? "Saved creator"} • {suggestion.bookmarkCount} matching bookmark
													{suggestion.bookmarkCount === 1 ? "" : "s"}
												</p>
											</div>
											<button
												type="button"
												disabled={pendingActionKey === actionKey}
												onClick={() => {
													void saveFollow(
														{
															kind: "creator",
															creatorUsername: suggestion.creatorUsername,
															creatorName: suggestion.creatorName,
															creatorAvatarUrl: suggestion.creatorAvatarUrl,
															scope: "subject",
															subjectTag: suggestion.subjectTag,
														},
														`Now following @${suggestion.creatorUsername} for ${suggestion.subjectTag}.`,
														actionKey,
													);
												}}
												className="rounded-full bg-coral px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-coral-hover disabled:cursor-not-allowed disabled:opacity-60"
											>
												{pendingActionKey === actionKey ? "Saving..." : "Follow subject"}
											</button>
										</div>
										<p className="mt-3 text-xs text-peach/60">Most recent match: {formatDate(suggestion.latestBookmarkAt)}</p>
									</div>
								);
							})}
						</div>
					)}
				</section>
			</div>

			<section className="rounded-5xl border border-white/10 bg-charcoal/80 p-6">
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Creator follows</p>
				<h2 className="mt-2 font-serif text-3xl text-white">Who you follow</h2>
				{isLoading ? (
					<p className="mt-6 text-sm text-peach/70">Loading creator follows...</p>
				) : creatorFollows.length === 0 ? (
					<div className="mt-6 rounded-4xl border border-white/10 bg-ink/45 p-5">
						<p className="text-sm text-peach/70">
							No creator follows yet. Start from a bookmark and follow the creator feed or a specific subject thread.
						</p>
						<a
							href="/app/bookmarks"
							className="mt-4 inline-flex rounded-full bg-coral px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-coral-hover"
						>
							Find creators in bookmarks
						</a>
					</div>
				) : (
					<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
						{creatorFollows.map((follow) => {
							const actionKey = `creator-follow-${follow.id}`;
							return (
								<div key={follow.id} className="rounded-4xl border border-white/10 bg-ink/55 p-5">
									<div className="flex items-center gap-3">
										{follow.creatorAvatarUrl ? (
											<img
												src={follow.creatorAvatarUrl}
												alt={`${follow.creatorUsername} avatar`}
												className="h-11 w-11 rounded-full border border-white/20 object-cover"
											/>
										) : (
											<div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-charcoal text-sm font-semibold text-white">
												{avatarLabel(follow.creatorName, follow.creatorUsername)}
											</div>
										)}
										<div>
											<p className="text-sm font-semibold text-white">@{follow.creatorUsername}</p>
											<p className="text-xs text-peach/60">
												{follow.creatorName ?? "Saved creator"} • {follow.scope === "all_feed" ? "Entire saved feed" : `Subject: ${follow.subjectTag}`}
											</p>
										</div>
									</div>
									<p className="mt-4 text-xs text-peach/60">Updated {formatDate(follow.updatedAt)}</p>
									<button
										type="button"
										disabled={pendingActionKey === actionKey}
										onClick={() => {
											void removeFollow(
												{ kind: "creator", followId: follow.id },
												`Removed @${follow.creatorUsername} from following.`,
												actionKey,
											);
										}}
										className="mt-4 rounded-full border border-white/20 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{pendingActionKey === actionKey ? "Removing..." : "Remove follow"}
									</button>
								</div>
							);
						})}
					</div>
				)}
			</section>

			<section className="rounded-5xl border border-white/10 bg-charcoal/80 p-6">
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Feed</p>
				<h2 className="mt-2 font-serif text-3xl text-white">Matched saved posts</h2>
				{isLoading ? (
					<p className="mt-6 text-sm text-peach/70">Loading following feed...</p>
				) : feedItems.length === 0 ? (
					<div className="mt-6 rounded-4xl border border-white/10 bg-ink/45 p-5">
						<p className="text-sm text-peach/70">
							No saved posts match your current follows yet. Save more bookmarks or broaden a creator to the full feed.
						</p>
						<a
							href="/app/bookmarks"
							className="mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
						>
							Add more bookmarks
						</a>
					</div>
				) : (
					<div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
						{feedItems.map((item) => (
							<article key={item.id} className="rounded-4xl border border-white/10 bg-ink/55 p-5">
								<div className="flex flex-wrap items-center gap-2">
									{item.tags.map((tag) => (
										<span
											key={tag}
											className="rounded-full border border-coral/40 bg-coral/10 px-2.5 py-1 text-[11px] uppercase tracking-wider text-coral"
										>
											{tag}
										</span>
									))}
								</div>
								<div className="mt-4 flex items-center justify-between gap-4">
									<div>
										<p className="text-sm font-semibold text-white">@{item.authorUsername}</p>
										<p className="mt-1 text-xs text-peach/60">{describeMatch(item)}</p>
									</div>
									<p className="text-xs text-peach/50">{formatDate(item.updatedAt)}</p>
								</div>
								<p className="mt-4 text-sm leading-relaxed text-peach/90">{item.tweetText}</p>
								<a
									href={bookmarkUrl(item)}
									target="_blank"
									rel="noopener noreferrer"
									className="mt-5 inline-flex rounded-full border border-white/20 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
								>
									Open on X
								</a>
							</article>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
