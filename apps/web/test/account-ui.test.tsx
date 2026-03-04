import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import AccountPage from "../app/account/page.js";
import AppHomePage from "../app/app/page.js";

test("dashboard page includes analyze action controls", () => {
	const html = renderToStaticMarkup(<AppHomePage />);
	assert.match(html, /id=\"hero-analyze-button\"/);
	assert.match(html, /id=\"nav-cta\"[^>]*>Account Settings<\/a>/);
	assert.match(html, /name=\"tweetUrlOrId\"/);
	assert.match(html, /Analyze Tweet/);
	assert.doesNotMatch(html, /Analyze any tweet instantly/);
	assert.doesNotMatch(html, /Workspace/);
	assert.doesNotMatch(html, /Account Dashboard/);
	assert.match(html, /Learning Tracks/);
});

test("account page includes preferences and sign-out actions", () => {
	const html = renderToStaticMarkup(<AccountPage />);
	assert.match(html, /action=\"\/api\/me\/preferences\"/);
	assert.match(html, /name=\"defaultModel\"/);
	assert.match(html, /name=\"learningMinutes\"/);
	assert.match(html, /formAction=\"\/sign-out\"/);
	assert.match(html, /Save Preferences/);
});
