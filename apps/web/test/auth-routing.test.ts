import assert from "node:assert/strict";
import test from "node:test";

import {
	buildSignInRedirectPath,
	isPublicPath,
	resolveAuthRedirectPath,
} from "../src/auth/routing.js";

test("isPublicPath allows marketing and auth routes", () => {
	assert.equal(isPublicPath("/"), true);
	assert.equal(isPublicPath("/sign-in"), true);
	assert.equal(isPublicPath("/sign-in/welcome"), true);
	assert.equal(isPublicPath("/sign-up"), true);
	assert.equal(isPublicPath("/sign-up/new"), true);
});

test("isPublicPath blocks app and account routes", () => {
	assert.equal(isPublicPath("/app"), false);
	assert.equal(isPublicPath("/account"), false);
	assert.equal(isPublicPath("/api/analysis"), false);
});

test("buildSignInRedirectPath includes redirect_url query", () => {
	assert.equal(buildSignInRedirectPath("/app", "?tab=history"), "/sign-in?redirect_url=%2Fapp%3Ftab%3Dhistory");
});

test("resolveAuthRedirectPath redirects unauthenticated private routes", () => {
	const redirect = resolveAuthRedirectPath({
		pathname: "/account",
		search: "",
		isAuthenticated: false,
	});
	assert.equal(redirect, "/sign-in?redirect_url=%2Faccount");
});

test("resolveAuthRedirectPath allows authenticated private routes", () => {
	const redirect = resolveAuthRedirectPath({
		pathname: "/account",
		search: "",
		isAuthenticated: true,
	});
	assert.equal(redirect, null);
});
