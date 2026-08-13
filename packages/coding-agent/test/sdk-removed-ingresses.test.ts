import { describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import path from "node:path";
import { parseArgs } from "../src/cli/args";

const packageRoot = path.resolve(import.meta.dir, "..");
const cliEntrypoint = path.join(packageRoot, "src", "cli.ts");

async function runCli(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
	const child = Bun.spawn([process.execPath, "run", cliEntrypoint, ...args], {
		cwd: packageRoot,
		stdout: "pipe",
		stderr: "pipe",
		stdin: "ignore",
	});
	return {
		exitCode: await child.exited,
		stdout: await new Response(child.stdout).text(),
		stderr: await new Response(child.stderr).text(),
	};
}

describe("removed external ingresses (Phase D structural proof)", () => {
	it("does not restore the retired rpc or bridge source directories", () => {
		expect(fs.existsSync(path.join(packageRoot, "src", "modes", "rpc"))).toBe(false);
		expect(fs.existsSync(path.join(packageRoot, "src", "modes", "bridge"))).toBe(false);
	});

	it("accepts rpc while rendering only rpc-ui and bridge as removed", async () => {
		expect(parseArgs(["--mode", "rpc"]).mode).toBe("rpc");
		for (const mode of ["rpc-ui", "bridge"]) {
			const result = await runCli(["--mode", mode, "-p", "noop"]);
			expect(result.exitCode, `--mode ${mode} must be rejected`).toBe(2);
			expect(result.stderr).toContain(
				`--mode ${mode} was removed; external control now uses the WORX Code SDK (docs/sdk.md)`,
			);
			expect(result.stdout).toContain("USAGE");
			expect(result.stderr).not.toMatch(/(?:^|\n)(?:Error: )?(?:Error|TypeError|CliParseError):|\bat\s+\S+/);
		}
	}, 30000);

	it("no source file imports the deleted mode modules", () => {
		const violations: string[] = [];
		const walk = (dir: string): void => {
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				const full = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					if (entry.name === "node_modules") continue;
					walk(full);
					continue;
				}
				if (!entry.name.endsWith(".ts")) continue;
				const text = fs.readFileSync(full, "utf8");
				if (/from\s+["'][^"']*modes\/(?:rpc|bridge)\//.test(text)) violations.push(full);
			}
		};
		walk(path.join(packageRoot, "src"));
		expect(violations).toEqual([]);
	});
});
