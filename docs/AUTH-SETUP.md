# Supabase + Better Auth 설정

Phase 1의 인증/DB 기반을 설정하는 문서입니다.

## 1. DATABASE_URL

Supabase Dashboard 상단의 **Connect**를 누릅니다.

로컬 개발에서는 우선 **Session pooler** 연결 문자열을 권장합니다.

- IPv4 환경에서도 안정적으로 연결 가능
- prepared statement를 지원
- Better Auth migration과 일반 서버 쿼리에 사용하기 편함

Supabase가 보여주는 문자열 전체를 복사하고 `[YOUR-PASSWORD]`만 프로젝트 생성 시 저장한 DB 비밀번호로 바꿉니다.

> 비밀번호에 `#`, `?`, `&`, 공백 등의 예약 문자가 있다면 URL percent-encoding이 필요합니다.

`.env.example`을 `.env.local`로 복사하고 값을 넣습니다.

```bash
cp .env.example .env.local
```

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
```

Secret 생성 예시:

```bash
openssl rand -base64 32
```

## 2. Better Auth DB migration

환경변수 설정 후 Better Auth의 핵심 테이블을 먼저 생성합니다.

```bash
npm run auth:migrate
```

생성되는 핵심 테이블은 Better Auth가 관리하는 user / session / account / verification 계열입니다.

그 다음 앱 전용 Hospital 관계 테이블을 생성합니다.

```bash
npm run db:migrate:app
```

순서를 바꾸면 `hospitals.created_by -> user.id` foreign key 생성이 실패합니다.

## 3. Google OAuth

Google Cloud Console에서 OAuth 2.0 Web application client를 생성합니다.

Local Authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

`.env.local`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## 4. Naver OAuth

Naver Developers에서 애플리케이션을 등록하고 네이버 로그인 API를 활성화합니다.

Local callback URL:

```text
http://localhost:3000/api/auth/callback/naver
```

`.env.local`:

```env
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
```

## 5. 실행

환경변수를 변경했다면 개발 서버를 재시작합니다.

```bash
npm run dev
```

- `/setup` : 설정 여부 확인 (secret 값 자체는 표시하지 않음)
- `/sign-in` : Google / Naver 로그인
- `/hospitals`, `/projects`, `/` : 로그인 필요

## 6. Production

Production 배포 전에는 반드시 다음을 실제 Production 값으로 교체합니다.

- `BETTER_AUTH_URL`
- Google production callback URL
- Naver production callback URL
- DB connection 전략

Vercel 같은 serverless 환경에서는 Supabase의 Transaction pooler가 적합할 수 있습니다. 배포 단계에서 별도로 결정합니다.

## Security

- `.env.local`은 Git에 커밋하지 않습니다.
- DB password, OAuth secret, Better Auth secret을 채팅/이슈/README에 남기지 않습니다.
- Data API를 현재 사용하지 않으므로 서버의 PostgreSQL 연결을 통해 데이터에 접근합니다.
- RLS는 추가 방어선으로 켜두되, server-side 권한 검증도 계속 수행합니다.
