export const ACP_MCP_REQUEST_TIMEOUT_MS = 30_000;
export const ACP_MCP_LIFECYCLE_TIMEOUT_MS = ACP_MCP_REQUEST_TIMEOUT_MS + 500;
/**
 * Readiness budget every ACP session-startup request asks the broker for. The
 * broker default (10s) leaves a semantic-ready deadline of ~8s, which a cold
 * session host misses on a loaded machine, so ACP always requests the larger
 * MCP-sized budget instead of only doing so when MCP servers are configured.
 */
export const ACP_LIFECYCLE_READINESS_TIMEOUT_MS = ACP_MCP_LIFECYCLE_TIMEOUT_MS;
/**
 * Slice of the readiness budget reserved for the work that follows MCP startup
 * (session wiring, marker publication). The ACP MCP startup ceiling is the
 * remaining time to `semanticReadyDeadlineAt` minus this headroom, so a slow
 * MCP handshake cannot consume the whole readiness window.
 */
export const ACP_MCP_STARTUP_HEADROOM_MS = 250;

export interface SessionLifecycleMcpStdioServer {
	type?: "stdio";
	name: string;
	command: string;
	args: string[];
	env?: Record<string, string>;
}

export interface SessionLifecycleMcpRemoteServer {
	type: "http" | "sse";
	name: string;
	url: string;
	headers?: Record<string, string>;
}

export type SessionLifecycleMcpServer = SessionLifecycleMcpStdioServer | SessionLifecycleMcpRemoteServer;
