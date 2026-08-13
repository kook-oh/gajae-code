import { emergencyTerminalRestore } from "@gajae-code/tui";
import { postmortem } from "@gajae-code/utils";

/**
 * Run modes for the coding agent.
 */
export { runAcpMode } from "./acp";
export { InteractiveMode, type InteractiveModeOptions } from "./interactive-mode";
export { type PrintModeOptions, runPrintMode } from "./print-mode";
export { type RpcAgentSession, type RpcModeOptions, type RpcOutboundFrame, runRpcMode } from "./rpc-mode";

postmortem.register("terminal-restore", () => {
	emergencyTerminalRestore();
});
