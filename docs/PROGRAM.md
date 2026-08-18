# byteWORX 프로그램 마스터 문서 (정본)

> **이 문서가 프로그램 전체의 단일 진입점이다.** 어떤 작업공간·어떤 에이전트(worx / senpi / claude / codex)로
> 세션을 열든, 계획·아키텍처·설계에 대한 질문은 이 문서와 아래 정본 링크에서 답해야 한다.
>
> **갱신 규칙 (비협상):** 계획·아키텍처·설계·메뉴 구성에 영향을 주는 변경은 **같은 커밋/PR에 해당 정본 문서
> 갱신을 포함해야 한다.** 정본에 없는 구상은 존재하지 않는 것으로 취급한다 — "채팅에서 정했다"는 정본이 아니다.

최종 갱신: 2026-08-18 · 관리 주체: 운영자 + 오케스트레이터 에이전트

## 트랙과 정본 위치

| 트랙 | 내용 | 정본 위치 | 상태 |
|---|---|---|---|
| **T1. 엔진 피벗** | gajae-code 포크 → worx-code 자체 엔진 (gjc 이름 완전 제거, 2플랫폼 natives 자체 빌드, wrapper 폐지) | **실행 체크리스트 `docs/plans/EXECUTION-CHECKLIST.md`** + 승인 계획 `docs/plans/ENGINE-PIVOT-PLAN.md` (rev.6) + `ENGINE-PIVOT-PLAN-BASE.md` (기준 문서) + `EVIDENCE-p0-4-*.md` (실측 증거) | **실행 중** — P0-FREEZE·P1 리네임 6/6 완료(스코프·내부 심볼 포함), P1b 패키징 계약·게이트 3종 작성 완료 / linux 산출물·게시 대기 |
| **T2. AX 플랫폼** | Temporal 기반 워크플로 엔진 + Review Hub + 칸반 + 설계·문서(SSOT) + worx-code 에이전트 연동 | **`bworx-io/worx-ax` 레포 `docs/`** — ARCHITECTURE.md(아키텍처·결정·메뉴·워크플로·로드맵) | **Phase 0 통과(2026-08-18)** — Go 언어 게이트 확정, 자체빌드 Temporal 이미지 + kill -9 재개 영수증. Phase 1(auth·문서코어·Review Hub) 대기 |
| **T3. IDE** | ORCA 포크 = ide.byteworx.dev = 유일한 사용자 웹 (AX 패널 2단 마운트 숙주) | `bworx-io/worx-ide` (패치·매니페스트) · 실행 계획은 T1 계획 §5(P3) | 엔진 계획에 종속 |
| **참조** | review-system(ems-review) — EMS 상세설계 시스템, **존치**. AX가 행동 계약만 차용 | `~/Dev/review-system` (EMS 트랙 소유) | 프로덕션, frozen 관점에선 무관 |
| **미러(T0)** | temporal — 자체 이미지 빌드용 소스 권위 · source-identical 유지, 분기 금지 | `bworx-io/temporal` (private, 2026-08-18 미러 완료) | 미러 온리 |
| **폐지 예정** | worx-code-wrapper — 마이그레이션 소스, frozen | `bworx-io/worx-code-wrapper` (계획 §10.5 cutover 4조건 후 아카이브) | frozen |

## 핵심 결정 요약 (상세는 각 정본)

- **G1 = Option A**: 네이티브 파이프라인 포함 완전 포크. 실증 완료(darwin-arm64 + linux-x64-modern 자체 빌드, sentinel 일치).
- **G2**: 지원 플랫폼 = darwin-arm64 + linux-x64(modern) 2종만.
- **포크가 제품이다**(계획 §10): 이 레포가 `worx` CLI를 직접 산출. wrapper는 기능 이관(P4) 후 아카이브.
- **이름 제거**(계획 §9): `GJC_*` env 282개 → `WORX_*`, 행동 식별자 리터럴 7곳(§9.2b), MCP 툴명 `gjc_*`→`worx_*`(P1에 완료).
- **보존 표면 3종**(계획 §9.1): S1 Coordinator MCP(AX 소비) · S2 ACP(IDE 소비) · S3 헤드리스 CLI `-p`/`--mode rpc`(ems-review 소비).
- **AX**: Temporal 셀프호스트(미러 T0→설정인가 T1→Go임베드 T2, 소스분기 T3 금지) · 백엔드 Go(**Phase 0에서 확정**) · 자체 SSO 브로커(office-JWT 비종속) · 한 엔진 두 소비 모드(ACP 인터랙티브 / Coordinator MCP 워크플로 스텝).

## 작업 규율

1. 이 레포에서 계획을 바꾸면 → `docs/plans/*` 갱신이 같은 변경에 포함될 것.
2. AX 관련 결정/설계 변경 → `worx-ax/docs/*` 갱신이 같은 변경에 포함될 것.
3. 새 트랙/레포가 생기면 → 이 문서의 트랙 표에 행 추가.
4. 에이전트는 세션 시작 시 이 문서를 읽고, "계획에 없다"고 답하기 전에 위 정본 위치를 먼저 확인할 것.
