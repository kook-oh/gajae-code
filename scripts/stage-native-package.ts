#!/usr/bin/env bun
/**
 * P1b §4b-1 — stage a built addon into its platform package.
 *
 * `packages/natives/scripts/build-native.ts` writes the addon and its build
 * receipt into the aggregator's `native/` directory. Publishing needs those
 * bytes inside the platform package instead, because that is the package npm
 * selects by `os`/`cpu`/`libc`. This script is the only sanctioned way to move
 * them, so the staged copy always arrives with its receipt and a recomputed
 * digest rather than as an untracked hand-copied file.
 *
 * Usage:
 *   bun scripts/stage-native-package.ts              # stage the host platform
 *   bun scripts/stage-native-package.ts --all        # stage every built platform
 *   bun scripts/stage-native-package.ts --platform linux-x64
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
	assertBuildReceiptShape,
	buildReceiptPath,
	builtAddonPath,
	NATIVE_PLATFORM_PACKAGES,
	type NativePlatformPackage,
	repoRoot,
	sha256OfFile,
	stagedAddonPath,
} from "./native-release-contract";

const args = process.argv.slice(2);
const stageAll = args.includes("--all");
const platformIndex = args.indexOf("--platform");
const requestedPlatform = platformIndex === -1 ? null : args[platformIndex + 1];
const hostTag = `${process.platform}-${process.arch}`;

function selectTargets(): readonly NativePlatformPackage[] {
	if (stageAll) return NATIVE_PLATFORM_PACKAGES;
	if (requestedPlatform) {
		const entry = NATIVE_PLATFORM_PACKAGES.find(candidate => candidate.platformTag === requestedPlatform);
		if (!entry) {
			const supported = NATIVE_PLATFORM_PACKAGES.map(candidate => candidate.platformTag).join(", ");
			throw new Error(`Unsupported platform ${requestedPlatform}. Supported: ${supported}`);
		}
		return [entry];
	}
	const entry = NATIVE_PLATFORM_PACKAGES.find(candidate => candidate.platformTag === hostTag);
	if (!entry) throw new Error(`Host platform ${hostTag} is not part of the supported release set.`);
	return [entry];
}

let staged = 0;
let skipped = 0;
for (const entry of selectTargets()) {
	const sourceAddon = builtAddonPath(entry);
	if (!(await Bun.file(sourceAddon).exists())) {
		if (stageAll) {
			console.log(`skip ${entry.platformTag}: no built addon at ${path.relative(repoRoot, sourceAddon)}`);
			skipped += 1;
			continue;
		}
		throw new Error(
			`No built addon for ${entry.platformTag} at ${path.relative(repoRoot, sourceAddon)}. ` +
				"Build it first (serially — concurrent native builds race on index.d.ts).",
		);
	}

	const sourceReceipt = buildReceiptPath(sourceAddon);
	if (!(await Bun.file(sourceReceipt).exists())) {
		throw new Error(`Built addon for ${entry.platformTag} has no build receipt at ${path.relative(repoRoot, sourceReceipt)}`);
	}
	const receipt = assertBuildReceiptShape(await Bun.file(sourceReceipt).json(), entry.platformTag);

	// Recompute before copying: staging a file whose bytes disagree with the
	// receipt would poison the whole integrity chain downstream.
	const actualSha = await sha256OfFile(sourceAddon);
	if (actualSha !== receipt.node_sha256) {
		throw new Error(
			`${entry.platformTag}: built addon digest ${actualSha} does not match its receipt ${receipt.node_sha256}`,
		);
	}
	if (receipt.node_filename !== entry.addonFilename) {
		throw new Error(`${entry.platformTag}: receipt names ${receipt.node_filename}, expected ${entry.addonFilename}`);
	}

	const targetAddon = stagedAddonPath(entry);
	await fs.mkdir(path.dirname(targetAddon), { recursive: true });
	await Bun.write(targetAddon, Bun.file(sourceAddon));
	await Bun.write(buildReceiptPath(targetAddon), Bun.file(sourceReceipt));
	console.log(
		`staged ${entry.platformTag}: ${path.relative(repoRoot, targetAddon)} ` +
			`(${receipt.build_profile}, sha256 ${actualSha.slice(0, 16)}…)`,
	);
	staged += 1;
}

console.log(`\nStaged ${staged} platform package(s)${skipped > 0 ? `, skipped ${skipped}` : ""}.`);
