# 엔진 피벗 실행 체크리스트 (정본)

승인 계획: `docs/plans/ENGINE-PIVOT-PLAN.md` (rev.6) · 프로그램 지도: `docs/PROGRAM.md`
최종 갱신: 2026-08-18 · 기준 커밋: `0a217c764`

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
- [x] **리네임 S6: 내부 `gjc` 심볼·경로** — 디렉터리·파일명·`Gjc*` 심볼·커맨드 텍스트 (아래 슬라이스 6 참조)

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

## 슬라이스 6 — 내부 소문자 `gjc` 심볼·경로 ✅

소비자 영향 0(전부 내부). 3단 원자 커밋으로 진행: 경로 → 파일명 → 심볼.

- [x] 디렉터리 `src/gjc-runtime/` → `src/worx-runtime/` (git mv + import 갱신)
      · 함께 이동: `test/gjc-runtime/`, `src/extensibility/gjc-plugins/`, `src/defaults/gjc/`,
      `test/fixtures/gjc-{plugins,state}`, 런타임 플러그인 루트 `.worx/gjc-plugins` 와 lock 파일
- [x] 파일명 `gjc-*.ts` / `gjc-*.test.ts` → `worx-*` (git mv, 65개)
      · 함께: `verify-gjc-*`/`generate-gjc-*` 스크립트, `scripts/gjc-session`, `scripts/gjc-sdk-skills`,
      `sdk-skills/gjc-sdk-*`, `crates/gjc-sdk`, `python/gjc-sdk`(+`gjc_sdk` 모듈), 생성 플러그인 스킬 3종
- [x] 타입·심볼 `Gjc*` → `Worx*` (약 160종) + `…Gjc…`/`gjc_*`/`__gjc_*` 식별자
      · **LSP rename 대신 토큰 앵커 치환**을 썼다: 대문자 `Gjc` 는 소문자 계약(`gjc_session_id` 등)과
      충돌할 수 없고, 소문자는 "대문자 or 언더스코어 단어가 뒤따르는 경우"로만 매칭 + 계약 2종을
      lookahead 로 제외했다. ~500종에 LSP rename 을 개별 적용하는 것은 비현실적이었다.
- [x] `scripts/*gjc*` → `*worx*`, `sdk-skills/worx-sdk-author` 등 경로
- [x] 상태 수신증 owner 값 `gjc-state-cli|gjc-runtime|gjc-hook` → `worx-*`
      (기존 파일은 `receiptWithRequiredFields` 가 미지 owner 를 기본값으로 정규화 — 폴백 레이어 추가 아님)
- [x] 사용자·에이전트에게 보이는 커맨드 텍스트 `gjc <subcommand>` → `worx <subcommand>`
      (번들 SKILL.md 4종, 역할 프롬프트, `commands/`·`cli/` 헬프, 생성 command-ref)
- [x] **제외**: `package.json`의 `gjc` 매니페스트/설정 키, ACP `_meta.gjc`, codex-handoff `gjc_session_id`/`gjc_turn_id`
- [x] 수용: `bun --cwd=packages/coding-agent run check` 통과 · `worx-behavior-identity`/`worx-public-identity` green ·
      `rebrand-inventory --strict` green · `check:plugins`(16) · `check:sdk-skills`(28) · `verify-worx-skill-docs` green

**함께 고쳐진 실제 결함 (리네임이 드러낸 것)**
- `task/gjc-command.ts` 의 `DEFAULT_CMD` 가 여전히 `gjc` 를 spawn 하고 있었다 — 바이너리는 `worx` 다.
- inshellisense 완성 스펙이 `gjc` 커맨드 이름을 발행하고 있었다. XDG init·fixture-report·DAP clientID 동일.
- Codex 관리형 훅 매처가 자기가 쓰는 명령(`worx codex-native-hook`)을 인식하지 못해 중복 삽입되고 있었다.
- 생성 스킬의 command-ref 가 존재하지 않는 `gjc state ...` 를 에이전트에게 지시하고 있었다.

**의도적 잔존 (슬라이스 6 제외 목록)**

| 대상 | 근거 |
|---|---|
| `package.json`의 `gjc` 매니페스트 키, 설정 루트 키 `gjc.*`(`gjc.ralplan.*`, `gjc.deepInterview.*`) | 계획 §9 제외 항목. 서드파티 플러그인/확장 매니페스트가 읽는다. |
| ACP `_meta.gjc`, `_gjc/sdk/{global,control,query}` ext-method | S2 보존 표면. worx-ide(ORCA)가 이름으로 호출한다. 변경하려면 양쪽 동시 릴리스가 필요하다. |
| codex-handoff `gjc_session_id`/`gjc_turn_id` | 영속 필드. 계획 §9 제외. |
| tmux user option `@gjc-session-id`/`@gjc-session-state-file`/`@gjc-profile` | 살아 있는 tmux 세션의 입양 태그. 이 맥에서 tmux 계열 테스트가 상시 실패라 리네임을 검증할 수 없다. |
| OOO 브리지 `--runtime gjc`, hindsight 기본 bank `gjc` | 외부 런타임 식별자 / 외부 메모리 네임스페이스. |
| 릴리스 자산 이름 `gjc-linux-x64` 등(install 스크립트·update-cli·loader 다운로드 URL) | **슬라이스 7(P1b 패키징)** 소관 — 실제 게시 자산명과 함께 결정한다. |
| 테스트 `mkdtemp` 접두사(`gjc-…-`), 레거시 탐지기(`worx-behavior-identity`, `verify-worx-sdk-rename`), `@mariozechner/gajae-code` 별칭 | 동작 무관 문자열 / 구 이름을 알아야 하는 검출기. |

## 슬라이스 7 — P1b 패키징·무결성 계약 (계획 §4b)

포크에 릴리스 게이트 스크립트가 **없었다**(wrapper 자산이었음) — 이관이 아니라 신규 작성이었다.
절차 정본: `docs/PUBLISHING-natives.md` · 계약 정본(코드): `scripts/native-release-contract.ts`

- [x] §4b-1 패키지 세트 확정: aggregator + 플랫폼 2종 이름·버전 정책, sentinel 파생 규칙과 결합
      · `scripts/native-release-contract.ts` 가 세 게이트의 단일 소스다. 버전-sentinel 결합은
      `verify:native` 가 **실제 애드온 바이트에서 `__piNativesV0_13_1` 을 찾아** 강제한다.
- [x] §4b-2 플랫폼 선택 계약: `optionalDependencies` 를 aggregator 매니페스트가 소유 ·
      미지원 플랫폼은 **로드 시점 단일 명시 오류**(로더가 throw). 침묵 실패 금지는 테스트로 고정
      (`native-release-gates.test.ts`: 로더 거부 경로가 throw 인지, 지원 목록이 게시 세트와 일치하는지)
- [x] §4b-3 무결성 체인 구현: 빌드 수신증(`.node.build.json`) → `.node sha256` → `tarball sha256` →
      릴리스 매니페스트. **애드온 해시는 tarball 내부 멤버에서 재계산**한다(작업 트리가 아니라 게시될 바이트).
      "재현 가능" = 해시 재계산 일치, 비트 동일 재빌드는 명시적 제외.
- [x] §4b-4 서명 결정: 릴리스 매니페스트에 `"signing": "none"` 필수, `verify:provenance` 가 요구.
      절차 문서에 근거 명기(§4 of `PUBLISHING-natives.md`).
- [x] §4b-5 검증 게이트 3종 신규 작성 — `bun run verify:native` / `selftest:pack` / `verify:provenance`
      (+ `verify:release` 아그리게이트, `stage:native` 스테이징). `verify:provenance` 는 재조준이 아니라
      **재작성**: `ci_run_url`/`workflow_ref`/`run_id` 계열을 **깊이 무관 거부**하고 `builder`/`build_host` 를
      요구한다 — no-CI 릴리스에서 CI provenance 를 채우는 것은 날조이기 때문.
- [ ] `dist` 프로파일 빌드 성공 + 소요 측정 (양 플랫폼, 직렬) — 현재 산출물은 `ci` 프로파일이다
- [ ] linux-x64 산출물 확보(리눅스 호스트에서 `stage:native --platform linux-x64`) — 없으면
      `selftest:pack` 이 **애드온 없는 531B tarball** 을 발견하고 fail-closed 한다(설계대로 동작 확인됨)
- [ ] 게시: `npm.pkg.github.com`에 플랫폼 2종 → aggregator 순서. **자격증명·승인 필요**
- [ ] 수용: 게시된 패키지로 3종 게이트가 양 플랫폼에서 통과

**darwin-arm64 실측 (2026-08-18, `ci` 프로파일 산출물)**
`verify:native` 29게이트 통과 · sentinel `__piNativesV0_13_1` 확인(46,149,152 B) ·
`.node` sha256 `fc3cc627df65c63d…` 수신증 일치 · tarball 10,368,316 B sha256 `d36495758f321228…` ·
`verify:provenance` 가 tarball 멤버에서 애드온 해시를 재계산해 동일 값 확인.

**부수 시정 — 설정 키 정합성 결함**
`.gjc`→`.worx` 스윕(슬라이스 4)이 **중첩 설정 접근자**까지 바꿔 `parsed.gjc` → `parsed.worx` 가 됐다.
설정 스키마는 `gjc.ralplan.*` / `gjc.deepInterview.*` 를 선언하고 번들 SKILL.md 예시도 `"gjc": {` 인데
런타임 중첩 분기만 `worx` 를 읽고 있었다 — 즉 **사용자가 설정한 값이 조용히 무시되는 상태**였다.
선언 스키마 기준으로 통일(`parsed.gjc`)하고 테스트·config.yml 픽스처를 맞췄다. `.gitignore` 의
`.gjc/` 규칙 19개도 `.worx/` 로 갱신(런타임 상태 디렉터리가 무시되지 않고 있었다).

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
  - **선행 의존 해소**: 슬라이스 6 완료로 MCP 툴명(`worx_coordinator_*` / `worx_delegate_*`)이 확정됐다 — AX Phase 2 착수 가능
- [ ] Phase 3~5: 에이전트-인-닥 / 자가개선·DSL / 확장

### E-lane (엔진 기능 요구)
- [ ] E1+E2: 코디네이터 세션 **툴 allowlist + 경계 프롬프트** 파라미터 — AX Phase 4 시점. 차단 갭 아님(헤드리스 CLI 경로로 우회 가능)

---

## 진행 요약

| 구간 | 상태 |
|---|---|
| P0-FREEZE | ✅ 완료 |
| P1b natives 빌드 | ✅ 2플랫폼 완료 · ✅ 패키징 계약·게이트 3종 작성 / ⬜ linux 산출물·dist 프로파일·게시 (슬라이스 7) |
| P1 리네임 | ✅ 6/6 슬라이스 완료 (잔존은 슬라이스 6 제외 목록 + 슬라이스 7 소관 릴리스 자산명) |
| P1 exit 증명 | ⬜ 슬라이스 8 |
| P1c 동기화 | ⬜ 슬라이스 9 |
| P4 이관 | ⬜ 슬라이스 10 |
| cutover | ⬜ 슬라이스 11 |
| AX 플랫폼 | ⬜ Phase 0 대기 (계획 정본 확정) |
