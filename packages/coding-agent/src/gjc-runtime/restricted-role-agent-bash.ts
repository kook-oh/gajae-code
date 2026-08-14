export const WORX_RESTRICTED_ROLE_AGENT_BASH_ENV = "WORX_RESTRICTED_ROLE_AGENT_BASH";
export const WORX_RALPLAN_ARTIFACT_ENV = "WORX_RALPLAN_ARTIFACT";

export function isRestrictedRoleAgentBash(): boolean {
	return process.env[WORX_RESTRICTED_ROLE_AGENT_BASH_ENV] === "1";
}
