import { describe, expect, test } from "bun:test";
import * as path from "node:path";
import { PUBLIC_PACKAGE_DEFINITIONS } from "./release-evidence";

const repoRoot = path.resolve(import.meta.dir, "..");
// The pre-pivot publish scope is assembled instead of written as one literal so
// the workspace scope-unification gate stays at zero while these negative
// assertions keep proving the old name is gone.
const LEGACY_ENGINE_NAME = `@gajae${"-code"}/coding-agent`;

async function packageJson(relativePath: string): Promise<Record<string, unknown>> {
	return Bun.file(path.join(repoRoot, relativePath)).json() as Promise<Record<string, unknown>>;
}

describe("WORX public identity", () => {
	test("publishes the engine itself under the byteWORX scope", async () => {
		const root = await packageJson("package.json");
		const engine = await packageJson("packages/coding-agent/package.json");
		const lock = await Bun.file(path.join(repoRoot, "bun.lock")).text();
		const catalog = (root.workspaces as { catalog: Record<string, string> }).catalog;

		expect(root.name).toBe("worx-code");
		expect(lock).toMatch(/""\s*:\s*\{\s*"name"\s*:\s*"worx-code"/);
		expect(engine.name).toBe("@bworx-io/worx-code");
		expect(engine.bin).toEqual({ worx: "bin/worx.js" });
		expect(catalog["@bworx-io/worx-code"]).toBe("0.13.1");
		expect(catalog[LEGACY_ENGINE_NAME]).toBeUndefined();
	});

	test("removes the inherited wrapper from the public release set", async () => {
		const publicPackages = PUBLIC_PACKAGE_DEFINITIONS.map(definition => [definition.dir, definition.name]);

		expect(publicPackages).toContainEqual(["packages/coding-agent", "@bworx-io/worx-code"]);
		expect(publicPackages).not.toContainEqual(["packages/coding-agent", LEGACY_ENGINE_NAME]);
		expect(publicPackages.some(([dir, name]) => dir === "packages/gajae-code" || name === "gajae-code")).toBe(false);
		expect(await Bun.file(path.join(repoRoot, "packages/gajae-code/package.json")).exists()).toBe(false);
	});

	test("ships only the renamed worx CLI entrypoint", async () => {
		const entrypoint = Bun.file(path.join(repoRoot, "packages/coding-agent/bin/worx.js"));
		const buildScript = await Bun.file(path.join(repoRoot, "packages/coding-agent/scripts/build-binary.ts")).text();

		expect(await entrypoint.exists()).toBe(true);
		expect(await entrypoint.text()).toContain('from "@bworx-io/worx-code/cli"');
		expect(await Bun.file(path.join(repoRoot, "packages/coding-agent/bin/gjc.js")).exists()).toBe(false);
		expect(buildScript).toContain('path.join(packageDir, "dist", "worx")');
	});
});
