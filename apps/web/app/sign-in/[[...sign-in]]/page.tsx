import { redirect } from "next/navigation";
import { resolveInternalRedirectUrl } from "../../../src/auth/redirect-url.js";

function resolveCallbackUrl(searchParams: { redirect_url?: string | string[] | undefined }): string {
	return resolveInternalRedirectUrl(searchParams.redirect_url, "/app");
}

export default function SignInPage({
	searchParams,
}: Readonly<{
	searchParams: { redirect_url?: string | string[] | undefined };
}>) {
	const callbackUrl = resolveCallbackUrl(searchParams);
	redirect(`/auth/popup-start?redirect_url=${encodeURIComponent(callbackUrl)}`);
}
