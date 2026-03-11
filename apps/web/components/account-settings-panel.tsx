"use client";

import { PROVIDER_OPTIONS, getProviderCatalogEntry } from "@pi-starter/ai";
import type { ProviderCredentialSummary, ProviderId, UserPreferencesResult } from "@pi-starter/contracts";
import React, { useEffect, useMemo, useState } from "react";

interface PreferencesPayload {
	preferences: UserPreferencesResult;
	credentials: ProviderCredentialSummary[];
}

const CUSTOM_MODEL_VALUE = "__custom__";

const DEFAULT_PREFERENCES: UserPreferencesResult = {
	userId: "pending",
	defaultProvider: "openai",
	defaultModel: "gpt-4.1-mini",
	learningMinutes: 10,
	updatedAt: 0,
};

export function AccountSettingsPanel() {
	const [preferences, setPreferences] = useState<UserPreferencesResult>(DEFAULT_PREFERENCES);
	const [credentials, setCredentials] = useState<Record<ProviderId, ProviderCredentialSummary | undefined>>({
		openai: undefined,
		google: undefined,
		xai: undefined,
		anthropic: undefined,
	});
	const [message, setMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [pendingProvider, setPendingProvider] = useState<ProviderId | null>(null);

	async function loadPreferences() {
		const response = await fetch("/api/me/preferences", { credentials: "same-origin" });
		const payload = (await response.json()) as
			| PreferencesPayload
			| { error?: { message?: string } };
		if (!response.ok || !("preferences" in payload) || !("credentials" in payload)) {
			throw new Error(payload.error?.message ?? "Unable to load account settings.");
		}
		setPreferences(payload.preferences);
		setCredentials({
			openai: payload.credentials.find((item) => item.provider === "openai"),
			google: payload.credentials.find((item) => item.provider === "google"),
			xai: payload.credentials.find((item) => item.provider === "xai"),
			anthropic: payload.credentials.find((item) => item.provider === "anthropic"),
		});
	}

	useEffect(() => {
		void loadPreferences().catch((error) => {
			setErrorMessage(error instanceof Error ? error.message : "Unable to load account settings.");
		});
	}, []);

	const modelSuggestions = useMemo(
		() => getProviderCatalogEntry(preferences.defaultProvider).models,
		[preferences.defaultProvider],
	);
	const selectedModelOption = modelSuggestions.includes(preferences.defaultModel)
		? preferences.defaultModel
		: CUSTOM_MODEL_VALUE;

	async function savePreferences(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setMessage(null);
		setErrorMessage(null);
		try {
			const response = await fetch("/api/me/preferences", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					defaultProvider: preferences.defaultProvider,
					defaultModel: preferences.defaultModel,
					learningMinutes: preferences.learningMinutes,
				}),
			});
			const payload = (await response.json()) as { preferences?: UserPreferencesResult; error?: { message?: string } };
			if (!response.ok || !payload.preferences) {
				setErrorMessage(payload.error?.message ?? "Unable to save preferences.");
				return;
			}
			await loadPreferences();
			setMessage("Preferences saved.");
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Unable to save preferences.");
		}
	}

	async function saveProviderKey(provider: ProviderId, apiKey: string) {
		setPendingProvider(provider);
		setMessage(null);
		setErrorMessage(null);
		try {
			const response = await fetch(`/api/me/provider-credentials/${provider}`, {
				method: "POST",
				credentials: "same-origin",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ apiKey }),
			});
			const payload = (await response.json()) as {
				credential?: ProviderCredentialSummary;
				error?: { message?: string };
			};
			if (!response.ok || !payload.credential) {
				setErrorMessage(payload.error?.message ?? `Unable to save ${provider} credentials.`);
				return false;
			}
			await loadPreferences();
			setMessage(`${getProviderCatalogEntry(provider).label} key saved.`);
			return true;
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : `Unable to save ${provider} credentials.`);
			return false;
		} finally {
			setPendingProvider(null);
		}
	}

	async function removeProviderKey(provider: ProviderId) {
		setPendingProvider(provider);
		setMessage(null);
		setErrorMessage(null);
		try {
			const response = await fetch(`/api/me/provider-credentials/${provider}`, {
				method: "DELETE",
				credentials: "same-origin",
			});
			if (!response.ok) {
				const payload = (await response.json()) as { error?: { message?: string } };
				setErrorMessage(payload.error?.message ?? `Unable to remove ${provider} credentials.`);
				return;
			}
			await loadPreferences();
			setMessage(`${getProviderCatalogEntry(provider).label} key removed.`);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : `Unable to remove ${provider} credentials.`);
		} finally {
			setPendingProvider(null);
		}
	}

	return (
		<div className="flex flex-col gap-8">
			<form action="/api/me/preferences" method="post" onSubmit={savePreferences} className="flex flex-col gap-5">
				<div>
					<label htmlFor="defaultProvider" className="text-sm font-semibold uppercase tracking-widest text-peach/70">
						Default provider
					</label>
					<select
						id="defaultProvider"
						name="defaultProvider"
						value={preferences.defaultProvider}
						onChange={(event) => {
							const provider = event.target.value as ProviderId;
							setPreferences((current) => ({
								...current,
								defaultProvider: provider,
								defaultModel: getProviderCatalogEntry(provider).defaultModel,
							}));
						}}
						className="mt-2 w-full rounded-4xl border border-white/20 bg-ink/70 px-5 py-4 text-white"
					>
						{PROVIDER_OPTIONS.map((provider) => (
							<option key={provider.id} value={provider.id}>
								{provider.label}
							</option>
						))}
					</select>
				</div>
				<div>
					<label htmlFor="defaultModel" className="text-sm font-semibold uppercase tracking-widest text-peach/70">
						Default model
					</label>
					<input type="hidden" name="defaultModel" value={preferences.defaultModel} />
					<select
						id="defaultModel"
						value={selectedModelOption}
						onChange={(event) => {
							const nextValue = event.target.value;
							setPreferences((current) => ({
								...current,
								defaultModel: nextValue === CUSTOM_MODEL_VALUE ? "" : nextValue,
							}));
						}}
						className="mt-2 w-full rounded-4xl border border-white/20 bg-ink/70 px-5 py-4 text-white"
					>
						{modelSuggestions.map((model) => (
							<option key={model} value={model}>
								{model}
							</option>
						))}
						<option value={CUSTOM_MODEL_VALUE}>Custom model</option>
					</select>
					{selectedModelOption === CUSTOM_MODEL_VALUE ? (
						<input
							id="defaultModelCustom"
							value={preferences.defaultModel}
							onChange={(event) => {
								setPreferences((current) => ({
									...current,
									defaultModel: event.target.value,
								}));
							}}
							placeholder="Enter a model ID"
							className="mt-3 w-full rounded-4xl border border-white/20 bg-ink/70 px-5 py-4 text-white placeholder:text-peach/40"
						/>
					) : null}
				</div>
				<div>
					<label htmlFor="learningMinutes" className="text-sm font-semibold uppercase tracking-widest text-peach/70">
						Minutes per day
					</label>
					<input
						id="learningMinutes"
						name="learningMinutes"
						type="number"
						value={preferences.learningMinutes}
						onChange={(event) => {
							setPreferences((current) => ({
								...current,
								learningMinutes: Number(event.target.value),
							}));
						}}
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
				</div>
			</form>

			<section className="grid gap-4">
				<h3 className="font-serif text-2xl text-white">Provider API Keys</h3>
				{PROVIDER_OPTIONS.map((provider) => {
					const summary = credentials[provider.id];
					return (
						<form
							key={provider.id}
							onSubmit={(event) => {
								event.preventDefault();
								const formData = new FormData(event.currentTarget);
								const apiKey = String(formData.get("apiKey") ?? "");
								void (async () => {
									const didSave = await saveProviderKey(provider.id, apiKey);
									if (didSave) {
										event.currentTarget.reset();
									}
								})();
							}}
							className="rounded-4xl border border-white/10 bg-ink/70 p-5"
						>
							<div className="flex flex-col gap-4">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="font-semibold text-white">{provider.label}</p>
										<p className="text-sm text-peach/70">{provider.keyHint}</p>
									</div>
									<p className="text-sm text-peach/70">{summary?.configured ? summary.keyHint ?? "Configured" : "Not configured"}</p>
								</div>
								<input
									type="password"
									name="apiKey"
									placeholder={provider.envVar}
									className="w-full rounded-[20px] border border-white/20 bg-charcoal/70 px-5 py-3 text-sm text-white placeholder:text-peach/40 focus:border-coral focus:outline-none"
								/>
								<div className="flex flex-wrap gap-3">
									<button
										type="submit"
										disabled={pendingProvider === provider.id}
										className="rounded-[48px] bg-coral px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
									>
										{summary?.configured ? "Update Key" : "Save Key"}
									</button>
									<button
										type="button"
										disabled={!summary?.configured || pendingProvider === provider.id}
										onClick={() => {
											void removeProviderKey(provider.id);
										}}
										className="rounded-[48px] border border-white/20 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
									>
										Remove Key
									</button>
								</div>
							</div>
						</form>
					);
				})}
			</section>

			{message ? <p className="text-sm text-coral">{message}</p> : null}
			{errorMessage ? <p role="alert" className="text-sm text-peach">{errorMessage}</p> : null}
		</div>
	);
}
