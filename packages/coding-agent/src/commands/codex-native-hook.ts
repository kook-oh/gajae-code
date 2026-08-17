import { Command } from "@bworx-io/worx-utils/cli";
import { runWorxNativeSkillHookCli } from "../hooks/native-skill-hook";

export default class CodexNativeHook extends Command {
	static description = "Run GJC native UserPromptSubmit/Stop skill-state hook";
	static strict = false;

	async run(): Promise<void> {
		await runWorxNativeSkillHookCli();
	}
}
