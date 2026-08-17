import { readFileSync } from "node:fs";
import * as path from "node:path";
import { getAgentDir, isEnoent } from "@bworx-io/worx-utils";
import { BUNDLED_WORX_SKILL_CATALOG, type BundledWorxSkillCatalogEntry } from "./worx-skills.generated";

export const DEFAULT_WORX_DEFINITION_NAMES = ["deep-interview", "ralplan", "team", "ultragoal"] as const;
export type DefaultWorxDefinitionName = (typeof DEFAULT_WORX_DEFINITION_NAMES)[number];
export type DefaultWorxDefinitionKind = "skill" | "skill-fragment";
export type EmbeddedDefaultWorxSkill = {
	name: DefaultWorxDefinitionName;
	description: string;
	filePath: string;
	baseDir: string;
	source: "bundled:default";
	hide?: boolean;
	/** Content is loaded on demand to keep startup free of bundled Markdown bodies. */
	content: string;
	loadContent: () => Promise<string>;
};
export type DefaultWorxInstallStatus = "different" | "matching" | "missing" | "skipped" | "written";

export interface DefaultWorxSkillDefinition {
	kind: "skill";
	name: DefaultWorxDefinitionName;
	relativePath: string;
	content: string;
	loadContent: () => Promise<string>;
}

export interface DefaultWorxSkillFragmentDefinition {
	kind: "skill-fragment";
	parentSkillName: DefaultWorxDefinitionName;
	relativePath: string;
	content: string;
	loadContent: () => Promise<string>;
}

export type DefaultWorxDefinition = DefaultWorxSkillDefinition | DefaultWorxSkillFragmentDefinition;

export interface InstallDefaultWorxDefinitionsOptions {
	check?: boolean;
	force?: boolean;
	/**
	 * Only rewrite default definition files that already exist on disk but whose
	 * content differs from the embedded defaults. Files that are absent are left
	 * absent (status "missing"). Used by `gjc update` to refresh opted-in copies
	 * without materializing new on-disk copies for users who never installed them.
	 */
	refreshOnly?: boolean;
	targetRoot?: string;
}

export type DefaultWorxDefinitionInstallFile =
	| {
			kind: "skill";
			name: DefaultWorxDefinitionName;
			path: string;
			status: DefaultWorxInstallStatus;
	  }
	| {
			kind: "skill-fragment";
			parentSkillName: DefaultWorxDefinitionName;
			path: string;
			status: DefaultWorxInstallStatus;
	  };

export interface DefaultWorxDefinitionInstallResult {
	targetRoot: string;
	total: number;
	written: number;
	skipped: number;
	matching: number;
	missing: number;
	different: number;
	files: DefaultWorxDefinitionInstallFile[];
}
function sourcePathForBundledEntry(entry: BundledWorxSkillCatalogEntry): string {
	const relative = entry.kind === "skill" ? entry.relativePath : entry.relativePath.replace(/^skill-fragments\//, "");
	return entry.kind === "skill"
		? path.join(import.meta.dir, "worx", relative)
		: path.join(import.meta.dir, "worx", "skills", relative);
}

export class BundledDefaultContentError extends Error {
	readonly code = "BUNDLED_DEFAULT_CONTENT_UNREADABLE";
	constructor(
		message: string,
		readonly sourcePath: string,
		readonly cause: unknown,
	) {
		super(message, { cause });
		this.name = "BundledDefaultContentError";
	}
}

export function readBundledContentSync(entry: BundledWorxSkillCatalogEntry): string {
	const sourcePath = sourcePathForBundledEntry(entry);
	try {
		return readFileSync(sourcePath, "utf8");
	} catch (cause) {
		const detail = cause instanceof Error ? cause.message : String(cause);
		throw new BundledDefaultContentError(
			`Unable to read bundled GJC definition ${sourcePath}: ${detail}`,
			sourcePath,
			cause,
		);
	}
}

function withLazyBundledContent<T extends object>(
	value: T,
	entry: BundledWorxSkillCatalogEntry,
): T & { content: string } {
	Object.defineProperty(value, "content", {
		enumerable: true,
		configurable: false,
		get: () => readBundledContentSync(entry),
	});
	return value as T & { content: string };
}

function asDefaultDefinition(entry: BundledWorxSkillCatalogEntry): DefaultWorxDefinition {
	if (entry.kind === "skill") {
		if (!entry.name) throw new Error(`Bundled skill catalog entry is missing name: ${entry.relativePath}`);
		return withLazyBundledContent(
			{
				kind: "skill",
				name: entry.name as DefaultWorxDefinitionName,
				relativePath: entry.relativePath,
				loadContent: entry.loadContent,
			},
			entry,
		);
	}
	if (!entry.parentSkillName)
		throw new Error(`Bundled skill fragment catalog entry is missing parent: ${entry.relativePath}`);
	return withLazyBundledContent(
		{
			kind: "skill-fragment",
			parentSkillName: entry.parentSkillName as DefaultWorxDefinitionName,
			relativePath: entry.relativePath,
			loadContent: entry.loadContent,
		},
		entry,
	);
}

const DEFAULT_WORX_DEFINITIONS: readonly DefaultWorxDefinition[] = BUNDLED_WORX_SKILL_CATALOG.map(asDefaultDefinition);

export function getDefaultWorxDefinitions(): readonly DefaultWorxDefinition[] {
	return DEFAULT_WORX_DEFINITIONS;
}

export function getDefaultWorxAgentDefinitions(): readonly DefaultWorxDefinition[] {
	return [];
}

export function getEmbeddedDefaultWorxSkillFragments(
	parentSkillName: DefaultWorxDefinitionName,
): DefaultWorxSkillFragmentDefinition[] {
	return DEFAULT_WORX_DEFINITIONS.filter(
		(definition): definition is DefaultWorxSkillFragmentDefinition =>
			definition.kind === "skill-fragment" && definition.parentSkillName === parentSkillName,
	);
}

export function getEmbeddedDefaultWorxSkills(): EmbeddedDefaultWorxSkill[] {
	return DEFAULT_WORX_DEFINITIONS.filter(
		(definition): definition is DefaultWorxSkillDefinition => definition.kind === "skill",
	).map(definition => {
		const catalogEntry = BUNDLED_WORX_SKILL_CATALOG.find(
			entry => entry.kind === "skill" && entry.name === definition.name,
		);
		if (!catalogEntry) {
			throw new Error(`Bundled GJC skill catalog invariant violated for "${definition.name}"`);
		}
		const description = catalogEntry.description ?? `GJC ${definition.name} workflow`;
		return withLazyBundledContent(
			{
				name: definition.name,
				description,
				filePath: `embedded:worx/${definition.relativePath}`,
				baseDir: `embedded:worx/skills/${definition.name}`,
				source: "bundled:default",
				loadContent: definition.loadContent,
			},
			catalogEntry,
		);
	});
}

export async function installDefaultWorxDefinitions(
	options: InstallDefaultWorxDefinitionsOptions = {},
): Promise<DefaultWorxDefinitionInstallResult> {
	const targetRoot = options.targetRoot ?? getAgentDir();
	const files: DefaultWorxDefinitionInstallFile[] = [];

	for (const definition of DEFAULT_WORX_DEFINITIONS) {
		const content = await definition.loadContent();
		const destination = path.join(targetRoot, definition.relativePath);
		const existing = await readExistingText(destination);
		let status: DefaultWorxInstallStatus;

		if (options.check) {
			status = existing === undefined ? "missing" : existing === content ? "matching" : "different";
		} else if (options.refreshOnly) {
			if (existing === undefined) {
				status = "missing";
			} else if (existing === content) {
				status = "matching";
			} else {
				await Bun.write(destination, content);
				status = "written";
			}
		} else if (existing !== undefined && !options.force) {
			status = "skipped";
		} else {
			await Bun.write(destination, content);
			status = "written";
		}

		if (definition.kind === "skill") {
			files.push({
				kind: definition.kind,
				name: definition.name,
				path: destination,
				status,
			});
		} else {
			files.push({
				kind: definition.kind,
				parentSkillName: definition.parentSkillName,
				path: destination,
				status,
			});
		}
	}

	return summarizeInstallResult(targetRoot, files);
}

async function readExistingText(filePath: string): Promise<string | undefined> {
	try {
		return await Bun.file(filePath).text();
	} catch (error) {
		if (isEnoent(error)) return undefined;
		throw error;
	}
}

function summarizeInstallResult(
	targetRoot: string,
	files: DefaultWorxDefinitionInstallFile[],
): DefaultWorxDefinitionInstallResult {
	return {
		targetRoot,
		total: files.length,
		written: countStatus(files, "written"),
		skipped: countStatus(files, "skipped"),
		matching: countStatus(files, "matching"),
		missing: countStatus(files, "missing"),
		different: countStatus(files, "different"),
		files,
	};
}

function countStatus(files: readonly DefaultWorxDefinitionInstallFile[], status: DefaultWorxInstallStatus): number {
	return files.filter(file => file.status === status).length;
}
