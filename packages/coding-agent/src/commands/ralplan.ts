import { Command } from "@bworx-io/worx-utils/cli";
import { runNativeRalplanCommand } from "../worx-runtime/ralplan-runtime";

export default class Ralplan extends Command {
	static description = "Run native GJC RALPLAN consensus planning workflow";
	static strict = false;
	static examples = [
		'$ worx ralplan "<task description>"',
		'$ worx ralplan --interactive --deliberate "<task description>"',
		'$ worx ralplan --write --stage planner --stage_n 1 --artifact "<markdown or path>"',
		"$ worx ralplan --write --stage critic --stage_n 1 --artifact-env WORX_RALPLAN_ARTIFACT",
	];

	async run(): Promise<void> {
		const result = await runNativeRalplanCommand(this.argv, process.cwd());
		if (result.stdout) process.stdout.write(result.stdout);
		if (result.stderr) process.stderr.write(result.stderr);
		process.exitCode = result.status;
	}
}
