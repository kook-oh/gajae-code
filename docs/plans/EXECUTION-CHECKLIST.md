# 엔진 피벗 실행 체크리스트 (정본)

승인 계획: `docs/plans/ENGINE-PIVOT-PLAN.md` (rev.6) · 프로그램 지도: `docs/PROGRAM.md`
최종 갱신: 2026-08-18 · 기준 커밋: `10f3bd91f`

> **자동 실행 규약.** 각 슬라이스는 *독립적으로 착수 가능하고, 명시된 수용 명령으로 스스로 통과/실패를 판정한다*.
> 에이전트는 순서대로 하나씩 잡아 실행하고, 슬라이스 완료 시 이 문서의 체크박스를 같은 커밋에서 갱신한다.
> **전역 규칙**: ① 커밋 전 반드시 `bun --cwd=packages/coding-agent run check` 통과 ② 표적 테스트만 실행(전량 금지)
> ③ 보존 표면 S1(Coordinator MCP)·S2(ACP)·S3(헤드리스 CLI `-p`/`--mode rpc`) 의미론 유지, `Mode`의 `rpc` 제거 금지
> ④ 소비자 계약(`package.json`의 `gjc` 매니페스트 키, ACP `_meta.gjc`, codex-handoff 영속 필드)은 **건드리지 않는다**
> ⑤ `docs/plans/*`·`docs/PROGRAM.md`는 계획 변경 시에만 갱신 ⑥ natives는 플랫폼당 **직렬** 빌드(동시 실행 시 실패).

## 완료 (증거 있음)

- [x] **P0-FREEZE** — `docs/PIVOT-FREEZE.md` 11절(포크 신원·ORCA 지점·2플랫폼 동결·sentinel·라이선스 4라인 시정·numstat·cadence·게이트 서명·스윕 베이스라인·보존 표면·비서명 결정)
- [x] **natives 자체 빌드 2플랫폼** — darwin-arm64(46.1MB)·linux-x64-modern(51.1MB), sentinel `__piNativesV0_13_1`, 바이너리 `GJC_` 잔존 0
- [x] **리네임 S1: 패키지·CLI 신원** — `@bworx-io/worx-code`, `worx` 바이너리
- [x] **리네임 S2: 행동 식별자** — MCP 툴명 `worx_*`, 세션커맨드 검증기, 와이어 프리페이스, 스윕 테스트(`scripts/worx-behavior-identity.test.ts`)
- [x] **리네임 S3: 환경변수** — `GJC_*` → `WORX_*` 전수(프로덕션·테스트·문서·Rust 크레이트)
- [x] **리네임 S4: 경로·플러그인** — `.gjc/`→`.worx/`, `~/.gjc`→`~/.worx`, `plugins/worx-code`, `docs/MIGRATION-worx-rename.md`
- [x] **보존 표면 S3 복원** — 헤드리스 JSONL(`--mode rpc`) 및 테스트
- [x] **CI 제거** — GitHub Actions 워크플로 삭제 + 레포 레벨 `enabled=false`(과금 중단)
- [x] **리네임 S5: 워크스페이스 스코프 통일** — `@gajae-code/*` → `@bworx-io/worx-*` (아래 슬라이스 5 참조)

---

## 슬라이스 5 — 워크스페이스 스코프 통일 `@gajae-code/*` → `@bworx-io/*` ✅

가장 큰 잔여 리네임이었다. 1,616파일 · 8,318개 스코프 리터럴을 정확 문자열(`@gajae-code/`) 매칭으로 치환.

- [x] 패키지명 변경: `agent-core` `ai` `bridge-client` `stats` `tui` `utils` + 벤치마크 2종 → `@bworx-io/worx-*`
- [x] 전 import 경로 갱신 + 루트 catalog 갱신 + `bun.lock` 재생성
- [x] `packages/gajae-code/` 빈 잔재 디렉터리 제거
- [x] **미지원 플랫폼 패키지 삭제** (G2: 2종만 지원) — `natives-darwin-x64` `natives-linux-arm64` `natives-win32-x64`
      (`packages/natives` `optionalDependencies`와 `loader-state.js` `SUPPORTED_PLATFORMS`는 이미 2종이었음)
- [x] 정규식·경로·npmrc 형태로 숨어 있던 스코프(`@gajae-code\/…` 이스케이프, `node_modules/@gajae-code`,
      `@gajae-code:registry`, `gajae-code-*.tgz` pack 파일명) 갱신 — 문자열 스윕이 못 잡던 **기능성** 지점
- [x] 스코프 게이트 재정렬: `rebrand-inventory`(scope/bin/root name + pivot 문서 allowlist), `verify-g002-gates`,
      `release-evidence`의 `PUBLIC_PACKAGE_DEFINITIONS` 이름순 재정렬, `worx-stats` bin
- [x] 수용: `bun install && bun --cwd=packages/coding-agent run check` 통과 ·
      `bun run check:ts`는 기존 실패(`sdk-client.test.ts` 5건, HEAD 동일)를 제외한 전 게이트 통과 ·
      `git grep -l '@gajae-code/' -- packages scripts` = **릴리스된 CHANGELOG 6개만** (아래 유지 근거)

**의도적 잔존 (스윕 대상 아님)**

| 대상 | 근거 |
|---|---|
| `packages/*/CHANGELOG.md` 6개의 릴리스 섹션 | 과거 사실 기록. `rebrand-inventory`의 `attribution-and-license`, `verify-gjc-sdk-rename`의 `isAllowed()`가 이미 changelog를 면제한다. `## [Unreleased]`에 리네임 항목을 추가했다. |
| `legacy-pi-compat.ts`의 `PI_SCOPE_ALIASES` 내 `"gajae-code"` | **소비자 계약.** 서드파티 플러그인(plannotator·runfusion·juicesharp)이 구 스코프를 peerDependencies로 선언한다. 별칭 입력은 유지하고 canonical 타깃만 `@bworx-io/worx-*`로 옮겼다. |
| `pi-scope-aliases.test.ts` / `worx-public-identity.test.ts` / `verify-gjc-sdk-rename.ts`의 구 스코프 리터럴 | 위 계약과 "구 이름 부재" 음성 단정을 지키려면 구 문자열이 필요하다. 레포 선례(`rebrand-inventory`의 `"@oh-my" + "-pi"`)대로 **문자열 결합**으로 표기해 게이트 0을 유지한다. |
| `gajae-code/<preset>` 모델 네임스페이스, upstream 이슈 URL, harness kind, pet 위젯 등 | 스코프가 아닌 **브랜드 문자열** — 슬라이스 6 이후 범위. |

**부수 시정 (슬라이스 5 착수 시 이미 깨져 있던 것)**
- `check:ts`가 HEAD에서 실패 중이었다: CI 제거 커밋(`2f7ade09e`)이 `check-node20-baseline.ts`와
  `ci-risk-canary-manifest.ts`를 삭제했지만 참조를 남겼다 → 고아 스크립트 `ci-virtual-integration.{ts,test.ts}` 삭제,
  `check:ts`/`ci:check:full`의 `check:node20-baseline` 참조 제거.
- 패키지 `homepage`가 `check-public-version-sync`의 기대값과 어긋나 있었다(`…#readme` vs 리포 URL) → 리포 URL로 정렬.
- `default-gjc-definitions.test.ts`가 여전히 `gjc skills list`를 기대 → 실제 출력(`worx …`)으로 갱신.

**기존 실패 (A/B로 HEAD와 동일 확인 — 이번 변경과 무관)**
- `packages/coding-agent/test/sdk-client.test.ts` 5건 (HEAD 동일)
- `scripts/release-policy.test.ts` / `release-publish-order.test.ts` 15건 — 삭제된 `.github/workflows/*`를 읽으려 함 + 설치 스크립트의 `GJC` 문구
- `verify-g002-gates`의 `MCP quarantine` / `inline-local tools` 2건 (HEAD 동일)
- `team-runtime` 계열 (이 맥에서 상시 실패, HEAD 동일)

## 슬라이스 6 — 내부 소문자 `gjc` 심볼·경로

소비자 영향 0(전부 내부). 규모: `worx-runtime/` 129파일, 파일명 `gjc-*` 295개, `Gjc*` 심볼 120파일.

- [ ] 디렉터리 `src/worx-runtime/` → `src/worx-runtime/` (git mv + import 갱신)
- [ ] 파일명 `gjc-*.ts` / `gjc-*.test.ts` → `worx-*` (git mv)
- [ ] 타입·심볼 `Gjc*` → `Worx*` (LSP rename 우선, 텍스트 치환 금지)
- [ ] `scripts/*gjc*` → `*worx*`, `sdk-skills/gjc-sdk-author` 등 경로
- [ ] **제외**: `package.json`의 `gjc` 매니페스트 키, ACP `_meta.gjc`, codex-handoff `gjc_session_id`/`gjc_turn_id`
- [ ] 수용: `check` 통과 + `worx-behavior-identity` 스윕 green + 잔존 목록이 위 제외 항목만

## 슬라이스 7 — P1b 패키징·무결성 계약 (계획 §4b)

포크에 릴리스 게이트 스크립트가 **없다**(wrapper 자산이었음) — 이관이 아니라 신규 작성이다.

- [ ] §4b-1 패키지 세트 확정: aggregator + 플랫폼 2종 이름·버전 정책, sentinel 파생 규칙과 결합
- [ ] §4b-2 플랫폼 선택 계약: `optionalDependencies` 소유를 엔진 포크 매니페스트로. 미지원 플랫폼 실패 방식 정의(설치 실패 or 로드 시점 단일 명시 오류) — **침묵 실패(`--version`만 통과) 금지**
- [ ] §4b-3 무결성 체인: `source SHA + 툴체인 + profile` → `.node sha256` → `tarball digest` → `publish 영수증`. "재현 가능" = 보관 아티팩트 해시 재계산 일치(비트 동일 재빌드 아님)
- [ ] §4b-4 서명 결정: **명시적 비서명** (PIVOT-FREEZE §11에 기록됨) — 게시 절차에 근거 문구 반영
- [ ] §4b-5 검증 게이트 3종 신규 작성: `verify:native`(2플랫폼 매트릭스) · `verify:provenance`(**no-CI 모델로 재작성** — 앵커 = 보관 아티팩트 해시 재계산, `ci_run_url`/`workflow_ref` 필수 필드 폐기) · `selftest:pack`
- [ ] `dist` 프로파일 빌드 성공 + 소요 측정 (양 플랫폼, 직렬)
- [ ] 게시: `npm.pkg.github.com`에 aggregator + 플랫폼 2종
- [ ] 수용: 게시된 패키지로 3종 게이트가 양 플랫폼에서 통과

## 슬라이스 8 — P1 exit 증명

- [ ] 클린 머신에서 **포크 산출물** tarball 설치
- [ ] 리네임된 CLI로 **실제 멀티턴 작업** 1건 완주
- [ ] natives 백엔드 툴 동작 확인
- [ ] 코드모드 부재 확인(postinstall 없음)
- [ ] 양 플랫폼 자체 빌드 `.node` 로드
- [ ] **`gjc` 명칭 잔존 0** (슬라이스 6 제외 항목 외)
- [ ] 수용: 위 6개 영수증을 `docs/evidence/P1-EXIT.md`에 기록

## 슬라이스 9 — P1c upstream 동기화 절차

- [ ] `upstream` remote 유지·auto-fetch 비활성 확인
- [ ] instruction-only 동기화 절차 문서화(`docs/UPSTREAM-SYNC.md`)
- [ ] divergence ledger 도입(리뷰한 서브시스템 기록)
- [ ] **리허설 1회**: 실제 upstream 변경 1건 → 게시 가능한 설치형 후보까지 완주 ("머지+tsc 통과"는 리허설 아님)

## 슬라이스 10 — P4 wrapper 기능 이관 (계획 §10.3)

- [ ] `src/identity`(SSH-cert·PKCE·reauth)
- [ ] `src/runtime`(shared-auth 레인·memory·project-groups)
- [ ] `src/remote-control`(릴레이 데몬·터널)
- [ ] `src/cli` 35종 서브커맨드
- [ ] `src/tools`(worx_* MCP) · `src/overlay`·rules · codegraph 배선
- [ ] 폐기 확인: brand.ts · acp-mitigation · single-copy 가드 · 엔진 핀/드리프트 장치
- [ ] 별도 처분 결정: `mobile/`(동결 보존) · `desktop/`·`web/`(포크 편입 vs 별도 레포)
- [ ] 수용: 각 기능의 대응 테스트가 포크에서 green

## 슬라이스 11 — cutover / wrapper 아카이브 (계획 §10.5, 4조건)

- [ ] (a) 이관 대상 전 기능이 포크 릴리스에서 동작
- [ ] (b) 포크 릴리스 ≥1회 완주
- [ ] (c) 개발자 전원 이관 완료 (`docs/MIGRATION-worx-rename.md` 절차)
- [ ] (d) ems-review 바이너리 경로 갱신 + print/RPC 스모크 1회
- [ ] 4조건 충족 후 `bworx-io/worx-code-wrapper` 아카이브

---

## 병행 트랙 (엔진에 종속되지 않음)

### AX 플랫폼 — 정본 `bworx-io/worx-ax` `docs/ARCHITECTURE.md`
- [ ] Phase 0: temporal 미러포크(T0) + 자체 이미지 빌드 + **Go 스파이크**(언어 확정 게이트, 1주 박스)
- [ ] Phase 1: auth v1(SSO→JWT/JWKS·RBAC) + 문서 코어 v1 + Review Hub v1 + SSE v1
- [ ] Phase 2: 워크플로 스파인(DesignChange + SpecImplement) + AX 문서 MCP + 칸반 프로젝션 + Temporal 인가 T1
  - **선행 의존**: 슬라이스 6 완료 전에는 MCP 툴명이 다시 바뀔 수 있으므로, AX Phase 2 착수 전 엔진 툴명 확정 필요
- [ ] Phase 3~5: 에이전트-인-닥 / 자가개선·DSL / 확장

### E-lane (엔진 기능 요구)
- [ ] E1+E2: 코디네이터 세션 **툴 allowlist + 경계 프롬프트** 파라미터 — AX Phase 4 시점. 차단 갭 아님(헤드리스 CLI 경로로 우회 가능)

---

## 진행 요약

| 구간 | 상태 |
|---|---|
| P0-FREEZE | ✅ 완료 |
| P1b natives 빌드 | ✅ 2플랫폼 완료 / ⬜ 패키징·게이트·게시 (슬라이스 7) |
| P1 리네임 | 🔶 5/6 슬라이스 완료 (남음: 내부 소문자 `gjc` 심볼 — 슬라이스 6) |
| P1 exit 증명 | ⬜ 슬라이스 8 |
| P1c 동기화 | ⬜ 슬라이스 9 |
| P4 이관 | ⬜ 슬라이스 10 |
| cutover | ⬜ 슬라이스 11 |
| AX 플랫폼 | ⬜ Phase 0 대기 (계획 정본 확정) |
