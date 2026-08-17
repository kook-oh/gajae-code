import { Command } from "@bworx-io/worx-utils/cli";
import {
	isUltragoalCreateGoalsInvocation,
	readUltragoalWorxObjective,
	WORX_SESSION_FILE_ENV,
	WORX_SESSION_ID_ENV,
	writeCurrentSessionGoalModeState,
	writePendingGoalModeRequest,
} from "../worx-runtime/goal-mode-request";
import { runNativeUltragoalCommand } from "../worx-runtime/ultragoal-runtime";

export default class Ultragoal extends Command {
	static description = "Run native GJC Ultragoal workflow commands";
	static strict = false;
	static examples = ["$ worx ultragoal status --json"];
	static delegateHelp = true;

	async run(): Promise<void> {
		const isReviewStart = this.argv.includes("review") && this.argv.includes("review-start");
		const shouldActivateGoalMode = isUltragoalCreateGoalsInvocation(this.argv);
		const result = await runNativeUltragoalCommand(this.argv);
		if (result.stdout) process.stdout.write(result.stdout);
		if (result.stderr) process.stderr.write(result.stderr);
		process.exitCode = result.status;
		if (result.status !== 0 || (!shouldActivateGoalMode && !isReviewStart)) return;
		if (isReviewStart && !result.createdReviewPlan && (result.reviewBlockerGoalIds?.length ?? 0) === 0) return;

		const cwd = process.cwd();
		const { objective, goalsPath, provenance } = await readUltragoalWorxObjective(cwd);

		await writeCurrentSessionGoalModeState({
			sessionFile: process.env[WORX_SESSION_FILE_ENV],
			objective,
			provenance,
		});
		await writePendingGoalModeRequest({
			cwd,
			objective,
			goalsPath,
			provenance,
			sessionId: process.env[WORX_SESSION_ID_ENV],
		});
	}
}
