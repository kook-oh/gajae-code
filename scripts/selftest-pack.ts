#!/usr/bin/env bun
/**
 * P1b §4b-5 gate 3 — `selftest:pack`.
 *
 * Packs the native release set exactly as `npm publish` would and inspects the
 * resulting tarballs, because manifest fields alone do not prove what ships:
 * `files` globs, `.npmignore`, and staging mistakes all show up only in the
 * archive. Every tarball is hashed, and the digests are written to the release
 * manifest that `verify:provenance` later re-anchors against.
 *
 * Usage:
 *   bun scripts/selftest-pack.ts                       # pack into a temp dir, verify, discard
 *   bun scripts/selftest-pack.ts --out artifacts/native-release
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
	AGGREGATOR_PACKAGE,
	assertBuildReceiptShape,
	buildReceiptPath,
	FORBIDDEN_LIFECYCLE_SCRIPTS,
	NATIVE_PLATFORM_PACKAGES,
	readManifest,
	repoRoot,
	stagedAddonPath,
} from "./native-release-contract";

interface GateRow {
	readonly name: string;
	readonly passed: boolean;
	readonly detail: string;
}
const rows: GateRow[] = [];
function gate(name: string, passed: boolean, detail: string): void {
	rows.push({ name, passed, detail });
}

const outIndex = process.argv.indexOf("--out");
const explicitOut = outIndex === -1 ? null : process.argv[outIndex + 1];
const outDir = explicitOut
	? path.resolve(repoRoot, explicitOut)
	: await fs.mkdtemp(path.join(os.tmpdir(), "worx-selftest-pack-"));
await fs.mkdir(outDir, { recursive: true });

async function packageDirs(): Promise<{ dir: string; platformTag: string | null }[]> {
	return [
		{ dir: AGGREGATOR_PACKAGE.dir, platformTag: null },
		...NATIVE_PLATFORM_PACKAGES.map(entry => ({ dir: entry.dir, platformTag: entry.platformTag })),
	];
}

async function packOne(dir: string): Promise<string> {
	const result = Bun.spawnSync(["bun", "pm", "pack", "--destination", outDir, "--quiet"], {
		cwd: path.join(repoRoot, dir),
		stdout: "pipe",
		stderr: "pipe",
	});
	if (result.exitCode !== 0) {
		throw new Error(`bun pm pack failed in ${dir}: ${new TextDecoder().decode(result.stderr)}`);
	}
	const produced = new TextDecoder().decode(result.stdout).trim().split("\n").filter(Boolean).pop();
	if (!produced) throw new Error(`bun pm pack produced no tarball for ${dir}`);
	return path.isAbsolute(produced) ? produced : path.join(outDir, path.basename(produced));
}

function listEntries(tarball: string): string[] {
	const result = Bun.spawnSync(["tar", "-tzf", tarball], { stdout: "pipe", stderr: "pipe" });
	if (result.exitCode !== 0) throw new Error(`tar -tzf failed for ${tarball}`);
	return new TextDecoder()
		.decode(result.stdout)
		.split("\n")
		.map(entry => entry.replace(/^package\//u, ""))
		.filter(Boolean);
}

function readPackedManifest(tarball: string): Record<string, unknown> {
	const result = Bun.spawnSync(["tar", "-xOzf", tarball, "package/package.json"], { stdout: "pipe", stderr: "pipe" });
	if (result.exitCode !== 0) throw new Error(`cannot read package.json from ${tarball}`);
	return JSON.parse(new TextDecoder().decode(result.stdout)) as Record<string, unknown>;
}

interface PackedPackage {
	package_name: string;
	package_version: string;
	platform_tag: string | null;
	tarball: string;
	tarball_sha256: string;
	tarball_bytes: number;
	node_sha256: string | null;
	source_commit: string | null;
	rust_toolchain: string | null;
	build_profile: string | null;
}

const packed: PackedPackage[] = [];
const aggregatorManifest = await readManifest(AGGREGATOR_PACKAGE.dir);
const releaseVersion = aggregatorManifest.version ?? "<missing>";

for (const target of await packageDirs()) {
	const manifest = await readManifest(target.dir);
	const label = target.platformTag ?? "aggregator";
	const tarball = await packOne(target.dir);
	const bytes = new Uint8Array(await Bun.file(tarball).arrayBuffer());
	const tarballSha = createHash("sha256").update(bytes).digest("hex");
	const entries = listEntries(tarball);
	const packedManifest = readPackedManifest(tarball);

	// A lifecycle script in the *packed* manifest is what actually runs on a
	// consumer machine, so the check belongs here and not only on the source tree.
	const packedScripts = (packedManifest.scripts ?? {}) as Record<string, string>;
	const hooks = FORBIDDEN_LIFECYCLE_SCRIPTS.filter(hook => typeof packedScripts[hook] === "string");
	gate(`${label}: tarball declares no install hooks`, hooks.length === 0, hooks.join(", ") || "none");
	gate(`${label}: tarball version`, packedManifest.version === releaseVersion, String(packedManifest.version));

	let nodeSha: string | null = null;
	let sourceCommit: string | null = null;
	let toolchain: string | null = null;
	let profile: string | null = null;

	if (target.platformTag === null) {
		// The aggregator ships the loader only. Shipping a `.node` here would
		// defeat `os`/`cpu` selection and put the wrong architecture on disk.
		const strayAddons = entries.filter(entry => entry.endsWith(".node"));
		gate("aggregator: ships no platform bytes", strayAddons.length === 0, strayAddons.join(", ") || "none");
		gate(
			"aggregator: ships the loader",
			entries.includes("native/index.js") && entries.includes("native/loader-state.js"),
			`${entries.length} entries`,
		);
	} else {
		const entry = NATIVE_PLATFORM_PACKAGES.find(candidate => candidate.platformTag === target.platformTag);
		if (!entry) throw new Error(`unknown platform ${target.platformTag}`);
		const addonEntry = `native/${entry.addonFilename}`;
		const hasAddon = entries.includes(addonEntry);
		gate(`${label}: tarball carries its addon`, hasAddon, hasAddon ? addonEntry : `missing ${addonEntry}`);
		const receiptEntry = `${addonEntry}.build.json`;
		gate(
			`${label}: tarball carries the build receipt`,
			entries.includes(receiptEntry),
			entries.includes(receiptEntry) ? receiptEntry : `missing ${receiptEntry}`,
		);
		if (hasAddon) {
			const receipt = assertBuildReceiptShape(
				await Bun.file(buildReceiptPath(stagedAddonPath(entry))).json(),
				target.platformTag,
			);
			nodeSha = receipt.node_sha256;
			sourceCommit = receipt.source_commit;
			toolchain = receipt.rust_toolchain;
			profile = receipt.build_profile;
		}
	}

	packed.push({
		package_name: String(manifest.name),
		package_version: String(manifest.version),
		platform_tag: target.platformTag,
		tarball: path.relative(repoRoot, tarball),
		tarball_sha256: tarballSha,
		tarball_bytes: bytes.byteLength,
		node_sha256: nodeSha,
		source_commit: sourceCommit,
		rust_toolchain: toolchain,
		build_profile: profile,
	});
	gate(`${label}: tarball digest recorded`, true, `${tarballSha.slice(0, 16)}… (${bytes.byteLength} bytes)`);
}

const manifestPath = path.join(outDir, "native-release-manifest.json");
await Bun.write(
	manifestPath,
	`${JSON.stringify(
		{
			schema_version: 1,
			release_version: releaseVersion,
			// §4b-4: this release line is deliberately unsigned. The integrity claim
			// is digest recomputation over retained artifacts, recorded here so the
			// publish procedure cannot quietly imply signature verification.
			signing: "none",
			built_at: new Date().toISOString(),
			// No-CI provenance: the builder and host are named because there is no
			// workflow run to point at. `verify:provenance` treats these as claims
			// and anchors trust on digest recomputation, not on their contents.
			builder: Bun.env.WORX_RELEASE_BUILDER ?? Bun.env.USER ?? "unknown",
			build_host: os.hostname(),
			packages: packed,
		},
		null,
		2,
	)}\n`,
);

let failed = 0;
for (const row of rows) {
	if (!row.passed) failed += 1;
	console.log(`${row.passed ? "[PASS]" : "[FAIL]"} ${row.name} — ${row.detail}`);
}
console.log(`\nrelease manifest: ${path.relative(repoRoot, manifestPath)}`);

if (!explicitOut) await fs.rm(outDir, { recursive: true, force: true });

if (failed > 0) {
	console.error(`selftest:pack failed (${failed}/${rows.length} gates).`);
	process.exit(1);
}
console.log(`selftest:pack passed (${rows.length} gates, release ${releaseVersion}).`);
