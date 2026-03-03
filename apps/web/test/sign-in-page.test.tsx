import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import SignInPage from "../app/sign-in/[[...sign-in]]/page.js";

test("sign-in page uses twitter-specific auth copy", () => {
	const html = renderToStaticMarkup(<SignInPage searchParams={{}} />);
	assert.match(html, /Twitter Authentication/);
	assert.match(html, /Sign in with Twitter/);
	assert.match(html, /Continue with Twitter/);
	assert.match(html, /\/api\/auth\/signin\/twitter\?callbackUrl=%2Fapp/);
});
