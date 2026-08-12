# Authentication & Account Management

JWT 기반 인증과 역할(관리자/일반) 권한 정책 정의.

## 인증 방식

- **토큰**: JWT (python-jose, `app/auth/jwt.py`)
  - 서명: `SECRET_KEY` + `ALGORITHM`(기본 HS256), 만료 `ACCESS_TOKEN_EXPIRE_MINUTES`(기본 480분=8시간)
  - payload: `{ sub: username, user_id, role, exp }`
- **비밀번호**: bcrypt 해시(passlib), 평문 저장 안 함 (`auth_service.hash_password/verify_password`)
- **전달**: HTTP 헤더 `Authorization: Bearer <access_token>`
- **프론트 저장**: `localStorage['token']` — axios 요청 인터셉터가 자동 첨부, 401 응답 시 토큰 제거 후 `/login` 이동 (`api/client.ts`)

---

## 로그인 흐름

```
POST /api/v1/auth/login {username, password}
  → 활성 사용자 조회 + bcrypt 검증
  → 성공: access_token 발급 / 실패: 401
프론트: 토큰 저장 → GET /api/v1/auth/me 로 사용자 로드 → AuthContext 반영
```

- 비활성(`is_active=false`) 사용자는 로그인 불가.
- `AuthContext`가 앱 로드시 토큰 있으면 `/me`로 세션 복원, 실패 시 토큰 삭제.

---

## 권한 의존성 (`app/auth/dependencies.py`)

| 의존성 | 검사 | 실패 |
|--------|------|------|
| `get_current_user` | 토큰 유효 + 사용자 존재 + `is_active` | 401 |
| `require_admin` | 위 + `role == "admin"` | 403 |

---

## 역할 & 권한 매트릭스

| 기능 | 일반(user) | 관리자(admin) |
|------|:---:|:---:|
| 로그인 / 내 정보 / 비밀번호 변경 | ✅ | ✅ |
| 주차 목록·상세·멤버·취합 조회 | ✅ | ✅ |
| 본인 주간보고 조회/작성/상태변경 | ✅ | ✅ |
| **타인** 주간보고 조회/작성 | ❌(403) | ✅ |
| 주차 생성/삭제 | ❌ | ✅ |
| 프로젝트 생성/수정/삭제/정렬 | ❌(조회는 가능) | ✅ |
| 계정 생성/수정/삭제/정렬/비번초기화 | ❌ | ✅ |
| 설정 페이지 접근 | ❌(라우트 가드) | ✅ |

- 보고 접근검사(`routers/reports.py::_check_access`): 관리자이거나 `current_user.id == user_id`만 허용.
- 프론트 라우트 가드(`App.tsx`): `RequireAuth`(로그인), `RequireAdmin`(관리자) — 미충족 시 리다이렉트.

---

## 계정 관리 (관리자, 설정 > 계정 관리 탭)

- 생성: username(고유)/password(6자 이상)/display_name/role
- 수정: display_name/role/is_active (username·password 불변)
- 비밀번호 초기화: 관리자가 새 비밀번호 지정
- 정렬: 드래그로 sort_order 재할당
- **admin 계정 보호**: `username == "admin"` 계정은 수정·삭제 시 `403` (`user_service.update_user/delete_user`)

---

## 기본 계정 (seed)

| username | password | role |
|----------|----------|------|
| admin | admin1234 | admin |

> 운영 배포 시 **즉시 비밀번호 변경** 및 `.env`의 `SECRET_KEY` 교체 권장(현재 기본값은 개발용 placeholder).

---

## 보안 주의 (현재 상태)

- `.env`의 `SECRET_KEY`가 개발용 고정값(`...change-in-production`) — 운영 전 교체 필수.
- 토큰 만료 8시간, 리프레시 토큰/로그아웃 서버 무효화는 없음(클라이언트에서 토큰 폐기).
- DB `role_permissions` 테이블은 현재 미사용(코드 연결 없음) — 세분화 권한 도입 시 활용 여지(`db.md`).
