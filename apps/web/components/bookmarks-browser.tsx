"use client";

import type { SavedBookmark } from "@pi-starter/contracts";
import React, { useEffect, useMemo, useState } from "react";

type BookmarkViewMode = "tile" | "row";

interface BookmarksResponseSuccess {
	bookmarks: SavedBookmark[];
}

interface BookmarksResponseError {
	error?: {
		code?: string;
		message?: string;
	};
}

interface DeleteBookmarkResponseSuccess {
	bookmarkId: string;
}

function formatBookmarkDate(timestamp: number): string {
	return new Date(timestamp).toLocaleString();
}

function truncateForPreview(text: string, maxLength = 170): string {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength).trimEnd()}…`;
}

function buildBookmarkCanonicalUrl(bookmark: SavedBookmark): string {
	const rawUrl = bookmark.tweetUrlOrId.trim();
	if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
		return rawUrl;
	}
	return `https://x.com/${bookmark.authorUsername}/status/${bookmark.tweetId}`;
}

function bookmarkAvatarLabel(bookmark: SavedBookmark): string {
	const preferred = bookmark.authorName ?? bookmark.authorUsername;
	const firstChar = preferred.trim().charAt(0);
	return firstChar.length > 0 ? firstChar.toUpperCase() : "X";
}

function parseBookmarkTags(input: string): string[] {
	const tags = input
		.split(",")
		.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0);
	const seen = new Set<string>();
	const deduped: string[] = [];

	for (const tag of tags) {
		const key = tag.toLowerCase();
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		deduped.push(tag);
	}

	return deduped;
}

export function BookmarksBrowser() {
	const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
	const [viewMode, setViewMode] = useState<BookmarkViewMode>("tile");
	const [selectedBookmark, setSelectedBookmark] = useState<SavedBookmark | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [panelTagsInput, setPanelTagsInput] = useState("");
	const [panelErrorMessage, setPanelErrorMessage] = useState<string | null>(null);
	const [panelSuccessMessage, setPanelSuccessMessage] = useState<string | null>(null);
	const [isUpdatingTags, setIsUpdatingTags] = useState(false);
	const [isDeletingBookmark, setIsDeletingBookmark] = useState(false);

	useEffect(() => {
		let isCancelled = false;

		async function loadBookmarks(): Promise<void> {
			setIsLoading(true);
			setErrorMessage(null);
			try {
				const response = await fetch("/api/bookmarks", {
					method: "GET",
					headers: {
						"content-type": "application/json",
					},
				});
				const payload = (await response.json()) as BookmarksResponseSuccess | BookmarksResponseError;
				if (!response.ok) {
					const fallbackMessage = "Unable to load bookmarks right now.";
					const message = "error" in payload && payload.error?.message ? payload.error.message : fallbackMessage;
					if (!isCancelled) {
						setErrorMessage(message);
						setBookmarks([]);
					}
					return;
				}
				if (!("bookmarks" in payload)) {
					if (!isCancelled) {
						setErrorMessage("Unexpected bookmarks response.");
						setBookmarks([]);
					}
					return;
				}

				if (!isCancelled) {
					setBookmarks(payload.bookmarks);
				}
			} catch (error) {
				if (!isCancelled) {
					setErrorMessage(error instanceof Error ? error.message : "Unexpected network failure while loading bookmarks.");
					setBookmarks([]);
				}
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		}

		void loadBookmarks();
		return () => {
			isCancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!selectedBookmark) {
			return;
		}

		const activeBookmark = bookmarks.find((bookmark) => bookmark.id === selectedBookmark.id);
		if (activeBookmark) {
			setSelectedBookmark(activeBookmark);
			return;
		}
		if (!activeBookmark) {
			setSelectedBookmark(null);
		}
	}, [bookmarks, selectedBookmark]);

	useEffect(() => {
		if (!selectedBookmark) {
			setPanelTagsInput("");
			setPanelErrorMessage(null);
			setPanelSuccessMessage(null);
			return;
		}
		setPanelTagsInput(selectedBookmark.tags.join(", "));
		setPanelErrorMessage(null);
		setPanelSuccessMessage(null);
	}, [selectedBookmark]);

	useEffect(() => {
		if (!selectedBookmark) {
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setSelectedBookmark(null);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [selectedBookmark]);

	const listContainerClass = useMemo(() => {
		if (viewMode === "tile") {
			return "grid grid-cols-1 gap-4 md:grid-cols-2";
		}
		return "flex flex-col gap-3";
	}, [viewMode]);

	async function updateSelectedBookmarkTags(): Promise<void> {
		if (!selectedBookmark) {
			return;
		}

		const parsedTags = parseBookmarkTags(panelTagsInput);
		if (parsedTags.length === 0) {
			setPanelErrorMessage("Add at least one tag.");
			setPanelSuccessMessage(null);
			return;
		}
		if (parsedTags.length > 8) {
			setPanelErrorMessage("Use up to 8 tags per tweet.");
			setPanelSuccessMessage(null);
			return;
		}
		if (parsedTags.some((tag) => tag.length > 24)) {
			setPanelErrorMessage("Each tag must be 24 characters or fewer.");
			setPanelSuccessMessage(null);
			return;
		}

		setIsUpdatingTags(true);
		setPanelErrorMessage(null);
		setPanelSuccessMessage(null);
		try {
			const response = await fetch("/api/bookmarks", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					bookmarkId: selectedBookmark.id,
					tags: parsedTags,
				}),
			});
			const payload = (await response.json()) as SavedBookmark | BookmarksResponseError;
			if (!response.ok) {
				const fallbackMessage = "Unable to update tags right now.";
				const message = "error" in payload && payload.error?.message ? payload.error.message : fallbackMessage;
				setPanelErrorMessage(message);
				return;
			}

			if (!("id" in payload)) {
				setPanelErrorMessage("Unexpected response while updating tags.");
				return;
			}

			setBookmarks((current) =>
				current
					.map((bookmark) => (bookmark.id === payload.id ? payload : bookmark))
					.sort((left, right) => right.updatedAt - left.updatedAt),
			);
			setSelectedBookmark(payload);
			setPanelTagsInput(payload.tags.join(", "));
			setPanelSuccessMessage("Tags updated.");
		} catch (error) {
			setPanelErrorMessage(error instanceof Error ? error.message : "Unexpected network failure while updating tags.");
		} finally {
			setIsUpdatingTags(false);
		}
	}

	async function deleteSelectedBookmark(): Promise<void> {
		if (!selectedBookmark) {
			return;
		}
		if (typeof window !== "undefined") {
			const approved = window.confirm("Delete this bookmarked tweet?");
			if (!approved) {
				return;
			}
		}

		setIsDeletingBookmark(true);
		setPanelErrorMessage(null);
		setPanelSuccessMessage(null);
		try {
			const response = await fetch("/api/bookmarks", {
				method: "DELETE",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					bookmarkId: selectedBookmark.id,
				}),
			});
			const payload = (await response.json()) as DeleteBookmarkResponseSuccess | BookmarksResponseError;
			if (!response.ok) {
				const fallbackMessage = "Unable to delete bookmark right now.";
				const message = "error" in payload && payload.error?.message ? payload.error.message : fallbackMessage;
				setPanelErrorMessage(message);
				return;
			}
			if (!("bookmarkId" in payload)) {
				setPanelErrorMessage("Unexpected response while deleting bookmark.");
				return;
			}

			setBookmarks((current) => current.filter((bookmark) => bookmark.id !== payload.bookmarkId));
			setSelectedBookmark(null);
		} catch (error) {
			setPanelErrorMessage(error instanceof Error ? error.message : "Unexpected network failure while deleting bookmark.");
		} finally {
			setIsDeletingBookmark(false);
		}
	}

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-peach/70">Open any card to read the full tweet in the side panel.</p>
				<div className="inline-flex rounded-[18px] border border-white/15 bg-ink/60 p-1">
					<button
						id="bookmarks-view-tile"
						type="button"
						aria-pressed={viewMode === "tile"}
						onClick={() => setViewMode("tile")}
						className={`rounded-[14px] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
							viewMode === "tile" ? "bg-coral text-white" : "text-peach/70 hover:text-white"
						}`}
					>
						Tile
					</button>
					<button
						id="bookmarks-view-row"
						type="button"
						aria-pressed={viewMode === "row"}
						onClick={() => setViewMode("row")}
						className={`rounded-[14px] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
							viewMode === "row" ? "bg-coral text-white" : "text-peach/70 hover:text-white"
						}`}
					>
						Row
					</button>
				</div>
			</div>

			{isLoading ? (
				<div className="rounded-4xl border border-white/10 bg-ink/60 p-6">
					<p className="text-sm text-peach/70">Loading bookmarks...</p>
				</div>
			) : errorMessage ? (
				<p role="alert" className="rounded-3xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-peach">
					{errorMessage}
				</p>
			) : bookmarks.length === 0 ? (
				<div className="rounded-4xl border border-white/10 bg-ink/60 p-6">
					<p className="text-sm text-peach/70">
						No bookmarks yet. Analyze a tweet and save it with tags from the dashboard.
					</p>
				</div>
			) : (
				<div id="bookmarks-list" className={listContainerClass}>
					{bookmarks.map((bookmark) => (
						<button
							key={bookmark.id}
							type="button"
							onClick={() => setSelectedBookmark(bookmark)}
							className={`rounded-4xl border border-white/10 bg-ink/65 p-5 text-left transition-all hover:border-coral/40 hover:bg-ink/80 ${
								viewMode === "row" ? "w-full" : ""
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex flex-wrap gap-2">
									{bookmark.tags.map((tag) => (
										<span key={tag} className="rounded-full border border-coral/40 bg-coral/10 px-2.5 py-1 text-[11px] uppercase tracking-wider text-coral">
											{tag}
										</span>
									))}
								</div>
								<span className="text-xs text-peach/50">{formatBookmarkDate(bookmark.updatedAt)}</span>
							</div>
							<div className="mt-4 flex items-center gap-3">
								{bookmark.authorAvatarUrl ? (
									<img
										src={bookmark.authorAvatarUrl}
										alt={`${bookmark.authorUsername} avatar`}
										className="h-9 w-9 rounded-full border border-white/20 object-cover"
									/>
								) : (
									<div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-charcoal text-sm font-semibold text-white">
										{bookmarkAvatarLabel(bookmark)}
									</div>
								)}
								<p className="text-sm font-semibold text-white">@{bookmark.authorUsername}</p>
							</div>
							<p className="mt-3 text-sm leading-relaxed text-peach/90">{truncateForPreview(bookmark.tweetText)}</p>
						</button>
					))}
				</div>
			)}

			{selectedBookmark ? (
				<div className="fixed inset-0 z-50">
					<button
						type="button"
						aria-label="Close bookmark details"
						onClick={() => setSelectedBookmark(null)}
						className="absolute inset-0 bg-black/65"
					/>
					<aside className="absolute right-0 top-0 h-full w-full border-l border-white/10 bg-charcoal p-6 shadow-2xl sm:w-[520px]">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Saved Tweet</p>
								<p className="mt-2 text-sm text-peach/70">Updated {formatBookmarkDate(selectedBookmark.updatedAt)}</p>
							</div>
							<button
								id="bookmark-panel-close"
								type="button"
								onClick={() => setSelectedBookmark(null)}
								className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
							>
								Close
							</button>
						</div>
						<div className="mt-6 flex items-center gap-3">
							{selectedBookmark.authorAvatarUrl ? (
								<img
									src={selectedBookmark.authorAvatarUrl}
									alt={`${selectedBookmark.authorUsername} avatar`}
									className="h-10 w-10 rounded-full border border-white/20 object-cover"
								/>
							) : (
								<div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-ink text-sm font-semibold text-white">
									{bookmarkAvatarLabel(selectedBookmark)}
								</div>
							)}
							<div>
								<p className="text-sm font-semibold text-white">{selectedBookmark.authorName ?? selectedBookmark.authorUsername}</p>
								<p className="text-xs text-peach/60">@{selectedBookmark.authorUsername}</p>
							</div>
						</div>
						<p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-peach/95">{selectedBookmark.tweetText}</p>
						<div className="mt-5 flex flex-wrap gap-2">
							{selectedBookmark.tags.map((tag) => (
								<span key={tag} className="rounded-full border border-coral/35 bg-coral/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-coral">
									{tag}
								</span>
							))}
						</div>
						<div id="bookmark-tags-editor" className="mt-6 rounded-3xl border border-white/10 bg-ink/45 p-4">
							<label htmlFor="bookmark-tags-edit-input" className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">
								Edit Tags
							</label>
							<input
								id="bookmark-tags-edit-input"
								type="text"
								value={panelTagsInput}
								onChange={(event) => {
									setPanelTagsInput(event.target.value);
									setPanelSuccessMessage(null);
								}}
								placeholder="strategy, growth, writing"
								className="mt-3 w-full rounded-[16px] border border-white/20 bg-charcoal/70 px-4 py-3 text-sm text-white placeholder:text-peach/40 focus:border-coral focus:outline-none"
							/>
							<div className="mt-3 flex flex-col gap-2 sm:flex-row">
								<button
									id="bookmark-update-tags-button"
									type="button"
									onClick={() => {
										void updateSelectedBookmarkTags();
									}}
									disabled={isUpdatingTags || isDeletingBookmark}
									className="inline-flex items-center justify-center rounded-[16px] bg-coral px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-coral-hover disabled:cursor-not-allowed disabled:opacity-60"
								>
									{isUpdatingTags ? "Saving..." : "Save Tags"}
								</button>
								<button
									id="bookmark-delete-button"
									type="button"
									onClick={() => {
										void deleteSelectedBookmark();
									}}
									disabled={isDeletingBookmark || isUpdatingTags}
									className="inline-flex items-center justify-center rounded-[16px] border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{isDeletingBookmark ? "Deleting..." : "Delete Tweet"}
								</button>
							</div>
							{panelErrorMessage ? (
								<p role="alert" className="mt-3 rounded-2xl border border-coral/35 bg-coral/10 px-3 py-2 text-xs text-peach">
									{panelErrorMessage}
								</p>
							) : null}
							{panelSuccessMessage ? (
								<p className="mt-3 text-xs text-peach/80">{panelSuccessMessage}</p>
							) : null}
						</div>
						<a
							href={buildBookmarkCanonicalUrl(selectedBookmark)}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-7 inline-flex rounded-[20px] bg-coral px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-hover"
						>
							Open on X
						</a>
					</aside>
				</div>
			) : null}
		</div>
	);
}
