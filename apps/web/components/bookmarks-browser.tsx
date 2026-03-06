"use client";

import { parseBookmarkTags, validateBookmarkTags } from "@pi-starter/contracts/bookmark-tags";
import type { SavedBookmark } from "@pi-starter/contracts";
import { buildBookmarkCanonicalUrl, buildBookmarksArchiveFileName, buildBookmarksMarkdownArchive } from "../src/bookmarks/export-markdown.js";
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

interface BookmarkTagFilterOption {
	key: string;
	label: string;
	count: number;
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

function bookmarkAvatarLabel(bookmark: SavedBookmark): string {
	const preferred = bookmark.authorName ?? bookmark.authorUsername;
	const firstChar = preferred.trim().charAt(0);
	return firstChar.length > 0 ? firstChar.toUpperCase() : "X";
}

function buildTagFilterOptions(bookmarks: SavedBookmark[]): BookmarkTagFilterOption[] {
	const byKey = new Map<string, BookmarkTagFilterOption>();
	for (const bookmark of bookmarks) {
		const uniqueTags = new Set<string>();
		for (const tag of bookmark.tags) {
			const key = tag.trim().toLowerCase();
			if (!key || uniqueTags.has(key)) {
				continue;
			}
			uniqueTags.add(key);

			const existing = byKey.get(key);
			if (existing) {
				byKey.set(key, { ...existing, count: existing.count + 1 });
				continue;
			}

			byKey.set(key, {
				key,
				label: tag.trim(),
				count: 1,
			});
		}
	}

	return Array.from(byKey.values()).sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: "base" }));
}

export function filterBookmarksByTags(bookmarks: SavedBookmark[], selectedTagKeys: string[]): SavedBookmark[] {
	if (selectedTagKeys.length === 0) {
		return bookmarks;
	}

	const normalizedKeys = new Set(selectedTagKeys.map((tagKey) => tagKey.trim().toLowerCase()).filter((tagKey) => tagKey.length > 0));
	if (normalizedKeys.size === 0) {
		return bookmarks;
	}

	return bookmarks.filter((bookmark) => bookmark.tags.some((tag) => normalizedKeys.has(tag.trim().toLowerCase())));
}

export function BookmarksBrowser() {
	const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
	const [viewMode, setViewMode] = useState<BookmarkViewMode>("tile");
	const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
	const [selectedBookmark, setSelectedBookmark] = useState<SavedBookmark | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [panelTagsInput, setPanelTagsInput] = useState("");
	const [panelErrorMessage, setPanelErrorMessage] = useState<string | null>(null);
	const [panelSuccessMessage, setPanelSuccessMessage] = useState<string | null>(null);
	const [isUpdatingTags, setIsUpdatingTags] = useState(false);
	const [isDeletingBookmark, setIsDeletingBookmark] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [exportMessage, setExportMessage] = useState<string | null>(null);

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

	const tagFilterOptions = useMemo(() => buildTagFilterOptions(bookmarks), [bookmarks]);

	const filteredBookmarks = useMemo(() => filterBookmarksByTags(bookmarks, activeTagFilters), [bookmarks, activeTagFilters]);

	useEffect(() => {
		const availableTagKeys = new Set(tagFilterOptions.map((option) => option.key));
		setActiveTagFilters((current) => current.filter((tagKey) => availableTagKeys.has(tagKey)));
	}, [tagFilterOptions]);

	function toggleTagFilter(tagKey: string): void {
		setActiveTagFilters((current) => {
			if (current.includes(tagKey)) {
				return current.filter((entry) => entry !== tagKey);
			}
			return [...current, tagKey];
		});
	}

	async function exportVisibleBookmarks(): Promise<void> {
		if (filteredBookmarks.length === 0 || typeof window === "undefined") {
			return;
		}

		setIsExporting(true);
		setExportMessage(null);
		try {
			const archive = buildBookmarksMarkdownArchive(filteredBookmarks);
			const fileName = buildBookmarksArchiveFileName(activeTagFilters);
			const blobBytes = Uint8Array.from(archive);
			const blob = new Blob([blobBytes.buffer], { type: "application/zip" });
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = fileName;
			document.body.append(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(downloadUrl);
			setExportMessage(`Exported ${filteredBookmarks.length} bookmark${filteredBookmarks.length === 1 ? "" : "s"} as Markdown.`);
		} catch (error) {
			setExportMessage(error instanceof Error ? error.message : "Unexpected export failure.");
		} finally {
			setIsExporting(false);
		}
	}

	async function updateSelectedBookmarkTags(): Promise<void> {
		if (!selectedBookmark) {
			return;
		}

		const parsedTags = parseBookmarkTags(panelTagsInput);
		const validationError = validateBookmarkTags(parsedTags);
		if (validationError) {
			setPanelErrorMessage(validationError);
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
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<p className="text-sm text-peach/70">Open any card to read the full tweet in the side panel. Filter by one or more tags.</p>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<button
							id="bookmarks-export-button"
							type="button"
							disabled={isLoading || filteredBookmarks.length === 0 || isExporting}
							onClick={() => {
								void exportVisibleBookmarks();
							}}
							className="inline-flex items-center justify-center rounded-[18px] border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isExporting ? "Exporting..." : "Export Markdown"}
						</button>
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
				</div>
				{exportMessage ? <p className="text-xs text-peach/70">{exportMessage}</p> : null}
				{tagFilterOptions.length > 0 ? (
					<div className="flex flex-wrap items-center gap-2">
						<button
							id="bookmarks-filter-all"
							type="button"
							aria-pressed={activeTagFilters.length === 0}
							onClick={() => setActiveTagFilters([])}
							className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
								activeTagFilters.length === 0
									? "border-coral bg-coral text-white"
									: "border-white/20 text-peach/70 hover:border-coral/40 hover:text-white"
							}`}
						>
							All tags
						</button>
						{tagFilterOptions.map((option) => {
							const isActive = activeTagFilters.includes(option.key);
							return (
								<button
									key={option.key}
									type="button"
									aria-pressed={isActive}
									onClick={() => {
										toggleTagFilter(option.key);
									}}
									className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
										isActive
											? "border-coral bg-coral/20 text-coral"
											: "border-white/20 text-peach/70 hover:border-coral/40 hover:text-white"
									}`}
								>
									{option.label} ({option.count})
								</button>
							);
						})}
					</div>
				) : null}

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
				) : filteredBookmarks.length === 0 ? (
					<div className="rounded-4xl border border-white/10 bg-ink/60 p-6">
						<p className="text-sm text-peach/70">No bookmarks match the selected tags.</p>
						<button
							type="button"
							onClick={() => setActiveTagFilters([])}
							className="mt-3 inline-flex rounded-[16px] border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
						>
							Clear Filters
						</button>
					</div>
				) : (
					<div id="bookmarks-list" className={listContainerClass}>
						{filteredBookmarks.map((bookmark) => (
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
