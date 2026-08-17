import { describe, expect, it } from "bun:test";
import {
	resolvePythonIntegrationGate,
	resolvePythonIpcTrace,
	resolvePythonSkipCheck,
} from "@bworx-io/worx-code/tools/implementations";
import {
	resolvePythonIntegrationGate as resolveKernelIntegrationGate,
	resolvePythonIpcTrace as resolveKernelIpcTrace,
	resolvePythonSkipCheck as resolveKernelSkipCheck,
} from "../../src/eval/py/env";

const RESOLVERS = [
	{
		kernel: resolveKernelSkipCheck,
		tool: resolvePythonSkipCheck,
		worx: "WORX_PYTHON_SKIP_CHECK",
		pi: "PI_PYTHON_SKIP_CHECK",
	},
	{
		kernel: resolveKernelIpcTrace,
		tool: resolvePythonIpcTrace,
		worx: "WORX_PYTHON_IPC_TRACE",
		pi: "PI_PYTHON_IPC_TRACE",
	},
	{
		kernel: resolveKernelIntegrationGate,
		tool: resolvePythonIntegrationGate,
		worx: "WORX_PYTHON_INTEGRATION",
		pi: "PI_PYTHON_INTEGRATION",
	},
] as const;

describe("Python environment flag resolvers", () => {
	it("shares the kernel resolver with tool exports for hostile GJC/PI values", () => {
		for (const { kernel, tool, worx, pi } of RESOLVERS) {
			expect(tool).toBe(kernel);
			expect(tool({ [worx]: "0", [pi]: "1" })).toBe(true);
			expect(tool({ [worx]: " \tYeS\n" })).toBe(true);
			expect(tool({ [worx]: "false", [pi]: " 0 " })).toBe(false);
		}
	});
});
