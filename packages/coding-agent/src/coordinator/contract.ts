export const COORDINATOR_MCP_PROTOCOL_VERSION = "2024-11-05";
export const COORDINATOR_MCP_SERVER_NAME = "worx-coordinator-mcp";

export const COORDINATOR_MCP_TOOL_NAMES = [
	"worx_coordinator_list_sessions",
	"worx_coordinator_read_status",
	"worx_coordinator_read_tail",
	"worx_coordinator_list_questions",
	"worx_coordinator_list_artifacts",
	"worx_coordinator_read_artifact",
	"worx_coordinator_read_coordination_status",
	"worx_coordinator_watch_events",
	"worx_coordinator_register_session",
	"worx_coordinator_start_session",
	"worx_coordinator_activate_session",
	"worx_coordinator_stop_session",
	"worx_coordinator_send_prompt",
	"worx_coordinator_submit_question_answer",
	"worx_coordinator_read_turn",
	"worx_coordinator_await_turn",
	"worx_coordinator_report_status",
	"worx_coordinator_register_codex_handoff",
	"worx_coordinator_read_codex_handoff",
	"worx_coordinator_ack_codex_handoff",
	"worx_delegate_plan",
	"worx_delegate_execute",
	"worx_delegate_team",
] as const;

export type CoordinatorToolName = (typeof COORDINATOR_MCP_TOOL_NAMES)[number];
