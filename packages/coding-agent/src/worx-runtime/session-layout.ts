/**
 * Pure path layout for session-scoped GJC workflow state.
 *
 * Every generated/runtime artifact for a GJC session lives under
 * `<cwd>/.worx/_session-{encodedSessionId}/...`. The `_session-` prefix is what
 * discriminates a session directory from shared, user-authored/installed config
 * (settings.json, secrets.yml, agents/, worx-plugins/, agent/, python-env/, user
 * skills/commands), which always stays at the `.worx/` root.
 *
 * This module is PURE and acyclic: every export is a deterministic function of
 * its arguments. It never reads `process.env` and never touches the filesystem.
 * Session resolution (flag/payload/env/latest-activity-marker) and any
 * filesystem scanning live in `session-resolution.ts`, the boundary module.
 */
import * as path from "node:path";

export const WORX_DIR = ".worx";
export const WORX_SESSION_PREFIX = "_session-";
export const WORX_SESSION_ACTIVITY_FILE = ".session-activity.json";

/** Source that produced a resolved GJC session id, for audit/diagnostics. */
export type WorxSessionSource = "flag" | "payload" | "env" | "latest";

export interface WorxSessionContext {
	worxSessionId: string;
	sessionRoot: string;
	source: WorxSessionSource;
}

/**
 * Encode a session id into a single safe path segment. Matches the historical
 * encoding used across the runtimes so ids round-trip identically:
 * `encodeURIComponent` plus dot-escaping (dots are legal in filenames but we
 * avoid `.`/`..` traversal ambiguity).
 */
export function encodeSessionSegment(value: string): string {
	return encodeURIComponent(value).replaceAll(".", "%2E");
}

/** Inverse of {@link encodeSessionSegment}. */
export function decodeSessionSegment(segment: string): string {
	return decodeURIComponent(segment.replaceAll("%2E", "."));
}

/** Throw when a session id is missing or blank; never let blank suppress callers. */
export function assertNonEmptyWorxSessionId(value: string | undefined, source: string): asserts value is string {
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`a non-empty GJC session id is required (${source})`);
	}
}

/**
 * Assert a value is safe to use as a single path segment: non-blank and free of
 * path separators or `.`/`..` traversal. Use for already-safe identifiers
 * (skill modes, slugs) where we want identical filenames but fail closed on
 * traversal rather than silently normalizing out of the intended directory.
 */
export function assertSafePathComponent(value: string, label: string): void {
	const trimmed = value.trim();
	if (trimmed === "") throw new Error(`${label} is required`);
	if (trimmed === "." || trimmed === ".." || /[/\\]/.test(trimmed)) {
		throw new Error(`${label} must be a safe path component (no separators or traversal): ${value}`);
	}
}

/** The shared `.worx/` root (holds shared config; never session-scoped). */
export function worxRoot(cwd: string): string {
	return path.join(cwd, WORX_DIR);
}

/** The per-session root directory: `<cwd>/.worx/_session-{encodedId}`. */
export function sessionRoot(cwd: string, worxSessionId: string): string {
	assertNonEmptyWorxSessionId(worxSessionId, "sessionRoot");
	return path.join(worxRoot(cwd), `${WORX_SESSION_PREFIX}${encodeSessionSegment(worxSessionId)}`);
}

/** Directory name (no path) for a session id, e.g. `_session-abc`. */
export function sessionDirName(worxSessionId: string): string {
	assertNonEmptyWorxSessionId(worxSessionId, "sessionDirName");
	return `${WORX_SESSION_PREFIX}${encodeSessionSegment(worxSessionId)}`;
}

/** Return the decoded session id for a `_session-*` directory name, else undefined. */
export function sessionIdFromDirName(name: string): string | undefined {
	if (!name.startsWith(WORX_SESSION_PREFIX)) return undefined;
	const suffix = name.slice(WORX_SESSION_PREFIX.length);
	if (suffix === "") return undefined;
	let decoded: string;
	try {
		decoded = decodeSessionSegment(suffix);
	} catch {
		return undefined;
	}
	return decoded.trim() === "" ? undefined : decoded;
}

/** Authoritative per-session activity marker path. */
export function sessionActivityPath(cwd: string, worxSessionId: string): string {
	return path.join(sessionRoot(cwd, worxSessionId), WORX_SESSION_ACTIVITY_FILE);
}

// ---- Top-level per-category subdir resolvers ----

export function sessionStateDir(cwd: string, worxSessionId: string): string {
	return path.join(sessionRoot(cwd, worxSessionId), "state");
}
export function sessionSpecsDir(cwd: string, worxSessionId: string): string {
	return path.join(sessionRoot(cwd, worxSessionId), "specs");
}
export function sessionPlansDir(cwd: string, worxSessionId: string): string {
	return path.join(sessionRoot(cwd, worxSessionId), "plans");
}
export function sessionUltragoalDir(cwd: string, worxSessionId: string): string {
	return path.join(sessionRoot(cwd, worxSessionId), "ultragoal");
}
export function sessionAuditDir(cwd: string, worxSessionId: string): string {
	return path.join(sessionRoot(cwd, worxSessionId), "audit");
}
export function sessionReportsDir(cwd: string, worxSessionId: string): string {
	return path.join(sessionRoot(cwd, worxSessionId), "reports");
}
export function sessionLogsDir(cwd: string, worxSessionId: string): string {
	return path.join(sessionRoot(cwd, worxSessionId), "logs");
}
export function sessionRuntimeDir(cwd: string, worxSessionId: string): string {
	return path.join(sessionRoot(cwd, worxSessionId), "runtime");
}
export function sessionRlmDir(cwd: string, worxSessionId: string): string {
	return path.join(sessionRoot(cwd, worxSessionId), "rlm");
}

// ---- Nested resolvers under <sessionRoot>/state ----

export function activeStateDir(cwd: string, worxSessionId: string): string {
	return path.join(sessionStateDir(cwd, worxSessionId), "active");
}
export function activeSnapshotPath(cwd: string, worxSessionId: string): string {
	return path.join(sessionStateDir(cwd, worxSessionId), "skill-active-state.json");
}
export function activeEntryPath(cwd: string, worxSessionId: string, skill: string): string {
	const normalized = skill.trim();
	if (normalized === "") throw new Error("skill is required");
	return path.join(activeStateDir(cwd, worxSessionId), `${encodeSessionSegment(normalized)}.json`);
}
export function modeStatePath(cwd: string, worxSessionId: string, mode: string): string {
	const normalized = mode.trim();
	assertSafePathComponent(normalized, "mode");
	return path.join(sessionStateDir(cwd, worxSessionId), `${normalized}-state.json`);
}
export function auditPath(cwd: string, worxSessionId: string): string {
	return path.join(sessionStateDir(cwd, worxSessionId), "audit.jsonl");
}
export function transactionJournalPath(cwd: string, worxSessionId: string, mutationId: string): string {
	return path.join(sessionStateDir(cwd, worxSessionId), "transactions", `${encodeSessionSegment(mutationId)}.json`);
}
export function teamStateRoot(cwd: string, worxSessionId: string): string {
	return path.join(sessionStateDir(cwd, worxSessionId), "team");
}
export function workflowGatePath(cwd: string, worxSessionId: string, gateId: string): string {
	return path.join(sessionStateDir(cwd, worxSessionId), "workflow-gates", `${encodeSessionSegment(gateId)}.json`);
}
export function harnessStateRoot(cwd: string, worxSessionId: string): string {
	return path.join(sessionStateDir(cwd, worxSessionId), "harness");
}
export function coordinatorMcpStateRoot(cwd: string, worxSessionId: string): string {
	return path.join(sessionStateDir(cwd, worxSessionId), "coordinator-mcp");
}

// ---- Nested resolvers under other top-level categories ----

export function tmuxRuntimeSessionPath(cwd: string, worxSessionId: string, slug: string): string {
	const normalized = slug.trim();
	assertSafePathComponent(normalized, "slug");
	return path.join(sessionRuntimeDir(cwd, worxSessionId), "tmux-sessions", `${normalized}.json`);
}
export function rlmArtifactRoot(cwd: string, worxSessionId: string, rlmSessionId: string): string {
	const normalized = rlmSessionId.trim();
	if (normalized === "") throw new Error("rlmSessionId is required");
	return path.join(sessionRlmDir(cwd, worxSessionId), encodeSessionSegment(normalized));
}
