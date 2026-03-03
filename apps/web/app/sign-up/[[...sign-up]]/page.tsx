import { SignUp } from "@clerk/nextjs";
import React from "react";

export default function SignUpPage() {
	return (
		<main className="min-h-screen bg-ink px-6 py-24">
			<div className="mx-auto flex max-w-6xl justify-center">
				<SignUp routing="path" path="/sign-up" forceRedirectUrl="/app" />
			</div>
		</main>
	);
}
