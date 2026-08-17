import { describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { AgentTool } from "@bworx-io/worx-agent-core";
import { getWorkflowMutationDecision } from "../../src/skill-state/workflow-mutation-guard";

async function withTempCwd(fn: (cwd: string) => Promise<void>): Promise<void> {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), "gjc-acl-gate-"));
	const priorSessionId = process.env.WORX_SESSION_ID;
	process.env.WORX_SESSION_ID = "test-session";
	try {
		await fn(dir);
	} finally {
		if (priorSessionId !== undefined) process.env.WORX_SESSION_ID = priorSessionId;
		await fs.rm(dir, { recursive: true, force: true });
	}
}

function tool(name: string, extra: Record<string, unknown> = {}): AgentTool {
	return {
		name,
		label: name,
		description: name,
		parameters: {} as never,
		execute: async () => ({ content: [{ type: "text" as const, text: "ok" }] }),
		...extra,
	} as AgentTool;
}

describe("G2 worx ACL gate", () => {
	it("blocks mutation tools targeting .worx paths", async () => {
		await withTempCwd(async cwd => {
			const blockedCases: Array<[AgentTool, unknown]> = [
				[tool("write"), { path: ".worx/state/foo.json", content: "{}" }],
				[tool("edit"), { path: ".worx/specs/spec.md", edits: [{ old_text: "a", new_text: "b" }] }],
				[tool("ast_edit"), { paths: [".worx/state/foo.json"], ops: [{ pat: "foo", out: "bar" }] }],
			];

			for (const [targetTool, args] of blockedCases) {
				const decision = await getWorkflowMutationDecision({ cwd, tool: targetTool, args });
				expect(decision.blocked).toBe(true);
				expect(decision.message).toContain("runtime-owned");
				if (decision.reason !== "unknown-target") {
					expect(["worx-target", "workflow-state-target"]).toContain(decision.reason as string);
				}
			}
		});
	});

	it("allows sanctioned worx bash commands, bash mutations, and non-.worx writes", async () => {
		await withTempCwd(async cwd => {
			const worxCommand = await getWorkflowMutationDecision({
				cwd,
				tool: tool("bash"),
				args: { command: "worx state ralplan write --input '{}'" },
			});
			expect(worxCommand.blocked).toBe(false);

			const bashMutation = await getWorkflowMutationDecision({
				cwd,
				tool: tool("bash"),
				args: { command: "rm -rf .worx/specs" },
			});
			expect(bashMutation.blocked).toBe(false);

			const productWrite = await getWorkflowMutationDecision({
				cwd,
				tool: tool("write"),
				args: { path: "src/product.ts", content: "x" },
			});
			expect(productWrite.blocked).toBe(false);

			// Per #951 the mutation guard never blocks `bash`; `.worx/**` is gated only
			// through the dedicated write/edit/ast_edit tools, so bash targeting .worx is allowed.
			for (const command of ["echo x > .worx/state/foo.json", "rm -rf .worx/specs"]) {
				const worxBash = await getWorkflowMutationDecision({ cwd, tool: tool("bash"), args: { command } });
				expect(worxBash.blocked).toBe(false);
			}
		});
	});
});
