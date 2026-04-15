import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import AppBookmarksPage from "../app/app/bookmarks/page.js";

test("bookmarks page renders view toggle and list shell", () => {
	const html = renderToStaticMarkup(<AppBookmarksPage />);
	assert.match(html, /Bookmarks<\/h1>/);
	assert.match(html, /id=\"bookmarks-search-input\"/);
	assert.match(html, /id=\"bookmarks-export-button\"/);
	assert.match(html, /id=\"bookmarks-sync-now-button\"/);
	assert.match(html, /id=\"bookmarks-view-tile\"/);
	assert.match(html, /id=\"bookmarks-view-row\"/);
	assert.match(html, /Loading bookmarks/);
});
