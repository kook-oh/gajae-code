import { describe, expect, it } from "bun:test";
import * as path from "node:path";
import { isMemoryGuardNativeSmokeFastPath, runMemoryGuardNativeSmokeFastPath } from "../src/cli";

describe("memory-guard native smoke fast path", () => {
	it("matches only the exact internal argv", () => {
		expect(isMemoryGuardNativeSmokeFastPath(["internal", "memory-guard-native-smoke", "--json"])).toBe(true);
		expect(isMemoryGuardNativeSmokeFastPath(["internal", "memory-guard-native-smoke"])).toBe(false);
		expect(isMemoryGuardNativeSmokeFastPath(["internal", "memory-guard-native-smoke", "--json", "extra"])).toBe(
			false,
		);
		expect(isMemoryGuardNativeSmokeFastPath(["internal", "memory-guard-native-smoke", "--pretty"])).toBe(false);
		expect(isMemoryGuardNativeSmokeFastPath(["launch", "internal", "memory-guard-native-smoke", "--json"])).toBe(
			false,
		);
	});

	it("emits the tagged native receipt without normal command dispatch", () => {
		let stdout = "";
		runMemoryGuardNativeSmokeFastPath({
			loadNative: () => ({
				probeWindowsJobMemory: () => ({ kind: "unsupported_platform", platform: "darwin" }),
			}),
			writeStdout: text => {
				stdout += text;
			},
		});
		expect(JSON.parse(stdout)).toEqual({
			api: "memory_guard_windows_job_probe_v1",
			source: "pi_natives",
			result: { kind: "unsupported_platform", platform: "darwin" },
		});
	});

	it("keeps the fast path ahead of runtime initialization", async () => {
		const cliSource = await Bun.file(path.join(import.meta.dir, "../src/cli.ts")).text();
		expect(cliSource.indexOf("if (isMemoryGuardNativeSmokeFastPath(argv))")).toBeGreaterThan(-1);
		expect(cliSource.indexOf("if (isMemoryGuardNativeSmokeFastPath(argv))")).toBeLessThan(
			cliSource.indexOf("await installRuntimeGlobals();"),
		);

	});
});
