import Link from "next/link";
import React from "react";

export default function AccountPage() {
	return (
		<main className="min-h-screen bg-ink px-6 py-16 text-peach">
			<div className="mx-auto flex max-w-4xl flex-col gap-8">
				<header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-coral">Account</p>
						<h1 className="mt-2 font-serif text-5xl text-white">Profile and Preferences</h1>
						<p className="mt-3 text-peach/70">Set defaults for model and study cadence, then return to your workspace.</p>
					</div>
					<Link href="/app" className="rounded-[48px] border border-white/20 px-5 py-2 text-sm font-semibold text-white">
						Back to Dashboard
					</Link>
				</header>

				<section className="rounded-5xl border border-white/10 bg-charcoal/90 p-8">
					<h2 className="font-serif text-3xl text-white">Learning Preferences</h2>
					<form action="/api/me/preferences" method="post" className="mt-6 flex flex-col gap-5">
						<div>
							<label htmlFor="defaultModel" className="text-sm font-semibold uppercase tracking-widest text-peach/70">
								Default model
							</label>
							<select
								id="defaultModel"
								name="defaultModel"
								className="mt-2 w-full rounded-4xl border border-white/20 bg-ink/70 px-5 py-4 text-white"
							>
								<option value="gpt-4.1">gpt-4.1</option>
								<option value="gpt-4.1-mini">gpt-4.1-mini</option>
							</select>
						</div>
						<div>
							<label htmlFor="learningMinutes" className="text-sm font-semibold uppercase tracking-widest text-peach/70">
								Minutes per day
							</label>
							<input
								id="learningMinutes"
								name="learningMinutes"
								type="number"
								defaultValue={10}
								min={5}
								max={120}
								className="mt-2 w-full rounded-4xl border border-white/20 bg-ink/70 px-5 py-4 text-white"
							/>
						</div>
						<div className="flex flex-wrap gap-3">
							<button
								type="submit"
								className="rounded-[48px] bg-coral px-7 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-coral-hover"
							>
								Save Preferences
							</button>
							<button
								formAction="/sign-out"
								type="submit"
								className="rounded-[48px] border border-white/25 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
							>
								Sign Out
							</button>
						</div>
					</form>
				</section>
			</div>
		</main>
	);
}
