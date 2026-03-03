import assert from "node:assert/strict";
import test from "node:test";

import { WEB_APP_ID } from "../src/index.js";

test("web scaffold exports app id", () => {
	assert.equal(WEB_APP_ID, "rabbitbrain-web");
});
