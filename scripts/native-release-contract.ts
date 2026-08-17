/**
 * P1b §4b-1 — the native release package set, in machine-readable form.
 *
 * The three release gates (`verify:native`, `verify:provenance`, `selftest:pack`)
 * all read this module instead of each re-deriving the package list, so a
 * platform can never be half-added: adding an entry here is what makes the
 * gates demand a manifest, a staged addon, a build receipt, and a tarball.
 *
 * G2 freezes support at darwin-arm64 and linux-x64(modern). Unsupported
 * platforms are absent from this set by construction, and the loader refuses
 * them with a single explicit error (§4b-2) rather than degrading silently.
 */
import * as path from "node:path";

export const repoRoot = path.resolve(import.meta.dir, "..");

/** Aggregator package that owns the platform-selection contract. */
export const AGGREGATOR_PACKAGE = {
	dir: "packages/natives",
	name: "@bworx-io/worx-code-natives",
} as const;

export interface NativePlatformPackage {
	/** Workspace directory, repo-relative. */
	readonly dir: string;
	/** Published package name. */
	readonly name: string;
	/** Loader platform tag (`${process.platform}-${process.arch}`). */
	readonly platformTag: string;
	/** npm `os` selector. */
	readonly os: string;
	/** npm `cpu` selector. */
	readonly cpu: string;
	/** npm `libc` selector; linux-only, absent elsewhere. */
	readonly libc?: readonly string[];
	/**
	 * Addon filename produced by the build for this platform. x64 builds carry a
	 * micro-architecture variant suffix; arm64 builds do not.
	 */
	readonly addonFilename: string;
}

export const NATIVE_PLATFORM_PACKAGES: readonly NativePlatformPackage[] = [
	{
		dir: "packages/natives-darwin-arm64",
		name: "@bworx-io/worx-code-natives-darwin-arm64",
		platformTag: "darwin-arm64",
		os: "darwin",
		cpu: "arm64",
		addonFilename: "pi_natives.darwin-arm64.node",
	},
	{
		dir: "packages/natives-linux-x64",
		name: "@bworx-io/worx-code-natives-linux-x64",
		platformTag: "linux-x64",
		os: "linux",
		cpu: "x64",
		libc: ["glibc"],
		addonFilename: "pi_natives.linux-x64-modern.node",
	},
] as const;

/** Every package published by the native release, aggregator first. */
export const NATIVE_RELEASE_PACKAGE_DIRS: readonly string[] = [
	AGGREGATOR_PACKAGE.dir,
	...NATIVE_PLATFORM_PACKAGES.map(entry => entry.dir),
];

/** Files a platform package is allowed to publish. */
export const PLATFORM_PACKAGE_FILES = ["native", "README.md"] as const;

/**
 * Install hooks are prohibited across the whole set: the addon ships as bytes in
 * the tarball, so a lifecycle script could only be a codemod or a downloader.
 * P1 exit asserts their absence, and the gates enforce it before publication.
 */
export const FORBIDDEN_LIFECYCLE_SCRIPTS = [
	"preinstall",
	"install",
	"postinstall",
	"preuninstall",
	"postuninstall",
	"prepare",
	"prepublish",
] as const;

/**
 * Version-sentinel derivation, mirroring `native/loader-state.js`. The addon
 * exports a function under this name, so the published aggregator version and
 * the compiled bytes are pinned to each other: bumping the version without
 * rebuilding makes the loader reject the addon instead of running a mismatched
 * native surface.
 */
export function versionSentinelExport(version: string): string {
	return `__piNativesV${version.replace(/[^A-Za-z0-9]/g, "_")}`;
}

/** Capability sentinel every accepted addon must also export. */
export const PUBLISH_OUTCOME_SENTINEL = "__piNativesPublishOutcomeV1";

export interface PackageManifest {
	name?: string;
	version?: string;
	private?: boolean;
	os?: string[];
	cpu?: string[];
	libc?: string[];
	files?: string[];
	scripts?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
	[key: string]: unknown;
}

export async function readManifest(dir: string): Promise<PackageManifest> {
	return (await Bun.file(path.join(repoRoot, dir, "package.json")).json()) as PackageManifest;
}

/** Where the build writes a platform's addon inside the aggregator package. */
export function builtAddonPath(entry: NativePlatformPackage): string {
	return path.join(repoRoot, AGGREGATOR_PACKAGE.dir, "native", entry.addonFilename);
}

/** Where the addon must be staged for that platform package to publish it. */
export function stagedAddonPath(entry: NativePlatformPackage): string {
	return path.join(repoRoot, entry.dir, "native", entry.addonFilename);
}

/** Build receipt emitted next to an addon by `packages/natives/scripts/build-native.ts`. */
export function buildReceiptPath(addonPath: string): string {
	return `${addonPath}.build.json`;
}

export interface NativeBuildReceipt {
	schema_version: number;
	source_commit: string;
	rust_toolchain: string;
	build_profile: string;
	target: string;
	node_filename: string;
	node_sha256: string;
}

const SHA256 = /^[0-9a-f]{64}$/u;
const COMMIT = /^[0-9a-f]{40}$/u;

export function assertBuildReceiptShape(value: unknown, label: string): NativeBuildReceipt {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw new Error(`${label}: build receipt must be an object`);
	}
	const receipt = value as Record<string, unknown>;
	if (receipt.schema_version !== 1) throw new Error(`${label}: unsupported schema_version ${String(receipt.schema_version)}`);
	for (const field of ["source_commit", "rust_toolchain", "build_profile", "target", "node_filename", "node_sha256"]) {
		if (typeof receipt[field] !== "string" || (receipt[field] as string).length === 0) {
			throw new Error(`${label}: ${field} must be a non-empty string`);
		}
	}
	if (!COMMIT.test(receipt.source_commit as string)) throw new Error(`${label}: source_commit is not a 40-hex commit`);
	if (!SHA256.test(receipt.node_sha256 as string)) throw new Error(`${label}: node_sha256 is not a sha256 digest`);
	return receipt as unknown as NativeBuildReceipt;
}

export async function sha256OfFile(filePath: string): Promise<string> {
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(new Uint8Array(await Bun.file(filePath).arrayBuffer()));
	return hasher.digest("hex");
}
