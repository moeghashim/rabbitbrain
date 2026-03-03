import Link from "next/link";
import React from "react";

function resolveCallbackUrl(searchParams: { redirect_url?: string | string[] }): string {
	const raw = searchParams.redirect_url;
	const value = Array.isArray(raw) ? raw[0] : raw;
	if (!value || value.trim().length === 0) {
		return "/app";
	}
	if (!value.startsWith("/")) {
		return "/app";
	}
	return value;
}

export default function SignInPage({
	searchParams,
}: Readonly<{
	searchParams: { redirect_url?: string | string[] };
}>) {
	const callbackUrl = resolveCallbackUrl(searchParams);
	const authUrl = `/api/auth/signin/twitter?callbackUrl=${encodeURIComponent(callbackUrl)}`;

	return (
		<main className="min-h-screen bg-ink px-6 py-24 text-peach">
			<div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-5xl border border-white/10 bg-charcoal/90 p-10 text-center">
				<p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">X Authentication</p>
				<h1 className="mt-4 font-serif text-5xl text-white">Sign in with X</h1>
				<p className="mt-4 text-peach/70">Use your X account to access your dashboard and account data.</p>
				<Link
					href={authUrl}
					className="mt-8 inline-flex rounded-[48px] bg-coral px-8 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-coral-hover"
				>
					Continue with X
				</Link>
			</div>
		</main>
	);
}
