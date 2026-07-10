# auth.md
# AI Weekly Hub - 인증/보안 명세
# JWT 로그인, 권한 관리, 비밀번호 정책 정의

---

## 인증 방식

- JWT (JSON Web Token), Bearer Token 방식
- 토큰 저장: 클라이언트 localStorage
- 헤더: `Authorization: Bearer {token}`
- 토큰 만료: 8시간 (ACCESS_TOKEN_EXPIRE_MINUTES=480)

---

## 로그인 플로우

```
1. POST /api/v1/auth/login  { username, password }
2. 서버: bcrypt 비밀번호 검증 → JWT 발급
3. 클라이언트: localStorage.setItem('token', token)
4. 이후 모든 요청 헤더에 Bearer 토큰 포함
5. 401 응답 수신 시 → 로그인 페이지로 리다이렉트
```

---

## JWT 페이로드

```json
{
  "sub": "username",
  "user_id": 1,
  "role": "admin",
  "exp": 1234567890
}
```

---

## 역할 (Role)

| 역할 | 코드 | 권한 |
|------|------|------|
| 관리자 | `admin` | 전체 기능 + 설정 |
| 일반 사용자 | `user` | 본인 보고서 작성, 전체 주간보고 열람 |

---

## 비밀번호 정책

- 최소 6자 이상
- 해시: bcrypt (passlib[bcrypt])
- 초기 비밀번호: 관리자가 설정 후 전달
- 비밀번호 변경: 모든 사용자 가능 (현재 비밀번호 확인 후)
- 비밀번호 초기화: 관리자만 가능 (특정 사용자 → 임시 비밀번호 설정)

---

## 보안 헤더 / CORS

- CORS: `http://localhost:5174` 허용 (개발), 프로덕션은 .env에서 설정
- 민감 정보 `.env` 관리:
  ```
  SECRET_KEY=<랜덤 32바이트 hex>
  ALGORITHM=HS256
  ACCESS_TOKEN_EXPIRE_MINUTES=480
  DATABASE_URL=sqlite:///./data/weekly_hub.db
  ```

---

## 패키지

```
python-jose[cryptography]
passlib[bcrypt]
```

---

## FastAPI 의존성 예시

```python
# 모든 로그인 필요 엔드포인트
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db))

# 관리자 전용
async def require_admin(current_user: User = Depends(get_current_user))
```

---

## 초기 관리자 계정

- 서버 최초 실행 시 seed.py 자동 실행
- admin 계정 없으면 생성: username=`admin`, password=`admin1234`, role=`admin`
- 최초 로그인 후 반드시 비밀번호 변경 권장
