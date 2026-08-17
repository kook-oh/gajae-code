import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { runNativeStateCommand } from "../../src/worx-runtime/state-runtime";
import { monitorWorxTeam, persistWorxTeamModeStateSummary, startWorxTeam } from "../../src/worx-runtime/team-runtime";

const TEST_SESSION_ID = "test-session";
let cleanupRoot: string | undefined;
let previousWorxSessionId: string | undefined;

beforeAll(() => {
	previousWorxSessionId = process.env.WORX_SESSION_ID;
	process.env.WORX_SESSION_ID = TEST_SESSION_ID;
});

afterAll(() => {
	if (previousWorxSessionId === undefined) {
		delete process.env.WORX_SESSION_ID;
	} else {
		process.env.WORX_SESSION_ID = previousWorxSessionId;
	}
});

afterEach(async () => {
	if (!cleanupRoot) return;
	await fs.rm(cleanupRoot, { recursive: true, force: true });
	cleanupRoot = undefined;
});

describe("native worx team mode-state convergence", () => {
	it("keeps worx state team read aligned with dry-run team start and status snapshots", async () => {
		cleanupRoot = await fs.mkdtemp(path.join(os.tmpdir(), "gjc-team-convergence-"));
		const started = await startWorxTeam({
			workerCount: 1,
			agentType: "executor",
			task: "Converge team state",
			teamName: "converge-team",
			cwd: cleanupRoot,
			dryRun: true,
			env: { PATH: "", WORX_SESSION_ID: TEST_SESSION_ID },
		});
		await persistWorxTeamModeStateSummary(started, cleanupRoot);

		const startRead = await runNativeStateCommand(
			["read", "--mode", "team", "--session-id", TEST_SESSION_ID, "--json"],
			cleanupRoot,
		);
		expect(startRead.status).toBe(0);
		const startState = JSON.parse(startRead.stdout ?? "{}");
		expect(startState.state.current_phase).toBe(started.phase);
		expect(startState.state.team_name).toBe(started.team_name);
		expect(startState.state.task_counts).toEqual(started.task_counts);

		const status = await monitorWorxTeam(started.team_name, cleanupRoot, {
			PATH: "",
			WORX_SESSION_ID: TEST_SESSION_ID,
		});
		await persistWorxTeamModeStateSummary(status, cleanupRoot);

		const statusRead = await runNativeStateCommand(
			["read", "--mode", "team", "--session-id", TEST_SESSION_ID, "--json"],
			cleanupRoot,
		);
		expect(statusRead.status).toBe(0);
		const statusState = JSON.parse(statusRead.stdout ?? "{}");
		expect(statusState.state.current_phase).toBe(status.phase);
		expect(statusState.state.team_name).toBe(status.team_name);
		expect(statusState.state.task_counts).toEqual(status.task_counts);
		expect(statusState.state.active).toBe(true);
		expect(statusState.state.receipt.owner).toBe("worx-runtime");
	});
});
