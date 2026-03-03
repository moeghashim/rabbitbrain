import assert from "node:assert/strict";
import test from "node:test";

import { getXClientInfo } from "../src/index.js";

test("x-client scaffold exports info", () => {
	const info = getXClientInfo();
	assert.equal(info.name, "x-client");
	assert.equal(info.version, "0.0.1");
});
