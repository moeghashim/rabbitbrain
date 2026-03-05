import React from "react";

import { AppWorkspaceNav } from "../../../components/app-workspace-nav.js";
import { BookmarksBrowser } from "../../../components/bookmarks-browser.js";

export default function AppBookmarksPage() {
	return (
		<div className="min-h-screen bg-ink text-peach">
			<AppWorkspaceNav activeItem="Bookmarks" />
			<main className="px-6 pb-16 pt-10">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
					<section className="rounded-5xl border border-white/10 bg-charcoal/90 p-8">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Workspace</p>
						<h1 className="mt-3 font-serif text-4xl text-white">Bookmarks</h1>
						<p className="mt-3 max-w-3xl text-sm text-peach/70 md:text-base">
							Review saved tweets by tag, switch between tile and row views, and open full tweet details in the slide-over panel.
						</p>
						<div className="mt-8">
							<BookmarksBrowser />
						</div>
					</section>
				</div>
			</main>
		</div>
	);
}
