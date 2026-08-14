# Authentication & Account Management

JWT 인증 + 전역/프로젝트별 역할 권한.

## 인증
- **토큰**: JWT(python-jose, `auth/jwt.py`). payload `{sub, user_id, role, exp}`, 만료 `ACCESS_TOKEN_EXPIRE_MINUTES`(기본 480분).
- **비밀번호**: bcrypt(passlib), 평문 저장 안 함.
- **전달/저장**: `Authorization: Bearer`, 프론트 `localStorage['token']`. axios 인터셉터가 자동 첨부하고 401 시 토큰 제거 후 `/login`.
- 비활성(`is_active=false`) 사용자는 로그인 불가.

## 권한 계층
- **전역역할** `users.role`: `admin` / `user`
- **프로젝트별역할** `project_members.role`: `pm` / `member` (사람마다 프로젝트별로 다를 수 있음)
- 의존성: `get_current_user`(로그인+활성), `require_admin`(role=admin).
- 프로젝트 수정/완료/팀원배정 권한: `ensure_can_edit` = 관리자 이거나 해당 프로젝트 PM.

## 권한 매트릭스 (설정 > 시스템 관리)
- 화면: 역할(관리자/PM/팀원) × 권한(프로젝트 생성/수정/삭제, 팀원 배정, 주차 관리, 유형·상태 관리, 계정 관리) 체크박스.
- 저장: `public.role_permissions`(role, permission, enabled). 카탈로그·기본값은 `permission_service`.
- **주의**: 현재 실제 API 접근제어는 역할 기반(관리자/담당 PM) 하드코딩. 이 매트릭스는 설정 저장소이며 세부권한 실시간 적용은 순차 반영 예정.

## 역할별 기능 요약
| 기능 | 관리자 | PM(담당) | 팀원 |
|---|:--:|:--:|:--:|
| 대시보드·프로젝트·종료 조회 | ✅ | ✅ | ✅ |
| 프로젝트 생성 | ✅ | ❌ | ❌ |
| 프로젝트 수정·완료·팀원배정 | ✅ | ✅(담당) | ❌ |
| 유형/상태·계정·권한 관리 | ✅ | ❌ | ❌ |
| 주차 생성/수정/**삭제(소프트)** | ✅ | ❌ | ❌ |
| 본인 주간보고 작성 | ➖ | ✅ | ✅ |
| 타인 주간보고 **조회** | ✅ | ❌ | ❌ |
| 타인 주간보고 **작성/수정** | ❌ | ❌ | ❌ |

> ➖ 관리자는 주간보고 **작성 대상에서 제외**(멤버 목록에 안 나타남). 작성/수정은 **오직 본인만** — 관리자도 타인 보고는 조회만(read-only).

## 계정 관리 (설정 > 인력 관리, 관리자)
- 생성: username(고유)/password(6자+)/display_name/role/직책/소속 + 참여(대시보드/주간보고)
- 수정: **아이디 변경 가능**(중복 검사) + 이름/직책/소속/역할/활성/참여
- 비밀번호 초기화, 정렬(직책순→가나다 표시, 비활성은 맨 아래)
- **admin 계정 보호**: 수정/삭제 403
- **퇴사자 = 소프트 삭제(비활성화)**: 삭제 버튼은 `is_active=false` 처리(하드 삭제 아님, 가역적). 과거 주간보고 기록은 **보존**되고, 멤버 목록에 이름 뒤 `(비활성)`으로 맨 아래 표시. `POST /users/{id}/activate`로 재활성화 가능.
- **참여 플래그**(`in_dashboard`/`in_weekly`)는 작성/선택 대상만 제어할 뿐 **메뉴를 숨기지 않는다**. `in_weekly=false`여도 주간보고 메뉴·전체취합 조회는 그대로 가능, 단지 작성 멤버 목록에서 빠짐.

## 기본 계정
| username | password | role |
|---|---|---|
| admin | admin1234 | admin |
> 운영 전 비밀번호 변경 및 `.env`의 `SECRET_KEY` 교체 필수.
