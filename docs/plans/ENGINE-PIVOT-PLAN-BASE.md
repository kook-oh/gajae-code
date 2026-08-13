# RALPLAN Revision — byteWORX Own-Engine Pivot (`worx-code`) — stage_n 2

Revises stage-01 planner (`8fe2e4d0…acd9d6`) against architect WATCH/REQUEST-CHANGES (`20ed3060…a8607c1`, F1–F4) and critic ITERATE (`25003e43…e4174d8045`, C1–C8). No typed conflicts between lanes; all findings treated as complementary `add`/`change`.

Evidence convention unchanged: **[V]** verified by reading source at the cited path:line · **[S]** spec-asserted, not re-verified · **[I]** inference, marked · **[X]** not executable on this host · **[T]** tool-truncated enumeration — floor stated, mechanical derivation prescribed.

---

## 0. Retraction and method correction (F1)

**I retract the stage-01 claim that patch 07's modified-file set is "a short list" of ~18 files, and the conclusion drawn from it that "for this patch the spec's 'one-time and ordinary source work' holds."** Both are false.

**How the error was produced.** I ran one `search` for `^--- a/` over `07-worx-acp-mount.patch`, received a result window that stopped at diff line 11,133 of 78,245, and generalized from it. I read **14% of the diff** and described the whole. The `new file mode` density I saw was real *for that prefix* — the patch is ordered with its additive `config/`, `resources/`, `src/main/worx-acp/**` content first — and the in-place modifications are concentrated later. Sampling a sorted diff and generalizing is the exact failure this programme has now committed six times.

**Re-enumeration, this pass.** Direct enumeration confirms the architect. Modified upstream files directly observed in patch 07 include, with diff-line anchors [V]:

| File | Diff line | Approx. hunk span to next entry |
|---|---|---|
| `src/main/runtime/orca-runtime.ts` | 16529 | ~2,140 |
| `src/renderer/src/App.tsx` | 38442 | ~1,650 |
| `src/main/runtime/rpc/methods/session-tabs.ts` | 20431 | ~1,600 |
| `src/renderer/src/store/slices/tabs-hydration.ts` | 53585 | ~320 (full-file rewrite: `@@ -1,303 +1,23 @@`) |
| `src/main/ipc/runtime-environments.ts` | 13089 | ~600 |
| `src/main/window/attach-main-window-services.ts` | 22752 | large |
| `src/preload/api-types.ts`, `src/preload/index.ts` | 38079, 38228 | — |
| `src/main/runtime/rpc/{core,dispatcher,methods/index}.ts` | 18669, 18722, 19679 | — |
| `src/main/runtime/runtime-rpc.ts`, `src/main/ipc/runtime.ts` | 22168, 14223 | — |
| all six i18n locale bundles (`en/es/ja/ko/zh` + …) | 48880–50084 | — |
| ~60 further `src/renderer/src/components/**` files (sidebar, tab-bar, tab-group, settings, status-bar) | 40419–48423 | — |

**Count discipline.** The enumeration is **tool-truncated**: the result stream caps at 1,049 lines / 50KB and `skip` did not offset on retry, so I can report a directly-observed floor of **≥130 modified upstream files within the first ~69% of the diff (to line 53,910 of 78,245)** and nothing more precise [T]. The true count exceeds the architect's ≥120 and exceeds mine. **I am not asserting a number I cannot compute.**

**Mechanical derivation is now a required P0 deliverable, not a planner estimate.** For each of the 12 active patches the executor runs, against the fork checkout, and commits the output as `docs/ORCA-PATCH-SPLIT.md`:

```
git apply --numstat --summary <patch>      # per-file added/deleted/mode
git apply --stat <patch>                   # totals
```

`--summary` lines beginning `create mode` are the additive class; every other path is the in-place class. Per patch, record: total files, additive count, in-place count, in-place added+deleted lines, and the in-place subset that upstream has also changed since the pin (`git log --oneline <pin>..upstream/main -- <path>`). **No ORCA sizing, sequencing, or estimate in this programme may cite a sampled figure again.**

**Consequences folded into the plan (below):** P3 is re-sequenced into three classes rather than "07 first, then 09–14"; pre-mortem S3 is rewritten because its premise ("07 ports cleanly, and the team over-generalizes from that") was itself my error, not a projected one.

---

## 1. Disposition of every finding

| ID | Disposition | Where |
|---|---|---|
| F1 patch-07 exoneration falsified | **Accepted, retracted, re-derived mechanically** | §0, §5 (P3) |
| F2 Option C lacks natives mirroring | **Accepted** — mirroring is now a precondition of Option C, not an optional hardening | §4 (P0-F/P1) |
| F3 cross-actor `approval.resolve` missing | **Accepted** — added to G6, to the P6 bridge contract, and to A14/E5 | §6 (P6) |
| F4 citation hygiene (patch-09 "no new files"; "14 files on disk"; "`sequence` on every command") | **Accepted, all three corrected** | §2 |
| C1 freeze inputs, close ownership decision | **Accepted** | §4 (P0-FREEZE) |
| C2 P1 cross-repo migration checklist | **Accepted** | §4 (P1) |
| C3 design the P6 bridge, not only schemas | **Accepted** | §6 |
| C4 falsifiable AC-4/5/6/8 | **Accepted** | §7 |
| C5 P2 fault injection + rollout controls | **Accepted**, extended to P5/P6/P8 | §8 |
| C6 P3 visual exit gate | **Accepted** | §5 |
| C7 remote workspace contract before implementation | **Accepted** | §9 |
| C8 operational ownership | **Accepted** | §10 |
| AC-8 re-size on corrected MCP transport | **Accepted** | §3 |

**Unchanged and carried forward from stage-01** (not restated here): Decision Drivers D1–D3; the AC-7 steer/queue source findings (architect: UPHELD to the line); the OD hostability findings (UPHELD); Option A / Option B-invalidated / Option C framing; in-scope/out-of-scope; the settled list; the escalation gates G1–G8 as amended below.

---

## 2. Citation corrections (F4)

| Stage-01 claim | Correction |
|---|---|
| Patch 09 "contains no new files in its modification set" — marked [V] | **Overstated.** I verified only that its *sampled* entries were `--- a/` modifications; I did not enumerate its `new file mode` set. Correct claim, and all that the evidence supports: patch 09's observed hunks edit existing upstream React components and their tests [V]. Its additive/in-place split is now derived by `git apply --numstat --summary` (§0), not asserted. |
| "14 files on disk" — marked [V] | **Imprecise.** The directory holds 18 entries: 14 `.patch` files, 2 `.md` patch stubs (`02-worx-hooks.md`, `03-worx-panels-mount.md`), `anchors.manifest.json`, `materialization.manifest.json`, `residue-exemptions.txt` — i.e. 16 patch-ish artifacts plus 3 manifests/exemptions [V]. The load-bearing figure is unchanged and correct: **12 active** in `active_patch_order`, **1 excluded** (`05-worx-panels-mount.patch`) [V `materialization.manifest.json:7-24`]. |
| "the existing optional `sequence` field on every command" — marked [V] | **False for two commands.** `sessions.stop` and `audit.append`… precisely: `sessions.stop` has `optionalFields: []`, and `audit.append` does carry `sequence` [V `remote-control/constants.ts:96-137`]. Correct claim: `sequence` is optional on **11 of 13** commands; `sessions.stop` is the exception. It remains a usable ordering primitive for the new verbs, but the P6 contract must define ordering explicitly rather than inherit it (§6). |

---

## 3. AC-8 re-sized on the corrected transport (stdio MCP, not ACP)

Stage-01 downgraded the ACP claim but **did not re-cost AC-8 after doing so**. Doing that now, because the original cheapness argument ("ACP is a surface worx already owns and 0.13.1 verified it fully compatible") is void.

**What the corrected transport actually costs.**

| Dimension | Under the (false) ACP premise | Under verified MCP/HTTP reality |
|---|---|---|
| Agent↔OD channel | Reuse owned ACP surface; zero new integration | **New**: a stdio MCP server entry in worx's MCP config. Worx already ships MCP wiring (`test/worx-mcp-server.test.ts`, `test/worx-ide-seed-mcp.test.ts` [V]), so this is configuration + a seed entry, not a protocol build |
| Per-agent adapter | n/a | `od mcp install <agent>` supports 16 targets, **none of them gjc/worx**; `pi` (our lineage ancestor) and `hermes` are present [V OD README]. Either (a) hand-write the config the installer would write — `~/.config/<agent>/open-design.json`-shaped — or (b) upstream a `worx` runtime definition under `apps/daemon/src/runtimes/defs/` (OD documents this as "one runtime definition + registry entry" [V]) |
| IDE↔OD channel | ACP session | **Plain HTTP**: reverse-proxied deep link to the OD web surface, plus a persisted worx-project → OD-project-id mapping. `od project list --json` and `/api/projects/:id/files/...` provide identity [V] |
| Auth | worx office-JWT end to end | **Mismatch.** OD is a single `OD_API_TOKEN` bearer + Basic Auth on the public proxy, no per-user identity [V]. Our reverse proxy must terminate office-JWT and inject the shared token — meaning **OD sees one principal for all 7–9 users** |
| Isolation | per-ACP-session | per-OD-project only. Daemon binds `127.0.0.1`, read-only by default; LAN exposure needs explicit `OD_BIND_HOST` + `OD_ALLOWED_ORIGINS`; connector credentials and live-artifact preview routes stay loopback-only regardless [V] |

**Net re-size.** AC-8 does not get harder in *volume* — it gets harder in *authorization*, and the work moves from "reuse a surface we own" to "build an identity-terminating proxy in front of a system with no identity model." Two of the three AC-8 checkboxes (delegate documents/design; button opens the project page) are cheap. The third — doing it for nine users without collapsing them into one principal — is the actual cost, and it is a G7 decision, not an implementation detail (§10).

**Non-goal restated:** we do not fork OD (~15,086+ files, ~1.7GB, Apache-2.0 [V]).

---

## 4. P0-FREEZE and P1 (C1, C2, F2)

### P0-FREEZE — a committed artifact before any implementation (C1)

Deliverable `docs/PIVOT-FREEZE.md`, committed, containing:

1. **gjc fork point** — exact upstream SHA + tag, resolved fork date, and `git rev-parse` receipt.
2. **ORCA fork point** — exact upstream SHA + tag at latest (the current overlay pin `cf7fb4f7b` is the *old* base and is recorded only as the patch-authoring baseline).
3. **Package versions** — `@gajae-code/coding-agent` and `@gajae-code/agent-core` (both `0.13.1` today [V `package.json` dependencies]), `@gajae-code/natives` and its five per-platform packages, `@colbymchenry/codegraph` `1.5.0` [V].
4. **Derived sentinel** — the literal symbol for the frozen natives version (`__piNativesV0_13_1` at 0.13.1 [V `natives/native/index.js:33`]), and the rule that regenerates it: `"__piNativesV" + version.replace(/[^A-Za-z0-9]/g,"_")` [V `loader-state.js:506`].
5. **License baseline** — the full ancestor list and the vendor licence inventory, as the diffable base for AC-1's LICENSE checkbox.
6. **ORCA patch split** — the `git apply --numstat --summary` table from §0 for all 12 active patches.
7. **G1/G2 decision, signed** — Option A or Option C, and the platform-support scope.

**C1 hard rule adopted:** *Option C is only available as an **operator-signed AC-1 exception recorded in this artifact**. Absent that signature, P1b (native matrix) blocks P1 and Option A is the plan.* Under Option A, P1's exit requires **own-built runtime proofs on both darwin-arm64 and linux-x64** — not one platform plus an assertion about the other.

**F2 — Option C mirroring precondition.** Option C consumes upstream's published `@gajae-code/natives*` at an exact pin that will age. Left as stage-01 wrote it, every install is hostage to upstream npm continuing to serve that version. Therefore, if Option C is signed, these are **preconditions of the exception, not follow-ups**:
- Mirror the exact tarballs for all platform packages we support into our own registry (`npm.pkg.github.com`, already our `publishConfig.registry` [V]), with recorded sha256 per tarball.
- Point the fork's resolution at the mirror, not at upstream, so an upstream unpublish/yank cannot break installs.
- Verify the mirrored artifact exposes the frozen sentinel (`verify:native` already exists as `scripts/verify-native-prebuilt.ts` [V] and is the natural home).
- Record an explicit exit condition for the exception: which event forces P1b to run (first Rust-level change needed, or first platform we must support that upstream stops publishing).

### P1 — cross-repo migration checklist (C2)

Every item below is grounded in the current wrapper manifest [V `package.json`]. Each is a checklist line, not a description.

**Engine fork repo**
- [ ] Repo created under `bworx-io`; `upstream` remote configured; auto-fetch disabled; fork SHA matches P0-FREEZE.
- [ ] Package name/scope decided and applied consistently across `name`, `repository`, `publishConfig`, and every internal cross-package import.
- [ ] `@gajae-code/agent-core` relationship resolved explicitly: fork it too, vendor it, or keep depending on upstream. It is a **separate top-level dependency** alongside `coding-agent` [V `package.json:dependencies`] — leaving it upstream while forking `coding-agent` means the ownership claim is partial and the single-copy assertion spans two scopes.
- [ ] Natives dependency points at the mirror (Option C) or at our own published platform packages (Option A).
- [ ] LICENSE + NOTICE carry every ancestor and ship inside the tarball (assert with `tar -tf`).

**Wrapper repo (`@bworx-io/worx-code` 0.11.0)**
- [ ] `dependencies`: `@gajae-code/coding-agent` and `@gajae-code/agent-core` → fork scope/versions.
- [ ] **`postinstall` removed.** It is currently `bun run brand && bun run acp:mitigate` [V] — deleting the codemods without removing `postinstall` breaks every install.
- [ ] `scripts` removed: `brand`, `acp:mitigate` [V].
- [ ] `files[]` entries removed: `scripts/apply-brand.ts`, `scripts/apply-acp-mitigation.ts` [V]. Keep `scripts/assert-single-gajae-copy.ts` and `scripts/verify-provenance.ts`.
- [ ] Files deleted: `scripts/apply-brand.ts`, `scripts/apply-acp-mitigation.ts`, `src/acp-mitigation.ts`, `src/branding/brand.ts`, `test/brand.test.ts`, `test/acp-mitigation.test.ts` [V all present].
- [ ] `check:single-copy` → `scripts/assert-single-gajae-copy.ts` retargeted to the fork scope; rename if the scope name changes [V].
- [ ] `test:worx` list pruned of the deleted tests (it names `test/brand.test.ts` and `test/acp-mitigation.test.ts` explicitly) [V].
- [ ] `test:engine-drift` reconstituted: it currently names `brand.test.ts`, `acp-mitigation.test.ts`, `worx-share-engine-drift.test.ts`, `engine-mode-contract.test.ts`, `worx-custom-tools-loader.test.ts`, `worx-overlay-tools.test.ts` [V]. Decide per test whether drift-vs-upstream still means anything once we *are* upstream; delete or re-point, do not leave asserting against a dependency that no longer exists.
- [ ] `audit:runtime` (`scripts/audit-runtime-deps.ts`) updated for the new dependency set [V].
- [ ] `verify:native` (`scripts/verify-native-prebuilt.ts`) updated for mirror or own-build [V].
- [ ] `selftest:pack` (`scripts/pack-install-selftest.ts`) updated and **used as the P1 exit harness** [V].
- [ ] `smoke:modes` (`scripts/smoke-engine-mode-passthrough.ts`) re-pointed [V].
- [ ] `exports` map reviewed — `./branding` and `./branding/*` subpaths survive the deletion of `src/branding/brand.ts` only if the remaining files still resolve [V].
- [ ] `bin.worx` → `src/entry.ts` delegation updated to the fork [V].
- [ ] `src/index.ts`, `src/entry.ts`, and every `@gajae-code/*` import callsite migrated.
- [ ] Update/auto-update logic (`test/worx-auto-update.test.ts`, `test/worx-update.test.ts`, `scripts/` update path) re-pointed at the fork's release channel [V].
- [ ] `bun.lock` regenerated; `scripts/verify-release.sh` and release/publish commands updated.
- [ ] Docs updated: `README.md`, `AGENTS.md`, `docs/RUNBOOK-ide-install.md`, `docs/GUIDE-worx-code-user-ko.md`.

**P1 exit proof (revised).** Build a **fresh wrapper tarball** against the fork, install it on a clean machine from the tarball (not from a workspace link), and:
1. `worx code --version` matches the frozen pin;
2. a **real multi-turn task in a real repository** completes, including a session write and at least one natives-backed tool (`applyBashFixups` / owner-only path security [V `natives/native/index.js:34-37`]);
3. **all codemods are absent** — no `postinstall` ran, no `apply-brand`/`apply-acp-mitigation` on disk, and the brand strings are correct anyway;
4. under Option A, steps 1–3 pass on **both darwin-arm64 and linux-x64** with our own `.node`.

---

## 5. P3 — ORCA, re-sequenced and given a real exit gate (F1, C6)

### Re-sequencing (replaces stage-01's "07 first, then 09–14")

The additive/in-place split is a property of *file paths*, not of patch numbers. Work in three classes, derived from the P0-FREEZE numstat table:

- **Class A — additive.** Paths upstream has never had (`src/main/worx-acp/**`, `src/renderer/src/worx-acp/**`, `config/scripts/acp-live-*`, `resources/worx-acp/**`, new `rpc/methods/*`). Port by copy; near-zero conflict surface. Genuinely ordinary source work.
- **Class B — integration seams.** In-place edits to upstream files that exist to *mount* Class A: `src/main/index.ts`, `src/main/ipc/*`, `src/main/runtime/rpc/{core,dispatcher,methods/index}.ts`, `src/preload/*`, `package.json`, `config/vitest.config.ts`. Re-express intent against the new tree. `pnpm-lock.yaml` is **regenerated, never re-applied**.
- **Class C — product surface re-implementation.** Everything that changes how the IDE looks or behaves: patch 07's `App.tsx` (~1,650 diff lines), `orca-runtime.ts` (~2,140), `session-tabs.ts` (~1,600), `tabs-hydration.ts` (full-file rewrite), the ~60 renderer components, the six i18n bundles — **plus the whole g022 series 09–14**. This class is design work with visual acceptance, not patch application.

**The stage-01 sequencing error is thereby removed:** patch 07 contributes to all three classes, so "do 07 first" was never a coherent instruction. Class C is the critical path and must start early, not after Class A "proves" the estimate.

Also in P3, unchanged: delete `rebrand.sh`, `cleanroom.sh`, the patch series, `anchors.manifest.json`, `materialize-overlay.mjs`; fix the two structurally-unclosable residues in source (artwork excluded by the text-only rebrand filter; `<title>Orca Web</title>` as an unquoted text node) [S]; close worx-ide #36 and #40 preserving #40's proven negative.

### P3 exit gate (C6) — the stated risk becomes the gate

**Candidate identity:** ORCA fork SHA, worx-ide fork SHA, build artifact sha256, recorded in the evidence bundle.

**Host and operator:** a machine with a real display and a real browser, operated by a named human. **[X] This host cannot run it — the browser tool cannot start a worker here. This plan offers no substitute and no code-level assertion in its place.**

**Viewports** (chosen because Class C *is* the responsive series): 1280×800, 1440×900, 1920×1080, 2560×1440, and one narrow ≤1024 width. Each captured.

**Representative workflows per viewport**, drawn from the surfaces patches 09–14 actually touch [V]: (a) shell + sidebar navigation open/collapse/resize; (b) chat + terminal pane split and drag; (c) dialogs and command palette open/close; (d) product pages; (e) landing/onboarding and editor; (f) localized responsive controls in Korean.

**First-paint procedure** (the flash is a first-frame artifact and cannot be caught by a settled screenshot): launch cold with the profile's persisted locale set to Korean, capture **video or a frame sequence from process start**, and assert on the frames — (1) no ORCA wordmark, icon, or artwork in any frame; (2) `<title>` never reads `Orca Web`; (3) first painted text is Korean, with no English-then-switch transition.

**Rebrand/icon/title states enumerated:** window title, taskbar/dock icon, favicon, in-app logo, About dialog, installer/DMG artwork, `web-index.html` `<title>`.

**Durable artifacts:** per-viewport screenshots, the first-paint frame sequence, a signed checklist naming operator and candidate SHA, filed under `docs/evidence/`.

**Pass condition:** every workflow renders correctly at every viewport **and** the first-paint sequence is clean. A green `tsc` is not evidence for any part of this gate.

---

## 6. P6 — the collaboration bridge, designed (C3, F3)

Stage-01 specified schemas and policy but not the bridge. Specified now.

**Engine endpoint.** `relay-client.ts` today speaks WSS to the office relay with subprotocol `worx.remote-control.v1` [V]. The queue operations live on the engine's SDK control/query surface: query `queue.messages.list`; control `queue.message.{remove,move,update}`; plus `queue.{steering,follow_up,interrupt}_mode.set` [V `operation-registry.ts:84-86,109-111,153`, `dispatch.ts:210-215,260-268`]. The daemon therefore terminates relay commands and re-issues them against the local engine session's SDK surface — **the relay does not gain a second transport, and the engine does not gain a network listener.**

**Session-ID mapping.** Relay commands already carry `hostId` + `sessionId` [V field contract]. The daemon maintains `relaySessionId → localEngineSessionId`; the engine's queue-entry ids remain its own opaque `steer:<seq>` / `followUp:<seq>` grammar [V `agent-session.ts:9945-9947`] and are **never** synthesized client-side.

**Authenticated actor propagation.** The actor is the relay grant's `actor_id` (grant records already require `actor_id` and `actor_email_hash`, token storage hashed-only [V `REMOTE_CONTROL_STORAGE_CONTRACT`]). The daemon attaches it to every enqueue; the engine persists it on the queue entry (the P1-dependent engine change). **The client never supplies its own actor id.** `job-manager.injectMessage(..., { fromAgentId })` [V `async/job-manager.ts:136-141`] is the existing precedent for an attributed injection and is the shape to follow.

**Lease-exempt enqueue boundary.** Exempt: `queue.enqueue`, `queue.list`, and self-scoped `queue.remove`/`queue.update`/`queue.move`. **Still lease-bound:** `terminal.input`, `terminal.resize`, and — per **F3** — `approval.resolve`. Rationale for F3: an approval is a single irreversible authorization on behalf of the session, not a queued intent; making it lease-exempt alongside enqueue would let any collaborator approve a tool call another user's turn triggered. **G6 is hereby widened to cover both cross-actor queue mutation and cross-actor `approval.resolve`.**

**Handlers.**
- `queue.list` → engine `queue.messages.list`; returns `{id, mode, text, actorId, sequence}[]`.
- `queue.enqueue` → `sendUserMessage(text, { deliverAs })` with actor attached; `deliverAs ∈ {steer, followUp, nextTurn}` [V `types.ts:378`].
- `queue.remove` → `queue.message.remove`; foreign-actor per policy.
- `queue.update` → `queue.message.update` (engine implements it as remove-then-resend preserving the queue of origin [V `runtime-init.ts:434-449`]).
- `queue.move` → `queue.message.move`; **elevation-gated symmetrically with remove/update**, closing the stage-01 asymmetry [V `allowlist.ts:25-26` gates remove+update only].

**Total ordering, tie-break, replay.** Ordering key is `(engineSequence, actorId)` — engine sequence first because the engine is the serializer; `actorId` lexicographic only as tie-break for entries the engine reports at equal sequence. `sequence` on the relay command is a client-side idempotency/ordering hint and **is not authoritative** (and, per F4, is not even present on all commands). On reconnect the client discards local queue state and re-reads `queue.list`; **replay is a full re-read, never a delta merge.**

**Response/event/failure semantics.** Every mutation returns the post-mutation list revision so clients converge without polling. Queue changes emit an event to all attached clients of the session. Failures map to the engine's existing codes: `resource_gone` when the entry vanished (already engine behaviour [V `runtime-init.ts:420-422`]), `invalid_position` for a bad move [V], `invalid_message` for a malformed update [V], plus a new `forbidden_actor` for a denied cross-actor mutation. A mutation racing the agent's consumption of that entry resolves as `resource_gone` — never as a silent no-op.

**Audit.** New `queue.*` events appended to `remote-control-audit.jsonl` alongside `share.create`, `share.revoke`, `session.attach`, `writer-lease.transfer` [V `constants.ts:42-47`].

**A14 / E5 extended.** Two humans, two devices, one session, and the run must exercise: **list** (both see both entries with correct authorship), **edit** (one edits their own; the other sees the revision), **cancel** (self succeeds; foreign follows the decided policy and returns `forbidden_actor` if denied), **ordering** (agent consumes in the defined total order; both transcripts identical), **replay** (one client disconnects mid-turn, reconnects, converges via full re-read), and **`terminal.input` + `approval.resolve` remain lease-bound** — proven by a non-lease-holder attempting each and being refused.

---

## 7. Falsifiable behaviour for AC-4/5/6/8 (C4)

**AC-4 — deterministic public-surface fixtures.** For each ported behaviour, a fixture and a stated expected outcome:

| Behaviour | Fixture | Expected |
|---|---|---|
| Cache-aware timeout | identical prompt twice, second within cache window | second call's effective timeout differs per the ported rule; recorded value asserted |
| Cache-hit metric | same pair | hit count increments exactly once |
| Miss notice | prompt mutated by one token | miss notice emitted once, with the miss reason |
| Parallel siblings | one turn issuing 3 independent read-only tools | all three start before any completes; wall clock < serial baseline |
| File-mutation queue | one turn issuing 2 writes to the same path | writes serialize; final content equals the later write; no interleaving |
| Eager tool-input streaming | tool with a large argument payload | partial input observable before the argument is complete |
| Strict flag | tool call with an out-of-schema argument | rejected at the boundary, not passed through |
| Grammar flag | tool with a constrained grammar | non-conforming output rejected |
| RPC | live call against the recovered surface | returns; `steeringQueueDepth`/`followupQueueDepth` reflect real queue state [V `owner.ts:415`] |

**AC-5 — the demand gate, adapted and cited in full.** Reuse the ralplan demand gate verbatim: cohort of exactly 2 named users plus one pre-session alternate; ordered first-match-wins rows evaluated in the fixed order **Void → Short run → Inconclusive-density → Negative → Positive → Mixed-residual**; exact-rational comparison (no floating point); half-open bounds; automatic pause; a single extension [S, gate definition is spec-carried]. **Promotion rate is defined here so it is measurable:** `promotions_accepted / skills_authored_automatically` over the window, where `skills_authored_automatically` counts append-only curator writes and `promotions_accepted` counts personal→team promotions approved by a human. Denominator zero ⇒ the authoring gate reports Void, not success.

**AC-6 — both hosts, both transports, all three volume classes.**
- Workspace hosts: the same task runs on `.14` **and** `.94`; both results recorded.
- Transports: git-first proven with a repo-backed project; rsync fallback proven by making git unavailable (not by a config flag alone).
- Volume class 1 (OAuth pool): read attempt from inside the sandbox **must fail** — a negative test, executed live.
- Class 2 (skills/agents): mount is read-only or baked; a write attempt fails.
- Class 3 (records): records reach the store **only** via API/MCP; no filesystem path from the sandbox to the record store.
- Config isolation: `GJC_CONFIG_DIR` stripped, proven by starting two users' sandboxes and showing distinct session indexes (the hazard is that sharing it silently shares the index across all nine users [S], and `acp-environment.ts:6` strips only `GJC_CODING_AGENT_DIR` [S]).

**AC-8 — documents/design/co-editing with two users.** Two users open the same OD project from their own worx IDE sessions; both create/edit; both observe the other's persisted result after reload. Persistence asserted against OD's own store via `od project list --json` / `/api/projects/:id/files/...` [V], not against the browser DOM. Given §3, the test must also record **which OD principal each user's request arrived as** — under the shared-token model the expected answer is "the same one", and that expectation is the G7 evidence.

---

## 8. P2 fault injection and rollout controls (C5)

**Stage-01 defect:** it conflated two opposite tests. "Force-kill the provider, observe fallback" and "`Restart=always` removes the exit-143 trap" cannot both be observed in one action — a unit that restarts immediately never stays down long enough for the client to fall back. Separated:

- **Test A — deliberate hold-down.** Stop the provider *and inhibit restart* (mask the unit, or stop with restart disabled) for a hold-down window long enough to exceed the client's retry budget. Observe: automatic transition to local OAuth, no manual intervention, and continued record capture. Record hold-down duration explicitly.
- **Test B — recovery.** Restore restart policy, kill the process **without** masking, and observe `Restart=always` bringing it back — including the exit-143 path, since the current failure is that `worx-auth-gateway` treats manual stop's exit 143 as clean so `Restart=on-failure` never fires [S]. Test B must specifically kill in a way that produces 143.
- **Test C — return path.** After recovery, the client returns to provider-backed operation and records continue.

**Record binding.** Records are bound to identifiers and counts in the store, not to log lines: capture `(record_id, session_id, created_at)` for the last N before hold-down, all records during, and the first N after; assert monotonic ids, no gap, no duplicate, and a count that matches the work performed. "Records kept flowing" without ids is not evidence.

**Rollout controls (P2, one-user canary on `.94`):** canary duration ≥ one full working day; minimum traffic ≥ a stated number of real turns; thresholds — zero unexplained 502s, fallback-transition count within a stated bound, p95 latency within a stated multiple of baseline; **rollback trigger** — any threshold breach or any record gap; **rollback procedure** — restore the three-service chain from the recorded prior unit files and restart explicitly (mandatory after maintenance because of the exit-143 trap [S]); **receipts** — candidate SHA, unit file hashes, image digest, and the `.14` provisioning evidence.

**Same controls at appropriate scale** for P5 (canary project + one user), P6 (two named users, one session, bounded window), P8 (one project, one user, before any second user is admitted). **No production `ide.byteworx.dev` cutover is in scope of this plan's approval — it is separately operator-approved (G8).**

---

## 9. P5 — remote workspace contract, specified before assignment (C7)

No executor should invent these. `sync-remote` and `local-sync` do not exist today [S].

- **Direction and arguments.** `local-sync <host> <project>` pulls remote→local; `sync-remote <host> <project>` pushes local→remote. Direction is in the verb; there is no `--direction` flag and no implicit "whichever is newer".
- **Host/project registry.** Hosts and projects resolve from the existing remote-control registry surface (`hosts.list`, `projects.list` [V `constants.ts:83-84`]) extended with a sync-target record; a project not in the registry is an error, never an implicit create.
- **Git-first eligibility.** Git path requires: a git worktree, a configured remote both ends can reach, and a clean-or-declared working tree. Otherwise fall back.
- **Rsync fallback trigger.** Not a repo, no reachable remote, or a git operation failing for a non-conflict reason. A **conflict is never a fallback trigger** — falling back to rsync on conflict would silently overwrite.
- **Dirty / untracked / deletion / conflict policy.** Dirty tree: refuse by default, `--allow-dirty` stashes and restores. Untracked: excluded by default, `--include-untracked` opts in. Deletions: propagated only with `--delete`, never by default. Conflict: **stop and report**; never auto-resolve, never `-X ours/theirs`. This aligns with the accepted non-goal that cross-session same-file conflicts are the user's problem [S].
- **Atomicity and rollback.** Receive into a staging path, then swap; a failed transfer leaves the previous state intact. Record a pre-sync ref (git) or a snapshot manifest (rsync) sufficient to restore.
- **Auth.** Per-user SSH certificates via the office CA (`TrustedUserCAKeys`), running as the user — never as root [S runbook lane]. rsync runs `--no-owner --no-group`; group inheritance comes from setgid dirs.
- **Sandbox contract.** Podman image identified by digest; mounts declared per the three volume classes (§7) with the OAuth pool absent entirely; network egress default-deny with an explicit allowlist; no host PID/IPC namespace sharing.
- **Target repos and files.** New code in the wrapper under `src/remote-control/` and `src/cli/`; new commands registered in the wrapper CLI; contract constants extended in `src/remote-control/constants.ts`; tests added alongside the existing `test/local-remote-control-*.test.ts` family [V].
- **Canary.** One user on `.94`, per §8 rollout controls.

---

## 10. Operational ownership (C8)

**Touched-repo verification/receipt matrix.** Five existing repos plus two new forks. For each, the plan requires a named local gate and a receipt artifact, since there is **no CI and no branch protection anywhere** [S] and GitHub Actions was removed 2026-07-27 for exhausted minutes [V `verify-release.sh:4-6`]:

| Repo | Gate | Receipt |
|---|---|---|
| `worx-code-wrapper` | `bash scripts/verify-release.sh` + `selftest:pack` [V] | gate summary + tarball sha256 |
| engine fork (new) | fork's own build/test + `verify:native` | build log + `.node` sha256 + sentinel check |
| ORCA fork (new) | build + the §5 visual gate | evidence bundle under `docs/evidence/` |
| `worx-ide` | build + first-paint capture | capture + candidate SHA |
| office / runtime / mobile (remaining three) | existing local gates | per-repo gate summary |

**Upstream-sync rehearsal (required once, before P1c is declared done).** Pick one real upstream change, apply it under the instruction-only rule, and drive it **all the way to a published, installable candidate** — fork build → wrapper tarball → clean-machine install → the P1 real-task proof. A sync that stops at "merged and tsc passes" has rehearsed nothing.

**Cadence: measure, do not repeat.** Stage-01 carried "~0.9 releases/day" as [S]. **Measure it** during P0-FREEZE from the upstream repo's own release/tag history over a stated window (e.g. releases in the trailing 90 days ÷ 90), record the window and the figure in `PIVOT-FREEZE.md`, and size the sync burden from that number. Until measured, no schedule may depend on it.

**G7 — concrete OD exposure options.** Decide between:

| | **OD-Exp-1: shared token behind an identity-terminating proxy** | **OD-Exp-2: per-user OD instance** |
|---|---|---|
| Authorization | our reverse proxy validates office-JWT, injects the single `OD_API_TOKEN` [V] | per-user token, per-user container |
| Isolation | per-OD-project only; all users are one OD principal | per-user filesystem and DB isolation |
| Rotation | rotate one token; all users cut over at once | rotate per user independently |
| Rollback | disable the proxy route; OD returns to loopback-only [V default bind `127.0.0.1`] | stop the user's instance |
| Cost | one instance | N instances, N× storage and memory |
| Negative test | an unauthenticated request to the OD host is refused **and** cannot reach loopback-only routes (connector credentials, live-artifact preview) [V] | additionally: user A's token cannot read user B's project |

Both options must pass their negative test **before any second user is admitted**. Recommendation deferred to the operator; the plan does not pick.

---

## 11. Pre-mortem, rewritten (S3 replaced; S1/S2 carried forward)

**S1 — "The fork shipped, then nothing could be released."** Carried forward unchanged from stage-01, and now additionally guarded: under C1, Option C requires a signed exception, so the linux-x64 gap cannot be papered over by defaulting; and F2's mirroring precondition means Option C does not merely relocate the dependency risk to upstream npm.

**S2 — "The provider collapse was fine until the day it wasn't."** Carried forward, and now the AC-2 boundary note is a named deliverable with a threat model, plus §8 separates the two fault-injection tests so a passing canary actually demonstrates fallback rather than fast restart.

**S3 (rewritten) — "The plan's own sizing was the defect."** The original S3 imagined a team over-generalizing from patch 07's clean port. That premise was mine and it was false, which makes the real scenario worse and more likely: **a sizing error propagates into sequencing, and the sequencing hides the risk.** Concretely — stage-01 told P3 to do 07 first because it was "additive", then treat 09–14 as the hard part. An executor following that lands Class A quickly, reports the estimate as validated, and schedules Class C last. Class C is ~60 renderer components, `App.tsx`, `orca-runtime.ts`, `session-tabs.ts`, a full-file `tabs-hydration.ts` rewrite and six locale bundles [V] — against a tree 1,227 commits newer. It slips; the visual gate is the only thing that would catch a partial landing; the visual gate cannot run on the dev host [X]; so it is skipped "until the end", and the end is where the slip already is. Nine users get a broken responsive shell.
*Earliest signal:* anyone citing a patch-level file count that did not come from `git apply --numstat`.
*Prevention:* §0 makes numstat-derived splits a P0 deliverable and bans sampled figures; §5 puts Class C on the critical path from the start; §5's gate names a capable host and a human operator so its absence is conspicuous; and this plan states its own falsified claim in full rather than quietly amending it.

---

## 12. Risk register — deltas from stage-01

| # | Change |
|---|---|
| R3 | **Rewritten and raised.** Was "09–14 responsive intent silently lost". Now: *ORCA Class C (patch-07 in-place + 09–14) re-implementation is under-sized because sizing was sampled rather than enumerated.* Mitigation: numstat-derived split in P0-FREEZE; Class C on the critical path; §5 exit gate. **Severity Critical.** |
| R13 | **New (F2).** Option C leaves installs dependent on upstream npm continuing to serve an aging exact pin. Mitigation: tarball mirroring to our registry with recorded sha256 as a precondition of the exception; stated exit condition forcing P1b. Severity High. |
| R14 | **New (F3).** Lease-exempt enqueue accidentally exempts `approval.resolve`, letting any collaborator authorize a tool call from another user's turn. Mitigation: `approval.resolve` explicitly lease-bound; G6 widened; proven in A14/E5. Severity High. |
| R15 | **New (§3).** AC-8 collapses 7–9 users into one OD principal. Mitigation: G7 with two costed options and mandatory negative tests before a second user. Severity High. |
| R16 | **New (C5).** A P2 canary passes because the provider restarted fast, not because fallback worked. Mitigation: hold-down and recovery separated into Tests A/B/C with an explicit hold-down duration. Severity High. |
| R17 | **New (C8).** An upstream sync is declared safe on a merge that was never published or installed. Mitigation: one full rehearsal to an installable candidate before P1c is done. Severity Medium. |
| R7 | **Amended.** Sync burden may not be sized from an unmeasured cadence; measurement is a P0-FREEZE deliverable. |
| R1, R2, R4–R6, R8–R12 | Carried forward unchanged. |

---

## 13. Sequencing (updated)

```
P0-FREEZE (committed artifact: SHAs, versions, sentinel, licences,
           numstat patch split, measured cadence, signed G1/G2)
   │
   ├─> P1 Engine ownership (cross-repo checklist §4; tarball-install exit)
   │      ├─> P1b Natives  [blocking unless Option C is signed; mirroring is
   │      │                 a precondition of the exception]
   │      ├─> P1c Sync procedure + one full published-candidate rehearsal
   │      ├─> P4 Feature merge (fixtures §7)
   │      ├─> P7 Self-improvement (instrument)
   │      └─> P6 Collaboration (bridge §6)  ← also needs P5
   │
   ├─> [.14 Tier 1 → Tier 2]  ──> P2 Provider (§8) ──> P7 (measure)
   │                          └─> P5 Remote workspace (contract §9) ──> P6
   │
   └─> P3 ORCA — Class A / B / C in parallel, C on the critical path
          └─> P8 open-design button (re-sized §3; G7 before user 2)
```

Ordering rationale is unchanged from stage-01 except that **Class C now starts at P3 open rather than after Class A**, because the evidence that justified deferring it was the claim I retracted.

---

## 14. Handoff

- **`executor`** — P0-FREEZE mechanical derivation (numstat table, cadence measurement, mirroring); P1 migration checklist; P3 Class A and Class B; P6 relay verbs and handlers; P8 OD deploy and button.
- **`architect`** — read-only: P3 Class C scope before code; the AC-2 boundary threat model; the podman/volume design; G7 option analysis.
- **`critic`** — this revision before P1 starts; again at the P2 boundary.
- **`ultragoal`** — after P0-FREEZE is committed and signed, not before.
- **Operator only** — G1–G8 (G6 widened to `approval.resolve`; G7 now has two costed options), plus every [X] proof: A6, A7, A8, A12, A14, A17, and the P3 visual gate.

**Unverified-here, carried forward and flagged:** the exact patch-07 modified-file count (floor ≥130, tool-truncated [T] — derive by numstat); "174 patch-touched files changed upstream" and the 1,227-commit distance (need an upstream fetch); gjc release cadence (now a P0 measurement, no longer citable as ~0.9/day until measured); the engine-feature status of `auth-broker`/`auth-gateway` (spec-established, given as settled ordering).
