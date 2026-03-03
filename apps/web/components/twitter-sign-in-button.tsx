"use client";

import { signIn } from "next-auth/react";
import React from "react";

export function TwitterSignInButton({ callbackUrl }: Readonly<{ callbackUrl: string }>) {
	return (
		<button
			id="twitter-sign-in-button"
			data-callback-url={callbackUrl}
			type="button"
			onClick={() => {
				void signIn("twitter", { callbackUrl });
			}}
			className="mt-8 inline-flex rounded-[48px] bg-coral px-8 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-coral-hover"
		>
			Continue with Twitter
		</button>
	);
}
