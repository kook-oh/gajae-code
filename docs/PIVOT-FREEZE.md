# P0-FREEZE — byteWORX own-engine pivot

Freeze date: 2026-08-13. This document freezes the pre-rename baseline; it does not begin the rename.

## 1. Fork identity

[V] Executed against the pre-freeze parent of commit `e2e106aee`:

```sh
git rev-parse e2e106aee^
git describe --tags --always e2e106aee^
git rev-list --count e2e106aee^
git tag --merged e2e106aee^ --list | wc -l
git reflog show --date=iso --format='%gd %cd %gs' main | tail -1
```

Output: `63ea66995c4e20ced48528f83af6e5b055fff372`; `v0.13.1`; `4318`; `92`; and `main@{2026-08-13 22:43:16 +0900} ... branch: Created from 63ea66995c4e20ced48528f83af6e5b055fff372`.

- Product fork: `https://github.com/bworx-io/worx-code.git`.
- Upstream: `https://github.com/Yeachan-Heo/gajae-code.git`.
- Fork point: `63ea66995c4e20ced48528f83af6e5b055fff372` (`v0.13.1`), created locally on 2026-08-13.
- Baseline `main` commits: 4,318; local tags: 92.

## 2. ORCA fork point

[V] Executed `git -C /Users/kook/bworx/worx-ide show HEAD:.upstream-pin` and an anchors-manifest JSON extraction. Output: `cf7fb4f7b` in both places, with `12` active patches and `['05-worx-panels-mount.patch']` excluded. `patches/materialization.manifest.json:4-6` names `.upstream-pin` as its `upstream_pin` source; `patches/anchors.manifest.json:4` records the same pin.

`cf7fb4f7bb370aa0a45314a7378313d76f53f4ee` is the frozen ORCA overlay pin and
**patch-authoring baseline**, not the current ORCA upstream tip.

[V] The local checkout has only `origin=https://github.com/bworx-io/worx-ide.git`;
`README.md` identifies `https://github.com/stablyai/orca` as upstream. Read-only
GitHub API probes on 2026-08-13 resolved:

- upstream `main`: `93334dc53fccdb7348d09fc28067ba6d3dec36ea`;
- latest stable release: `v1.4.180`, peeled commit
  `0b62333cf179adbd839843456e111e2cdaf0bffd`;
- latest tag: `v1.4.182-rc.1`, commit
  `27c9def4ac37eb2e4154426b30c763545dd39484`.

These values freeze the observed drift boundary. They do not repin the overlay.

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

The P1b own-scope package set is frozen as:

| Role | Package | Frozen version |
|---|---|---:|
| Aggregator | `@bworx-io/worx-code-natives` | `0.13.1` |
| macOS Apple Silicon | `@bworx-io/worx-code-natives-darwin-arm64` | `0.13.1` |
| Linux x64 modern | `@bworx-io/worx-code-natives-linux-x64` | `0.13.1` |

These are target publish identities; the inherited manifests remain unchanged
until P1b. The version rule derives `__piNativesV0_13_1`, which matches the
frozen Rust export and loader re-export documented in §4.

G2 freezes only two own-native targets: `darwin-arm64` and `linux-x64-modern`. `darwin-x64`, `linux-arm64`, and `win32-x64` are **unsupported (G2)**; their inherited catalog entries are not a support commitment. [V] `/Users/kook/bworx/worx-code-wrapper/package.json` reports `@colbymchenry/codegraph@1.5.0`; move that wrapper dependency decision to P4.

## 4. Native version sentinel

[V] Executed:

```sh
git grep -n -E '__piNativesV0_13_1|packageVersion\.replace\(/\[\^A-Za-z0-9\]/g' -- \
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

Vendor-license inventory at the frozen parent:

| Vendored component | License path | Copyright |
|---|---|---|
| brush builtins | `crates/brush-builtins-vendored/LICENSE` | MIT, © 2024 reuben olinsky |
| brush core | `crates/brush-core-vendored/LICENSE` | MIT, © 2024 reuben olinsky |
| insane-search | `packages/coding-agent/vendor/insane-search/LICENSE` | MIT, © 2026 fivetaku |

These vendor licenses remain distributed beside their vendored sources and are
not replaced by the root lineage notice.

## 6. ORCA numstat split

[V] In `/Users/kook/bworx/worx-ide`, every `patches/*.patch` was measured without applying it:

```sh
git apply --numstat --summary < "$patch"
```

The per-patch files/additions/deletions and additive-versus-in-place split are recorded in [ORCA-PATCH-SPLIT.md](ORCA-PATCH-SPLIT.md). [V] Both ORCA manifests declare 12 active patches and one excluded patch, `05-worx-panels-mount.patch`; measurement found 13 `.patch` files plus the two patch stubs `02-worx-hooks.md` and `03-worx-panels-mount.md`, for 15 patch-ish artifacts. The two manifests and the exemption record are separate inventory inputs.

## 7. Measured release cadence

[V] Executed:

```sh
git for-each-ref --format='%(creatordate:short) %(refname:short)' refs/tags |
  awk '$1 >= "2026-05-16" && $1 <= "2026-08-13" { total++; if ($2 !~ /nightly/) stable++ } END { printf "window=2026-05-16..2026-08-13 total=%d stable=%d nightly-excluded=%d cadence=%.3f stable-releases/day\\n", total, stable, total-stable, stable/90 }'
```

Output: `window=2026-05-16..2026-08-13 total=92 stable=89 nightly-excluded=3 cadence=0.989 stable-releases/day`. The trailing 90-calendar-day window is inclusive; tags containing `nightly` are excluded. This is a tag-date observation, not a future release commitment.

## 8. Gate signatures and dispositions

[V] A Python source extraction of `/Users/kook/bworx/worx-code-wrapper/docs/evidence/p0-4-native-build-probe-2026-08-12.md:10-16` outputs the 2026-08-12 operator signature: **G1 = Option A** and **G2 = darwin-arm64 + linux-x64 (modern), two platforms**; it also says the other three platforms are unsupported and Option C/F2 was not selected.

[V] A Python source extraction of `/Users/kook/bworx/worx-code-wrapper/.worx/_session-019f846c-2f78-7000-9840-7068e2f159f9/plans/ralplan/019ff279-d9df-7000-0f9b-fa4565a1529a/stage-08-final.md:3,29-52,174-180` outputs ralplan run `019ff279-d9df-7000-0f9b-fa4565a1529a`, stage 8 final rev.6, dated 2026-08-13, and the recorded approval scope.

Disposition summary: §1b retires 13 lines/14 sites of Option C/F2/R13 material: Option C framing and F2 mirroring are removed, R13 is deleted, and the two-platform own-build path is retained. §10 establishes that the wrapper is retired as the product model and this fork is the product/engine itself; no wrapper compatibility layer is planned.

## 9. Behavioral-identifier sweep before rename

This is the rename-start baseline. [V] Command (excluding documentation only):

```sh
git grep -n -E '=== "gjc"|!== "gjc"|startsWith\("gjc' -- ':!docs/**'
```

The command returns 17 matches: `packages/coding-agent/src/config/settings.ts:1656`;
`packages/coding-agent/src/coordinator-mcp/server.ts:826`;
`packages/coding-agent/src/worx-runtime/team-runtime.ts:384,433`;
`packages/coding-agent/src/worx-runtime/tmux-sessions.ts:943`;
`packages/coding-agent/src/hooks/skill-state.ts:175`;
`packages/coding-agent/src/sdk/transport/auth-preface.ts:69`;
`packages/coding-agent/src/session/agent-session.ts:13990`;
`packages/coding-agent/src/tools/bash-allowed-prefixes.ts:272`;
`packages/coding-agent/test/core/python-runner-artifact.test.ts:49`;
`packages/coding-agent/test/worx-runtime/launch-tmux.test.ts:125`;
`packages/coding-agent/test/shell-snapshot.test.ts:49,71,92`;
`scripts/generate-worx-plugins.ts:24`; and
`scripts/verify-worx-plugins.ts:57,65`.

[V] `git grep -n 'gjc-sdk-transport/' -- ':!docs/**'` finds the production protocol definition at `packages/coding-agent/src/sdk/transport/auth-preface.ts:6,69`, plus its TypeScript fixture/tests and Python SDK implementation/tests: `packages/coding-agent/test/fixtures/sdk-frame-vectors/transport-shapes.json:6`, `packages/coding-agent/test/sdk-frame-vectors.test.ts:118`, `packages/coding-agent/test/sdk-serve-transport.test.ts:345,347,378,402,421,422,440`, `python/worx-sdk/worx_sdk/transport.py:87`, and `python/worx-sdk/tests/test_vectors.py:52`.

[V] MCP public-name count was measured from the two declaration sources:

```sh
{ git grep -h -o -E 'gjc_[a-z0-9_]+' -- packages/coding-agent/src/coordinator/contract.ts; git grep -h -o -E 'gjc_[a-z0-9_]+' -- packages/coding-agent/src/sdk/mcp/server.ts; } | sort -u | wc -l
```

Output: `27` unique `gjc_`-prefixed MCP tool names (23 coordinator, 4 SDK).
[V] `git grep -h -o -E 'WORX_[A-Z_]+' -- 'packages/*/src/**' | sort -u | wc -l`
outputs `276` unique identifiers across package source. This supersedes the
plan's preliminary count of 282 and the narrower coding-agent-only count of
251; P1 must use a fresh exhaustive sweep rather than either stale count.

## 10. Downstream preservation surfaces

P1 may rename these surfaces, but must preserve their behavior:

| Surface | Frozen contract | Confirmed consumer |
|---|---|---|
| S1 Coordinator MCP | `mcp-serve coordinator`; delegate plan/execute/team; `start_session → send_prompt → read_turn/await_turn → submit_question_answer`; durable `turn_id` and `idempotency_key` semantics | AX workflow Activities for analysis, implementation, and PR steps |
| S2 ACP | IDE chat-session semantics through the `worx-acp` path | `worx-ide` Class A paths `src/main/worx-acp/**` and `src/renderer/src/worx-acp/**` |
| S3 Headless automation | Preserve `-p/--print`, `--session-dir`, `--append-system-prompt`, `--tools`, and `--continue`; migrate streaming control to the supported SDK/Coordinator contracts | `ems-review` / review-system `web/gjc/runner.py` |

`--mode rpc` is not a current engine contract. The CLI parser rejects it as
removed, and the SDK documentation names the SDK machine interface as the only
external-control interface. `ems-review` still contains an opt-in RPC branch,
but `WORX_RPC` defaults off, so that branch is a downstream incompatibility rather
than behavior to restore. P1 must not reintroduce the retired RPC protocol.
Before cutover, the EMS track must replace that branch with the supported
SDK/Coordinator lifecycle, prompt, status, and event contracts while retaining
the working print-mode path.

## 11. Signing/attestation decision

**Explicitly unsigned** — P0 implementation decision, 2026-08-13, permitted by
rev.6 §4b. Distribution is limited to internal GitHub Packages behind the
`gh auth` gate. Integrity is instead required through the hash chain:
source SHA → `.node` SHA-256 → tarball digest → publish receipt. Reconsider
signing/attestation when external distribution begins.
