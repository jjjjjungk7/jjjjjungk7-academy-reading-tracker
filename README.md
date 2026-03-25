# 📚 Academy Reading Tracker

학원 선생님을 위한 학생 독서 기록 관리 앱.  
반별 관리, 학생별 독서 기록(동시 다권), 주문 알림 배너, 일괄 시작 기능을 제공합니다.

## 주요 기능

- **반 중심 대시보드** — 반별 학생/진행 현황, 완료 예정 목록
- **일괄 읽기 시작** — 반 전체(또는 일부)에 동시 적용, 학생별 예상완료일 개별 입력
- **주문 알림 배너** — 예상완료일 7일 이내이고 아직 주문 없는 기록을 자동으로 감지
- **주문 관리** — 상태(주문필요/주문완료/입고/취소) 관리, 반/상태별 필터
- **도서 관리** — 시리즈·레벨·권번호 기반 CRUD
- **관리자 PIN 로그인** — 간단한 PIN 인증 (전체 계정 불필요)

---

## 기술 스택

- **Next.js 16 (App Router) + TypeScript**
- **Tailwind CSS v4**
- **Supabase (PostgreSQL)**
- **pnpm**

---

## 설치 및 실행

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.example`을 복사해서 `.env.local`을 만드세요:

```bash
cp .env.example .env.local
```

`.env.local`에 아래 값을 채워주세요:

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 키 (공개 가능) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role 키 (절대 노출 금지) |
| `ADMIN_PIN_HASH` | 관리자 PIN의 bcrypt 해시 |

### 3. 관리자 PIN 해시 생성

```bash
node -e "const b=require('bcryptjs'); b.hash('YOUR_PIN', 10).then(console.log)"
```

출력된 해시를 `.env.local`의 `ADMIN_PIN_HASH`에 붙여넣으세요.

---

## Supabase 설정

### 1. 마이그레이션 실행

[Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**에서 아래 파일을 실행하세요:

```
supabase/migrations/0001_init.sql
```

또는 Supabase CLI를 사용하는 경우:

```bash
supabase db push
```

### 2. 시드 데이터 (선택)

개발/테스트용 샘플 데이터를 넣으려면:

```bash
# SQL Editor에서 실행
supabase/seed.sql
```

### 3. 필수 환경 변수 확인

Supabase Dashboard → **Project Settings → API**에서:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ `service_role` 키는 절대 클라이언트(브라우저)에 노출하지 마세요. 이 앱은 서버 사이드에서만 사용합니다.

---

## 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하세요.  
처음 접속하면 `/login` 페이지로 이동되며 PIN을 입력하면 됩니다.

---

## 페이지 구성

| 경로 | 설명 |
|---|---|
| `/` | 홈 — 반 목록, 전체 주문 알림 배너 |
| `/login` | 관리자 PIN 로그인 |
| `/classes/[id]` | 반 대시보드 — 학생 목록, 14일 완료 예정, 주문 알림 |
| `/students/[id]` | 학생 상세 — 진행중/완료 독서 기록, 새 기록 추가 |
| `/batch/start` | 일괄 읽기 시작 — 반·도서·학생 선택, 학생별 예상완료일 입력 |
| `/orders` | 주문 관리 — 반/상태 필터, 상태 변경 |
| `/books` | 도서 관리 — 시리즈/레벨 기반 CRUD |

---

## 보안 참고사항

- 모든 쓰기 작업은 Next.js 서버 사이드(Server Actions / Route Handlers)에서만 수행됩니다.
- Supabase RLS가 활성화되어 있으며, anon 역할은 모든 테이블에서 SELECT가 차단됩니다.
- 프로덕션 환경에서는 `SUPABASE_SERVICE_ROLE_KEY`를 `.env.local`에 안전하게 보관하세요.

---

## 배포 (Vercel)

1. [vercel.com](https://vercel.com)에서 이 레포를 가져오세요.
2. **Environment Variables** 설정에 `.env.local`의 변수들을 추가하세요.
3. 배포 완료 후 Supabase 마이그레이션을 실행하세요.
