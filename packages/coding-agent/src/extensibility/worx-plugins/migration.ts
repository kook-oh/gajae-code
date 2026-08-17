import * as path from "node:path";
import { compileWorxPluginBundle } from "./compiler";
import { canonicalizeJsonSchema, schemaHash } from "./metadata";
import {
	type NormalizedWorxPluginSurfaces,
	PluginMigrationRequiredError,
	type WorxPluginCopiedFile,
	WorxPluginLoadError,
	type WorxPluginMigrationFailure,
	type WorxPluginMigrationState,
	type WorxPluginRegistryEntry,
} from "./types";

export interface WorxPluginMigrationStatus {
	plugin: string;
	scope: WorxPluginRegistryEntry["scope"];
	status: "migrated" | "failed";
	surfaces: string[];
	failure?: WorxPluginMigrationFailure;
}

function surfaceIds(surfaces: NormalizedWorxPluginSurfaces): string[] {
	return [
		...surfaces.tools.map(surface => surface.extensionId),
		...surfaces.hooks.map(surface => surface.extensionId),
		...surfaces.mcps.map(surface => surface.extensionId),
		...surfaces.systemAppendices.map(surface => surface.extensionId),
		...surfaces.agentAppendices.map(surface => surface.extensionId),
		...surfaces.subskills.map(surface => surface.extensionId),
	];
}

function errorInfo(error: unknown): WorxPluginLoadError {
	if (error instanceof WorxPluginLoadError) return error;
	return new WorxPluginLoadError("invalid_schema", String(error));
}

async function verifyStoredFiles(
	entry: WorxPluginRegistryEntry,
	files: readonly WorxPluginCopiedFile[],
): Promise<void> {
	const stored = new Map(entry.copiedFiles.map(file => [file.relativePath, file.sha256.toLowerCase()]));
	for (const file of files) {
		const expected = stored.get(file.relativePath);
		if (!expected) continue;
		if (expected !== file.sha256.toLowerCase()) {
			throw new WorxPluginLoadError("hash_mismatch", `Installed file hash mismatch for ${file.relativePath}`);
		}
	}
}

function migrationFailure(error: unknown, surface: string): WorxPluginMigrationFailure {
	const typed = errorInfo(error);
	return { code: typed.code, surface, cause: typed.message };
}

function migrationState(
	status: WorxPluginMigrationState["status"],
	failure?: WorxPluginMigrationFailure,
): WorxPluginMigrationState {
	return {
		status,
		metadataVersion: 2,
		...(status === "migrated" ? { migratedAt: new Date().toISOString() } : {}),
		...(failure ? { failure } : {}),
	};
}

export function isV2Tool(surface: unknown): surface is {
	extensionId: string;
	name: string;
	schema: unknown;
	schemaHash: string;
	implementationHash: string;
	metadataVersion: 2;
} {
	if (!surface || typeof surface !== "object") return false;
	const value = surface as Record<string, unknown>;
	return (
		value.metadataVersion === 2 &&
		typeof value.schemaHash === "string" &&
		typeof value.implementationHash === "string" &&
		"schema" in value
	);
}

export function entryNeedsMigration(entry: WorxPluginRegistryEntry): boolean {
	if (entry.migration?.status === "failed") return true;
	if (entry.surfaces.tools.some(surface => !isV2Tool(surface))) return true;
	if (entry.surfaces.hooks.some(surface => typeof surface.implementationHash !== "string")) return true;
	if (entry.surfaces.tools.length > 0 || entry.surfaces.hooks.length > 0) return false;
	return entry.migration?.status !== "migrated";
}

async function verifyV2EntryMetadata(entry: WorxPluginRegistryEntry): Promise<void> {
	const bundle = await compileWorxPluginBundle(entry.pluginRoot);
	const compiledTools = new Map(bundle.surfaces.tools.map(surface => [surface.extensionId, surface]));
	for (const surface of entry.surfaces.tools) {
		if (!isV2Tool(surface))
			throw new WorxPluginLoadError("migration_required", `Tool ${surface.extensionId} is missing v2 metadata`);
		const schema = canonicalizeJsonSchema(surface.schema);
		if (schemaHash(schema) !== surface.schemaHash)
			throw new WorxPluginLoadError("hash_mismatch", `Schema hash mismatch for ${surface.extensionId}`);
		const compiled = compiledTools.get(surface.extensionId);
		if (
			!compiled ||
			compiled.implementationHash !== surface.implementationHash ||
			compiled.schemaHash !== surface.schemaHash
		) {
			throw new WorxPluginLoadError("hash_mismatch", `Compiled v2 metadata mismatch for ${surface.extensionId}`);
		}
	}
	const compiledHooks = new Map(bundle.surfaces.hooks.map(surface => [surface.extensionId, surface]));
	for (const surface of entry.surfaces.hooks) {
		const compiled = compiledHooks.get(surface.extensionId);
		if (!compiled || compiled.implementationHash !== surface.implementationHash)
			throw new WorxPluginLoadError("hash_mismatch", `Compiled v2 metadata mismatch for ${surface.extensionId}`);
	}
}

/**
 * Convert one persisted v1 registry entry into v2 metadata. This function only
 * reads manifests and declared files through the non-executing compiler.
 */
export async function migrateWorxPluginEntry(
	entry: WorxPluginRegistryEntry,
): Promise<{ entry: WorxPluginRegistryEntry; changed: boolean; status: WorxPluginMigrationStatus }> {
	if (!entryNeedsMigration(entry)) {
		try {
			await verifyV2EntryMetadata(entry);
			return {
				entry,
				changed: false,
				status: {
					plugin: entry.name,
					scope: entry.scope,
					status: "migrated",
					surfaces: surfaceIds(entry.surfaces),
				},
			};
		} catch (error) {
			const failure = migrationFailure(error, surfaceIds(entry.surfaces)[0] ?? `plugin:${entry.name}`);
			const failed: WorxPluginRegistryEntry = { ...entry, migration: migrationState("failed", failure) };
			return {
				entry: failed,
				changed: true,
				status: {
					plugin: entry.name,
					scope: entry.scope,
					status: "failed",
					surfaces: surfaceIds(entry.surfaces),
					failure,
				},
			};
		}
	}

	try {
		const bundle = await compileWorxPluginBundle(entry.pluginRoot);
		if (entry.manifestHash && entry.manifestHash.toLowerCase() !== bundle.manifestHash.toLowerCase()) {
			throw new WorxPluginLoadError("hash_mismatch", "Installed manifest hash mismatch");
		}
		await verifyStoredFiles(entry, bundle.files);
		const oldIds = new Set(surfaceIds(entry.surfaces));
		const newIds = new Set(surfaceIds(bundle.surfaces));
		for (const id of oldIds) {
			if (!newIds.has(id))
				throw new WorxPluginLoadError(
					"missing_surface",
					`Declared surface ${id} is missing from the plugin manifest`,
				);
		}
		const migrated: WorxPluginRegistryEntry = {
			...entry,
			version: bundle.version,
			manifestPath: bundle.manifestPath,
			manifestHash: bundle.manifestHash,
			copiedFiles: bundle.files,
			surfaces: bundle.surfaces,
			migration: migrationState("migrated"),
		};
		return {
			entry: migrated,
			changed: true,
			status: { plugin: entry.name, scope: entry.scope, status: "migrated", surfaces: surfaceIds(bundle.surfaces) },
		};
	} catch (error) {
		const failure = migrationFailure(
			error,
			entry.migration?.failure?.surface ?? surfaceIds(entry.surfaces)[0] ?? `plugin:${entry.name}`,
		);
		const failed: WorxPluginRegistryEntry = { ...entry, migration: migrationState("failed", failure) };
		return {
			entry: failed,
			changed: true,
			status: {
				plugin: entry.name,
				scope: entry.scope,
				status: "failed",
				surfaces: surfaceIds(entry.surfaces),
				failure,
			},
		};
	}
}

/** Migrate entries from a parsed registry in memory; never imports implementations. */
export async function migrateWorxPluginEntries(
	entries: readonly WorxPluginRegistryEntry[],
): Promise<{ entries: WorxPluginRegistryEntry[]; changed: boolean; statuses: WorxPluginMigrationStatus[] }> {
	const results = await Promise.all(entries.map(entry => migrateWorxPluginEntry(entry)));
	return {
		entries: results.map(result => result.entry),
		changed: results.some(result => result.changed),
		statuses: results.map(result => result.status),
	};
}

/** Read-only status helper used by `worx plugin doctor`. */
export async function migrationStatusForEntry(entry: WorxPluginRegistryEntry): Promise<WorxPluginMigrationStatus> {
	if (entry.migration?.status === "failed") {
		return {
			plugin: entry.name,
			scope: entry.scope,
			status: "failed",
			surfaces: surfaceIds(entry.surfaces),
			failure: entry.migration.failure,
		};
	}
	return { plugin: entry.name, scope: entry.scope, status: "migrated", surfaces: surfaceIds(entry.surfaces) };
}

export async function getWorxPluginMigrationStatuses(
	cwd: string,
	options: { migrate?: boolean } = {},
): Promise<WorxPluginMigrationStatus[]> {
	const { readRegistry } = await import("./registry");
	const [user, project] = await Promise.all([
		readRegistry("user", cwd, { migrate: options.migrate !== false }),
		readRegistry("project", cwd, { migrate: options.migrate !== false }),
	]);
	return await Promise.all([...user.plugins, ...project.plugins].map(migrationStatusForEntry));
}

export async function runWorxPluginMigrationPreflight(cwd: string): Promise<WorxPluginMigrationStatus[]> {
	return getWorxPluginMigrationStatuses(cwd, { migrate: true });
}

/**
 * Optional doctor pre-flight. It uses exactly the same in-process compiler as
 * registry load and therefore has no separate eager activation path.
 */
export async function migratePluginRootForDoctor(pluginRoot: string): Promise<WorxPluginMigrationStatus> {
	try {
		const bundle = await compileWorxPluginBundle(path.resolve(pluginRoot));
		return { plugin: bundle.name, scope: "project", status: "migrated", surfaces: surfaceIds(bundle.surfaces) };
	} catch (error) {
		const failure = migrationFailure(error, `plugin-root:${pluginRoot}`);
		return { plugin: path.basename(pluginRoot), scope: "project", status: "failed", surfaces: [], failure };
	}
}

export function migrationDoctorCheckMessage(status: WorxPluginMigrationStatus): string {
	if (status.status === "migrated")
		return `${status.plugin} (${status.scope}) migrated to registry v2; surfaces: ${status.surfaces.join(", ") || "none"}`;
	const failure = status.failure;
	return `${status.plugin} (${status.scope}) migration failed for ${failure?.surface ?? "unknown surface"}: ${failure?.cause ?? "unknown cause"}`;
}

export function migrationRequiredError(entry: WorxPluginRegistryEntry): PluginMigrationRequiredError {
	const failure = entry.migration?.failure;
	return new PluginMigrationRequiredError(
		entry.name,
		failure?.surface ?? `plugin:${entry.name}`,
		failure?.cause ?? "v2 metadata is unavailable",
	);
}
