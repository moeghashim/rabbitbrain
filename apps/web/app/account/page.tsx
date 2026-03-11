import Link from "next/link";
import React from "react";

import { AccountSettingsPanel } from "../../components/account-settings-panel.js";
import { SignOutButton } from "../../components/sign-out-button.js";

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
					<div className="mt-6">
						<AccountSettingsPanel />
					</div>
					<div className="mt-6">
						<SignOutButton />
					</div>
				</section>
			</div>
		</main>
	);
}
