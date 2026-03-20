import assert from "node:assert/strict";
import test from "node:test";
import React from "react";

import { renderToStaticMarkup } from "react-dom/server";

import LandingPage from "../app/page.js";

test("landing page renders headline and core sections", async () => {
	const page = await LandingPage({});
	const html = renderToStaticMarkup(page);
	assert.match(html, /Transform the <span class="text-glow text-primary">signal<\/span>/);
	assert.match(html, /Neural ingestion terminal/);
	assert.match(html, /Raw ingest/);
	assert.match(html, /Engine Architecture/);
	assert.match(html, /Enter the protocol/);
});

test("landing page ctas route to auth pages", async () => {
	const page = await LandingPage({});
	const html = renderToStaticMarkup(page);
	assert.match(html, /id=\"nav-cta\"[^>]*href=\"\/auth\/popup-start\?redirect_url=%2Fapp\"/);
	assert.match(html, /href=\"\/app\/bookmarks\"[^>]*>Bookmarks<\/a>/);
	assert.match(html, /href=\"\/privacy\"[^>]*>Privacy<\/a>/);
	assert.match(html, /href=\"\/support\"[^>]*>Support<\/a>/);
	assert.match(html, /id=\"hero-analyze-button\"/);
	assert.match(html, /Connect<\/a>/);
	assert.match(html, /Authenticate with X/);
});

test("landing page analyzer keeps the tweet input but hides provider and model selectors", async () => {
	const page = await LandingPage({});
	const html = renderToStaticMarkup(page);
	assert.match(html, /id=\"hero-tweet-url\"/);
	assert.doesNotMatch(html, /id=\"hero-provider\"/);
	assert.doesNotMatch(html, /id=\"hero-model\"/);
});

test("landing page keeps responsive class markers for desktop and mobile", async () => {
	const page = await LandingPage({});
	const html = renderToStaticMarkup(page);
	assert.match(html, /md:flex/);
	assert.match(html, /lg:grid-cols-4/);
	assert.match(html, /sm:text-\[5rem\]/);
});
