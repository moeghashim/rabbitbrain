import { SignIn } from "@clerk/nextjs";
import React from "react";

export default function SignInPage() {
	return (
		<main className="min-h-screen bg-ink px-6 py-24">
			<div className="mx-auto flex max-w-6xl justify-center">
				<SignIn routing="path" path="/sign-in" forceRedirectUrl="/app" />
			</div>
		</main>
	);
}
