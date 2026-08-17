import { describe, expect, it } from "bun:test";
import * as path from "node:path";
import {
	AGGREGATOR_PACKAGE,
	assertBuildReceiptShape,
	FORBIDDEN_LIFECYCLE_SCRIPTS,
	NATIVE_PLATFORM_PACKAGES,
	readManifest,
	repoRoot,
	versionSentinelExport,
} from "./native-release-contract";
import { findRejectedCiFields, REQUIRED_PACKAGE_FIELDS, REQUIRED_PLATFORM_FIELDS } from "./verify-provenance";

describe("native release contract (P1b §4b-1)", () => {
	it("freezes the published set at the aggregator plus the two supported platforms", () => {
		expect(NATIVE_PLATFORM_PACKAGES.map(entry => entry.platformTag)).toEqual(["darwin-arm64", "linux-x64"]);
		expect(AGGREGATOR_PACKAGE.name).toBe("@bworx-io/worx-code-natives");
	});

	it("derives the version sentinel exactly like the loader does", () => {
		// native/loader-state.js: `__piNativesV${version.replace(/[^A-Za-z0-9]/g, "_")}`
		expect(versionSentinelExport("0.13.1")).toBe("__piNativesV0_13_1");
		expect(versionSentinelExport("1.0.0-nightly.3")).toBe("__piNativesV1_0_0_nightly_3");
	});

	it("keeps the aggregator as the owner of platform selection", async () => {
		const aggregator = await readManifest(AGGREGATOR_PACKAGE.dir);
		expect(Object.keys(aggregator.optionalDependencies ?? {}).sort()).toEqual(
			NATIVE_PLATFORM_PACKAGES.map(entry => entry.name).sort(),
		);
	});

	it("keeps every platform manifest on its own os/cpu/libc selector", async () => {
		for (const entry of NATIVE_PLATFORM_PACKAGES) {
			const manifest = await readManifest(entry.dir);
			expect(manifest.os).toEqual([entry.os]);
			expect(manifest.cpu).toEqual([entry.cpu]);
			expect(manifest.libc).toEqual(entry.libc as string[] | undefined);
		}
	});

	it("declares no install hooks anywhere in the release set", async () => {
		for (const dir of [AGGREGATOR_PACKAGE.dir, ...NATIVE_PLATFORM_PACKAGES.map(entry => entry.dir)]) {
			const scripts = (await readManifest(dir)).scripts ?? {};
			for (const hook of FORBIDDEN_LIFECYCLE_SCRIPTS) expect(scripts[hook]).toBeUndefined();
		}
	});
});

describe("build receipt validation (P1b §4b-3)", () => {
	const valid = {
		schema_version: 1,
		source_commit: "a".repeat(40),
		rust_toolchain: "nightly-2026-04-29",
		build_profile: "dist",
		target: "darwin-arm64",
		node_filename: "pi_natives.darwin-arm64.node",
		node_sha256: "b".repeat(64),
	};

	it("accepts a complete receipt", () => {
		expect(assertBuildReceiptShape(valid, "test").build_profile).toBe("dist");
	});

	it("rejects a truncated digest, a short commit, and a missing toolchain", () => {
		expect(() => assertBuildReceiptShape({ ...valid, node_sha256: "b".repeat(40) }, "test")).toThrow("sha256");
		expect(() => assertBuildReceiptShape({ ...valid, source_commit: "abc" }, "test")).toThrow("40-hex");
		expect(() => assertBuildReceiptShape({ ...valid, rust_toolchain: "" }, "test")).toThrow("rust_toolchain");
	});

	it("rejects an unknown schema version rather than guessing the shape", () => {
		expect(() => assertBuildReceiptShape({ ...valid, schema_version: 2 }, "test")).toThrow("schema_version");
	});
});

describe("provenance model (P1b §4b-5)", () => {
	it("rejects fabricated CI provenance at any depth", () => {
		expect(findRejectedCiFields({ packages: [{ package_name: "x", ci_run_url: "https://ci.example/1" }] })).toEqual([
			"packages.0.ci_run_url",
		]);
		expect(findRejectedCiFields({ workflow_ref: "org/repo/.github/workflows/ci.yml@refs/heads/main" })).toEqual([
			"workflow_ref",
		]);
	});

	it("accepts a manual manifest that names its builder instead", () => {
		expect(findRejectedCiFields({ builder: "kook", build_host: "mac", packages: [] })).toEqual([]);
	});

	it("requires the digest chain fields on every platform row", () => {
		expect(REQUIRED_PACKAGE_FIELDS).toContain("tarball_sha256");
		expect(REQUIRED_PLATFORM_FIELDS).toContain("node_sha256");
		expect(REQUIRED_PLATFORM_FIELDS).toContain("source_commit");
		expect(REQUIRED_PLATFORM_FIELDS).toContain("rust_toolchain");
		expect(REQUIRED_PLATFORM_FIELDS).toContain("build_profile");
	});
});

describe("unsupported platform failure mode (P1b §4b-2)", () => {
	it("keeps the loader's supported set aligned with the published platform packages", async () => {
		const loader = await Bun.file(path.join(repoRoot, AGGREGATOR_PACKAGE.dir, "native/loader-state.js")).text();
		const declared = loader.match(/const SUPPORTED_PLATFORMS = \[([^\]]*)\]/u)?.[1] ?? "";
		const tags = [...declared.matchAll(/"([^"]+)"/gu)].map(match => match[1]);
		expect(tags.sort()).toEqual(NATIVE_PLATFORM_PACKAGES.map(entry => entry.platformTag).sort());
	});

	it("fails an unsupported platform loudly instead of degrading to a silent no-native session", async () => {
		const loader = await Bun.file(path.join(repoRoot, AGGREGATOR_PACKAGE.dir, "native/loader-state.js")).text();
		// The refusal must be a thrown error naming the platform; a warning or a
		// null return would let `--version` pass while every natives-backed tool
		// dies later with an unrelated message.
		expect(loader).toContain("Unsupported platform:");
		expect(loader).toMatch(/throw new Error\(\s*`Unsupported platform/u);
	});
});
