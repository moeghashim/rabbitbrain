import assert from "node:assert/strict";
import test from "node:test";

import { getProviderCatalogEntry, PROVIDER_CATALOG, PROVIDER_OPTIONS } from "../src/index.js";

test("provider catalog contains all supported providers", () => {
	assert.equal(PROVIDER_OPTIONS.length, 4);
	assert.deepEqual(Object.keys(PROVIDER_CATALOG).sort(), ["anthropic", "google", "openai", "xai"]);
	assert.equal(getProviderCatalogEntry("openai").defaultModel, "gpt-4.1-mini");
});
