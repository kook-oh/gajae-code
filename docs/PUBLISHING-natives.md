# 네이티브 릴리스 절차 (P1b, 계획 §4b)

승인 계획: `docs/plans/ENGINE-PIVOT-PLAN.md` §4b · 실행 체크리스트: `docs/plans/EXECUTION-CHECKLIST.md` 슬라이스 7

이 문서는 **포크가 자체 빌드한 네이티브 애드온을 게시 가능한 패키지로 만드는 절차**의 정본이다.
상류 wrapper 의 릴리스 게이트는 이 레포에 존재하지 않았으므로 이관이 아니라 신규 작성이다.

## 1. 패키지 세트와 버전 정책 (§4b-1)

정본은 문서가 아니라 코드다: `scripts/native-release-contract.ts`. 게이트 3종이 모두 이 모듈을 읽는다.

| 패키지 | 역할 |
|---|---|
| `@bworx-io/worx-code-natives` | aggregator. 로더만 담고 `.node` 는 담지 않는다. 플랫폼 선택 계약을 소유한다. |
| `@bworx-io/worx-code-natives-darwin-arm64` | darwin-arm64 애드온 (`pi_natives.darwin-arm64.node`) |
| `@bworx-io/worx-code-natives-linux-x64` | linux-x64(modern) 애드온 (`pi_natives.linux-x64-modern.node`) |

**버전 정책 — sentinel 결합.** 세 패키지는 항상 같은 버전으로 게시한다. 로더는 기대 sentinel 을
`__piNativesV{version 의 비영숫자→_}` 로 파생하고(`native/loader-state.js`), Rust 애드온은 같은 이름의
export 를 내보낸다. 따라서 **버전을 올리면 반드시 재빌드해야 한다** — 재빌드 없이 버전만 올리면 로더가
애드온을 거부한다(조용한 불일치가 아니라 명시적 실패). `verify:native` 가 실제 바이트에서 sentinel 을
확인해 이 결합을 강제한다.

## 2. 플랫폼 선택 계약 (§4b-2)

`optionalDependencies` 는 **엔진 포크의 aggregator 매니페스트가 소유**한다. wrapper 나 소비자 매니페스트에
넣지 않는다. 각 플랫폼 패키지는 `os`/`cpu`(+ linux 는 `libc: ["glibc"]`)로만 선택된다.

**미지원 플랫폼의 실패 방식 = 로드 시점 단일 명시 오류.** `loadNative()` 는 지원 목록에 없는 platformTag 에
대해 플랫폼 이름과 지원 목록을 담은 `Error` 를 던진다. 프리모템 S1 이 경고한 **침묵 실패(`--version` 만
통과하고 natives 툴이 전멸)** 는 금지이며, `scripts/native-release-gates.test.ts` 가 로더의 거부 경로가
throw 인지(경고·null 반환이 아닌지) 검사한다.

## 3. 무결성 체인 (§4b-3)

```
source_commit + rust_toolchain + build_profile
  → node_sha256      (빌드가 .node 옆 .build.json 에 기록)
  → tarball_sha256   (selftest:pack 이 pack 산출물에서 계산)
  → publish 영수증   (게시 후 레지스트리 응답을 같은 매니페스트에 append)
```

**"재현 가능"의 정의: 보관 아티팩트에 대해 해시를 재계산하면 기록값과 일치한다.**
비트 동일 재빌드는 목표에서 **명시적으로 제외**한다(nightly 툴체인·thin LTO·병렬 codegen).
`verify:provenance` 는 tarball 을 다시 해싱하고, **애드온 해시는 작업 트리가 아니라 tarball 내부 멤버에서**
재계산한다 — 게시되는 바이트가 곧 검증 대상이어야 하기 때문이다.

## 4. 서명 결정 (§4b-4)

**명시적 비서명.** 근거는 `docs/PIVOT-FREEZE.md` §11 에 기록돼 있다. 릴리스 매니페스트는 `"signing": "none"`
필드를 반드시 포함하며 `verify:provenance` 가 이를 요구한다 — 절차가 서명 검증을 암묵적으로 시사하지
못하게 하기 위해서다. 서명을 도입하려면 이 필드와 게이트를 함께 바꾼다.

## 5. 검증 게이트 3종 (§4b-5)

```sh
bun run verify:native        # 매트릭스: 매니페스트·선택 계약·설치 훅 부재·스테이징·sentinel·digest
bun run selftest:pack        # 실제 pack → tarball 내용물 검사 → digest 기록 → 릴리스 매니페스트 생성
bun run verify:provenance    # 매니페스트 스키마 + 해시 재계산 앵커 (CI 필드 거부)
bun run verify:release       # 위 3종을 순서대로 (artifacts/native-release 에 산출)
```

`verify:provenance` 는 상류 게이트의 재조준이 아니라 **재작성**이다. 상류는 `ci_run_url`·`workflow_ref` 를
필수로 요구하고 `gh run view` 서버측 대조를 유일한 독립 앵커로 삼았다. 이 레포에는 `.github` 자체가 없고
릴리스는 전수 수동이므로 그 필드를 채우는 것은 **provenance 날조**다. 따라서 해당 필드는 매니페스트
어느 깊이에 있든 **거부**하고, 대신 `builder`/`build_host` 를 요구한 뒤 신뢰를 해시 재계산에 둔다.

## 6. 릴리스 실행 순서

natives 는 **플랫폼당 직렬**로 빌드한다(동시 실행 시 `native/.build/`·`index.d.ts` 경합으로 exit 101).

```sh
# 1) darwin-arm64 호스트에서
PI_NATIVE_PROFILE=dist bun --cwd=packages/natives run build
bun run stage:native                       # 빌드 산출물 + 영수증을 플랫폼 패키지로 스테이징

# 2) linux-x64 호스트에서 (같은 커밋)
TARGET_VARIANT=modern PI_NATIVE_PROFILE=dist bun --cwd=packages/natives run build
bun run stage:native --platform linux-x64

# 3) 양 플랫폼 산출물이 한 트리에 모인 상태에서
bun run verify:release

# 4) 게시 (npm.pkg.github.com) — aggregator 를 마지막에
bun pm pack --destination artifacts/native-release   # 또는 verify:release 산출물 재사용
npm publish --registry https://npm.pkg.github.com <platform tarballs...>
npm publish --registry https://npm.pkg.github.com <aggregator tarball>

# 5) 게시 후: 레지스트리 영수증을 릴리스 매니페스트에 append 하고 게이트를 재실행
bun run verify:provenance artifacts/native-release/native-release-manifest.json
```

플랫폼 패키지를 aggregator 보다 **먼저** 게시한다. 반대 순서면 aggregator 를 설치한 소비자가 아직 존재하지
않는 optional dependency 를 만난다.

## 7. 현재 상태 (2026-08-18)

- 게이트 3종 + 스테이징 스크립트 + 계약 모듈: **작성 완료**, darwin-arm64 실측으로 통과.
- darwin-arm64: `ci` 프로파일 산출물로 체인 전 구간(수신증 → .node digest → tarball digest → 재계산) 검증됨.
- linux-x64: 이 맥에 산출물이 없어 `selftest:pack`/`verify:provenance` 가 **의도대로 실패**한다
  (애드온 없는 531B tarball 을 게시로 흘려보내지 않는다). 리눅스 호스트에서 §6 의 2단계를 수행해야 한다.
- `dist` 프로파일 빌드 성공·소요는 **양 플랫폼 모두 미실측** — 현재 산출물은 `ci` 프로파일이다.
- 게시는 아직 수행하지 않았다(자격증명·승인 필요).
