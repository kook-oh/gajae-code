import type { CanonicalWorxWorkflowSkill } from "../../skill-state/active-state";
import { CANONICAL_WORX_WORKFLOW_SKILLS } from "../../skill-state/active-state";

export const WORX_PLUGIN_MANIFEST_FILENAME = "gajae-plugin.json";
export const WORX_PLUGIN_KIND = "gajae-code-plugin";

export const WORX_SUBSKILL_PARENT_SKILLS = CANONICAL_WORX_WORKFLOW_SKILLS;
export type WorxSubskillParentSkill = CanonicalWorxWorkflowSkill;

export const WORX_SUBSKILL_PARENT_AGENTS = ["executor", "architect", "planner", "critic"] as const;
export type WorxSubskillParentAgent = (typeof WORX_SUBSKILL_PARENT_AGENTS)[number];

export type WorxSubskillParent = WorxSubskillParentSkill | WorxSubskillParentAgent;

export const WORX_AGENT_SUBSKILL_PHASES: Record<WorxSubskillParentAgent, string[]> = {
	executor: ["prompt"],
	architect: ["prompt"],
	planner: ["prompt"],
	critic: ["prompt"],
};

export interface WorxPluginToolManifestEntry {
	name: string;
	path: string;
	description?: string;
	sha256?: string;
	/** Optional JSON Schema declaration for registry-v2 metadata. */
	schema?: unknown;
	/** Aliases accepted when migrating older manifests. */
	inputSchema?: unknown;
	input_schema?: unknown;
	parameters?: unknown;
	/** Optional sidecar JSON Schema file, resolved within the plugin root. */
	schemaPath?: string;
	schema_path?: string;
	/**
	 * "always-on" object entries are activated for the whole session; legacy
	 * string shorthand stays "subskill"-scoped and is only attached to subskill
	 * bindings (never registered as an always-on tool surface).
	 */
	surface: "subskill" | "always-on";
}

export interface WorxPluginHookManifestEntry {
	name: string;
	event: string;
	target?: string;
	phase?: "before" | "after";
	path: string;
	sha256?: string;
}

export type WorxPluginMcpTransport = "stdio" | "http" | "sse";

export interface WorxPluginMcpManifestEntry {
	name: string;
	transport: WorxPluginMcpTransport;
	command?: string;
	args?: string[];
	cwd?: string;
	url?: string;
	headers?: Record<string, string>;
	sha256?: string;
}

export interface WorxPluginAppendixManifestEntry {
	name: string;
	path?: string;
	content?: string;
	sha256?: string;
}

export interface WorxPluginAgentAppendixManifestEntry extends WorxPluginAppendixManifestEntry {
	agent: WorxSubskillParentAgent;
}

export interface WorxPluginManifest {
	name: string;
	version: string;
	kind: "gajae-code-plugin";
	subskills: string[];
	tools: WorxPluginToolManifestEntry[];
	hooks: WorxPluginHookManifestEntry[];
	mcps: WorxPluginMcpManifestEntry[];
	systemAppendix: WorxPluginAppendixManifestEntry[];
	agentAppendix: WorxPluginAgentAppendixManifestEntry[];
}

export interface SubskillFrontmatter {
	name: string;
	binds_to: string;
	phase: string;
	activation_arg: string;
	description: string;
}

export interface LoadedSubskillBinding {
	plugin: string;
	subskillName: string;
	parent: string;
	bindsTo: string;
	phase: string;
	activationArg: string;
	description: string;
	filePath: string;
	body: string;
	toolPaths: string[];
}

export interface NormalizedSubskillToolSurface {
	extensionId: string;
	relativePath: string;
	implementationHash: string;
}

export interface LoadedSubskillToolReference {
	extensionId: string;
	relativePath: string;
	expectedDigest: string;
}

export interface LoadedSubskillActivation {
	activationArg: string;
	plugin: string;
	subskillName: string;
	parent: string;
	bindsTo: string;
	phase: string;
	/** Registry identity for v2-only activation. */
	scope?: WorxPluginScope;
	extensionId?: string;
	expectedDigest?: string;
	filePath: string;
	toolPaths: string[];
	toolRefs?: LoadedSubskillToolReference[];
}

export interface PhaseScopedToolBinding {
	plugin: string;
	parent: string;
	phase: string;
	toolPath: string;
}

export interface LoadedWorxPlugin {
	name: string;
	version: string;
	root: string;
	manifestPath: string;
	bindings: LoadedSubskillBinding[];
	toolBindings: PhaseScopedToolBinding[];
}

export type WorxPluginLoadErrorCode =
	// Parse-time
	| "forbidden_surface"
	| "invalid_manifest"
	| "invalid_kind"
	| "unsupported_surface"
	// Compile-time
	| "invalid_frontmatter"
	| "invalid_parent"
	| "invalid_phase"
	| "missing_file"
	| "hash_mismatch"
	| "invalid_schema"
	| "missing_surface"
	| "invalid_appendix"
	| "invalid_hook"
	| "invalid_mcp"
	// Install-time
	| "duplicate_arg"
	| "duplicate_parent_phase"
	| "duplicate_tool"
	| "duplicate_hook"
	| "duplicate_mcp"
	| "duplicate_appendix"
	| "security_policy"
	| "install_conflict"
	// Session-start / runtime
	| "session_collision"
	| "runtime_mismatch"
	| "quarantined_surface"
	| "migration_required";

export class WorxPluginLoadError extends Error {
	readonly code: WorxPluginLoadErrorCode;

	constructor(code: WorxPluginLoadErrorCode, message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "WorxPluginLoadError";
		this.code = code;
	}
}

/** Typed refusal raised when an implementation changed after v2 metadata was recorded. */
export class PluginImplementationHashMismatchError extends WorxPluginLoadError {
	readonly expected: string;
	readonly actual: string;
	readonly path: string;

	constructor(path: string, expected: string, actual: string) {
		super("hash_mismatch", `GJC plugin implementation hash mismatch for ${path}`);
		this.name = "PluginImplementationHashMismatchError";
		this.path = path;
		this.expected = expected;
		this.actual = actual;
	}
}

/** Typed refusal for a registry entry that could not be migrated to v2 metadata. */
export class PluginMigrationRequiredError extends WorxPluginLoadError {
	constructor(plugin: string, surface: string, cause: string) {
		super("migration_required", `GJC plugin "${plugin}" surface "${surface}" requires migration: ${cause}`);
		this.name = "PluginMigrationRequiredError";
	}
}

export type WorxPluginScope = "user" | "project";

export type WorxPluginSourceKind = "path" | "git" | "tarball";

export interface WorxPluginCopiedFile {
	relativePath: string;
	sha256: string;
	bytes: number;
}

export interface NormalizedSubskillSurface {
	extensionId: string;
	name: string;
	description: string;
	parent: string;
	phase: string;
	activationArg: string;
	relativePath: string;
	sha256: string;
	toolRefs?: NormalizedSubskillToolSurface[];
}

export interface NormalizedToolSurface {
	extensionId: string;
	name: string;
	relativePath: string;
	sha256: string;
	description?: string;
	/** v2 metadata fields; optional only for in-memory legacy fixtures. */
	schema?: JsonSchema202012;
	schemaHash?: string;
	implementationHash?: string;
	presentationHash?: string;
	metadataVersion?: 2;
}

/** JSON Schema 2020-12 documents are kept as JSON values so migration never needs an implementation import. */
export type JsonSchema202012 = boolean | Record<string, unknown>;

/**
 * Registry-v2 tool metadata. The implementation and presentation hashes are
 * content digests, not executable metadata. `schema` is canonicalized before
 * `schemaHash` is computed.
 */
export interface NormalizedToolSurfaceV2 extends NormalizedToolSurface {
	schema: JsonSchema202012;
	schemaHash: string;
	implementationHash: string;
	presentationHash?: string;
	metadataVersion: 2;
}

export interface WorxPluginMigrationFailure {
	code: WorxPluginLoadErrorCode;
	surface: string;
	cause: string;
}

export interface WorxPluginMigrationState {
	status: "migrated" | "failed";
	metadataVersion: 2;
	migratedAt?: string;
	failure?: WorxPluginMigrationFailure;
}

export interface NormalizedHookSurface {
	extensionId: string;
	name: string;
	event: string;
	target?: string;
	phase?: "before" | "after";
	relativePath: string;
	sha256: string;
	implementationHash?: string;
}

export interface NormalizedMcpSurface {
	extensionId: string;
	name: string;
	transport: WorxPluginMcpTransport;
	configHash: string;
	config: WorxPluginMcpManifestEntry;
}

export interface NormalizedAppendixSurface {
	extensionId: string;
	name: string;
	relativePath?: string;
	/** Inline appendix body (when the manifest used `content` instead of `path`). */
	content?: string;
	contentHash: string;
	bytes: number;
}

export interface NormalizedAgentAppendixSurface extends NormalizedAppendixSurface {
	agent: WorxSubskillParentAgent;
}

export interface NormalizedWorxPluginSurfaces {
	subskills: NormalizedSubskillSurface[];
	tools: NormalizedToolSurface[];
	hooks: NormalizedHookSurface[];
	mcps: NormalizedMcpSurface[];
	systemAppendices: NormalizedAppendixSurface[];
	agentAppendices: NormalizedAgentAppendixSurface[];
}

/**
 * Result of the pure compile step. Computed from manifest, frontmatter, and
 * declared files read as bytes only — never by importing plugin code.
 */
export interface NormalizedWorxPluginBundle {
	name: string;
	version: string;
	root: string;
	manifestPath: string;
	manifestHash: string;
	surfaces: NormalizedWorxPluginSurfaces;
	files: WorxPluginCopiedFile[];
}

export interface WorxPluginQuarantineEntry {
	surfaceId: string;
	code: WorxPluginLoadErrorCode;
	message: string;
	detectedAt: string;
}

export interface WorxPluginRegistrySource {
	kind: WorxPluginSourceKind;
	uri: string;
	ref?: string;
	sha?: string;
	resolvedAt: string;
}

export interface WorxPluginRegistryEntry {
	name: string;
	version: string;
	scope: WorxPluginScope;
	enabled: boolean;
	pluginRoot: string;
	manifestPath: string;
	manifestHash: string;
	source: WorxPluginRegistrySource;
	installedAt: string;
	updatedAt: string;
	copiedFiles: WorxPluginCopiedFile[];
	surfaces: NormalizedWorxPluginSurfaces;
	disabledSurfaceIds: string[];
	quarantine?: WorxPluginQuarantineEntry[];
	/** v2 metadata status; absent is accepted for in-memory legacy test fixtures. */
	migration?: WorxPluginMigrationState;
}

export interface WorxPluginRegistry {
	version: 1;
	scope: WorxPluginScope;
	plugins: WorxPluginRegistryEntry[];
}

/**
 * Stable identifiers for plugin-contributed surfaces used by observability,
 * disabledSurfaceIds, and quarantine bookkeeping.
 */
export type WorxPluginSurfaceExtensionId = string;

/** Canonical GJC bundle identity: kind is fixed, target is (scope, name). */
export const WORX_BUNDLE_KIND = "gjc-bundle";

export interface WorxBundleIdentity {
	kind: typeof WORX_BUNDLE_KIND;
	scope: WorxPluginScope;
	name: string;
}

/** Source descriptor exposed to CLI/Settings: never carries raw locator secrets. */
export interface WorxBundleSafeSource {
	kind: WorxPluginSourceKind;
	/** Redacted display locator (host + path only; no userinfo/query/fragment). */
	display: string;
	/** Conservative safe git ref, omitted when the stored value is unsafe. */
	ref?: string;
	/** Hex-only revision identifier, omitted when the stored value is unsafe. */
	sha?: string;
	resolvedAt: string;
	/** True when this source kind supports re-resolution during update. */
	updatable: boolean;
	/** Present only when updatable is false. */
	unsupportedReason?: string;
}

export interface WorxBundleSurfaceSummary {
	extensionId: string;
	kind: "tool" | "hook" | "mcp" | "system-appendix" | "agent-appendix" | "subskill";
	name: string;
	/** Persisted user intent (registry disabledSurfaceIds). */
	enabled: boolean;
	/** Deterministic quarantine derived from persisted registry state only. */
	quarantined: boolean;
	quarantineCode?: WorxPluginLoadErrorCode;
}

/** Installed-bundle DTO shared by CLI and Settings. Contains no raw locators. */
export interface WorxBundleSummary {
	identity: WorxBundleIdentity;
	version: string;
	description?: string;
	enabled: boolean;
	source: WorxBundleSafeSource;
	installedAt: string;
	updatedAt: string;
	manifestHash: string;
	/** Deterministic fingerprint of the exact installed target. */
	targetFingerprint: string;
	surfaces: WorxBundleSurfaceSummary[];
	/** True when any deterministic quarantine blocks enablement. */
	quarantined: boolean;
}

/**
 * Host-derived token binding an update preview to the exact candidate, the
 * exact installed baseline, and the deterministic decision context. Apply is a
 * compare-and-swap against all three fingerprints.
 */
export interface WorxReviewedUpdateToken {
	identity: WorxBundleIdentity;
	candidateFingerprint: string;
	baselineFingerprint: string;
	decisionContextFingerprint: string;
	reviewedAt: string;
}

export type WorxLifecycleErrorCode =
	| "already_installed_use_upgrade"
	| "not_installed"
	| "identity_mismatch"
	| "stale_candidate"
	| "stale_baseline"
	| "stale_decision_context"
	| "source_unsupported"
	| "source_unavailable"
	| "quarantined"
	| "surface_unknown"
	| "invalid_target";

export interface WorxLifecycleError {
	code: WorxLifecycleErrorCode;
	/** Sanitized operator-facing message; never contains raw locators or causes. */
	message: string;
	/** Safe scoped recovery hint (e.g. the exact command to run instead). */
	recovery?: string;
}

export type WorxLifecycleResult<T> = { ok: true; value: T } | { ok: false; error: WorxLifecycleError };

export interface WorxUpdatePreview {
	identity: WorxBundleIdentity;
	current: WorxBundleSummary;
	candidateVersion: string;
	candidateManifestHash: string;
	/** Surface IDs added, removed, or retained by this candidate. */
	addedSurfaceIds: string[];
	removedSurfaceIds: string[];
	retainedSurfaceIds: string[];
	changed: boolean;
	token: WorxReviewedUpdateToken;
}

export type WorxUpdateApplyStatus = "updated" | "unchanged";

export interface WorxUpdateApplyResult {
	status: WorxUpdateApplyStatus;
	summary: WorxBundleSummary;
	/** Number of filesystem remnants that could not be removed after a successful swap. */
	remnantCount: number;
}

export interface WorxInstallResult {
	status: "installed";
	summary: WorxBundleSummary;
}

export interface WorxToggleResult {
	summary: WorxBundleSummary;
	/** False when the requested state already matched (no persisted mutation). */
	mutated: boolean;
}

/**
 * Scope-qualified runtime evidence emitted by producers. Producers never
 * publish; the session coordinator accumulates one complete generation.
 */
export interface WorxRuntimeFinding {
	identity: WorxBundleIdentity;
	surfaceId: string;
	code: WorxPluginLoadErrorCode;
	message: string;
}

export interface WorxRuntimeSnapshot {
	/** Monotonic activation generation this snapshot describes. */
	generation: number;
	findings: WorxRuntimeFinding[];
}

export type WorxRuntimeSnapshotState = { status: "unavailable" } | { status: "current"; snapshot: WorxRuntimeSnapshot };
