import React from "react";

export default function AppHomePage() {
	return (
		<main className="min-h-screen bg-ink px-6 py-16 text-peach">
			<div className="mx-auto max-w-6xl">
				<h1 className="font-serif text-6xl text-white">Workspace</h1>
				<p className="mt-4 max-w-2xl text-peach/70">
					Your account workspace is protected by Clerk middleware. Analysis history and track generation will appear
					here in the next features.
				</p>
			</div>
		</main>
	);
}
