# P0-4 프로브 결과 — 자체 네이티브 빌드 실증 (Option A)

- 일자: 2026-08-12
- 목적: ralplan run `019ff279-d9df-7000-0f9b-fa4565a1529a` 의 escalation gate **G1(네이티브 전략 A/C)** 서명을 위한
  no-proceed 프로브. "우리 파이프라인에서 `.node`를 실제로 빌드할 수 있는가"를 주장이 아니라 실행으로 확인.
- 결론: **성공. Option A는 서명 가능.**

## 1. 운영자 결정

| 게이트 | 결정 | 근거 |
|---|---|---|
| **G1** 네이티브 전략 | **Option A** — 네이티브 파이프라인 포함 완전 포크 | 운영자 지시 (2026-08-12). 엔진 자체를 senpi/omo-native 방식으로 자체 구축하는 것이 목표 |
| **G2** 플랫폼 범위 | phase 1 = **darwin-arm64 + linux-x64(modern)** 2종. darwin-x64 / linux-arm64 / win32-x64 는 미지원 | 실사용 하드웨어가 맥북(arm64)과 x86_64 리눅스 서버 2대뿐. 아티팩트 8종 → 2종 |

Option C(upstream natives 소비 + F2 미러링)는 **선택되지 않음.** C1 하드룰상 예외 서명이 없으므로 P1b(네이티브 매트릭스)는
P1의 선행 조건이 되고, P1 exit 은 darwin-arm64 와 linux-x64 **양쪽**에서 자체 빌드 `.node` 런타임 증명을 요구한다.

## 2. 빌드 호스트

| 항목 | 값 |
|---|---|
| 호스트 | `192.168.10.14` (`byteworx-a6000`, ssh alias `a6000-scan`) |
| OS / arch | Ubuntu 24.04, Linux 6.8.0-124, x86_64 |
| CPU / MEM | 72 core / 125 GB |
| 작업 경로 | `/srv/fast/projects/worx/engine-fork` (ubuntu--vg-fast--lv, 345G 여유) |
| 권한 | `bworx` 사용자, **sudo 불필요** (툴체인 전부 작업경로 하위 설치) |

`.94`(Xeon E5-2699 v3, 8 core)도 후보였으나 리소스 열위로 `.14` 채택.

### 설치한 툴체인 (전부 `/srv/fast/projects/worx/engine-fork/toolchain/` 하위)

| 도구 | 버전 | 비고 |
|---|---|---|
| rustup | 1.29.0 | `RUSTUP_HOME`/`CARGO_HOME` 을 작업경로로 격리 |
| rustc / cargo | **1.97.0-nightly (37d85e592 2026-04-28)** | `rust-toolchain.toml` 의 `nightly-2026-04-29` 가 자동 선택 |
| bun | 1.3.14 | 시스템에 `unzip` 이 없어 릴리스 zip 을 python3 `zipfile` 로 추출 |
| node | **22.14.0** | 시스템 node 18.19.1 로는 napi CLI 가 `node:util.styleText` 부재로 실패 |

> 재현 시 주의: `unzip` 부재와 node 18 은 이 호스트에서 실제로 부딪힌 두 개의 함정이다. 둘 다 sudo 없이 우회했다.

## 3. 소스

| 항목 | 값 |
|---|---|
| 저장소 | `https://github.com/Yeachan-Heo/gajae-code.git` (public, MIT) |
| 태그 | `v0.13.1` |
| 커밋 | `63ea66995c4e20ced48528f83af6e5b055fff372` (2026-08-11T23:01:36+09:00) |
| 빌드 명령 | `packages/natives` → `bun run build` (= `bun scripts/build-native.ts`) |

크레이트는 **모노레포에 동봉**되어 있다(`crates/pi-natives`, `pi-ast`, `pi-iso`, `pi-shell`, `gjc-sdk`,
`brush-core-vendored`, `brush-builtins-vendored`, `git-daemon`). 별도 저장소 포크나 2차 동기화 부담은 **없다.**

## 4. 빌드 결과

| 항목 | 값 |
|---|---|
| 소요 시간 | **1분 32초** (wall) / 19분 07초 (user, 병렬) |
| 컴파일된 크레이트 | 378 |
| 산출물 | `native/pi_natives.linux-x64-modern.node`, **51,133,200 bytes** |
| 프로파일 | `local` (릴리스는 `PI_NATIVE_PROFILE=dist` 필요 — 미측정) |
| 변종 | `modern` (AVX2 자동 감지 → `RUSTFLAGS=-C target-cpu=x86-64-v3`) |

## 5. 검증 (주장 아님, 실행 결과)

`node -e` 로 산출된 `.node` 를 직접 require:

```
export 개수: 85
sentinel: [ '__piNativesV0_13_1', '__piNativesPublishOutcomeV1' ]
  applyBashFixups : OK
  astGrep : OK
  grep : OK
  glob : OK
  Shell : OK
  PtySession : OK
  NotificationServer : OK
  RecoveryFsRoot : OK
  applyOwnerOnlyPathSecurity : OK

applyBashFixups("cat foo.txt | head -5")
  → {"command":"cat foo.txt","stripped":["| head -5"]}
```

### 5b. darwin-arm64 (운영자 맥 M5) — 동일 절차로 성공

| 항목 | 값 |
|---|---|
| 작업 경로 | `~/bworx/engine-fork/gajae-code` (레포 외부, 격리) |
| 툴체인 | 기존 rustup 이 `rust-toolchain.toml` 의 `nightly-2026-04-29` 를 자동 설치·선택 |
| 프로파일 | `ci` (`CI` 환경변수 존재 → 자동 선택. `local` 보다 릴리스에 가까움) |
| 소요 시간 | 의존성 캐시 후 `pi-natives` 단독 **57.6초** / 콜드 전체 약 10분 |
| 산출물 | `native/pi_natives.darwin-arm64.node`, **46,162,912 bytes** |

```
export 개수: 86
sentinel: [ '__piNativesV0_13_1', '__piNativesPublishOutcomeV1' ]
  applyBashFixups / astGrep / grep / glob / Shell / PtySession /
  NotificationServer / RecoveryFsRoot / applyOwnerOnlyPathSecurity /
  ComputerController : 전부 OK
applyBashFixups("cat foo.txt | head -5")
  → {"command":"cat foo.txt","stripped":["| head -5"]}
```

**⚠️ 함정 (재현 시 반드시 지킬 것): `bun run build` 를 동시에 두 번 돌리면 실패한다.**
첫 시도에서 스크립트를 중복 기동해 두 프로세스가 같은 `native/.build/` 와 `index.d.ts` 를 놓고 경합했고,
`error: could not compile pi-natives (lib)` / `Internal Error: Build failed with exit code 101` 로 죽었다.
소스 문제가 아니며, 단일 실행으로 재시도하니 그대로 통과했다. CI 가 없어 수동 빌드인 만큼 **릴리스 절차에
"플랫폼당 빌드는 직렬, 동시 실행 금지" 를 명문화**해야 한다.

### 5c. 두 플랫폼 대조

| | linux-x64 (`.14`) | darwin-arm64 (맥 M5) |
|---|---|---|
| sentinel `__piNativesV0_13_1` | 있음 | 있음 |
| export 수 | 85 | 86 (`ComputerController` = macOS 전용 1종 추가) |
| 크기 | 51.1 MB | 46.2 MB |
| 빌드 (콜드) | 1분 32초 (72코어) | 약 10분 |
| 프로파일 | `local` | `ci` |

**AC-1 세 번째 체크박스가 요구한 "darwin-arm64 + linux-x64 자체 빌드"는 두 플랫폼 모두 실증되었다.**

- **동결 sentinel `__piNativesV0_13_1` 이 우리 빌드에 그대로 존재한다.** 로더가 natives 패키지 버전에서 파생시키는
  그 심볼이며(`loader-state.js:506`), 이것이 일치하면 포크한 TS 엔진이 우리 `.node` 를 무수정으로 로드한다.
- 단순 심볼 존재가 아니라 **실동작**까지 확인(`applyBashFixups` 가 파이프를 올바르게 분리).

### AVX2 변종 적합성

| 대상 | CPU | AVX2 |
|---|---|---|
| `.14` byteworx-a6000 | x86_64, 72c | YES |
| `.94` lab94 | Xeon E5-2699 v3 (Haswell) | YES |

두 배포 대상 모두 AVX2 보유 → **`modern` 단일 변종으로 충분**하며 `baseline` 별도 빌드는 불필요.
(AVX2 없는 호스트가 합류하면 그때 `TARGET_VARIANT=baseline` 로 1종 추가.)

## 6. 라이선스 계보 — AC-1 LICENSE 체크박스용 확정 사실

pi 계열 계보를 실제 저장소에서 확인:

```
badlogic/pi-mono              MIT © 2025 Mario Zechner            (순수 TS, crates 없음)
  ├─ can1357/oh-my-pi         MIT © 2025 Mario Zechner
  │                               + 2025-2026 Can Bölük           ← Rust 네이티브 층의 출처
  │                               crates: pi-ast pi-builtins pi-iso pi-natives pi-shell pi-voice pi-walker
  │    └─ Yeachan-Heo/gajae-code  MIT © 2025-2026 Yeachan-Heo     ← 우리가 포크할 대상
  └─ code-yeongyu/senpi       MIT © 2025 Mario Zechner
                                  + 2026 Yeongyu Kim              (crates: senpi-pty 1종, toolchain=stable)
                                  → npm 배포판 `omo-ai`
```

**확인된 결함 1건 (우리가 상속받는다):** `gajae-code` 의 `LICENSE` 는 Yeachan-Heo 만 저작권자로 표기하며,
Mario Zechner / Can Bölük 표기가 **없다.** 조상 표기는 `NOTICE.md` 에 산문으로만 존재한다. MIT 는
"위 저작권 고지를 모든 복제본에 포함할 것"을 요구하므로 이는 상류의 표기 누락이고, **우리가 포크해서 바이너리를
배포하는 순간 배포자는 우리가 된다.**

→ 우리 포크의 `LICENSE` + `NOTICE` 는 다음을 **모두** 실어야 한다:
Mario Zechner (pi-mono) · Can Bölük (oh-my-pi) · Yeachan-Heo (gajae-code) · byteWORX.
(비교 대상 `senpi` 는 이 표기를 올바르게 수행하고 있다 — 참고 선례.)

## 7. senpi / omo-ai 대조 (운영자 지시로 병행 검토)

| | senpi (code-yeongyu) | gajae-code (Yeachan-Heo) |
|---|---|---|
| 원본 | `badlogic/pi-mono` 직계 포크 | `can1357/oh-my-pi` 경유 |
| Rust 크레이트 | **`senpi-pty` 1종** | `pi-natives` 외 **7종+** |
| Rust 툴체인 | `stable`, profile=minimal | **`nightly-2026-04-29` 고정** |
| 네이티브 표면 | PTY 한정 | 셸/PTY/프로세스, 관리형 FS+내구성, **승인 중재 전송(NotificationServer/registerWorkflowGateAsk/resolveClaim)**, ast-grep/grep/glob, 컴퓨터 제어 |
| npm 배포 | `omo-ai` (beta 채널 전용, prerelease) | `gajae-code` |
| 라이선스 표기 | 조상 표기 **정확** | 조상 표기 **누락** (§6) |

**시사점 2가지.**

1. senpi 는 "순수 TS 엔진을 포크한 뒤 Rust 층을 스스로 얹은" 선례다. 즉 운영자가 말한 "omo native 처럼 자체 구축"은
   **Option A 그 자체**이며, 이 프로브는 그 경로가 우리 환경에서 실제로 열려 있음을 확인했다.
2. 두 계열은 조상/자손이 아니라 **형제 포크**다. senpi 의 Rust 표면이 PTY 1종뿐인 반면 gajae 계열은 승인 중재
   전송 계층까지 네이티브에 있다. AX 플랫폼(Review Hub 다중 승인자, 게이트 리스 정책)이 건드릴 층이 정확히
   그 네이티브 안이므로, 그 층의 소유권을 갖는 것이 Option A 의 전략적 값이다.

## 8. 남은 작업 (P1b)

- [x] **darwin-arm64 빌드 — 완료** (§5b). `nightly-2026-04-29` 자동 설치, `pi_natives.darwin-arm64.node` 46.2MB, sentinel 확인.
- [ ] `PI_NATIVE_PROFILE=dist` 릴리스 프로파일 빌드 1회 및 소요 시간 측정 (현재 수치는 `local`/`ci` 프로파일 기준)
- [ ] 두 플랫폼 산출물을 우리 스코프 패키지로 게시 (`npm.pkg.github.com`) + `scripts/verify-native-prebuilt.ts` 를 자체 빌드 기준으로 갱신
- [ ] `LICENSE`/`NOTICE` 에 §6 의 4개 저작권 라인 반영
- [ ] 릴리스 절차 문서화: CI 가 없으므로 맥 1대 + `.14` 1대에서 **직렬** 수동 2회 빌드가 릴리스 게이트 (동시 실행 금지 — §5b)
- [ ] 맥 로컬 빌드 산출물 보관 정책: `~/bworx/engine-fork` 의 cargo target 이 디스크를 잠식한다(맥 여유 53GB/460GB). 릴리스 후 `cargo clean` 또는 `.14` 로 빌드 일원화 검토

## 9. 재현 방법

```sh
ssh a6000-scan
WORK=/srv/fast/projects/worx/engine-fork
export RUSTUP_HOME="$WORK/toolchain/rustup" CARGO_HOME="$WORK/toolchain/cargo" BUN_INSTALL="$WORK/toolchain/bun"
export PATH="$WORK/toolchain/node/bin:$CARGO_HOME/bin:$BUN_INSTALL/bin:$PATH"
cd "$WORK/gajae-code/packages/natives" && bun run build
```

로그: `/srv/fast/projects/worx/engine-fork/logs/{provision.log,provision2.log,build-native.log}`
