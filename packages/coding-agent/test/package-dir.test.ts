import { afterEach, describe, expect, it } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import { getPackageDir } from "@bworx-io/worx-code/config";

const ORIGINAL_WORX_PACKAGE_DIR = process.env.WORX_PACKAGE_DIR;
const ORIGINAL_PI_PACKAGE_DIR = process.env.PI_PACKAGE_DIR;

describe("getPackageDir", () => {
	afterEach(() => {
		process.env.WORX_PACKAGE_DIR = ORIGINAL_WORX_PACKAGE_DIR;
		process.env.PI_PACKAGE_DIR = ORIGINAL_PI_PACKAGE_DIR;
	});

	it("prefers WORX_PACKAGE_DIR over legacy PI_PACKAGE_DIR", () => {
		const worxPackageDir = path.join(os.tmpdir(), "gjc-package-dir");
		const legacyPackageDir = path.join(os.tmpdir(), "legacy-pi-package-dir");

		process.env.WORX_PACKAGE_DIR = worxPackageDir;
		process.env.PI_PACKAGE_DIR = legacyPackageDir;

		expect(getPackageDir()).toBe(worxPackageDir);
	});

	it("keeps PI_PACKAGE_DIR as a legacy fallback", () => {
		const legacyPackageDir = path.join(os.tmpdir(), "legacy-pi-package-dir");

		delete process.env.WORX_PACKAGE_DIR;
		process.env.PI_PACKAGE_DIR = legacyPackageDir;

		expect(getPackageDir()).toBe(legacyPackageDir);
	});
});
