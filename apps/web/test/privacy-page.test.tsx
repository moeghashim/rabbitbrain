import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import PrivacyPage from "../app/privacy/page.js";

test("privacy page discloses extension data handling and contact details", () => {
	const html = renderToStaticMarkup(<PrivacyPage />);
	assert.match(html, /Rabbitbrain for X/);
	assert.match(html, /only runs on https:\/\/x.com/);
	assert.match(html, /does not execute remote code/i);
	assert.match(html, /support@rabbitbrain.app/);
});
