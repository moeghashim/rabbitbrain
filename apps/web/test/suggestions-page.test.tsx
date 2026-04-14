import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import AppSuggestionsPage from "../app/app/suggestions/page.js";

test("suggestions page renders the suggestions workspace shell", () => {
	const html = renderToStaticMarkup(<AppSuggestionsPage />);

	assert.match(html, /Suggestions/);
	assert.match(html, /Signal suggestions/);
	assert.match(html, /Loading suggestions/);
});
