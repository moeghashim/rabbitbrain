import assert from "node:assert/strict";
import test from "node:test";

import type { ServiceHealth } from "../src/index.js";

test("contracts scaffold type is structurally valid", () => {
	const value: ServiceHealth = {
		service: "contracts",
		ok: true,
	};
	assert.equal(value.ok, true);
});
