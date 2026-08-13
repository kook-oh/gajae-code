// Prints the spawn-command overrides this process resolves.
// Spawned with a controlled cwd so the caller can plant a project `.env`: the
// env module parses `projectEnv` at load time from `process.cwd()`, so the
// trust boundary can only be exercised from a separate process.
import { processStartCommandOverrideForTest } from "@bworx-io/worx-code/commands/harness";
import { sdkSessionCommandOverrideForTest } from "@bworx-io/worx-code/sdk/broker/lifecycle";

console.log(
	JSON.stringify({
		sdkSessionCommand: sdkSessionCommandOverrideForTest() ?? null,
		processStartCommand: processStartCommandOverrideForTest(),
	}),
);
