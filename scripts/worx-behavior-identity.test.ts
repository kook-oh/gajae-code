import * as path from "node:path";
import { describe, expect, test } from "bun:test";
import { COORDINATOR_MCP_SERVER_NAME, COORDINATOR_MCP_TOOL_NAMES } from "../packages/coding-agent/src/coordinator/contract";
import {
	resolveGjcTeamWorkerCli,
	translateGjcWorkerLaunchArgsForCli,
} from "../packages/coding-agent/src/gjc-runtime/team-runtime";
import { detectSkillKeywords } from "../packages/coding-agent/src/hooks/skill-state";
import { buildHermesSetupSpec } from "../packages/coding-agent/src/setup/hermes-setup";
import { buildHostPluginSetup } from "../packages/coding-agent/src/setup/host-plugin-setup";
import { checkBashAllowedPrefixes } from "../packages/coding-agent/src/tools/bash-allowed-prefixes";

const REPO_ROOT = path.resolve(import.meta.dir, "..");
const EXPECTED_COORDINATOR_TOOLS = [
	"worx_coordinator_list_sessions",
	"worx_coordinator_read_status",
	"worx_coordinator_read_tail",
	"worx_coordinator_list_questions",
	"worx_coordinator_list_artifacts",
	"worx_coordinator_read_artifact",
	"worx_coordinator_read_coordination_status",
	"worx_coordinator_watch_events",
	"worx_coordinator_register_session",
	"worx_coordinator_start_session",
	"worx_coordinator_activate_session",
	"worx_coordinator_stop_session",
	"worx_coordinator_send_prompt",
	"worx_coordinator_submit_question_answer",
	"worx_coordinator_read_turn",
	"worx_coordinator_await_turn",
	"worx_coordinator_report_status",
	"worx_coordinator_register_codex_handoff",
	"worx_coordinator_read_codex_handoff",
	"worx_coordinator_ack_codex_handoff",
	"worx_delegate_plan",
	"worx_delegate_execute",
	"worx_delegate_team",
] as const;

const SWEEP_FILES = [
	"scripts/generate-gjc-plugins.ts",
	"scripts/verify-gjc-plugins.ts",
] as const;

const FORBIDDEN_BEHAVIOR_IDENTIFIERS = [
	{
		label: "exact gjc behavior comparison",
		pattern: /(?:===|!==)\s*["'`]gjc["'`]|["'`]gjc["'`]\s*(?:===|!==)/gu,
	},
	{
		label: "Coordinator MCP tool or server identifier",
		pattern: /\bgjc_(?:coordinator|delegate)_[a-z0-9_]+\b|\bgjc_coordinator\b/gu,
	},
	{
		label: "SDK transport preface",
		pattern: /\bgjc-sdk-transport\//gu,
	},
	{
		label: "workflow skill token or stop reason",
		pattern: /\$gjc:|\bgjc_skill_[a-z0-9_]+\b|\bgjc_ultragoal_verification_[a-z0-9_]+\b/gu,
	},
	{
		label: "workflow mutation decision token",
		pattern: /\bgjc-target\b/gu,
	},
	{
		label: "Coordinator session executable",
		pattern: /GJC_COORDINATOR_MCP_SESSION_COMMAND[^\n]*\bgjc --worktree\b/gu,
	},
] as const;

async function behaviorIdentityFiles(): Promise<string[]> {
	const files: string[] = [];
	const glob = new Bun.Glob("**/*.{ts,md,json,yml,yaml,sh}");
	for (const relativeRoot of ["packages/coding-agent/src", "plugins/gajae-code"] as const) {
		for await (const relativePath of glob.scan({
			cwd: path.join(REPO_ROOT, relativeRoot),
			onlyFiles: true,
		})) {
			files.push(path.join(relativeRoot, relativePath));
		}
	}
	files.push(...SWEEP_FILES);
	return files.sort();
}

async function findForbiddenBehaviorIdentifiers(): Promise<string[]> {
	const violations: string[] = [];
	for (const relativePath of await behaviorIdentityFiles()) {
		if (relativePath.endsWith(".generated.ts")) continue;
		const source = await Bun.file(path.join(REPO_ROOT, relativePath)).text();
		const lines = source.split("\n");
		for (const [index, line] of lines.entries()) {
			for (const forbidden of FORBIDDEN_BEHAVIOR_IDENTIFIERS) {
				forbidden.pattern.lastIndex = 0;
				if (forbidden.pattern.test(line)) {
					violations.push(`${relativePath}:${index + 1}: ${forbidden.label}: ${line.trim()}`);
				}
			}
		}
	}
	return violations;
}

describe("WORX behavior identity", () => {
	test("uses WORX names for the Coordinator MCP contract", () => {
		expect(COORDINATOR_MCP_SERVER_NAME).toBe("worx-coordinator-mcp");
		expect(COORDINATOR_MCP_TOOL_NAMES).toEqual(EXPECTED_COORDINATOR_TOOLS);
	});

	test("generates WORX Coordinator session commands", () => {
		const hostSetup = buildHostPluginSetup("claude", { root: [REPO_ROOT] });
		expect(hostSetup.coordinatorConfigPreview.command).toBe("worx");
		expect(hostSetup.coordinatorConfigPreview.env.GJC_COORDINATOR_MCP_SESSION_COMMAND).toBe("worx --worktree");

		const hermesSetup = buildHermesSetupSpec({ root: [REPO_ROOT] });
		expect(hermesSetup.serverKey).toBe("worx_coordinator");
		expect(hermesSetup.gjcCommand).toBe("worx");
		expect(hermesSetup.sessionCommand).toBe("worx --worktree");
	});

	test("launches WORX workers and validates WORX self-calls", () => {
		expect(resolveGjcTeamWorkerCli({})).toBe("worx");
		expect(translateGjcWorkerLaunchArgsForCli("worx", ["--worktree"])).toEqual(["--worktree"]);

		const prefixes = ["worx ralplan --write", "worx state"] as const;
		expect(checkBashAllowedPrefixes("worx state ralplan read --json", prefixes).allowed).toBe(true);
		expect(checkBashAllowedPrefixes("worx state ralplan nope --json", prefixes).allowed).toBe(false);
	});

	test("recognizes the WORX explicit skill token namespace", () => {
		expect(detectSkillKeywords("$worx:team")).toEqual([
			expect.objectContaining({
				keyword: "$worx:team",
				skill: "team",
			}),
		]);
		expect(detectSkillKeywords("$gjc:team")).toEqual([]);
	});

	test("contains no legacy behavior identifiers in shipped sources", async () => {
		expect(await findForbiddenBehaviorIdentifiers()).toEqual([]);
	});
});
