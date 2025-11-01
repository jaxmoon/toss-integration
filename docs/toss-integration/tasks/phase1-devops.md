# Phase 1-1: Next.js 프로젝트 초기화

## ⚠️ 작업 전 필수 확인

### 1. TechSpec 문서 읽기
**반드시 먼저 읽을 것**: `/docs/toss-integration/techspec.md`

작업을 시작하기 전에 반드시 techspec.md를 읽고 다음을 이해해야 합니다:
- 전체 시스템 아키텍처
- 필수 의존성 목록 (Section 6)
- Next.js 프로젝트 구조 (Section 3)
- 환경 변수 설정 요구사항 (Section 10)

### 2. Toss Payments 최신 문서 확인 (context7 사용)
**context7 MCP 도구를 사용하여 최신 Toss Payments 문서를 확인하세요:**

```
1. mcp__context7__resolve-library-id 호출
   - libraryName: "tosspayments"

2. mcp__context7__get-library-docs 호출
   - context7CompatibleLibraryID: (1번에서 받은 ID)
   - topic: "widget sdk setup, next.js integration"
```

확인할 주요 내용:
- Widget SDK 최신 설치 방법
- Next.js 14+ 호환성
- 환경 변수 설정 가이드
- 초기화 베스트 프랙티스

---

## 에이전트

**담당**: `devops-infrastructure-specialist`

---

## 목표

Next.js 14 프로젝트를 초기화하고, Toss Payments 통합에 필요한 모든 의존성을 설치하여 개발 환경을 완전히 구축합니다.

---

## 선행 작업

- Git 저장소 초기화 완료
- `feat/toss-integration` 브랜치에서 작업 중

---

## 구체적 작업

### 1. techspec.md 읽기 (필수)
```bash
cat /Users/jax/GitHub/primer/lecture/toss/docs/toss-integration/techspec.md
```

### 2. Next.js 프로젝트 생성

현재 디렉토리가 `/Users/jax/GitHub/primer/lecture/toss`인지 확인 후:

```bash
# 현재 위치 확인
pwd

# Next.js 프로젝트 초기화 (현재 디렉토리에 설치)
npx create-next-app@latest . --typescript --tailwind --app --no-src
```

**대화형 선택 옵션**:
- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: **Yes**
- `src/` directory: **No** (app 디렉토리 직접 사용)
- App Router: **Yes**
- Import alias: **Yes** (`@/*`)

### 3. 필수 의존성 설치

```bash
# Toss Payments SDK 및 HTTP 클라이언트
npm install @tosspayments/tosspayments-sdk@^2.0.0 axios@^1.6.0

# 테스트 라이브러리
npm install --save-dev @testing-library/react@^14.0.0 @testing-library/jest-dom@^14.0.0 jest@^29.0.0 jest-environment-jsdom@^29.0.0

# TypeScript 타입 정의
npm install --save-dev @types/jest
```

### 4. 환경 변수 파일 생성

`.env.local` 파일 생성:

```bash
cat > .env.local << 'EOF'
# Toss Payments 테스트 키
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm
TOSS_SECRET_KEY=test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6

# 앱 기본 URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EOF
```

### 5. .env.example 파일 생성 (Git에 커밋용)

```bash
cat > .env.example << 'EOF'
# Toss Payments API Keys
NEXT_PUBLIC_TOSS_CLIENT_KEY=your_client_key_here
TOSS_SECRET_KEY=your_secret_key_here

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EOF
```

### 6. .gitignore 확인 및 수정

`.env.local`이 .gitignore에 포함되어 있는지 확인:

```bash
# .env.local이 없으면 추가
grep -q "^.env.local$" .gitignore || echo ".env.local" >> .gitignore
```

### 7. package.json 스크립트 확인

`package.json`에 다음 스크립트가 있는지 확인:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### 8. 프로젝트 구조 생성

techspec.md의 Component Design (Section 3)을 참고하여 디렉토리 생성:

```bash
# 디렉토리 구조 생성
mkdir -p components
mkdir -p lib
mkdir -p types
mkdir -p config
mkdir -p __tests__/components
mkdir -p __tests__/api
mkdir -p __tests__/lib
```

### 9. TypeScript 설정 확인

`tsconfig.json` 파일이 다음 설정을 포함하는지 확인:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 10. 개발 서버 실행 테스트

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속하여 Next.js 기본 페이지가 표시되는지 확인 (Ctrl+C로 종료)

### 11. 빌드 테스트

```bash
npm run build
```

빌드 에러가 없는지 확인

---

## 출력물

생성되어야 할 파일 및 디렉토리:

```
/Users/jax/GitHub/primer/lecture/toss/
├── package.json                 # 의존성 목록
├── package-lock.json
├── tsconfig.json               # TypeScript 설정
├── next.config.js              # Next.js 설정
├── tailwind.config.js          # Tailwind CSS 설정
├── postcss.config.js
├── .env.local                  # 환경 변수 (Git 제외)
├── .env.example                # 환경 변수 템플릿
├── .gitignore                  # .env.local 포함
├── node_modules/               # 설치된 패키지
├── app/                        # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/                 # React 컴포넌트 (빈 디렉토리)
├── lib/                        # 유틸리티 (빈 디렉토리)
├── types/                      # TypeScript 타입 (빈 디렉토리)
├── config/                     # 설정 (빈 디렉토리)
├── public/                     # 정적 파일
└── __tests__/                  # 테스트 디렉토리
    ├── components/
    ├── api/
    └── lib/
```

---

## 검증 방법

다음 명령어들이 모두 성공해야 합니다:

```bash
# 1. 의존성 확인
npm list @tosspayments/tosspayments-sdk axios jest @testing-library/react

# 2. TypeScript 컴파일 확인
npx tsc --noEmit

# 3. 개발 서버 실행 확인 (포트 3000에서 실행되어야 함)
npm run dev &
sleep 5
curl http://localhost:3000
pkill -f "next dev"

# 4. 빌드 확인
npm run build

# 5. 환경 변수 확인
test -f .env.local && echo "✅ .env.local exists"
grep -q "NEXT_PUBLIC_TOSS_CLIENT_KEY" .env.local && echo "✅ Client key configured"
grep -q "^.env.local$" .gitignore && echo "✅ .env.local in .gitignore"
```

---

## 완료 조건

- [ ] techspec.md 읽기 완료
- [ ] Next.js 14+ 프로젝트 생성 완료
- [ ] `package.json`에 모든 필수 의존성 포함
- [ ] `node_modules/` 디렉토리 존재
- [ ] `.env.local` 파일 생성 (Toss 테스트 키 포함)
- [ ] `.env.example` 파일 생성
- [ ] `.gitignore`에 `.env.local` 포함
- [ ] 디렉토리 구조 생성 (`components/`, `lib/`, `types/`, `config/`, `__tests__/`)
- [ ] `npm run dev` 정상 실행 (에러 없음)
- [ ] `npm run build` 성공 (에러 0건, 경고 최소화)
- [ ] `npx tsc --noEmit` 성공 (TypeScript 에러 0건)

---

## Git 커밋

작업 완료 후 다음 커밋 메시지로 커밋:

```bash
git add .
git commit -m "feat(setup): Next.js 프로젝트 초기화 및 의존성 설치

- Next.js 14 프로젝트 생성 (TypeScript, Tailwind, App Router)
- Toss Payments SDK 및 필수 의존성 설치
- 환경 변수 설정 (.env.local, .env.example)
- 프로젝트 디렉토리 구조 생성
- 빌드 및 개발 서버 동작 확인

Related to: Phase 1-1"
```

---

## 참고 문서

- Next.js 공식 문서: https://nextjs.org/docs
- Toss Payments SDK 문서: https://docs.tosspayments.com/reference/widget-sdk
- 프로젝트 TechSpec: `/docs/toss-integration/techspec.md`
