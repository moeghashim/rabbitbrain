import Link from "next/link";
import React from "react";

export default function SignUpPage() {
	return (
		<main className="min-h-screen bg-ink px-6 py-24 text-peach">
			<div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-5xl border border-white/10 bg-charcoal/90 p-10 text-center">
				<p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">X Authentication</p>
				<h1 className="mt-4 font-serif text-5xl text-white">Create your account with X</h1>
				<p className="mt-4 text-peach/70">Authentication is X-only in this release. Continue with your X account.</p>
				<Link
					href="/api/auth/signin/twitter?callbackUrl=%2Fapp"
					className="mt-8 inline-flex rounded-[48px] bg-coral px-8 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-coral-hover"
				>
					Continue with X
				</Link>
			</div>
		</main>
	);
}
