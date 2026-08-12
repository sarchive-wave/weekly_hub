# Business Logic & Feature Definitions

현재 코드(`backend/app`, `frontend/src`) 기준 핵심 비즈니스 로직.

---

## 1. 주차(Week) 관리

- 생성: `(year, month, week_num)` 조합 고유. 중복 시 `409`. (`week_service.create_week`)
- 삭제: 주차 삭제 시 하위 `reports` → `report_entries`까지 DB CASCADE 삭제.
- 목록(`get_weeks`): 최신순(year·month DESC, week_num ASC) + 각 주차에 대해
  - `total_members` = 활성 사용자 수
  - `done_members` = 상태 `done` 보고 수
- 프론트 메인은 선택된 연/월로 클라이언트 필터링.

---

## 2. 주간보고(Report) 저장 — 전체 교체 방식

`report_service.save_report`:
```
1) (week, user) 보고 없으면 생성(status="draft")
2) 해당 report의 기존 report_entries 전부 DELETE
3) 요청 entries를 순회하며 재삽입 (없는 project_id는 skip)
4) commit 후 응답 재구성
```
- 항상 "현재 편집 화면의 슬롯 전체"를 보내 덮어쓰는 구조 → 부분 수정 개념 없음.
- 프론트(`PersonalReport`)는 projectId가 지정된 슬롯만 필터링해 전송.

---

## 3. 보고 상태(status) 흐름

```
none  ── 저장 ─▶ draft ── 작성완료 토글 ─▶ done
  ▲                                        │
  └────────────── 완료 해제 ───────────────┘
```
- 값: `none` / `draft` / `done` (그 외 `400`). (`update_status`)
- 조회 시 보고가 없으면 `none` + 빈 entries 반환(레코드 미생성).
- 프론트 작성완료 토글: `done` ↔ `none`.

---

## 4. 전체 취합(summary) 로직

`week_service.get_summary`:
- 모든 프로젝트를 정렬: **"휴가 및 교육"은 항상 마지막**, 영문 프로젝트 우선, 그 외 이름순.
- 각 프로젝트별로 팀원들의 `current_work`/`next_work`를 리스트로 취합(공백 제거, 빈 값 제외).
- 내용이 있는 프로젝트만 포함하되, "휴가 및 교육"은 내용 없어도 항상 노출(pinned, 맨 뒤).
- 사용자 순서는 `sort_order`, `id` 기준.

---

## 5. 금주/차주 날짜 라벨 계산 (프론트)

`PersonalReport.getWeekDateLabels`:
- `start_date`가 있으면 그 날을 월요일 기준으로, 없으면 year/month/week_num으로 해당 주 월요일 추정.
- 금주 = 월~금, 차주 = 익주 월~금. 라벨 예: `금주 8월 10일(월) ~ 8월 14일(금)`.
- 계산 불가 시 "금주"/"차주"로 표기.

---

## 6. 프로젝트 선택 UX (개인 보고 편집)

- 슬롯별 프로젝트 Select: 이미 다른 슬롯에서 선택된 프로젝트는 제외(중복 방지), 현재 슬롯 값은 포함.
- 정렬: 영문 시작 프로젝트 우선 → 영문/한글 각각 locale 정렬.

---

## 7. 계정 정책

- 생성: username 중복 `409`, password 6자 미만 `400`. (`user_service.create_user`)
- 수정: display_name/role/is_active만 변경(아이디·비밀번호 제외).
- **admin 계정 보호**: `username=="admin"`은 수정/삭제 `403`.
- 비밀번호 초기화/변경: 6자 이상 강제. 변경은 현재 비밀번호 검증 필요.
- 정렬: `reorder_users` — 전달 id 순서대로 `sort_order` 1..N 재할당.

---

## 8. 프로젝트 정책

- 이름 고유(생성/수정 시 중복 `409`).
- 삭제 시 참조 `report_entries`는 DB CASCADE로 함께 삭제.
- 정렬: `reorder_projects` — 전달 순서대로 `sort_order` 재할당(프론트는 @dnd-kit 드래그).

---

## 9. 인증/접근 제어

- 로그인·권한 상세는 `auth.md`. 핵심:
  - 관리자 전용: 계정 전반, 프로젝트 쓰기, 주차 생성/삭제.
  - 보고 접근: 관리자 또는 본인만(`_check_access`).
  - 프론트 라우트 가드 + axios 401 인터셉터로 세션 만료 처리.

---

## 10. 초기화(seed)

앱 기동 시 admin 역할 사용자가 없으면 `admin/admin1234` 계정 생성(`seed.run`).
