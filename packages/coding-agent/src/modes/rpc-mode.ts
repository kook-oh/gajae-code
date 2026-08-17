/** Preserved headless JSONL RPC transport for external process consumers. */
import { createInterface } from "node:readline";
import { Snowflake } from "@bworx-io/worx-utils";
import type {
	ExtensionUIContext,
	ExtensionUIDialogOptions,
	ExtensionWidgetContent,
	ExtensionWidgetOptions,
} from "../extensibility/extensions/types";
import type { AgentSession, AgentSessionEvent } from "../session/agent-session";
import { initializeExtensions } from "./runtime-init";
import type { Theme } from "./theme/theme";
import { theme } from "./theme/theme";

export type RpcAgentSession = AgentSession;

export type RpcExtensionUIResponse =
	| { type: "extension_ui_response"; id: string; value: string }
	| { type: "extension_ui_response"; id: string; confirmed: boolean }
	| { type: "extension_ui_response"; id: string; cancelled: true; timedOut?: boolean };

export type RpcExtensionUIRequest =
	| { type: "extension_ui_request"; id: string; method: "select"; title: string; options: string[]; timeout?: number }
	| {
			type: "extension_ui_request";
			id: string;
			method: "confirm";
			title: string;
			message: string;
			timeout?: number;
	  }
	| {
			type: "extension_ui_request";
			id: string;
			method: "input";
			title: string;
			placeholder?: string;
			timeout?: number;
	  }
	| {
			type: "extension_ui_request";
			id: string;
			method: "editor";
			title: string;
			prefill?: string;
			promptStyle?: boolean;
	  }
	| {
			type: "extension_ui_request";
			id: string;
			method: "notify";
			message: string;
			notifyType?: "info" | "warning" | "error";
	  }
	| {
			type: "extension_ui_request";
			id: string;
			method: "setStatus";
			statusKey: string;
			statusText: string | undefined;
	  }
	| {
			type: "extension_ui_request";
			id: string;
			method: "setWidget";
			widgetKey: string;
			widgetLines: string[] | undefined;
			widgetPlacement?: "aboveEditor" | "belowEditor";
	  }
	| { type: "extension_ui_request"; id: string; method: "setTitle"; title: string }
	| { type: "extension_ui_request"; id: string; method: "set_editor_text"; text: string };

export type RpcOutboundFrame =
	| { type: "ready" }
	| AgentSessionEvent
	| RpcExtensionUIRequest
	| { type: "error"; command: "parse" | "prompt"; error: string }
	| { type: "extension_error"; extensionPath?: string; event?: string; error: string };

export interface RpcModeOptions {
	input?: AsyncIterable<string>;
	output?: (frame: RpcOutboundFrame) => void | Promise<void>;
}

type PendingExtensionRequest = {
	resolve(response: RpcExtensionUIResponse): void;
};

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExtensionUIResponse(value: unknown): value is RpcExtensionUIResponse {
	if (!isRecord(value) || value.type !== "extension_ui_response" || typeof value.id !== "string") return false;
	if (value.cancelled === true) return value.timedOut === undefined || typeof value.timedOut === "boolean";
	return typeof value.value === "string" || typeof value.confirmed === "boolean";
}

function nextRequestId(): string {
	return String(Snowflake.next());
}

function writeStdoutFrame(frame: RpcOutboundFrame): Promise<void> {
	const completion = Promise.withResolvers<void>();
	let settled = false;
	const finish = (error?: Error | null): void => {
		if (settled) return;
		settled = true;
		if (error) completion.reject(error);
		else completion.resolve();
	};
	try {
		process.stdout.write(`${JSON.stringify(frame)}\n`, finish);
	} catch (error) {
		completion.reject(error);
	}
	return completion.promise;
}

function defaultInput(): AsyncIterable<string> {
	return createInterface({ input: process.stdin, crlfDelay: Number.POSITIVE_INFINITY, terminal: false });
}

class RpcExtensionUIContext implements ExtensionUIContext {
	readonly #pendingRequests: Map<string, PendingExtensionRequest>;
	readonly #output: (frame: RpcOutboundFrame) => Promise<void>;

	constructor(
		pendingRequests: Map<string, PendingExtensionRequest>,
		output: (frame: RpcOutboundFrame) => Promise<void>,
	) {
		this.#pendingRequests = pendingRequests;
		this.#output = output;
	}

	#createDialogPromise<T>(
		options: ExtensionUIDialogOptions | undefined,
		defaultValue: T,
		request: (id: string) => RpcExtensionUIRequest,
		parse: (response: RpcExtensionUIResponse) => T,
	): Promise<T> {
		if (options?.signal?.aborted) return Promise.resolve(defaultValue);

		const id = nextRequestId();
		const completion = Promise.withResolvers<T>();
		let settled = false;
		let timeout: NodeJS.Timeout | undefined;
		const cleanup = (): void => {
			if (timeout) clearTimeout(timeout);
			options?.signal?.removeEventListener("abort", onAbort);
			this.#pendingRequests.delete(id);
		};
		const finish = (value: T): void => {
			if (settled) return;
			settled = true;
			cleanup();
			completion.resolve(value);
		};
		const onAbort = (): void => finish(defaultValue);

		options?.signal?.addEventListener("abort", onAbort, { once: true });
		if (options?.timeout !== undefined) {
			timeout = setTimeout(() => {
				options.onTimeout?.();
				finish(defaultValue);
			}, options.timeout);
		}
		this.#pendingRequests.set(id, { resolve: response => finish(parse(response)) });
		void this.#output(request(id));
		return completion.promise;
	}

	select(title: string, options: string[], dialogOptions?: ExtensionUIDialogOptions): Promise<string | undefined> {
		return this.#createDialogPromise(
			dialogOptions,
			undefined,
			id => ({
				type: "extension_ui_request",
				id,
				method: "select",
				title,
				options,
				timeout: dialogOptions?.timeout,
			}),
			response => ("value" in response ? response.value : undefined),
		);
	}

	confirm(title: string, message: string, dialogOptions?: ExtensionUIDialogOptions): Promise<boolean> {
		return this.#createDialogPromise(
			dialogOptions,
			false,
			id => ({
				type: "extension_ui_request",
				id,
				method: "confirm",
				title,
				message,
				timeout: dialogOptions?.timeout,
			}),
			response => ("confirmed" in response ? response.confirmed : false),
		);
	}

	input(title: string, placeholder?: string, dialogOptions?: ExtensionUIDialogOptions): Promise<string | undefined> {
		return this.#createDialogPromise(
			dialogOptions,
			undefined,
			id => ({
				type: "extension_ui_request",
				id,
				method: "input",
				title,
				placeholder,
				timeout: dialogOptions?.timeout,
			}),
			response => ("value" in response ? response.value : undefined),
		);
	}

	editor(
		title: string,
		prefill?: string,
		dialogOptions?: ExtensionUIDialogOptions,
		editorOptions?: { promptStyle?: boolean },
	): Promise<string | undefined> {
		return this.#createDialogPromise(
			dialogOptions,
			undefined,
			id => ({
				type: "extension_ui_request",
				id,
				method: "editor",
				title,
				prefill,
				promptStyle: editorOptions?.promptStyle,
			}),
			response => ("value" in response ? response.value : undefined),
		);
	}

	notify(message: string, type?: "info" | "warning" | "error"): void {
		void this.#output({
			type: "extension_ui_request",
			id: nextRequestId(),
			method: "notify",
			message,
			notifyType: type,
		});
	}

	onTerminalInput(): () => void {
		return () => {};
	}

	setStatus(key: string, text: string | undefined): void {
		void this.#output({
			type: "extension_ui_request",
			id: nextRequestId(),
			method: "setStatus",
			statusKey: key,
			statusText: text,
		});
	}

	setWorkingMessage(): void {}

	setWidget(key: string, content: ExtensionWidgetContent, options?: ExtensionWidgetOptions): void {
		if (content !== undefined && (!Array.isArray(content) || !content.every(line => typeof line === "string")))
			return;
		void this.#output({
			type: "extension_ui_request",
			id: nextRequestId(),
			method: "setWidget",
			widgetKey: key,
			widgetLines: content,
			widgetPlacement: options?.placement,
		});
	}

	setFooter(): void {}
	setHeader(): void {}

	setTitle(title: string): void {
		void this.#output({ type: "extension_ui_request", id: nextRequestId(), method: "setTitle", title });
	}

	custom<T>(): Promise<T> {
		return Promise.resolve(undefined as T);
	}

	setEditorText(text: string): void {
		void this.#output({ type: "extension_ui_request", id: nextRequestId(), method: "set_editor_text", text });
	}

	pasteToEditor(text: string): void {
		this.setEditorText(text);
	}

	getEditorText(): string {
		return "";
	}

	setEditorComponent(): void {}

	get theme(): Theme {
		return theme;
	}

	getAllThemes(): Promise<{ name: string; path: string | undefined }[]> {
		return Promise.resolve([]);
	}

	getTheme(): Promise<Theme | undefined> {
		return Promise.resolve(undefined);
	}

	setTheme(): Promise<{ success: boolean; error?: string }> {
		return Promise.resolve({ success: false, error: "Theme switching is unavailable in RPC mode" });
	}

	getToolsExpanded(): boolean {
		return false;
	}

	setToolsExpanded(): void {}
}

function throwFailures(failures: unknown[]): void {
	if (failures.length === 0) return;
	if (failures.length === 1) throw failures[0];
	throw new AggregateError(failures, "RPC mode failed during transport or session cleanup");
}

/** Run the preserved stdin/stdout RPC contract until input reaches EOF. */
export async function runRpcMode(
	session: RpcAgentSession,
	setToolUIContext?: (uiContext: ExtensionUIContext, hasUI: boolean) => void,
	options: RpcModeOptions = {},
): Promise<void> {
	process.env.PI_NOTIFICATIONS = "off";
	process.env.WORX_NOTIFICATIONS = "off";

	const write = options.output ?? writeStdoutFrame;
	const failures: unknown[] = [];
	let outputFailure: unknown;
	let outputTail = Promise.resolve();
	const output = (frame: RpcOutboundFrame): Promise<void> => {
		outputTail = outputTail
			.then(() => write(frame))
			.catch(error => {
				outputFailure ??= error;
			});
		return outputTail;
	};
	const pendingRequests = new Map<string, PendingExtensionRequest>();
	const inFlightPrompts = new Set<Promise<void>>();
	const uiContext = new RpcExtensionUIContext(pendingRequests, output);
	setToolUIContext?.(uiContext, true);
	let unsubscribe: (() => void) | undefined;

	try {
		await initializeExtensions(session, {
			reportSendError: (_action, error) => {
				void output({ type: "extension_error", error: error.message });
			},
			reportRuntimeError: error => {
				void output({
					type: "extension_error",
					extensionPath: error.extensionPath,
					event: error.event,
					error: error.error,
				});
			},
			uiContext,
		});
		unsubscribe = session.subscribe(event => {
			void output(event);
		});
		await output({ type: "ready" });
		for await (const rawLine of options.input ?? defaultInput()) {
			const line = rawLine.trim();
			if (!line) continue;
			let frame: unknown;
			try {
				frame = JSON.parse(line);
			} catch (error) {
				await output({ type: "error", command: "parse", error: `Invalid JSON: ${errorMessage(error)}` });
				continue;
			}
			if (isExtensionUIResponse(frame)) {
				pendingRequests.get(frame.id)?.resolve(frame);
				continue;
			}
			if (!isRecord(frame) || frame.type !== "prompt" || typeof frame.message !== "string") {
				await output({ type: "error", command: "parse", error: 'Expected {type:"prompt",message:string}' });
				continue;
			}
			let tracked: Promise<void>;
			tracked = session
				.prompt(frame.message)
				.catch(error => output({ type: "error", command: "prompt", error: errorMessage(error) }))
				.then(() => {
					inFlightPrompts.delete(tracked);
				});
			inFlightPrompts.add(tracked);
		}
	} catch (error) {
		failures.push(error);
	} finally {
		for (const pending of pendingRequests.values()) {
			pending.resolve({ type: "extension_ui_response", id: "eof", cancelled: true });
		}
		pendingRequests.clear();
		await Promise.all([...inFlightPrompts]);
		unsubscribe?.();
		await outputTail;
		if (outputFailure !== undefined) failures.push(outputFailure);
		try {
			await session.dispose();
		} catch (error) {
			failures.push(error);
		}
	}
	throwFailures(failures);
}
