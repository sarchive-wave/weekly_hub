# technical.md
# AI Weekly Hub - 테크니컬 명세
# DB 스키마, API 구성, 메뉴 구조, 기술 스펙 정의

---

## 화면 흐름

```
[로그인 페이지]
    ↓ 로그인 성공
[메인 페이지]
    - 제목: AI Weekly Hub
    - 주차별 카드 목록 (관리자가 직접 생성)
      예) 2026년 7월 1주차 / 7월 2주차 / ...
      카드 정보: 작성 인원 수 / 완료 인원 수
    ↓ 카드 클릭
[주차 상세 페이지]
    ├── 왼쪽 사이드바 (고정)
    │   ├── [← 목록으로]
    │   └── 팀원 이름 목록 (설정에서 등록된 순서)
    │       상태 색상: 미작성=회색, 작성중=노란색, 완료=파란색
    │       클릭 시 → 해당 팀원 주간보고 작성 화면
    └── 오른쪽 메인 영역
        ├── 기본(팀원 미선택): 전체 주간보고 (프로젝트별 취합, 읽기 전용, 이름 숨김)
        └── 팀원 선택 시: 해당 팀원 주간보고 작성 화면
            ├── 상단: 상태 토글 버튼 [작성중] / [작성완료]
            ├── 프로젝트 선택 (설정에서 등록된 목록, 복수 선택 가능)
            └── 선택된 프로젝트별 카드
                ├── 금주 업무 (Textarea)
                └── 차주 업무 (Textarea)

[설정 페이지] - 관리자 전용
    ├── 계정 관리 (생성/수정/삭제, 비밀번호 초기화)
    ├── 팀원 관리 (이름 등록/순서 변경)
    └── 프로젝트 관리 (생성/수정/삭제/순서 변경)

[프로필] - 모든 사용자
    └── 비밀번호 변경
```

---

## DB 스키마

### users
```sql
id            INTEGER PRIMARY KEY AUTOINCREMENT
username      VARCHAR(50) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
role          VARCHAR(10) NOT NULL DEFAULT 'user'   -- 'admin' | 'user'
display_name  VARCHAR(50) NOT NULL
is_active     BOOLEAN NOT NULL DEFAULT 1
sort_order    INTEGER DEFAULT 999
created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
```

### projects
```sql
id         INTEGER PRIMARY KEY AUTOINCREMENT
name       VARCHAR(100) UNIQUE NOT NULL
sort_order INTEGER DEFAULT 999
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### weeks
```sql
id         INTEGER PRIMARY KEY AUTOINCREMENT
year       INTEGER NOT NULL
month      INTEGER NOT NULL
week_num   INTEGER NOT NULL
title      VARCHAR(50) NOT NULL    -- 예: "7월 1주차"
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
UNIQUE(year, month, week_num)
```

### reports
```sql
id         INTEGER PRIMARY KEY AUTOINCREMENT
week_id    INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE
user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
status     VARCHAR(10) NOT NULL DEFAULT 'none'   -- 'none' | 'draft' | 'done'
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
UNIQUE(week_id, user_id)
```

### report_entries
```sql
id           INTEGER PRIMARY KEY AUTOINCREMENT
report_id    INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE
project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE
current_work TEXT DEFAULT ''
next_work    TEXT DEFAULT ''
UNIQUE(report_id, project_id)
```

---

## API 전체 목록

### 인증
```
POST   /api/v1/auth/login            # 로그인 → JWT
GET    /api/v1/auth/me               # 내 정보
PUT    /api/v1/auth/change-password  # 비밀번호 변경
```

### 계정 관리 (관리자)
```
GET    /api/v1/users                 # 전체 목록
POST   /api/v1/users                 # 생성
PUT    /api/v1/users/{id}            # 수정
DELETE /api/v1/users/{id}            # 삭제
POST   /api/v1/users/{id}/reset-password  # 비밀번호 초기화
PUT    /api/v1/users/reorder         # 순서 변경
```

### 프로젝트 (관리자)
```
GET    /api/v1/projects              # 목록
POST   /api/v1/projects              # 생성
PUT    /api/v1/projects/{id}         # 수정
DELETE /api/v1/projects/{id}         # 삭제
PUT    /api/v1/projects/reorder      # 순서 변경
```

### 주차
```
GET    /api/v1/weeks                 # 목록 (로그인 필요)
POST   /api/v1/weeks                 # 생성 (관리자)
DELETE /api/v1/weeks/{id}            # 삭제 (관리자)
GET    /api/v1/weeks/{id}/summary    # 전체 주간보고 취합 (전체)
GET    /api/v1/weeks/{id}/members    # 팀원별 상태 목록 (전체)
```

### 주간보고
```
GET    /api/v1/reports/{week_id}/{user_id}        # 개인 보고서 조회
PUT    /api/v1/reports/{week_id}/{user_id}        # 저장 (본인 or 관리자)
PATCH  /api/v1/reports/{week_id}/{user_id}/status # 상태 변경 (본인 or 관리자)
```

---

## 권한 매트릭스

| 기능 | 일반 사용자 | 관리자 |
|------|------------|--------|
| 전체 주간보고 열람 | ✅ | ✅ |
| 팀원별 상태 확인 | ✅ | ✅ |
| 본인 보고서 작성/수정 | ✅ | ✅ |
| 타인 보고서 열람 | ❌ | ✅ |
| 타인 보고서 수정 | ❌ | ✅ |
| 주차 생성/삭제 | ❌ | ✅ |
| 계정/프로젝트/팀원 관리 | ❌ | ✅ |

---

## 개발 히스토리

### 2026-06-26
- 프로젝트 기획 시작
- 화면 구조 확정:
  - 메인: 주차별 카드
  - 상세: 기본=전체주간보고(읽기전용), 좌사이드바=팀원 이름 클릭→개인 작성화면
  - 팀원 상태 색상: 미작성(회색), 작성중(노란색), 완료(파란색)
- JWT 기반 인증, admin/user 역할
- 포트: Frontend 5174, Backend 8081
