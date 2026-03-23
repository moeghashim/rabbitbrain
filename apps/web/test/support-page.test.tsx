import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import SupportPage from "../app/support/page.js";

test("support page includes install steps, troubleshooting, and response expectations", () => {
	const html = renderToStaticMarkup(<SupportPage />);
	assert.match(html, /Install and Use/);
	assert.match(html, /Troubleshooting/);
	assert.match(html, /web app, CLI, and extension/i);
	assert.match(html, /Request ID/);
	assert.match(html, /reply within two business days/);
	assert.match(html, /support@rabbitbrain.app/);
});
