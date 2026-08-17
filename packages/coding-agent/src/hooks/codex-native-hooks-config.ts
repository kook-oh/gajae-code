import * as os from "node:os";
import * as path from "node:path";

export const WORX_MANAGED_CODEX_HOOK_EVENTS = ["UserPromptSubmit", "Stop"] as const;

export type WorxManagedCodexHookEvent = (typeof WORX_MANAGED_CODEX_HOOK_EVENTS)[number];

type JsonObject = Record<string, unknown>;

export interface CodexCommandHook {
	type: "command";
	command: string;
	statusMessage?: string;
	timeout?: number;
}

export interface CodexHookEntry {
	hooks: CodexCommandHook[];
}

export interface WorxManagedCodexHooksConfig {
	hooks: Record<WorxManagedCodexHookEvent, CodexHookEntry[]>;
}

export interface MergeWorxManagedCodexHooksResult {
	content: string;
	changed: boolean;
	managedHookCount: number;
}

export interface WorxCodexHooksStatus {
	hooksPath: string;
	installed: boolean;
	missingEvents: WorxManagedCodexHookEvent[];
	managedHookCount: number;
}

function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeHooksRoot(parsed: unknown): JsonObject {
	if (!isJsonObject(parsed)) return {};
	return structuredClone(parsed);
}

function normalizeHooksMap(root: JsonObject): Record<string, unknown> {
	if (isJsonObject(root.hooks)) return root.hooks;
	const hooks: Record<string, unknown> = {};
	root.hooks = hooks;
	return hooks;
}

function commandIsWorxManaged(value: unknown): boolean {
	if (typeof value !== "string") return false;
	// Recognizes the command this module emits plus the pre-pivot spelling, so a
	// stale managed hook written by an older build is replaced instead of being
	// preserved as a user hook and duplicated.
	return new RegExp(`\\b(?:worx|${"gjc"})(?:\\.exe)?\\b`).test(value) && /\bcodex-native-hook\b/.test(value);
}

function entryContainsWorxManagedHook(value: unknown): boolean {
	if (!isJsonObject(value) || !Array.isArray(value.hooks)) return false;
	return value.hooks.some(hook => isJsonObject(hook) && commandIsWorxManaged(hook.command));
}

function managedCommand(): string {
	return "worx codex-native-hook";
}

function managedEntry(event: WorxManagedCodexHookEvent): CodexHookEntry {
	const hook: CodexCommandHook = {
		type: "command",
		command: managedCommand(),
		statusMessage: "GJC skill state",
		...(event === "Stop" ? { timeout: 30 } : {}),
	};
	return { hooks: [hook] };
}

export function buildWorxManagedCodexHooksConfig(): WorxManagedCodexHooksConfig {
	return {
		hooks: {
			UserPromptSubmit: [managedEntry("UserPromptSubmit")],
			Stop: [managedEntry("Stop")],
		},
	};
}

export function getDefaultCodexHooksPath(homeDir = os.homedir()): string {
	return path.join(homeDir, ".codex", "hooks.json");
}

export function mergeWorxManagedCodexHooksConfig(existingContent: string | null): MergeWorxManagedCodexHooksResult {
	let root = normalizeHooksRoot(null);
	if (existingContent?.trim()) {
		try {
			root = normalizeHooksRoot(JSON.parse(existingContent) as unknown);
		} catch {
			root = normalizeHooksRoot(null);
		}
	}

	const hooks = normalizeHooksMap(root);
	const managed = buildWorxManagedCodexHooksConfig();
	let managedHookCount = 0;

	for (const event of WORX_MANAGED_CODEX_HOOK_EVENTS) {
		const existingEntries = Array.isArray(hooks[event]) ? hooks[event] : [];
		const userEntries = existingEntries.filter(entry => !entryContainsWorxManagedHook(entry));
		const nextEntries = [...managed.hooks[event], ...userEntries];
		managedHookCount += managed.hooks[event].length;
		hooks[event] = nextEntries;
	}

	const content = `${JSON.stringify(root, null, 2)}\n`;
	return { content, changed: content !== (existingContent ?? ""), managedHookCount };
}

export function readWorxManagedCodexHooksStatus(content: string | null, hooksPath: string): WorxCodexHooksStatus {
	const missingEvents: WorxManagedCodexHookEvent[] = [];
	let managedHookCount = 0;
	let hooks: Record<string, unknown> = {};
	if (content?.trim()) {
		try {
			const root = normalizeHooksRoot(JSON.parse(content) as unknown);
			hooks = isJsonObject(root.hooks) ? root.hooks : {};
		} catch {
			hooks = {};
		}
	}

	for (const event of WORX_MANAGED_CODEX_HOOK_EVENTS) {
		const entries = Array.isArray(hooks[event]) ? hooks[event] : [];
		const eventManagedCount = entries.filter(entryContainsWorxManagedHook).length;
		managedHookCount += eventManagedCount;
		if (eventManagedCount === 0) missingEvents.push(event);
	}

	return {
		hooksPath,
		installed: missingEvents.length === 0,
		missingEvents,
		managedHookCount,
	};
}
