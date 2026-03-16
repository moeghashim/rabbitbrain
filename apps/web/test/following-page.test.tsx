import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import AppFollowingPage from "../app/app/following/page.js";

test("following page renders the follow management shell", () => {
	const html = renderToStaticMarkup(<AppFollowingPage />);
	assert.match(html, /Following<\/h1>/);
	assert.match(html, /Creator follows/);
	assert.match(html, /Matched saved posts/);
	assert.match(html, /Creator suggestions/);
});
