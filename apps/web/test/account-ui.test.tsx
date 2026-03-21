import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import AccountPage from "../app/account/page.js";
import AppHomePage from "../app/app/page.js";

test("app home page mirrors the landing analyzer shell", async () => {
	const page = await AppHomePage({});
	const html = renderToStaticMarkup(page);

	assert.match(html, /id=\"hero-analyze-button\"/);
	assert.match(html, /id=\"nav-cta\"[^>]*href=\"\/auth\/popup-start\?redirect_url=%2Fapp\"/);
	assert.match(html, /href=\"\/app\/following\"[^>]*>Following<\/a>/);
	assert.match(html, /href=\"\/app\/bookmarks\"[^>]*>Bookmarks<\/a>/);
	assert.match(html, /id=\"hero-tweet-url\"/);
	assert.match(html, /Neural ingestion terminal/);
	assert.match(html, /Transform the <span class=\"text-glow text-primary\">signal<\/span>/);
	assert.match(html, /Enter the protocol/);
	assert.doesNotMatch(html, /Learning Tracks/);
});

test("account page includes preferences and sign-out actions", () => {
	const html = renderToStaticMarkup(<AccountPage />);
	assert.match(html, /action=\"\/api\/me\/preferences\"/);
	assert.match(html, /name=\"defaultProvider\"/);
	assert.match(html, /name=\"defaultModel\"/);
	assert.match(html, /name=\"learningMinutes\"/);
	assert.match(html, /Provider API Keys/);
	assert.match(html, /id=\"sign-out-button\"/);
	assert.match(html, /Save Preferences/);
	assert.match(html, /Sign Out/);
});
