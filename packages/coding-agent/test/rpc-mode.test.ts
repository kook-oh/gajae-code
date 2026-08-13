import { describe, expect, it } from "bun:test";
import type { ExtensionUIContext } from "../src/extensibility/extensions/types";
import { runRpcMode, type RpcAgentSession, type RpcOutboundFrame } from "../src/modes/rpc-mode";
import type { AgentSessionEvent, AgentSessionEventListener } from "../src/session/agent-session";

class RpcInputDriver implements AsyncIterable<string> {
	#closed = false;
	#queued: string[] = [];
	#waiting: PromiseWithResolvers<IteratorResult<string>> | undefined;

	push(frame: object): void {
		const line = JSON.stringify(frame);
		if (this.#waiting) {
			const waiting = this.#waiting;
			this.#waiting = undefined;
			waiting.resolve({ done: false, value: line });
			return;
		}
		this.#queued.push(line);
	}

	close(): void {
		this.#closed = true;
		this.#waiting?.resolve({ done: true, value: undefined });
		this.#waiting = undefined;
	}

	[Symbol.asyncIterator](): AsyncIterator<string> {
		return {
			next: () => {
				const value = this.#queued.shift();
				if (value !== undefined) return Promise.resolve({ done: false as const, value });
				if (this.#closed) return Promise.resolve({ done: true as const, value: undefined });
				this.#waiting = Promise.withResolvers<IteratorResult<string>>();
				return this.#waiting.promise;
			},
		};
	}
}

describe("headless RPC mode", () => {
	it("preserves ready -> prompt -> top-level events -> UI cancellation -> EOF disposal", async () => {
		const input = new RpcInputDriver();
		const frames: RpcOutboundFrame[] = [];
		const promptMessages: string[] = [];
		let listener: AgentSessionEventListener | undefined;
		let ui: ExtensionUIContext | undefined;
		let confirmation: boolean | undefined;
		let disposed = false;
		let unsubscribed = false;

		const emit = (event: AgentSessionEvent): void => listener?.(event);
		const session: RpcAgentSession = {
			subscribe(nextListener: AgentSessionEventListener) {
				listener = nextListener;
				return () => {
					listener = undefined;
					unsubscribed = true;
				};
			},
			async prompt(message: string) {
				promptMessages.push(message);
				emit({
					type: "message_update",
					message: {
						role: "assistant",
						content: [{ type: "text", text: "done" }],
						api: "anthropic-messages",
						provider: "anthropic",
						model: "fake",
						stopReason: "stop",
						usage: {
							input: 0,
							output: 0,
							cacheRead: 0,
							cacheWrite: 0,
							totalTokens: 0,
							cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
						},
						timestamp: 1,
					},
					assistantMessageEvent: {
						type: "text_end",
						contentIndex: 0,
						content: "done",
						partial: {
							role: "assistant",
							content: [{ type: "text", text: "done" }],
							api: "anthropic-messages",
							provider: "anthropic",
							model: "fake",
							stopReason: "stop",
							usage: {
								input: 0,
								output: 0,
								cacheRead: 0,
								cacheWrite: 0,
								totalTokens: 0,
								cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
							},
							timestamp: 1,
						},
					},
				});
				if (!ui) throw new Error("RPC UI context was not installed before ready");
				confirmation = await ui.confirm("Continue?", "Confirm the operation");
				emit({ type: "agent_end", stopReason: "completed", messages: [] });
			},
			async dispose() {
				disposed = true;
			},
		} as unknown as RpcAgentSession;

		await runRpcMode(session, (context, hasUI) => {
			expect(hasUI).toBe(true);
			ui = context;
		}, {
			input,
			output(frame) {
				frames.push(frame);
				if (frame.type === "ready") input.push({ type: "prompt", message: "review this" });
				if (frame.type === "extension_ui_request") {
					input.push({ type: "extension_ui_response", id: frame.id, cancelled: true });
				}
				if (frame.type === "agent_end") input.close();
			},
		});

		expect(promptMessages).toEqual(["review this"]);
		expect(confirmation).toBe(false);
		expect(frames.map(frame => frame.type)).toEqual([
			"ready",
			"message_update",
			"extension_ui_request",
			"agent_end",
		]);
		expect(frames[1]).toMatchObject({ type: "message_update", assistantMessageEvent: { content: "done" } });
		expect(frames[1]).not.toHaveProperty("payload");
		expect(unsubscribed).toBe(true);
		expect(disposed).toBe(true);
	});
});
