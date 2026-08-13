# P0-FREEZE — byteWORX own-engine pivot

Freeze date: 2026-08-13. This document freezes the pre-rename baseline; it does not begin the rename.

## 1. Fork identity

[V] Executed in this checkout:

```sh
git rev-parse HEAD
git describe --tags --always
git rev-list --count main
git tag --list | wc -l
git reflog show --date=iso --format='%gd %cd %gs' main | tail -1
```

Output: `63ea66995c4e20ced48528f83af6e5b055fff372`; `v0.13.1`; `4318`; `92`; and `main@{2026-08-13 22:43:16 +0900} ... branch: Created from 63ea66995c4e20ced48528f83af6e5b055fff372`.

- Product fork: `https://github.com/bworx-io/worx-code.git`.
- Upstream: `https://github.com/Yeachan-Heo/gajae-code.git`.
- Fork point: `63ea66995c4e20ced48528f83af6e5b055fff372` (`v0.13.1`), created locally on 2026-08-13.
- Baseline `main` commits: 4,318; local tags: 92.

## 2. ORCA fork point

[V] Executed `git -C /Users/kook/bworx/worx-ide show HEAD:.upstream-pin` and an anchors-manifest JSON extraction. Output: `cf7fb4f7b` in both places, with `12` active patches and `['05-worx-panels-mount.patch']` excluded. `patches/materialization.manifest.json:4-6` names `.upstream-pin` as its `upstream_pin` source; `patches/anchors.manifest.json:4` records the same pin.

`cf7fb4f7b` is the frozen ORCA overlay pin and **patch-authoring baseline**, not a claim about the current ORCA upstream tip. [GAP: ORCA upstream remote/latest SHA is not configured locally; `worx-ide` has only `origin`, and `refs/remotes/upstream/HEAD` cannot be resolved.]

## 3. Package-version freeze and G2 platform scope

[V] Executed:

```sh
python3 - <<'PY'
import json
from pathlib import Path
for p in [Path('packages/coding-agent/package.json'), Path('packages/natives/package.json')]:
    d = json.loads(p.read_text())
    print(f'{p}: name={d["name"]} version={d["version"]}')
root = json.loads(Path('package.json').read_text())
for k, v in root['workspaces']['catalog'].items():
    if k.startswith('@gajae-code/'):
        print(f'{k}={v}')
PY
```

Output establishes `@gajae-code/coding-agent@0.13.1`, `@gajae-code/natives@0.13.1`, and catalog `0.13.1` for `stats`, `agent-core`, `ai`, `bridge-client`, `coding-agent`, `natives`, five platform-natives packages, `tui`, and `utils`.

G2 freezes only two own-native targets: `darwin-arm64` and `linux-x64-modern`. `darwin-x64`, `linux-arm64`, and `win32-x64` are **unsupported (G2)**; their inherited catalog entries are not a support commitment. [V] `/Users/kook/bworx/worx-code-wrapper/package.json` reports `@colbymchenry/codegraph@1.5.0`; move that wrapper dependency decision to P4.

## 4. Native version sentinel

[V] Executed:

```sh
git grep -n -E '__piNativesV0_13_1|version\.replace\(/\[\^A-Za-z0-9\]/g' -- \
  packages/natives/native/loader-state.js crates/pi-natives/src/lib.rs packages/natives/native/index.js
```

Output locates the derived loader rule at `packages/natives/native/loader-state.js:506`:

```js
const versionSentinelExport = `__piNativesV${packageVersion.replace(/[^A-Za-z0-9]/g, "_")}`;
```

The corresponding frozen 0.13.1 export is `__piNativesV0_13_1` at `crates/pi-natives/src/lib.rs:79` (and is re-exported at `packages/natives/native/index.js:33`). The loader rule is the contract: a package version change changes the required native export name.

## 5. License lineage baseline and correction

Lineage: `pi-mono` → `oh-my-pi` → `gajae-code` → `byteWORX worx-code`.

The inherited `LICENSE` named only Yeachan-Heo. [V] A Python source extraction of `/Users/kook/bworx/worx-code-wrapper/docs/evidence/p0-4-native-build-probe-2026-08-12.md:151-158` reports the missing Mario Zechner and Can Bölük notices and the required four-party correction. This commit corrects that upstream attribution defect: `LICENSE` now names Mario Zechner (pi-mono), Can Bölük (oh-my-pi), Yeachan-Heo and Gajae Code Contributors, and byteWORX; `NOTICE.md` preserves its existing notices and adds the explicit lineage tree.

## 6. ORCA numstat split

[V] In `/Users/kook/bworx/worx-ide`, every `patches/*.patch` was measured without applying it:

```sh
git apply --numstat --summary < "$patch"
```

The per-patch files/additions/deletions and additive-versus-in-place split are recorded in [ORCA-PATCH-SPLIT.md](ORCA-PATCH-SPLIT.md). [V] Both ORCA manifests declare 12 active patches and one excluded patch, `05-worx-panels-mount.patch`; measurement found 13 `.patch` files and 15 patch-ish artifacts (the 13 patches plus two manifests).

## 7. Measured release cadence

[V] Executed:

```sh
git for-each-ref --format='%(creatordate:short) %(refname:short)' refs/tags |
  awk '$1 >= "2026-05-16" && $1 <= "2026-08-13" { total++; if ($2 !~ /nightly/) stable++ } END { printf "window=2026-05-16..2026-08-13 total=%d stable=%d nightly-excluded=%d cadence=%.3f stable-releases/day\\n", total, stable, total-stable, stable/90 }'
```

Output: `window=2026-05-16..2026-08-13 total=92 stable=89 nightly-excluded=3 cadence=0.989 stable-releases/day`. The trailing 90-calendar-day window is inclusive; tags containing `nightly` are excluded. This is a tag-date observation, not a future release commitment.

## 8. Gate signatures and dispositions

[V] A Python source extraction of `/Users/kook/bworx/worx-code-wrapper/docs/evidence/p0-4-native-build-probe-2026-08-12.md:10-16` outputs the 2026-08-12 operator signature: **G1 = Option A** and **G2 = darwin-arm64 + linux-x64 (modern), two platforms**; it also says the other three platforms are unsupported and Option C/F2 was not selected.

[V] A Python source extraction of `/Users/kook/bworx/worx-code-wrapper/.gjc/_session-019f846c-2f78-7000-9840-7068e2f159f9/plans/ralplan/019ff279-d9df-7000-0f9b-fa4565a1529a/stage-08-final.md:3,29-52,174-180` outputs ralplan run `019ff279-d9df-7000-0f9b-fa4565a1529a`, stage 8 final rev.6, dated 2026-08-13, and the recorded approval scope.

Disposition summary: §1b retires 13 lines/14 sites of Option C/F2/R13 material: Option C framing and F2 mirroring are removed, R13 is deleted, and the two-platform own-build path is retained. §10 establishes that the wrapper is retired as the product model and this fork is the product/engine itself; no wrapper compatibility layer is planned.

## 9. Behavioral-identifier sweep before rename

This is the rename-start baseline. [V] Command (excluding documentation only):

```sh
git grep -n -E '=== "gjc"|!== "gjc"|startsWith\("gjc' -- ':!docs/**'
```

All 15 matches: `packages/coding-agent/src/config/settings.ts:1656`; `packages/coding-agent/src/coordinator-mcp/server.ts:826`; `packages/coding-agent/src/gjc-runtime/team-runtime.ts:384,433`; `packages/coding-agent/src/gjc-runtime/tmux-sessions.ts:943`; `packages/coding-agent/src/hooks/skill-state.ts:175`; `packages/coding-agent/src/sdk/transport/auth-preface.ts:69`; `packages/coding-agent/src/session/agent-session.ts:13990`; `packages/coding-agent/src/tools/bash-allowed-prefixes.ts:272`; `packages/coding-agent/test/core/python-runner-artifact.test.ts:49`; `packages/coding-agent/test/gjc-runtime/launch-tmux.test.ts:125`; `packages/coding-agent/test/shell-snapshot.test.ts:49,71,92`; `scripts/generate-gjc-plugins.ts:24`; `scripts/verify-gjc-plugins.ts:57,65`.

[V] `git grep -n 'gjc-sdk-transport/' -- ':!docs/**'` finds the production protocol definition at `packages/coding-agent/src/sdk/transport/auth-preface.ts:6,69`, plus its TypeScript fixture/tests and Python SDK implementation/tests: `packages/coding-agent/test/fixtures/sdk-frame-vectors/transport-shapes.json:6`, `packages/coding-agent/test/sdk-frame-vectors.test.ts:118`, `packages/coding-agent/test/sdk-serve-transport.test.ts:345,347,378,402,421,422`, `python/gjc-sdk/gjc_sdk/transport.py:87`, and `python/gjc-sdk/tests/test_vectors.py:52`.

[V] MCP public-name count was measured from the two declaration sources:

```sh
{ git grep -h -o -E 'gjc_[a-z0-9_]+' -- packages/coding-agent/src/coordinator/contract.ts; git grep -h -o -E 'gjc_[a-z0-9_]+' -- packages/coding-agent/src/sdk/mcp/server.ts; } | sort -u | wc -l
```

Output: `27` unique `gjc_`-prefixed MCP tool names (23 coordinator, 4 SDK). [V] `git grep -h -o -E 'GJC_[A-Z_]+' -- packages/coding-agent/src | sort -u | wc -l` outputs `251` unique `GJC_` identifiers in production coding-agent source.

## 10. Signing/attestation decision

**Explicitly unsigned** — operator decision, 2026-08-13. Distribution is limited to internal GitHub Packages behind the `gh auth` gate. Integrity is instead required through the hash chain: source SHA → `.node` SHA-256 → tarball digest → publish receipt. Reconsider signing/attestation when external distribution begins.
