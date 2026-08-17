#!/usr/bin/env bun
/**
 * P1b §4b-5 gate 2 — `verify:provenance`, rewritten for a no-CI release model.
 *
 * The upstream provenance gate required `ci_run_url` and `workflow_ref` and
 * anchored trust on a `gh run view` server-side commit comparison. This fork has
 * no `.github` directory and releases are built by hand on two hosts, so those
 * fields could only be filled in by fabricating a CI run. They are therefore
 * rejected outright: a manifest that claims CI provenance in a no-CI release is
 * worse than one that admits it was built by a person.
 *
 * What replaces them (§4b-3): the anchor is recomputation. Every retained
 * tarball is re-hashed, and the addon is re-hashed *out of the tarball* so the
 * chain covers the bytes that would actually be published:
 *
 *   source_commit + rust_toolchain + build_profile
 *     -> node_sha256 (recomputed from the tarball member)
 *     -> tarball_sha256 (recomputed from the retained archive)
 *     -> publish receipt (recorded per package once published)
 *
 * "Reproducible" means those recomputations match the recorded values. It does
 * not claim a bit-identical rebuild; the nightly toolchain, thin LTO, and
 * parallel codegen make that a promise this release line cannot keep.
 *
 * Usage:
 *   bun scripts/verify-provenance.ts artifacts/native-release/native-release-manifest.json
 */
import { createHash } from "node:crypto";
import * as path from "node:path";
import { NATIVE_PLATFORM_PACKAGES, repoRoot } from "./native-release-contract";

interface GateRow {
	readonly name: string;
	readonly passed: boolean;
	readonly detail: string;
}
const rows: GateRow[] = [];
function gate(name: string, passed: boolean, detail: string): void {
	rows.push({ name, passed, detail });
}

/**
 * Fields that only make sense when a CI service vouches for the build. Present
 * in a manual release, they are unverifiable decoration.
 */
export const REJECTED_CI_FIELDS = ["ci_run_url", "workflow_ref", "run_id", "run_attempt", "job_id"] as const;

export const REQUIRED_MANIFEST_FIELDS = [
	"schema_version",
	"release_version",
	"signing",
	"built_at",
	"builder",
	"build_host",
	"packages",
] as const;

export const REQUIRED_PACKAGE_FIELDS = ["package_name", "package_version", "tarball", "tarball_sha256", "tarball_bytes"] as const;

/** Platform rows additionally have to carry the native build facts. */
export const REQUIRED_PLATFORM_FIELDS = ["source_commit", "rust_toolchain", "build_profile", "node_sha256"] as const;

const SHA256 = /^[0-9a-f]{64}$/u;

export function findRejectedCiFields(value: unknown, trail: string[] = []): string[] {
	if (Array.isArray(value)) return value.flatMap((item, index) => findRejectedCiFields(item, [...trail, String(index)]));
	if (typeof value !== "object" || value === null) return [];
	const found: string[] = [];
	for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
		if ((REJECTED_CI_FIELDS as readonly string[]).includes(key)) found.push([...trail, key].join("."));
		found.push(...findRejectedCiFields(child, [...trail, key]));
	}
	return found;
}

async function main(): Promise<void> {
	const manifestArg = process.argv[2] ?? "artifacts/native-release/native-release-manifest.json";
	const manifestPath = path.resolve(repoRoot, manifestArg);
	if (!(await Bun.file(manifestPath).exists())) {
		console.error(`verify:provenance: no release manifest at ${path.relative(repoRoot, manifestPath)}`);
		console.error("Run `bun run selftest:pack --out artifacts/native-release` first.");
		process.exit(2);
	}
	const manifest = (await Bun.file(manifestPath).json()) as Record<string, unknown>;

	const missingTop = REQUIRED_MANIFEST_FIELDS.filter(field => manifest[field] === undefined);
	gate("manifest carries every required field", missingTop.length === 0, missingTop.join(", ") || "complete");

	const rejected = findRejectedCiFields(manifest);
	gate("manifest claims no CI provenance", rejected.length === 0, rejected.join(", ") || "none");

	gate("manifest records the signing decision", manifest.signing === "none", String(manifest.signing));
	gate("manifest schema version", manifest.schema_version === 1, String(manifest.schema_version));

	const packages = Array.isArray(manifest.packages) ? (manifest.packages as Record<string, unknown>[]) : [];
	gate("manifest lists the whole release set", packages.length === NATIVE_PLATFORM_PACKAGES.length + 1, `${packages.length} package(s)`);

	const platformTags = new Set(NATIVE_PLATFORM_PACKAGES.map(entry => entry.platformTag));
	const seenPlatforms = new Set<string>();

	for (const entry of packages) {
		const label = String(entry.package_name ?? "<unnamed>");
		const missing = REQUIRED_PACKAGE_FIELDS.filter(field => entry[field] === undefined);
		gate(`${label}: required fields`, missing.length === 0, missing.join(", ") || "complete");

		const tarballPath = path.resolve(repoRoot, String(entry.tarball ?? ""));
		if (!(await Bun.file(tarballPath).exists())) {
			gate(`${label}: retained tarball present`, false, `missing ${String(entry.tarball)}`);
			continue;
		}
		const bytes = new Uint8Array(await Bun.file(tarballPath).arrayBuffer());
		const actualTarballSha = createHash("sha256").update(bytes).digest("hex");
		gate(
			`${label}: tarball digest recomputes`,
			SHA256.test(String(entry.tarball_sha256)) && actualTarballSha === entry.tarball_sha256,
			actualTarballSha.slice(0, 16),
		);
		gate(`${label}: tarball size recorded`, bytes.byteLength === entry.tarball_bytes, `${bytes.byteLength} bytes`);

		const platformTag = entry.platform_tag === null ? null : String(entry.platform_tag);
		if (platformTag === null) continue;
		if (!platformTags.has(platformTag)) {
			gate(`${label}: platform is in the supported set`, false, platformTag);
			continue;
		}
		seenPlatforms.add(platformTag);

		const missingPlatformFields = REQUIRED_PLATFORM_FIELDS.filter(field => entry[field] === undefined || entry[field] === null);
		gate(`${label}: native build facts`, missingPlatformFields.length === 0, missingPlatformFields.join(", ") || "complete");
		if (missingPlatformFields.length > 0) continue;

		// Anchor the addon digest on the archive member, not on the working tree: the
		// published bytes are the ones inside the tarball.
		const platform = NATIVE_PLATFORM_PACKAGES.find(candidate => candidate.platformTag === platformTag);
		if (!platform) continue;
		const member = `package/native/${platform.addonFilename}`;
		const extracted = Bun.spawnSync(["tar", "-xOzf", tarballPath, member], { stdout: "pipe", stderr: "pipe" });
		if (extracted.exitCode !== 0) {
			gate(`${label}: tarball contains the addon`, false, `missing ${member}`);
			continue;
		}
		const addonSha = createHash("sha256").update(extracted.stdout).digest("hex");
		gate(`${label}: addon digest recomputes from the tarball`, addonSha === entry.node_sha256, addonSha.slice(0, 16));
		gate(`${label}: source commit shape`, /^[0-9a-f]{40}$/u.test(String(entry.source_commit)), String(entry.source_commit).slice(0, 12));
		gate(
			`${label}: build profile is a release profile`,
			entry.build_profile === "dist" || entry.build_profile === "ci",
			String(entry.build_profile),
		);
	}

	const missingPlatforms = [...platformTags].filter(tag => !seenPlatforms.has(tag));
	gate("every supported platform has provenance", missingPlatforms.length === 0, missingPlatforms.join(", ") || "darwin-arm64, linux-x64");

	let failed = 0;
	for (const row of rows) {
		if (!row.passed) failed += 1;
		console.log(`${row.passed ? "[PASS]" : "[FAIL]"} ${row.name} — ${row.detail}`);
	}

	if (failed > 0) {
		console.error(`\nverify:provenance failed (${failed}/${rows.length} gates).`);
		process.exit(1);
	}
	console.log(`\nverify:provenance passed (${rows.length} gates, release ${String(manifest.release_version)}).`);
}

// Importable for tests: only the CLI entrypoint runs the gate.
if (import.meta.main) await main();
