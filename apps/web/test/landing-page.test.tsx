import assert from "node:assert/strict";
import test from "node:test";
import React from "react";

import { renderToStaticMarkup } from "react-dom/server";

import LandingPage from "../app/page.js";

test("landing page renders headline and core sections", () => {
	const html = renderToStaticMarkup(<LandingPage />);
	assert.match(html, /Paste a tweet/);
	assert.match(html, /Twitter Signal Lab/);
	assert.match(html, /Analyze any tweet instantly/);
	assert.match(html, /The Studio/);
	assert.match(html, /Leave <span class=\"italic\">mediocrity<\/span>/);
});

test("landing page ctas route to auth pages", () => {
	const html = renderToStaticMarkup(<LandingPage />);
	assert.match(html, /id=\"nav-cta\"[^>]*href=\"\/sign-in\"/);
	assert.match(html, /id=\"hero-analyze-button\"/);
	assert.match(html, /Login with Twitter<\/a>/);
});

test("landing page keeps responsive class markers for desktop and mobile", () => {
	const html = renderToStaticMarkup(<LandingPage />);
	assert.match(html, /md:flex/);
	assert.match(html, /lg:grid-cols-3/);
	assert.match(html, /sm:text-\[5rem\]/);
});
