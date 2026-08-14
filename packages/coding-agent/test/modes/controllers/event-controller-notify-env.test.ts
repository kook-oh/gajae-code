/**
 * Tests for the per-run completion-notification opt-out `WORX_NOTIFY=off`.
 *
 * Non-interactive fleet runs (`gjc -p --no-session`) inherit the global
 * `completion.notify=on` / `completion.notifyCommand` and therefore fire a
 * notification per run (e.g. a command that opens a fresh Telegram topic). The env
 * var gives those runs a config-untouched, child-inheritable way to stay silent —
 * honored before any settings lookup in `sendCompletionNotification`.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { resetSettingsForTest, Settings, settings } from "@bworx-io/worx-code/config/settings";
import { EventController } from "@bworx-io/worx-code/modes/controllers/event-controller";
import { initTheme } from "@bworx-io/worx-code/modes/theme/theme";
import type { InteractiveModeContext } from "@bworx-io/worx-code/modes/types";
import { completionNotifyDisabledByEnv } from "@bworx-io/worx-code/sdk/bus/config";
import type { AssistantMessage } from "@gajae-code/ai";
import { TERMINAL } from "@gajae-code/tui";

type NotifyProc = Bun.Subprocess<"ignore", "ignore", "ignore">;

beforeAll(() => {
	initTheme();
});

const ORIGINAL_WORX_NOTIFY = process.env.WORX_NOTIFY;

beforeEach(async () => {
	resetSettingsForTest();
	delete process.env.WORX_NOTIFY;
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gjc-notify-env-"));
	await Settings.init({ inMemory: true, cwd: tempDir });
});

afterEach(() => {
	vi.restoreAllMocks();
	resetSettingsForTest();
	if (ORIGINAL_WORX_NOTIFY === undefined) delete process.env.WORX_NOTIFY;
	else process.env.WORX_NOTIFY = ORIGINAL_WORX_NOTIFY;
});

function makeAssistantMessage(): AssistantMessage {
	return {
		role: "assistant",
		content: [{ type: "text", text: "hello" }],
		stopReason: "stop",
		usage: { inputTokens: 0, outputTokens: 0 },
		timestamp: Date.now(),
	} as unknown as AssistantMessage;
}

function makeContext(): InteractiveModeContext {
	return {
		isBackgrounded: true,
		sessionManager: {
			getSessionName: () => "test-session",
			getCwd: () => process.cwd(),
			getSessionId: () => "session-test",
		},
		session: {
			getLastAssistantMessage: () => makeAssistantMessage(),
		},
	} as unknown as InteractiveModeContext;
}

describe("completionNotifyDisabledByEnv", () => {
	it("is true for off / 0 / false, case- and whitespace-insensitive", () => {
		for (const v of ["off", "OFF", "0", "false", "False", "  off  "]) {
			expect(completionNotifyDisabledByEnv({ WORX_NOTIFY: v })).toBe(true);
		}
	});

	it("is false when unset, empty, or any on-ish value", () => {
		expect(completionNotifyDisabledByEnv({})).toBe(false);
		expect(completionNotifyDisabledByEnv({ WORX_NOTIFY: "" })).toBe(false);
		for (const v of ["on", "1", "true", "yes"]) {
			expect(completionNotifyDisabledByEnv({ WORX_NOTIFY: v })).toBe(false);
		}
	});

	it("does not read the sibling WORX_NOTIFICATIONS var", () => {
		expect(completionNotifyDisabledByEnv({ WORX_NOTIFICATIONS: "0" })).toBe(false);
	});
});

describe("sendCompletionNotification — WORX_NOTIFY=off per-run opt-out", () => {
	it("suppresses every surface even with completion.notify=on and a notifyCommand set", () => {
		const terminalSpy = vi.spyOn(TERMINAL, "sendNotification").mockImplementation(() => {});
		const spawnSpy = vi
			.spyOn(Bun, "spawn")
			.mockImplementation(
				() => ({ exited: Promise.resolve(0), kill: () => {}, unref: () => {} }) as unknown as NotifyProc,
			);
		const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
		settings.override("completion.notify", "on");
		settings.set("completion.notifyCommand", "notify-test");
		settings.set("notifications.terminalBell", true);
		settings.set("notifications.bellOnComplete", true);
		process.env.WORX_NOTIFY = "off";

		new EventController(makeContext()).sendCompletionNotification();

		expect(terminalSpy).toHaveBeenCalledTimes(0);
		expect(spawnSpy).toHaveBeenCalledTimes(0);
		expect(writeSpy).not.toHaveBeenCalledWith("\x07");
	});

	it("still fires normally when WORX_NOTIFY is unset (control)", () => {
		const terminalSpy = vi.spyOn(TERMINAL, "sendNotification").mockImplementation(() => {});
		settings.override("completion.notify", "on");
		// beforeEach already deleted WORX_NOTIFY.

		new EventController(makeContext()).sendCompletionNotification();

		expect(terminalSpy).toHaveBeenCalledTimes(1);
	});

	it("still fires when WORX_NOTIFY is an on-ish value", () => {
		const terminalSpy = vi.spyOn(TERMINAL, "sendNotification").mockImplementation(() => {});
		settings.override("completion.notify", "on");
		process.env.WORX_NOTIFY = "on";

		new EventController(makeContext()).sendCompletionNotification();

		expect(terminalSpy).toHaveBeenCalledTimes(1);
	});
});
