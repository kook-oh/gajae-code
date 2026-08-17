import { Command } from "@bworx-io/worx-utils/cli";
import { runNativeStateCommand } from "../worx-runtime/state-runtime";

export default class State extends Command {
	static description =
		"Read or update current-session GJC workflow state receipts under .worx/_session-{sessionid}/state";
	static strict = false;
	static examples = [
		'$ worx state read --input \'{"mode":"deep-interview"}\' --json',
		'$ worx state write --input \'{"state":{"interview_id":"abc"}}\' --mode deep-interview --json',
		"$ worx state clear --mode deep-interview",
		"$ worx state deep-interview read --json",
		'$ worx state ralplan write --input \'{"phase":"planner","active":true}\' --json',
		"$ worx state team contract",
		"$ worx state deep-interview handoff --to ralplan --json",
		"$ worx state doctor --skill ralplan --json",
	];

	async run(): Promise<void> {
		const result = await runNativeStateCommand(this.argv);
		if (result.stdout) process.stdout.write(result.stdout);
		if (result.stderr) process.stderr.write(result.stderr);
		process.exitCode = result.status;
	}
}
