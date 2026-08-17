// Prints the web-search endpoints and auth material this process resolves.
// Spawned with a controlled cwd so the caller can plant a project `.env`: the env
// module parses `projectEnv` at load time from `process.cwd()`, so the trust
// boundary can only be exercised from a separate process.

import { resolveKimiSearchBaseUrlForTest } from "@bworx-io/worx-code/web/search/providers/kimi";
import { resolveXaiSearchBaseUrlForTest } from "@bworx-io/worx-code/web/search/providers/xai";
import { $credentialEnv } from "@bworx-io/worx-utils";

console.log(
	JSON.stringify({
		kimiBaseUrl: resolveKimiSearchBaseUrlForTest(),
		xaiBaseUrl: resolveXaiSearchBaseUrlForTest(),
		// anthropic search reads these two directly through the same resolver
		anthropicSearchKey: $credentialEnv("ANTHROPIC_SEARCH_API_KEY") ?? null,
		anthropicSearchBaseUrl: $credentialEnv("ANTHROPIC_SEARCH_BASE_URL") ?? null,
	}),
);
