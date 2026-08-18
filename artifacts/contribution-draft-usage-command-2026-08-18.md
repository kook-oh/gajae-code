# `/usage` regression: reset countdown and per-account identity are lost in the multi-account panel

> Contribution draft prepared from contribution-prep bundle `.gjc/contribution-prep/2026-08-18T05-03-04-592Z/`
> (source session `01a0133f-2aad-7000-aa94-d7e6b06a2b03`, git head `5605594050d77320e63d4ce5cafa02cf9e59e096`).
> No PR/issue/branch created. Working tree was clean (`changed-files.txt` and `git-diff.patch` are empty) and the
> redacted transcript window was captured empty, so everything below is grounded in current source plus a
> reproduction harness run against the shipped renderer.

## Problem summary

`/usage` used to read as a usage *dashboard*: a rendered panel per account with an explicit
"time until reset" readout. In the current build the panel degrades badly as soon as more than one
credential is present — which is exactly the multi-account setup the command exists for.

1. **The `resets in …` line is suppressed for every multi-account window.**
   `renderUsageReports()` only emits the reset line when a window has a single limit:
   `packages/coding-agent/src/modes/controllers/command-controller.ts:1859`
   `const resetText = sortedLimits.length <= 1 ? resolveResetRange(sortedLimits, nowMs) : null;`
   With 2+ accounts the dedicated line disappears entirely, even though `resolveResetRange()`
   (same file, `:1690`) already knows how to render a range (`resets in 2h–5d`).

2. **The only surviving reset signal is a parenthetical suffix that competes with the account label
   for column width.** `formatAccountHeaderRow()` (`:1614`) packs `label + (reset)` into one bar-width
   column; `resolveColumnWidth()` (`:1740`) shrinks columns down to `BAR_WIDTH_MIN = 4` under pressure,
   and `truncateJobLabel()` then eats the account identity.

3. **Truncated labels make per-account attribution impossible.** Real credential emails share a domain
   and often a prefix, so they collapse to visually identical stubs (`user0.longmail@exa…`).

4. **Reset granularity is coarse and relative-only.** `formatDuration()`
   (`packages/coding-agent/src/slash-commands/helpers/format.ts:5`) rounds to a single unit above 48h,
   so a 7-day window reads `7d` whether 6.6 or 7.4 days remain. There is no absolute reset timestamp
   anywhere in the panel, which is what "how many days until reset" actually needs.

5. **Non-TUI surfaces have no panel at all.** `/usage` in ACP/SDK/Telegram mode goes through
   `buildUsageReportText()` (`packages/coding-agent/src/slash-commands/helpers/usage-report.ts:72`),
   a flat code block. And when `fetchUsageReports` is missing or returns `[]`, the TUI path replaces the
   entire panel with a single warning line (`command-controller.ts:632` "Usage reporting is not configured
   for this session.", `:644` "No usage data available."), which reads to a user as "the UI is gone".

## Reproduction / context

- Platform: darwin arm64, bun 1.3.14, cwd `~/bworx/worx-code`, head `5605594050d77320e63d4ce5cafa02cf9e59e096`.
- User-visible repro: run `/usage` in an interactive session with **more than one** provider credential.
- Deterministic harness (temporary test file, removed after capture) calling the exported renderer directly:
  `renderUsageReports(reports, theme, NOW, width)` from
  `packages/coding-agent/src/modes/controllers/command-controller.ts`, with 2-window (5h/7d) Anthropic
  reports per account.

Single account, width 120 — reset line present:

```
✔ Claude 5 Hour
  user0.longmail@exa… (2h)
  ██▒░░░░░░░░░░░░░░░░░░░░░ 90% free
  resets in 2h
```

Three accounts, width 120 — reset line gone, labels truncated:

```
✔ Claude 5 Hour
  user2.longmail@exa… (2h) user1.longmail@exa… (2h) user0.longmail@exa… (2h)
  ███████░░░░░░░░░░░░░░░░░ ████▓░░░░░░░░░░░░░░░░░░░ ██▒░░░░░░░░░░░░░░░░░░░░░ 80% free
```

Five accounts, width 80 — account identity is unrecoverable:

```
✔ Claude 5 Hour
  user4.l… (2h) user3.l… (2h) user2.l… (2h) user1.l… (2h) user0.l… (2h)
  ██████▒░░░░░░ █████░░░░░░░░ ███▓░░░░░░░░░ ██▒░░░░░░░░░░ █░░░░░░░░░░░░ 70% free
```

Note also that the aggregate trailing figure (`80% free`) is an *average across accounts*
(`formatAggregateAmount()`, `:1667`), so once the per-account columns become unreadable the only legible
number describes no account in particular.

## Proposed fix

Layout-level; no protocol or schema change required.

1. **Always render reset information per window.** Drop the `sortedLimits.length <= 1` gate at
   `command-controller.ts:1859` and always call `resolveResetRange()`. It already collapses to a single
   value when all accounts share a reset instant and renders `min–max` otherwise.
2. **Stop making the reset suffix fight the account label.** Move the per-account reset out of the bar
   column: keep the header row for identity only, and render a dedicated dim reset row (aligned to the same
   columns) when accounts have divergent resets.
3. **Preserve account identity under truncation.** Truncate emails from the middle or on the local part
   (`user0…@example.com`) instead of right-truncation that discards the discriminating characters; when the
   column budget drops below a legible threshold, switch to a stacked one-account-per-row layout instead of
   a squeezed grid.
4. **Make the countdown answer "how many days".** Emit a two-unit duration for windows ≥ 48h (`6d 14h`) and
   append the absolute local reset time (e.g. `resets 2026-08-25 09:00`). Add a dedicated formatter rather
   than changing `formatDuration()`, which is shared with job/elapsed rendering.
5. **Give the text surface the same content.** Mirror per-account rows and reset lines in
   `buildUsageReportText()` so ACP/SDK/Telegram `/usage` is not strictly poorer.
6. **Make the empty states explain themselves.** Replace the bare warnings at `command-controller.ts:632`
   and `:644` with messages naming the cause (no OAuth/subscription credential configured; provider returned
   no limits) so an empty result is distinguishable from a broken UI.

Items 1–4 are the minimum that resolves the reported regression; 5–6 close the surface gap.

## Affected files

| File | Change |
|---|---|
| `packages/coding-agent/src/modes/controllers/command-controller.ts` | Reset-line gate (`:1859`), `resolveResetRange` (`:1690`), `formatAccountHeaderRow` (`:1614`), `formatResetShort` (`:1607`), `resolveColumnWidth` (`:1740`), empty-state messages (`:632`, `:644`) |
| `packages/coding-agent/src/slash-commands/helpers/format.ts` | New multi-unit / absolute reset formatter alongside `formatDuration` (`:5`) |
| `packages/coding-agent/src/slash-commands/helpers/usage-report.ts` | Text-mode parity for per-account rows and reset lines (`:32`, `:72`) |
| `packages/coding-agent/test/usage-report-columns.test.ts` | Extend with reset-line and truncation assertions |

Not touched: `packages/ai` usage fetching (`AuthStorage.fetchUsageReports`), the `UsageReport`/`UsageLimit`
shape, and `/v1/usage` broker + gateway responses. Everything the fix needs is already present in
`limit.window.resetsAt` and `report.metadata.email`.

## Tests to run

```sh
bun test packages/coding-agent/test/usage-report-columns.test.ts
bun test packages/coding-agent/test/status-line-usage.test.ts
bun --cwd=packages/coding-agent run check
bun run lint
```

New coverage to add in `usage-report-columns.test.ts`:

- a multi-account window still emits a `resets in …` line (regression lock for the `<= 1` gate);
- divergent resets render the `min–max` range; identical resets collapse to one value;
- account labels stay mutually distinguishable at width 80 with 5 accounts;
- `≥ 48h` windows render day granularity plus an absolute reset marker.

## Uncertainty / remaining risks

- **The originating transcript was captured empty**, so the reporter's exact terminal width, provider mix, and
  credential count are unknown. The reproduction above derives from the shipped renderer, not from the
  reporting session. If the user saw *zero* output, the trigger is more likely the `fetchUsageReports`
  null/empty path (`command-controller.ts:631`, `:643`) than the layout gate — item 6 covers that case, but
  confirming which one fired needs the original session or a screenshot.
- **No upstream history to bisect.** Repo history is squashed at `19f8c1f43` ("Establish the OMP baseline"),
  the single commit touching `resolveResetRange` / `formatResetShort` / the `<= 1` gate, so the
  "worked before" build cannot be identified from this checkout. The regression claim is taken from the reporter.
- **Layout risk.** A reset row per window adds one line per limit group; on very small terminals that trades
  vertical space for legibility. The stacked fallback (item 3) should be width-gated so wide terminals keep the
  compact grid.
- **`formatDuration` is shared** with job/elapsed rendering; changing it in place would alter unrelated UI, hence
  the separate formatter.
- **Aggregate `% free` semantics** (average across accounts) are arguably also misleading, but changing them is a
  separate behavioral decision and out of scope here.
