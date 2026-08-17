# WORX 리네임 — 사용자 이관 절차

이 포크는 상류 `gjc` 명칭을 완전히 제거했다. **하위호환 폴백은 제공하지 않는다**(승인된 계획 §9.2의 클린 브레이크).
따라서 기존 `gjc` 설치에서 넘어올 때 아래 이관을 **한 번** 수동으로 수행해야 한다.

## 1. 사용자 설정·상태 디렉터리

```sh
# 자격증명·세션·에이전트 상태가 모두 여기 있다
mv ~/.gjc ~/.worx
```

이관하지 않으면 재로그인(`worx /login`)과 프로바이더 재설정이 필요하다. 세션 이력도 새로 시작된다.

## 2. 프로젝트별 상태 디렉터리

작업 중이던 각 레포에서:

```sh
mv .gjc .worx
```

`.worx/` 에는 계획 아티팩트(ralplan), 원장(ultragoal), 세션 상태가 들어 있다. 이관하지 않으면 진행 중이던
워크플로 상태를 잃는다(파일 자체는 `.gjc/` 에 그대로 남으므로 되돌릴 수 있다).

## 3. 환경변수

`GJC_*` 는 전부 `WORX_*` 로 바뀌었다. 셸 프로파일(`~/.zshrc` 등)에 export 해 둔 것이 있으면 이름을 바꿔라.

```sh
grep -n "GJC_" ~/.zshrc ~/.bashrc ~/.profile 2>/dev/null
```

자주 쓰이는 것: `GJC_CONFIG_DIR` → `WORX_CONFIG_DIR`, `GJC_CODING_AGENT_DIR` → `WORX_CODING_AGENT_DIR`,
`GJC_AUTH_BROKER_URL` → `WORX_AUTH_BROKER_URL`.

## 4. 외부 소비자

- **Coordinator MCP 를 쓰는 컨트롤러**: 툴 이름이 `gjc_coordinator_*` / `gjc_delegate_*` → `worx_coordinator_*` /
  `worx_delegate_*` 로 바뀌었다. MCP 설정의 서버 키도 `gjc_coordinator` → `worx_coordinator`,
  커맨드는 `gjc` → `worx`. `worx setup hermes --install` 로 재생성하는 것이 가장 안전하다.
- **헤드리스 CLI 를 subprocess 로 부르는 시스템**(예: ems-review): 바이너리 경로만 포크 CLI(`worx`)로 갱신하면 된다.
  플래그(`-p` / `--session-dir` / `--append-system-prompt` / `--tools` / `--continue` / `--mode rpc`)는 그대로 보존된다.
- **플러그인 디렉터리**: `plugins/gajae-code/` → `plugins/worx-code/`.

## 5. 네이티브 애드온

`WORX_*` 환경변수를 읽는 Rust 크레이트가 있으므로 이 리네임 이후의 `.node` 는 재빌드본이어야 한다.
darwin-arm64 / linux-x64(modern) 두 플랫폼 모두 재빌드 완료 상태다(플랫폼당 직렬 빌드 규칙 유지).

## 6. 내부 리네임(슬라이스 6) 이후 추가 이관

포크 내부의 `gjc` 경로·심볼이 `worx` 로 바뀌면서 **로컬 상태 파일의 위치·이름 몇 가지가 함께 바뀌었다.**
하위호환 폴백은 여기서도 제공하지 않는다.

```sh
# 프로젝트별 플러그인 설치 루트
mv .gjc/gjc-plugins .worx/worx-plugins 2>/dev/null || mv .worx/gjc-plugins .worx/worx-plugins

# 사용자 플러그인 루트와 lock 파일
mv ~/.worx/agent/gjc-plugins ~/.worx/agent/worx-plugins
mv ~/.worx/plugins/gjc-plugins.lock.json ~/.worx/plugins/worx-plugins.lock.json

# 로그·크래시 산출물 (이관하지 않아도 새 파일이 생길 뿐, 과거 로그만 남는다)
#   ~/.worx/**/gjc.YYYY-MM-DD.log  → worx.YYYY-MM-DD.log
#   ~/.worx/**/gjc-crash.log       → worx-crash.log
```

진행 중이던 워크플로 상태(`.worx/_session-*/state/**`)는 그대로 읽히지만, 수신증의 `owner` 값이
`gjc-runtime` 계열에서 `worx-runtime` 계열로 바뀌었다. 구 수신증은 미지 owner 로 취급돼 기본값으로
정규화된다(상태 자체는 보존, 수신증 출처 표기만 초기화).

바뀌지 **않은** 것: `package.json` 의 `gjc` 매니페스트/설정 키, ACP `_meta.gjc` 와 `_gjc/sdk/*` 메서드,
codex-handoff 의 `gjc_session_id`/`gjc_turn_id`, tmux 세션 태그 `@gjc-*`. 서드파티/IDE/영속 계약이라
그대로 둔다.
