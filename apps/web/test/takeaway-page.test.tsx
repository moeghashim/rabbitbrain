import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import AppTakeawayPage from "../app/app/takeaway/page.js";

test("takeaway page renders the account takeaway shell", () => {
	const html = renderToStaticMarkup(<AppTakeawayPage />);
	assert.match(html, /Takeaway<\/h1>/);
	assert.match(html, /Follow account/);
	assert.match(html, /Choose a followed account/);
	assert.match(html, /History/);
});
