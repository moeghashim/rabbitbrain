import assert from "node:assert/strict";
import test from "node:test";

import { config } from "../proxy.js";

test("proxy matcher excludes api routes so auth handlers are not intercepted", () => {
	assert.deepEqual(config.matcher, ["/((?!api|_next|.*\\..*).*)"]);
});
