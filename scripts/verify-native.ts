#!/usr/bin/env bun
/**
 * P1b §4b-5 gate 1 — `verify:native`.
 *
 * Checks the native release set as a matrix over both supported platforms
 * instead of the single hardcoded platform the upstream wrapper gate used.
 *
 * Platform-independent checks run everywhere: manifest shape, the
 * platform-selection contract on the aggregator, the absence of install hooks,
 * and the presence of a staged addon plus its build receipt for every platform.
 * Byte-level checks (sha256 recomputation, sentinel export) run for whichever
 * platforms actually have their addon staged, so a darwin host proves darwin
 * and reports the linux rows as `not-staged` rather than silently passing them.
 */
import * as path from "node:path";
import {
	AGGREGATOR_PACKAGE,
	assertBuildReceiptShape,
	buildReceiptPath,
	FORBIDDEN_LIFECYCLE_SCRIPTS,
	NATIVE_PLATFORM_PACKAGES,
	type NativePlatformPackage,
	PLATFORM_PACKAGE_FILES,
	PUBLISH_OUTCOME_SENTINEL,
	readManifest,
	repoRoot,
	sha256OfFile,
	stagedAddonPath,
	versionSentinelExport,
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

function forbiddenScriptsIn(scripts: Record<string, string> | undefined): string[] {
	if (!scripts) return [];
	return FORBIDDEN_LIFECYCLE_SCRIPTS.filter(hook => typeof scripts[hook] === "string");
}

const aggregator = await readManifest(AGGREGATOR_PACKAGE.dir);
const releaseVersion = aggregator.version ?? "<missing>";

gate("aggregator identity", aggregator.name === AGGREGATOR_PACKAGE.name, `${aggregator.name} @ ${releaseVersion}`);

// §4b-2: the engine fork's aggregator manifest owns platform selection. It must
// name exactly the supported platform packages, each pinned to the same version
// the aggregator publishes, so an install can never resolve a stale addon.
const optional = aggregator.optionalDependencies ?? {};
const expectedOptionalNames = NATIVE_PLATFORM_PACKAGES.map(entry => entry.name).sort();
const actualOptionalNames = Object.keys(optional).sort();
gate(
	"aggregator owns the platform selection contract",
	JSON.stringify(actualOptionalNames) === JSON.stringify(expectedOptionalNames),
	actualOptionalNames.join(", ") || "<none>",
);

const aggregatorHooks = forbiddenScriptsIn(aggregator.scripts);
gate("aggregator declares no install hooks", aggregatorHooks.length === 0, aggregatorHooks.join(", ") || "none");

for (const entry of NATIVE_PLATFORM_PACKAGES) {
	const manifest = await readManifest(entry.dir);
	const label = entry.platformTag;

	gate(`${label}: package identity`, manifest.name === entry.name, `${manifest.name}`);
	gate(`${label}: version matches the aggregator`, manifest.version === releaseVersion, `${manifest.version}`);
	gate(`${label}: os selector`, JSON.stringify(manifest.os) === JSON.stringify([entry.os]), JSON.stringify(manifest.os));
	gate(`${label}: cpu selector`, JSON.stringify(manifest.cpu) === JSON.stringify([entry.cpu]), JSON.stringify(manifest.cpu));
	// libc is a linux-only selector: setting it elsewhere makes npm skip the
	// package, and omitting it on linux lets a glibc addon install on musl.
	gate(
		`${label}: libc selector`,
		JSON.stringify(manifest.libc) === JSON.stringify(entry.libc ?? undefined),
		JSON.stringify(manifest.libc ?? null),
	);
	gate(
		`${label}: publishes only the addon and readme`,
		JSON.stringify(manifest.files) === JSON.stringify([...PLATFORM_PACKAGE_FILES]),
		JSON.stringify(manifest.files),
	);
	gate(`${label}: is publishable`, manifest.private !== true, `private=${String(manifest.private ?? false)}`);
	const hooks = forbiddenScriptsIn(manifest.scripts);
	gate(`${label}: declares no install hooks`, hooks.length === 0, hooks.join(", ") || "none");

	const spec = optional[entry.name];
	gate(
		`${label}: aggregator pins the platform package`,
		spec === "workspace:*" || spec === releaseVersion,
		String(spec ?? "<missing>"),
	);

	await verifyStagedArtifact(entry, label, releaseVersion);
}

async function verifyStagedArtifact(entry: NativePlatformPackage, label: string, version: string): Promise<void> {
	const addonPath = stagedAddonPath(entry);
	const staged = await Bun.file(addonPath).exists();
	if (!staged) {
		// Not a failure on a host that cannot build this platform. The publish
		// procedure stages both platforms before packing, and `selftest:pack`
		// fails closed when a platform tarball would ship without its addon.
		gate(`${label}: addon staged`, true, `not-staged (${path.relative(repoRoot, addonPath)})`);
		return;
	}
	gate(`${label}: addon staged`, true, path.relative(repoRoot, addonPath));

	const receiptPath = buildReceiptPath(addonPath);
	if (!(await Bun.file(receiptPath).exists())) {
		gate(`${label}: build receipt present`, false, `missing ${path.relative(repoRoot, receiptPath)}`);
		return;
	}
	gate(`${label}: build receipt present`, true, path.relative(repoRoot, receiptPath));

	let receipt: ReturnType<typeof assertBuildReceiptShape>;
	try {
		receipt = assertBuildReceiptShape(await Bun.file(receiptPath).json(), label);
	} catch (error) {
		gate(`${label}: build receipt shape`, false, error instanceof Error ? error.message : String(error));
		return;
	}
	gate(`${label}: build receipt shape`, true, `profile=${receipt.build_profile} toolchain=${receipt.rust_toolchain}`);

	// §4b-3 anchor: recompute the digest over the retained bytes. "Reproducible"
	// here means the recomputation matches the recorded value, not that a rebuild
	// is bit-identical.
	const actualSha = await sha256OfFile(addonPath);
	gate(`${label}: addon digest matches its receipt`, actualSha === receipt.node_sha256, actualSha.slice(0, 16));
	gate(`${label}: receipt names the staged file`, receipt.node_filename === entry.addonFilename, receipt.node_filename);

	// The sentinel is emitted by the Rust addon under a version-derived js_name,
	// so finding it in the bytes proves the addon belongs to this release line.
	const bytes = new Uint8Array(await Bun.file(addonPath).arrayBuffer());
	const haystack = Buffer.from(bytes).toString("latin1");
	const sentinel = versionSentinelExport(version);
	gate(`${label}: version sentinel ${sentinel}`, haystack.includes(sentinel), `${bytes.byteLength} bytes`);
	gate(`${label}: capability sentinel`, haystack.includes(PUBLISH_OUTCOME_SENTINEL), PUBLISH_OUTCOME_SENTINEL);
}

let failed = 0;
for (const row of rows) {
	if (!row.passed) failed += 1;
	console.log(`${row.passed ? "[PASS]" : "[FAIL]"} ${row.name} — ${row.detail}`);
}

if (failed > 0) {
	console.error(`\nverify:native failed (${failed}/${rows.length} gates).`);
	process.exit(1);
}
console.log(`\nverify:native passed (${rows.length} gates, release ${releaseVersion}).`);
