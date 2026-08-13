# Backend API Specification

> DB 설계는 `db.md`, 인증/권한은 `auth.md`. 이 문서는 **API 명세**만 다룬다.

## 공통
- Base: `/api/v1`, 인증 헤더 `Authorization: Bearer <JWT>`
- 권한 의존성: `get_current_user`(로그인), `require_admin`(role=admin)
- 응답: 대부분 모델 직접 반환. 액션형 일부(reorder/reset-password/change-password/my-order/권한)는 `{success,data,message}` 또는 매트릭스 dict.

## Auth `/api/v1/auth`
| Method | Endpoint | 인증 | 설명 |
|---|---|---|---|
| POST | `/login` | - | `{username,password}` → `{access_token,token_type}` |
| GET | `/me` | 로그인 | 현재 사용자 |
| PUT | `/change-password` | 로그인 | 본인 비밀번호 변경 |

## Users `/api/v1/users` (관리자 전용)
| Method | Endpoint | 설명 |
|---|---|---|
| GET | `` | 사용자 목록(직책순→가나다) |
| POST | `` | 생성 `{username,password,display_name,role,position?,team?}` |
| PUT | `/reorder` | 순서 재정렬 |
| PUT | `/{id}` | 수정(**username 변경 가능**, display_name/role/is_active/position/team) |
| DELETE | `/{id}` | 삭제 |
| POST | `/{id}/reset-password` | 비밀번호 초기화 |

- 아이디 중복 409, 비밀번호 6자 미만 400, **admin 계정 수정/삭제 403**(보호).
- 퇴사자는 삭제 대신 `is_active=false` 권장(주간보고 기록 CASCADE 삭제 방지).

## Projects `/api/v1/projects`
| Method | Endpoint | 인증 | 설명 |
|---|---|---|---|
| GET | `?status=&visible=` | 로그인 | 목록. status=진행중/완료, visible=dashboard/weekly(노출필터). 개인순서 적용 |
| PUT | `/my-order` | 로그인 | 개인 표시순서 저장 `{ids}` |
| POST | `` | 관리자 | 생성(코드 미입력 시 PRJ-000N 자동) |
| GET | `/{id}` | 로그인 | 상세 |
| PUT | `/{id}` | 관리자·담당PM | 부분 수정(보낸 필드만, 필드별 감사로그) |
| DELETE | `/{id}` | 관리자 | 삭제 |
| POST | `/{id}/complete` | 관리자·담당PM | 완료(종료) → 노출 자동 OFF |
| POST | `/{id}/reopen` | 관리자·담당PM | 재개(진행중) → 노출 자동 ON |
| GET/PUT | `/{id}/members` | 조회=로그인, 저장=관리자·PM | 팀원 배정 |
| GET | `/{id}/logs` | 로그인 | 변경 이력(감사) |
| GET | `/{id}/weekly` | 로그인 | 주차별 주간 진행(read-only) |

- 생성 바디 주요 필드: `code?, name, full_name?, description?, type_id?, status_id?, pm_user_id?, start_date?, end_date?, nas_path?, git_url?, show_in_dashboard?, show_in_weekly?`
- 이름/코드 중복 409. status는 complete/reopen로만 변경(일반 수정 제외).

## Project Meta `/api/v1/project-meta/{kind}` (kind = type|status)
| Method | Endpoint | 인증 | 설명 |
|---|---|---|---|
| GET | `/{kind}` | 로그인 | 유형/상태 목록 |
| POST | `/{kind}` | 관리자 | 추가 |
| PUT | `/{kind}/{id}` | 관리자 | 수정 |
| DELETE | `/{kind}/{id}` | 관리자 | 삭제(사용 중이면 409) |

## Dashboard `/api/v1/dashboard`
| GET | `` | 로그인 | 대시보드(진행중 items + 상태/유형 집계), 개인순서·팀원이름 포함 |

## Weeks `/api/v1/weeks`
| Method | Endpoint | 인증 | 설명 |
|---|---|---|---|
| GET | `` | 로그인 | 주차 목록(+완료 인원수) |
| POST | `` | 관리자 | 주차 생성(종료일<시작일 400) |
| PUT | `/{id}` | 관리자 | 주차 수정(날짜 검증) |
| DELETE | `/{id}` | 관리자 | 삭제(보고 CASCADE) |
| GET | `/{id}/members` | 로그인 | 멤버 상태(직책순) |
| GET | `/{id}/summary` | 로그인 | 전체 취합(주간보고 노출 프로젝트만) |

## Reports `/api/v1/reports`
| Method | Endpoint | 인증 | 설명 |
|---|---|---|---|
| GET | `/{week_id}/{user_id}` | 본인·관리자 | 보고 조회 |
| PUT | `/{week_id}/{user_id}` | 본인·관리자 | 저장(entries 전체 교체) |
| PATCH | `/{week_id}/{user_id}/status` | 본인·관리자 | 상태 변경 |

- 작성 드롭다운의 프로젝트는 **진행중 + 주간보고 노출**만(`visible=weekly`).

## Permissions `/api/v1/permissions` (관리자 전용)
| Method | Endpoint | 설명 |
|---|---|---|
| GET | `` | 역할×권한 매트릭스(카탈로그 + 저장값 병합) |
| PUT | `` | 토글 `{role,permission,enabled}` 저장 |

> 현재 실제 접근제어는 역할 기반(관리자/담당 PM) 하드코딩이며, 이 매트릭스는 설정 저장소. 세부권한 실시간 적용은 향후.

## 기타
`GET /` 헬스, `GET /docs` Swagger.

## 에러 코드
401 미인증 · 403 권한 없음(관리자/타인보고/admin보호) · 404 없음 · 409 중복(username/code/name/week/마스터 사용중) · 400 유효성(비번·날짜·status) · 422 바디 검증.
