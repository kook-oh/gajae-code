import { CANONICAL_WORX_WORKFLOW_SKILLS, type CanonicalGjcWorkflowSkill } from "../skill-state/active-state";

export interface SkillKeywordDefinition {
	keyword: string;
	skill: GjcWorkflowSkill;
	priority: number;
	guidance: string;
}

export const WORX_WORKFLOW_SKILLS = CANONICAL_WORX_WORKFLOW_SKILLS;

export type GjcWorkflowSkill = CanonicalGjcWorkflowSkill;

export const WORX_SKILL_KEYWORD_DEFINITIONS: readonly SkillKeywordDefinition[] = [
	{
		keyword: "$deep-interview",
		skill: "deep-interview",
		priority: 8,
		guidance: "Activate GJC deep-interview requirements workflow",
	},
	{
		keyword: "$ralplan",
		skill: "ralplan",
		priority: 9,
		guidance: "Activate GJC ralplan planning workflow",
	},
	{
		keyword: "$ultragoal",
		skill: "ultragoal",
		priority: 8,
		guidance: "Activate GJC ultragoal durable goal workflow",
	},
	{
		keyword: "$team",
		skill: "team",
		priority: 8,
		guidance: "Activate GJC team workflow",
	},
] as const;

export function isGjcWorkflowSkill(value: string): value is GjcWorkflowSkill {
	return (WORX_WORKFLOW_SKILLS as readonly string[]).includes(value);
}

export function compareSkillKeywordMatches(
	a: { priority: number; keyword: string },
	b: { priority: number; keyword: string },
): number {
	if (b.priority !== a.priority) return b.priority - a.priority;
	if (b.keyword.length !== a.keyword.length) return b.keyword.length - a.keyword.length;
	return a.keyword.localeCompare(b.keyword);
}
