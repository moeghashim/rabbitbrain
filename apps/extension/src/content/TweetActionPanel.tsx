import type { AnalyzeTweetResponse } from "@pi-starter/contracts";
import React from "react";

export type PanelStatus = "idle" | "loading" | "auth-pending" | "error" | "success";

export interface TweetActionPanelProps {
	status: PanelStatus;
	tweetUrl: string;
	analysisResult: AnalyzeTweetResponse | null;
	tagsInput: string;
	errorMessage: string | null;
	authMessage: string | null;
	saveMessage: string | null;
	isSaving: boolean;
	onAnalyze: () => void;
	onToggleConcept: (conceptName: string) => void;
	onChangeTagsInput: (value: string) => void;
	onSaveBookmark: () => void;
}

function formatInteractionCount(value: number): string {
	return new Intl.NumberFormat(undefined, {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(value);
}

export function TweetActionPanel({
	status,
	tweetUrl,
	analysisResult,
	tagsInput,
	errorMessage,
	authMessage,
	saveMessage,
	isSaving,
	onAnalyze,
	onToggleConcept,
	onChangeTagsInput,
	onSaveBookmark,
}: Readonly<TweetActionPanelProps>) {
	return (
		<section className="rb-shell">
			<div className="rb-header">
				<div>
					<p className="rb-kicker">Rabbitbrain for X</p>
					<h3 className="rb-title">Analyze public X posts and save tagged insights to Rabbitbrain.</h3>
				</div>
				<button type="button" className="rb-button" onClick={onAnalyze} disabled={status === "loading"}>
					{status === "loading" ? "Analyzing..." : "Analyze"}
				</button>
			</div>

			<p className="rb-caption">{tweetUrl}</p>

			{status === "auth-pending" && authMessage ? <p className="rb-banner rb-banner--info">{authMessage}</p> : null}
			{status === "error" && errorMessage ? <p className="rb-banner rb-banner--error">{errorMessage}</p> : null}

			{status === "success" && analysisResult ? (
				<div className="rb-stack">
					<div className="rb-card-grid">
						<section className="rb-card rb-card--tweet">
							<div className="rb-author">
								{analysisResult.tweet.authorAvatarUrl ? (
									<img
										src={analysisResult.tweet.authorAvatarUrl}
										alt={analysisResult.tweet.authorName ? `${analysisResult.tweet.authorName} avatar` : "Tweet author avatar"}
										className="rb-avatar"
									/>
								) : (
									<div className="rb-avatar rb-avatar--fallback">
										{analysisResult.tweet.authorName?.charAt(0) ?? analysisResult.tweet.authorUsername?.charAt(0) ?? "X"}
									</div>
								)}
								<div>
									<p className="rb-author-name">{analysisResult.tweet.authorName ?? "Unknown author"}</p>
									<p className="rb-author-handle">@{analysisResult.tweet.authorUsername ?? "unknown"}</p>
								</div>
							</div>
							<p className="rb-tweet-text">{analysisResult.tweet.text}</p>
							{analysisResult.tweet.publicMetrics ? (
								<div className="rb-chip-row">
									{typeof analysisResult.tweet.publicMetrics.replyCount === "number" ? (
										<span className="rb-chip">
											<strong>{formatInteractionCount(analysisResult.tweet.publicMetrics.replyCount)}</strong> Replies
										</span>
									) : null}
									{typeof analysisResult.tweet.publicMetrics.likeCount === "number" ? (
										<span className="rb-chip">
											<strong>{formatInteractionCount(analysisResult.tweet.publicMetrics.likeCount)}</strong> Likes
										</span>
									) : null}
									{typeof analysisResult.tweet.publicMetrics.repostCount === "number" ? (
										<span className="rb-chip">
											<strong>{formatInteractionCount(analysisResult.tweet.publicMetrics.repostCount)}</strong> Reposts
										</span>
									) : null}
								</div>
							) : null}
						</section>

						<section className="rb-card rb-card--analysis">
							<p className="rb-kicker">Analysis</p>
							<h4 className="rb-analysis-title">{analysisResult.analysis.topic}</h4>
							<p className="rb-analysis-summary">{analysisResult.analysis.summary}</p>
							<p className="rb-analysis-intent">
								<span>Intent:</span> {analysisResult.analysis.intent}
							</p>
							<div className="rb-chip-row">
								{analysisResult.analysis.novelConcepts.map((concept) => (
									<button
										key={concept.name}
										type="button"
										className="rb-chip rb-chip--button"
										onClick={() => {
											onToggleConcept(concept.name);
										}}
									>
										{concept.name}
									</button>
								))}
							</div>
						</section>
					</div>

					{analysisResult.thread && analysisResult.thread.tweets.length > 1 ? (
						<section className="rb-card rb-card--tweet">
							<p className="rb-kicker">Thread</p>
							<p className="rb-bookmark-copy">
								Showing all {analysisResult.thread.tweets.length} posts in the analyzed thread.
							</p>
							<div className="rb-stack">
								{analysisResult.thread.tweets.map((tweet, index) => (
									<div key={tweet.id} className="rb-card rb-card--tweet">
										<p className="rb-caption">Post {index + 1}</p>
										<p className="rb-tweet-text">{tweet.text}</p>
									</div>
								))}
							</div>
						</section>
					) : null}

					<section className="rb-card rb-card--bookmark">
						<div className="rb-bookmark-header">
							<div>
								<p className="rb-kicker">Save Tweet</p>
								<p className="rb-bookmark-copy">Tags are prefilled from the analysis chips and remain editable before saving.</p>
							</div>
							<a className="rb-link" href="https://rabbitbrain.app/app/bookmarks" target="_blank" rel="noreferrer">
								Open Bookmarks
							</a>
						</div>
						<div className="rb-bookmark-controls">
							<input
								type="text"
								value={tagsInput}
								onChange={(event) => {
									onChangeTagsInput(event.target.value);
								}}
								placeholder="strategy, writing, growth"
								className="rb-input"
							/>
							<button type="button" className="rb-button" onClick={onSaveBookmark} disabled={isSaving}>
								{isSaving ? "Saving..." : "Save to Bookmarks"}
							</button>
						</div>
						{errorMessage ? <p className="rb-banner rb-banner--error">{errorMessage}</p> : null}
						{saveMessage ? <p className="rb-banner rb-banner--success">{saveMessage}</p> : null}
					</section>
				</div>
			) : null}
		</section>
	);
}
