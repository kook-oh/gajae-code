#!/usr/bin/env bun

/**
 * Guardrail for the surfaces the engine-pivot rename must never touch.
 *
 * Two classes of breakage motivated this check, both shipped by rename sweeps
 * and both invisible to typecheck, lint, and the existing rebrand inventory:
 *
 * 1. Signature-covered bytes. The bundled SDK guide advisories feed each
 *    guide's sha256, so editing their text invalidates the pinned Ed25519
 *    signature. Catalog self-verification then throws at module load and the
 *    detached SDK broker dies before discovery, taking ACP down with it.
 * 2. Frozen consumer contracts. `docs/plans/EXECUTION-CHECKLIST.md` excludes
 *    the ACP `_meta.gjc` status keys, the `_gjc/sdk/*` ext-methods, the
 *    `package.json` `gjc` plugin-manifest key, and the codex-handoff id fields
 *    from the rebrand, because external consumers (worx-ide/ORCA among them)
 *    call them by name. Renaming them drops data silently instead of failing.
 */

import * as path from "node:path";

interface FrozenToken {
	/** Literal that must still appear in every listed file. */
	token: string;
	/** Repo-relative files that carry the contract. */
	files: readonly string[];
	/** Why the token is frozen, printed on success and on failure. */
	rationale: string;
}

interface BannedToken {
	/** Literal that must not appear anywhere under the scanned roots. */
	token: string;
	/** What to write instead. */
	replacement: string;
}

const repoRoot = path.join(import.meta.dir, "..");

const ACP_AGENT = "packages/coding-agent/src/modes/acp/acp-agent.ts";
const ACP_EVENT_MAPPER = "packages/coding-agent/src/modes/acp/acp-event-mapper.ts";
const ACP_SDK_ADAPTER = "packages/coding-agent/src/sdk/acp/adapter.ts";
const CODEX_HANDOFF = "packages/coding-agent/src/coordinator-mcp/codex-handoff.ts";
const EXTENSION_LOADER = "packages/coding-agent/src/extensibility/extensions/loader.ts";
const PLUGIN_MANAGER = "packages/coding-agent/src/extensibility/plugins/manager.ts";

const FROZEN_TOKENS: readonly FrozenToken[] = [
	{
		token: "gjcPhase",
		files: [ACP_AGENT, ACP_EVENT_MAPPER],
		rationale: "ACP session-status `_meta` key read by external ACP clients.",
	},
	{
		token: "gjcRunning",
		files: [ACP_AGENT, ACP_EVENT_MAPPER],
		rationale: "ACP session-running `_meta` key read by external ACP clients.",
	},
	{
		token: "_gjc/sdk/global",
		files: [ACP_AGENT, ACP_SDK_ADAPTER],
		rationale: "ACP ext-method name worx-ide (ORCA) dispatches by literal.",
	},
	{
		token: "_gjc/sdk/control",
		files: [ACP_AGENT, ACP_SDK_ADAPTER],
		rationale: "ACP ext-method name worx-ide (ORCA) dispatches by literal.",
	},
	{
		token: "_gjc/sdk/query",
		files: [ACP_AGENT, ACP_SDK_ADAPTER],
		rationale: "ACP ext-method name worx-ide (ORCA) dispatches by literal.",
	},
	{
		token: "pkg.gjc",
		files: [EXTENSION_LOADER, PLUGIN_MANAGER],
		rationale: "`package.json` manifest key published extensions and plugins already ship.",
	},
	{
		token: "gjc_session_id",
		files: [CODEX_HANDOFF],
		rationale: "codex-handoff persisted field; renaming it orphans stored handoffs.",
	},
	{
		token: "gjc_turn_id",
		files: [CODEX_HANDOFF],
		rationale: "codex-handoff persisted field; renaming it orphans stored handoffs.",
	},
];

const BANNED_TOKENS: readonly BannedToken[] = [
	{ token: "worxPhase", replacement: "gjcPhase" },
	{ token: "worxRunning", replacement: "gjcRunning" },
	{ token: "_worx/sdk/", replacement: "_gjc/sdk/" },
	{ token: "worx_session_id", replacement: "gjc_session_id" },
	{ token: "worx_turn_id", replacement: "gjc_turn_id" },
];

// Only hand-written, tracked source carries the wire contract. Generated
// artifacts (e.g. the docs index) embed documentation prose that legitimately
// names a banned token while explaining why it is banned, so the scan walks
// `git ls-files` rather than the working tree.
const BANNED_SCAN_PATH = /^packages\/[^/]+\/(?:src|test)\/.+\.ts$/;

const errors: string[] = [];

for (const frozen of FROZEN_TOKENS) {
	for (const file of frozen.files) {
		const contents = await Bun.file(path.join(repoRoot, file)).text().catch(() => undefined);
		if (contents === undefined) {
			errors.push(`${file} is missing, but it carries the frozen token \`${frozen.token}\`.`);
			continue;
		}
		if (!contents.includes(frozen.token))
			errors.push(`${file} no longer contains the frozen token \`${frozen.token}\`. ${frozen.rationale}`);
	}
}

const listed = Bun.spawnSync(["git", "ls-files", "-z", "--", "packages"], { cwd: repoRoot });
if (listed.exitCode !== 0) throw new Error(`git ls-files failed: ${listed.stderr.toString().trim()}`);
const scanned = listed.stdout.toString().split("\0").filter(entry => BANNED_SCAN_PATH.test(entry));
if (scanned.length === 0) throw new Error("frozen contract scan matched no tracked source files");
for (const relativePath of scanned) {
	const contents = await Bun.file(path.join(repoRoot, relativePath)).text();
	for (const banned of BANNED_TOKENS)
		if (contents.includes(banned.token))
			errors.push(`${relativePath} uses renamed wire token \`${banned.token}\`; the frozen name is \`${banned.replacement}\`.`);
}

// Module load performs the pinned-signature self-verification; a rewritten
// advisory byte fails here with the same error the SDK broker would hit.
try {
	await import("../packages/coding-agent/src/sdk/guides/catalog");
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	errors.push(
		`Bundled SDK guide catalog failed to load: ${message} — the bundled advisory texts are signature-covered and must stay byte-identical to what was signed.`,
	);
}

if (errors.length > 0) {
	console.error("Frozen contract check failed:");
	for (const error of errors) console.error(`- ${error}`);
	console.error(
		"\nThese surfaces are excluded from the rename by docs/plans/EXECUTION-CHECKLIST.md. Restore the frozen names instead of migrating them.",
	);
	process.exit(1);
}

console.log("Frozen contract check passed:");
for (const frozen of FROZEN_TOKENS) console.log(`- ${frozen.token}: ${frozen.rationale}`);
console.log("- bundled SDK guide manifest: pinned Ed25519 self-verification succeeded.");
