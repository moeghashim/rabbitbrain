import assert from "node:assert/strict";
import test from "node:test";

import { config } from "../middleware.js";

test("middleware matcher excludes api routes so auth handlers are not intercepted", () => {
	assert.deepEqual(config.matcher, ["/((?!api|_next|.*\\..*).*)"]);
});
