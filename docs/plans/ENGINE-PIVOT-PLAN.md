# Reconciliation / Final (rev.3) — byteWORX Own-Engine Pivot

run: `019ff279-d9df-7000-0f9b-fa4565a1529a` · stage 8 (final, rev.6) · 2026-08-13

**기준 문서:** `stage-02-revision.md` (da8deb31…0a24bf).
**대체 대상:** `stage-04-final.md`(rev.2). rev.2 는 독립 critic 에서 **OKAY(차단 0)** 를 받았으나 비차단 지적 중 사실오류 2건·과소기술 1건이 실행자에게 그대로 전달되므로 rev.3 에서 정정한다.

## 0. 검토 이력

| 레인 | 스테이지 | 판정 |
|---|---|---|
| Architect | 2 | CLEAR / COMMENT |
| Critic | 2 | **OKAY** (C1–C8 resolved) |
| Architect 독립 재검토 (rev.1) | 3 | **BLOCK** — 조건 2건 |
| Critic 독립 재검토 (rev.2) | 4 | **OKAY** — 차단 0, 비차단 6건 |

critic 이 독립 확인한 사실: §1b 처분표의 **라인·인용 전 행 정확**, 전수 스윕 결과 **처분표 밖 잔존 0건**, 끊기는 참조 0건, 증거 대조(커밋 SHA·rustc·산출물 크기·export·프로파일·빌드 시간) **전 항목 MATCH**.

## 1. 합의 수정 — 확정

| # | 대상 | 처분 |
|---|---|---|
| 1 | `stage-02-revision.md:73` | **같은 줄 두 수치 동시 수정.** "14 `.patch` files" → **13**, "16 patch-ish artifacts" → **15**. 근거: 같은 줄이 "18 entries"를 주장하는데 14+2+3=19 로 자기모순, 13+2+3=18 ✓, patch-ish=13+2=**15** ✓. 하중 수치(12 active, 1 excluded)는 불변 |
| 2 | `stage-02-revision.md:74` | "`sequence` optional on **11 of 13**" → **12 of 13**. 같은 줄이 `sessions.stop` 단일 예외를 명시하므로 11 은 자기모순 |
| 3 | sentinel `:33`→`:34` (Architect N1) | **기각.** `__piNativesV0_13_1` = `native/index.js:33`(기준문서 `:107`), `applyBashFixups` = `:34-37`(`:153`). 지적 쪽이 오인용 |

> rev.2 는 #1 에서 같은 줄의 두 번째 수치를 놓쳤다. "정정이 새 오류를 낳는" 패턴은 stage-2 critic 이 이미 경고한 것이므로 여기서 끊는다.

## 1b. Option C / F2 / R13 폐기 — 행 단위 처분

G1=A 확정으로 Option C 분기는 사멸했다. 기준 문서의 **13행 / 14개 지점**을 처분한다. 처분표에 없는 문장은 종전대로 유효하다. (critic 전수 스윕: 처분표 밖 잔존 **0건**.)

| 라인 | 현재 | 처분 |
|---|---|---|
| `:51` | F2 대응표 행 | **역사 기록으로만 유지** + 실행 의미 없음 명기 + **Where 열의 "§4 (P0-F/P1)" 참조 제거**(해당 절이 `:114-118` 삭제로 소멸) |
| `:64` | 승계 목록의 "… / **Option C** framing" | **Option C framing 승계 취소** → "Option A 확정(2026-08-12 서명)" |
| `:98` | 절 제목 "… (C1, C2, **F2**)" | **"(C1, C2)"** |
| `:106` | freeze inventory "**five** per-platform packages" | **2종만 동결·기록**(darwin-arm64, linux-x64-modern). 나머지 3종은 "미지원(G2)" 명시 |
| `:110` | "Option A **or Option C**, and the platform-support scope" | **"G1=Option A, G2=darwin-arm64 + linux-x64(modern) — 2026-08-12 서명 완료"** |
| `:112` | C1 하드룰 | **조건절 삭제.** 남기는 규범: "P1b 는 P1 을 무조건 선행 차단하며, P1 exit 은 양 플랫폼 자체 빌드 `.node` 런타임 증명을 요구한다" |
| `:114-118` | **F2 미러링 전제조건 절 전체** | **전면 삭제** |
| `:128` | "mirror (Option C) **or** own published (Option A)" | **"우리가 게시한 2개 플랫폼 패키지를 가리킨다"** |
| `:141` | "`verify:native` … **mirror or** own-build" | **"자체 빌드 산출물 기준으로 재조준(§4b-5)"** |
| `:318` | 프리모템 S1 의 F2 인용 | **F2 절 삭제** → 근거를 "Option A 확정 + 양 플랫폼 자체 빌드 실증(§3)"으로 교체 |
| `:333` | **R13** (upstream npm 인질, High) | **위험 등록부에서 삭제.** (critic: R13 참조는 `:333` 단독 — 끊기는 참조 없음) |
| `:350-351` | 흐름도 "[blocking unless Option C is signed; mirroring…]" | **"[P1 선행, 무조건 차단]"**. 흐름도가 P1b 를 P1 하위 가지로 그리므로 **§7 을 순서의 정본으로 한다** |
| `:370` | executor 역할의 "…, **mirroring**" | **삭제 → "네이티브 2플랫폼 빌드·게시"** |

## 2. 게이트 서명 (운영자, 2026-08-12)

**G1 = Option A** · **G2 = darwin-arm64 + linux-x64(modern) 2종.**
귀결: AC-1 예외 없음 · F2 무효 · R13 소멸 · P1b 는 P1 선행 · P1 exit 은 양 플랫폼 자체 빌드 증명.

## 3. P0-4 프로브 — 추정을 실측으로 교체

증거: `docs/evidence/p0-4-native-build-probe-2026-08-12.md`

### 3.1 틀린 추정의 처분

| 종전 서술 | 실측 | 처분 |
|---|---|---|
| 릴리스당 아티팩트 8개 | **2개** (`.94`·`.14` 모두 AVX2 → baseline 불필요) | 정정 |
| 5개 플랫폼 호스트/크로스툴체인 | 실사용 2대로 충분 | 정정 |
| Rust 크레이트 별도 포크·동기화 | 모노레포 동봉 → 2차 동기화 없음 | 정정 |
| R1 — linux-x64 호스트 부재 시 전면 차단 | 호스트 확보·빌드 성공 | **해소** |
| "Option A 는 P1 소요 2배" [I] | 근거 4개 소멸 | **무효화.** 재추정 전 인용 금지 |

### 3.2 확정된 실측치

| 항목 | linux-x64 (`.14`) | darwin-arm64 (맥 M5) |
|---|---|---|
| 소스 | v0.13.1 @ `63ea66995c4e20ced48528f83af6e5b055fff372` | 동일 |
| 툴체인 | rustc **1.97.0-nightly (2026-04-28)** (`nightly-2026-04-29` 핀) | 동일 |
| 산출물 | `pi_natives.linux-x64-modern.node` **51,133,200 B** | `pi_natives.darwin-arm64.node` **46,162,912 B** |
| sentinel `__piNativesV0_13_1` | 존재 | 존재 |
| export | 85개 | 86개 (`ComputerController` macOS 전용) |
| 검증 범위 | 개수 + 대표 심볼 **9종** + `applyBashFixups` 1건 | 개수 + 대표 심볼 **10종** + 동일 1건 |
| 콜드 빌드 | 1분 32초 (72코어, 378 크레이트) | 약 10분 |
| 프로파일 | `local` | `ci` |

> "전체 export 동작 확인"이 아니다. 전 export 영수증은 P1 exit 의 실제 멀티턴 작업으로 대체한다.

### 3.3 신규 실행 제약 (P1b 편입)

1. **동시 빌드 금지.** 병렬 `bun run build` → `native/.build/`·`index.d.ts` 경합으로 `exit code 101`. 소스 결함 아님.
2. **빌드 호스트 전제 2건.** 시스템 `unzip` 부재(bun 차단), 시스템 node 18 의 `node:util.styleText` 미지원(napi CLI 차단). 우회: python3 `zipfile`, node 22.
3. **`dist` 프로파일 — 소요뿐 아니라 빌드 성공 자체가 미실증.** 위 수치는 `local`/`ci` 기준.

## 4. P0-FREEZE §5(License baseline) 승격

```
badlogic/pi-mono        MIT © 2025 Mario Zechner              (순수 TS, crates 없음)
├─ can1357/oh-my-pi     MIT © 2025 Zechner + 2025-26 Can Bölük  ← Rust 네이티브 층의 출처
│  └─ Yeachan-Heo/gajae-code  MIT © 2025-2026 Yeachan-Heo       ← 포크 대상
└─ code-yeongyu/senpi   MIT © 2025 Zechner + 2026 Yeongyu Kim   → npm `omo-ai` (형제 포크)
```

`gajae-code` 의 `LICENSE` 는 Yeachan-Heo 만 표기하고 Zechner/Bölük 표기가 없다(조상 언급은 `NOTICE.md` 산문뿐). MIT 는 저작권 고지의 복제본 포함을 요구하며 **Option A 에서 배포자는 우리**다.
→ P0-FREEZE §5 를 **결함 시정 항목**으로 승격. `LICENSE`+`NOTICE` 에 4개 라인: Mario Zechner · Can Bölük · Yeachan-Heo · byteWORX. 형식 선례는 `senpi`.

## 4b. P1b — 자체 네이티브 패키징·무결성 계약

현행 wrapper `dependencies` 는 `@colbymchenry/codegraph`, `@gajae-code/agent-core`, `@gajae-code/coding-agent` 3개이며 **natives 표현이 없고 `optionalDependencies` 자체가 없다** [V `package.json:75-79`]. 기준 문서에는 두 플랫폼이 실제로 설치되게 만드는 계약이 없다. 아래를 P1b 필수로 추가한다.

**1. 패키지 세트 확정** — own-scope aggregator 1 + 플랫폼 패키지 2. G2 미지원 3종은 게시하지 않는다.
**버전 문자열 ↔ sentinel 결합 제약:** 로더는 sentinel 을 `"__piNativesV" + version.replace(/[^A-Za-z0-9]/g,"_")` 로 파생한다. aggregator 게시 버전이 바뀌면 기대 sentinel 도 바뀐다. 버전 정책은 이 규칙과 함께 고정한다.
*종료 조건:* 3개 패키지 이름·버전이 P0-FREEZE 에 문자 그대로 기록되고, 파생 sentinel 이 빌드 산출물의 실제 export 와 일치.

**2. 플랫폼 선택 계약의 소유 매니페스트** — `optionalDependencies`(또는 동등물)를 **엔진 포크 매니페스트가 소유**한다. wrapper 에 직접 넣지 않는다. 미지원 플랫폼 실패 방식은 프리모템 S1(애드온 부재 시 natives 툴 전멸, `--version` 은 통과)을 재현하지 않도록 정의한다: 설치 시점 실패 또는 로드 시점 명시적 단일 오류 중 하나를 택해 구현한다.
*검증 방법(함대에 미지원 하드웨어가 없으므로 시뮬레이션):* 설치 후 플랫폼 패키지를 제거하고 세션을 기동해 (a) natives 백엔드 툴이 **명시적 오류**로 실패하고 (b) `--version` 만 통과하는 침묵 실패가 **발생하지 않음**을 관측.
*종료 조건:* (a)(b) 관측 영수증.

**3. 무결성 체인** — `source SHA + 툴체인 + 빌드 프로파일` → `.node sha256` → `tarball digest` → `publish 영수증`.
*"재현 가능"의 정의:* **비트 동일 재빌드를 요구하지 않는다.** 요구는 "보관된 아티팩트에 대해 각 해시를 재계산하면 기록값과 일치한다"이다. 비트 동일 재현성은 목표에서 명시적으로 제외한다(nightly 툴체인·thin LTO·병렬 codegen).
*종료 조건:* 보관 아티팩트로 체인 4단 해시 재계산 전부 일치.

**4. 서명/attestation 결정** — 채택하거나 **명시적으로 비서명을 선택**하고 근거를 기록한다. 미결정 금지.
*종료 조건:* P0-FREEZE 에 결정문 1개 존재.

**5. 게시물 기준 검증 게이트** — 세 스크립트를 **게시된 패키지**로 양 플랫폼에서 실행한다. 현재 상태를 실제로 읽은 결과, 이 항목의 분량은 rev.2 가 암시한 "재조준"보다 **크다.**

- **`verify:native`** [V `scripts/verify-native-prebuilt.ts`] — 현재 **darwin-arm64 단일 하드코딩**이다: `PLATFORM_NODE = "pi_natives.darwin-arm64.node"` (`:19`), 플랫폼 패키지 경로 `natives-darwin-arm64` (`:41`), 검사 스코프도 `@gajae-code/natives` 고정 (`:39`). 필요한 작업 = **플랫폼 매트릭스화 + 스코프 교체 + `-modern` 변종 파일명 처리.** 유계(≈60행)이나 단순 치환이 아니다. sentinel 파생 검사(`:52-55`)와 `glob` 존재 검사, `assertNoInstallHooks` 는 그대로 재사용한다.
- **`verify:provenance`** [V `scripts/verify-provenance.ts`] — **"편입"이 아니라 재작성이다.** 현 스크립트는 CI 워크플로 자기증명 검증기로 `REQUIRED_FIELDS` 에 **`ci_run_url` 과 `workflow_ref` 를 필수**로 요구하며(`:20-28`), 유일한 독립 앵커가 `gh run view` 서버측 커밋 대조다(`:57-108`, `:131-145`). **이 리포에는 `.github` 디렉터리 자체가 없다** [V] — Actions 는 2026-07-27 제거됐고 릴리스는 전수 수동이다. 따라서 수동 2호스트 빌드는 유효한 manifest 를 만들 수 없고, 억지로 채우면 **provenance 를 날조**하게 된다. 실제 필요 작업 = **§4b-3 무결성 체인을 no-CI 모델로 검증하는 스키마·신뢰모델 재작성**: 필수 필드를 `{source_sha, toolchain, build_profile, build_host, node_sha256, tarball_sha256, package_name, package_version, builder, built_at}` 로 교체하고, 앵커를 "CI run" 대신 "보관 아티팩트 해시 재계산"으로 바꾼다. 신뢰 경계 문구도 **"CI 서버 상관 없음 — 수동 빌드 자기증명 + 아티팩트 해시 재계산"** 으로 정직하게 다시 쓴다.
- **`selftest:pack`** [V `package.json:40`] — 게시 패키지 기준으로 재실행.
- **릴리스 게이트 배선:** `scripts/verify-release.sh` 는 현재 `verify:native` 와 `selftest:pack` 만 호출하고 **`verify:provenance` 를 호출하지 않는다** [V `verify-release.sh:50-51`]. 위 세 항목을 게이트에 실제로 물리려면 이 스크립트 수정이 함께 필요하다(rev.2 누락분).

*종료 조건(5항 전체):* 게시된 2개 플랫폼 패키지에 대해 세 스크립트가 각 플랫폼에서 통과하고, 그 실행이 `verify-release.sh` 경로 안에서 일어난다.

## 5. senpi / omo-ai 대조 — 전략 근거

| | senpi | gajae-code |
|---|---|---|
| 원본 | `pi-mono` 직계 | `oh-my-pi` 경유 |
| Rust 크레이트 | `senpi-pty` **1종** | `pi-natives` 외 **7종+** |
| 툴체인 | `stable`, minimal | `nightly-2026-04-29` 고정 |
| 네이티브 표면 | PTY 한정 | 셸/PTY/프로세스, 관리형 FS+내구성, **승인 중재 전송**, ast-grep/grep/glob, 컴퓨터 제어 |
| 조상 저작권 표기 | 정확 | **누락**(§4) |

- senpi 는 **순수 TS 엔진 포크 후 Rust 층 자체 구축** 선례 — Option A 그 자체.
- 두 계열은 형제 포크이며 조상/자손이 아니다.
- gajae 계열 네이티브의 `NotificationServer`/`registerWorkflowGateAsk`/`registerArbitratedAsk`/`resolveClaim` 을 엔진 TS 가 `src/sdk/bus/index.ts` 와 `src/sdk/bus/control-drain-lease.ts` 에서 구동한다. 큐 순서는 TS, 등록·클레임·확정 원시 동작은 네이티브다. **G5·G6·P6 가 건드릴 층의 소유권**이 Option A 의 전략적 값이다.

## 6. 잔여 caveat (비차단)

1. §8 canary 임계치가 "a stated number / bound / multiple" 로 남아 있다. 각 창 개시 **전** 확정, 관측 후 선택 금지.
2. AC-5 게이트 표 계측 시 worx-session 정의·창 명시(구 Claude-Code 훅 세션 정의 유입 차단).
3. **P0-FREEZE 미실행은 P1 을 그대로 차단한다.**
4. 맥 로컬 cargo target 디스크 잠식(여유 53GB/460GB). 릴리스 후 `cargo clean` 또는 `.14` 일원화를 P1b 에서 결정.
5. `dist` 프로파일 미측정 — **소요 미확정 + 빌드 성공 자체 미실증.** P1b 첫 항목이므로 P1b 착수의 선행 조건은 아니다.

## 7. 실행 순서 (순서의 정본)

```
P0-FREEZE ─┬─ 포크/ORCA SHA · 패키지 버전(2 플랫폼) · 파생 sentinel
           ├─ LICENSE 4라인 시정 (§4)              ← 결함 시정
           ├─ ORCA numstat 분할표 (13 patch / 15 patch-ish)
           ├─ 측정된 cadence
           ├─ G1=A / G2=2플랫폼 서명 기록 ✅
           ├─ §1b 행 단위 폐기 반영 ✅
           └─ §4b-4 서명/비서명 결정문
   │
   ├─> P1b Natives (P1 무조건 선행)
   │      · dist 프로파일 빌드 성공 + 소요 측정 (양 플랫폼, 직렬)
   │      · §4b-1~4 패키지 세트·플랫폼 계약·무결성 체인
   │      · verify:native 매트릭스화 · verify:provenance 재작성 · verify-release.sh 배선
   │
   └─> P1 Engine ownership
          exit: 클린머신 tarball 설치 + 실제 멀티턴 작업 + natives 백엔드 툴 +
                코드모드 부재 + **양 플랫폼 자체 빌드 `.node`**
```

기준 문서의 P1c / P4 / P7 / P6(←P5) / P3→P8 의존 관계는 본 델타가 뒤집지 않으며 그대로 유효하다.

## 8. 승인 요청 범위

승인 대상 = `stage-02-revision.md` + 본 델타 전체(§1, §1b, §2, §3, §4, §4b, §6, §7).
승인 시 착수 가능 = **P0-FREEZE 및 P1b**.

승인 밖(운영자 전용): **G3–G8**, [X] 증명 A6·A7·A8·A12·A14·A17, P3 시각 게이트, 프로덕션 컷오버(G8).
**G1·G2 는 종료.** stage-3 BLOCK 조건 2건은 §1b·§4b 로 해소, stage-4 비차단 지적 6건은 rev.3 에 반영 완료.

## 9. (rev.4 추가) 다운스트림 보존 표면 3종 + 이름 제거 리네임 맵

> 본 rev.4 는 rev.3 전문에 §9 를 추가한 것이며 `stage-05-final.md` 를 대체한다.
> 배경: 포크는 gjc 이름을 **완전히 제거**하고 worx-code 를 엔진 그 자체로 만든다("래퍼가 gjc 를 감싼다" 모델 폐기).
> 이름 제거의 실측 범위와, 포크가 깨뜨리면 안 되는 소비자 표면을 P0-FREEZE/P1 에 편입한다.

### 9.1 보존 표면 3종 — P0-FREEZE 에 기록, P1 exit 에서 검증

| # | 표면 | 내용 | 확인된 소비자 |
|---|---|---|---|
| S1 | **Coordinator MCP** | `mcp-serve coordinator` · `gjc_delegate_plan/execute/team` · `start_session→send_prompt→read_turn/await_turn→submit_question_answer` · durable `turn_id` + `idempotency_key` 계약 | AX 플랫폼 워크플로 Activity (분석·구현·PR 스텝) |
| S2 | **ACP 표면** (worx-acp 경로) | IDE 채팅 세션 | worx-ide (ORCA Class A: `src/main/worx-acp/**`, `src/renderer/src/worx-acp/**`) |
| S3 | **헤드리스 CLI 표면** | `-p/--print` · `--session-dir` · `--append-system-prompt` · `--tools` · `--continue` · `--mode rpc` — 전부 엔진 `src/cli/args.ts` 실재 확인 [V `:333,:265,:228,:299,:193,:180`] | ems-review(review-system) `web/gjc/runner.py` — print + RPC 두 모드로 subprocess 구동 |

플래그명 자체는 중립(브랜드 무관)이라 리네임 대상이 아니다. 보존 의무는 **의미론**(플래그 동작·RPC 이벤트 형태)이다.

### 9.2 리네임 맵 — P1 체크리스트 추가 항목

- [ ] 포크 CLI 바이너리/제품명 확정 (gjc 계열명 전면 제거).
- [ ] **환경변수 네임스페이스: 엔진 소스 `GJC_*` 고유 282개 실측** [V grep 전수]. 전수 리네임(`WORX_*` 계열) 범위·시점 결정. 하위호환 레이어는 만들지 않는다(클린 브레이크 + 마이그레이션 노트) — 소비자가 전부 사내(wrapper·review-system·스크립트)라 가능하다.
- [ ] 설정 디렉터리(`~/.gjc` 계열 → 우리 명명). 사용자-가시 문자열·refs 는 기존 P1 브랜딩 항목에 이미 포함.
- [ ] 리네임 후 S1–S3 재검증(스모크)이 P1 exit 증명에 포함된다.
- 참고: natives sentinel(`__piNativesV…`)은 로더↔애드온 내부 계약으로 자동 일관(양쪽 모두 우리 빌드) — 다운스트림 표면 아님, 조치 불요.

### 9.3 ems-review 마이그레이션 (EMS 트랙 소유, 본 계획 범위 밖 — 기록만)

P1 exit(설치 가능한 포크) 후: review-system 의 바이너리 경로 설정을 포크 CLI 로 갱신하고 print/RPC 스모크 1회. review-system 자체의 `GJC_BIN`/`GJC_RPC_*` 등 env **명칭**은 그들 코드의 내부 명명이며(엔진 env 아님 — 값만 우리 바이너리를 가리키면 됨) 우리 리네임과 무관하다. 모듈명(`web/gjc/`)·`refs/gjc/blocked/*` 정리는 EMS 트랙 선택사항.

### 9.2b (rev.5 추가) 리네임 맵 보강 — 행동 식별자 클래스

> 본 rev.5 는 rev.4 전문에 §9.2b 를 추가한 것이며 `stage-06-final.md` 를 대체한다.
> 배경: "gjc" 는 표시 문자열·env 이름뿐 아니라 **코드 동작을 가르는 리터럴**로도 박혀 있다.
> 운영자 지적("커맨드는 `worx --worktree` 여야 한다")을 검증한 결과, 해당 검증기가 실행파일명
> 리터럴을 고정하고 있어 리네임 없이는 `worx --worktree` 가 **거부**된다. 전수 스윕으로 동급
> 지점을 실측했다. 문자열 브랜딩 치환(§9.2 기존 항목)과 별개의 P1 작업 클래스다.

| 위치 [V] | 리터럴 | 의미 | 처분 |
|---|---|---|---|
| `coordinator-mcp/server.ts:826` | `executable !== "gjc"` | 코디네이터 세션 커맨드 allowlist — 이 검증기가 `worx --worktree` 를 거부하는 지점 | 포크 바이너리명으로 교체. 설정도 `WORX_COORDINATOR_MCP_SESSION_COMMAND="worx --worktree"` 계열로 |
| `gjc-runtime/team-runtime.ts:384,433` | `workerCli !== "gjc"` | team 워커 CLI 검증 | 동일 교체 |
| `tools/bash-allowed-prefixes.ts:272` | `words[0] !== "gjc"` | bash 툴 자기호출 프리픽스 정책 | 동일 교체 |
| `config/settings.ts:1656` | `agentName !== "gjc"` | 에이전트명 분기 | 동일 교체 |
| `sdk/transport/auth-preface.ts:69` | `gjc-sdk-transport/` | **SDK 와이어 핸드셰이크 식별자** | 클린 브레이크 — 클라이언트가 전부 in-tree 라 동기 교체 가능. P1 에서 out-of-tree SDK 클라이언트 부재를 확인 후 실행 |
| MCP 툴명 `gjc_coordinator_*` / `gjc_delegate_*` | 툴 이름 자체 | S1(Coordinator MCP) 표면의 이름 | **P1 포크 시점에 `worx_*` 로 리네임.** AX 플랫폼 Phase 2 가 코드로 소비하기 전이 유일하게 무비용인 시점. ems-review(S3 CLI)·worx-ide(S2 ACP)는 툴명 무영향 |
| `hooks/skill-state.ts:175` · `session/agent-session.ts:13990` | `gjc:` 토큰 · `gjc_skill_*` stop reason | 내부 상태 토큰 | 내부 일관 교체 (기존 세션 파일 마이그레이션 불요 — 신규 세션부터) |

- [ ] P1 체크리스트 추가: **행동 식별자 전수 스윕** — `=== "gjc"` / `!== "gjc"` / `startsWith("gjc` / 접두 토큰 패턴을 소스 전수 grep 으로 재확인하고, 위 표 밖의 발견을 리네임 맵에 편입.
- S1 보존 의무(§9.1)의 정확한 해석: 보존 대상은 **의미론**(멱등 원장·turn 계약·스키마)이며, 이름은 P1 리네임 맵을 따른다. S1 재검증 스모크는 리네임 후 명칭 기준으로 수행한다.

## 10. (rev.6) 제품 구조 정정 — 포크가 제품이다, wrapper 는 폐지된다

> rev.5 까지의 구조적 결함: 기준 문서 P1 체크리스트(`stage-02-revision.md:131-149`)는
> worx-code-wrapper 레포를 존치하고 엔진 포크를 **npm 의존성으로 소비**하는 2-레포 구조를 전제했다.
> 이는 "남의 엔진에 씌우는 래퍼" 시대의 관성이며, 서명된 방향(G1=Option A: 엔진 자체가 우리 것)과
> 모순된다. 엔진을 소유하는 순간 별도 wrapper 레포는 순수 오버헤드다 — 2-레포 릴리스, 교차 버전 핀,
> single-copy 가드 전부가 래퍼 존재 때문에 필요했던 것들이다. 본 절이 해당 블록을 대체한다.

### 10.1 최종 제품 모델

- 신규 레포 `bworx-io/<product>` = **gajae-code 모노레포 포크 그 자체** (히스토리 보존 포크).
  리네임(§9)·natives 빌드(§3)·기능 개발·릴리스 전부 이 한 레포에서 일어난다.
- 이 레포가 `worx` CLI 를 **직접** 산출한다. 별도 wrapper 레포는 최종 상태에 존재하지 않는다.
- `worx-code-wrapper` 는 **마이그레이션 소스**로만 쓰이고, cutover(10.5) 후 **아카이브**된다.
  이후 어떤 릴리스도 wrapper 에서 나오지 않는다.

### 10.2 기준 문서 P1 체크리스트(:131-149) 행 단위 처분

| 기준 항목 | 처분 |
|---|---|
| `:132` dependencies → 포크 스코프 재지향 | **폐기** — 소비 관계 자체가 소멸 |
| `:133-136` postinstall·brand·acp-mitigation 제거 | **승계** — wrapper 아카이브와 함께 자연 소멸. 브랜딩은 포크 소스 리네임(§9)이 대체 |
| `:137` `check:single-copy` 재조준 | **폐기** — 단일 레포에서 존재 이유 소멸 |
| `:138-139` `test:worx`/`test:engine-drift` 정리 | **변환** — drift 테스트는 "upstream 추적 포크" 관점으로 포크에 재작성. wrapper 고유 테스트는 기능 이관(10.3)과 함께 이동 |
| `:140-143` `audit:runtime`/`verify:native`/`selftest:pack`/`smoke:modes` | **이관** — 포크 레포의 릴리스 게이트로 이식 (§4b 갱신 사항은 그 위에 적용) |
| `:144-146` exports/bin/import 마이그레이션 | **변환** — "wrapper 파일 수정"이 아니라 "wrapper 기능의 포크 이관"(10.3) |
| `:147` update/auto-update 채널 재지향 | **변환** — 포크의 릴리스 채널이 유일한 채널 |
| `:148-149` bun.lock·verify-release·docs | **이관** — 포크 기준 재작성 |

### 10.3 wrapper 기능 이관 레인 — P4 의 정의 확정

P4 "Feature merge" = **wrapper 고유 기능을 포크의 1급 기능으로 이관**하는 레인. §7 fixtures 가 acceptance.

- **이관**: `src/identity`(SSH-cert·PKCE·reauth) · `src/runtime`(shared-auth 레인·memory·project-groups)
  · `src/remote-control`(릴레이 데몬·터널) · `src/cli`(pick/init/login/sync/ide/gateway/admin 등 35종)
  · `src/tools`(worx_* MCP) · `src/overlay`·rules · codegraph 배선 · 대응 테스트 전부.
- **폐기**: `brand.ts` · `acp-mitigation` · single-copy 가드 · 엔진 핀/드리프트 장치 전부 (존재 이유 소멸).
- **별도 처분**: `mobile/`(은퇴 트랙 — 아카이브에 동결 보존) · `desktop/`·`web/`(독립 표면 —
  포크 모노레포 편입 vs 별도 레포를 P4 착수 시 결정) · `docs/`(포크로 이관).

### 10.4 P1 exit 재정의

기준 문서 `:151` 의 "fresh **wrapper** tarball" 문구를 대체한다: P1 exit 은 **포크가 산출한 설치물**을
클린 머신에 tarball 설치하여 증명한다 — (1) 리네임된 CLI 로 실제 멀티턴 작업 (2) natives 백엔드 툴
(3) 양 플랫폼 자체 빌드 `.node` (4) **gjc 명칭 잔존 0** (§9.2b 행동 식별자 스윕 포함).
P1 에 포함할 최소 CLI 패리티 슬라이스(예: identity login 경유 provider 연결)는 P1 착수 시 확정하고,
나머지 wrapper 기능은 P4 슬라이스로 이관한다.

### 10.5 cutover / 아카이브 게이트

wrapper 아카이브 조건 4개: (a) 10.3 이관 대상 전 기능이 포크 릴리스에서 동작 (b) 포크 릴리스 ≥1회 완주
(c) 사용자(개발자 전원)의 이관 완료 (d) ems-review 바이너리 경로 갱신(§9.3) 완료.
그 전까지 wrapper 는 **frozen** — 기능 추가 금지, 치명 수정만 허용.

### 10.6 불변 사항

G1/G2 서명 · §3 natives 실측 · §9.1 보존 표면 S1-S3 · §9.2/9.2b 리네임 맵 · AX 플랫폼 계획은
본 절로 인해 바뀌지 않는다 — 오히려 단순해진다: S3(헤드리스 CLI)는 포크 자신의 CLI 이고,
ems-review 는 포크 바이너리를 직접 가리키며, 재지향 레이어는 어디에도 없다.
