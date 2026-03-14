# 기억력 챌린지 (Memory Challenge)

하루 1개 카테고리로 진행되는 1분 세션형 단어 기억 게임.  
난이도별로 다른 단어 수가 빠르게 지나가고, 플레이어는 순수 기억으로 봤던 것과 안 봤던 것을 구분해야 한다.

## 게임 방법

1. 오늘의 카테고리가 공개된다 (하루 1개, 자정에 자동 전환, 모든 유저 동일)
2. 난이도에 따라 정해진 수의 단어가 하나씩 빠르게 지나간다
3. 이후 모든 단어가 섞여 선택지로 제시된다
   - **기본 모드**: 방금 봤던 단어를 모두 골라낸다
   - **리버스 모드**: 보여주지 않았던 단어를 골라낸다 (점수 배율 적용)
4. 목숨이 소진되거나 목표 단어를 모두 선택하면 종료
5. **다시 보기** 기능으로 단어를 재확인할 수 있으나 점수가 차감된다
6. 결과 화면에서 점수, 소요 시간, 놓친 단어를 확인하고 리더보드에 등록한다

> **핵심**: 선택지는 모두 같은 카테고리다. 카테고리에 맞지 않는 단어를 찾는 게임이 아니라, 순수하게 기억력으로 본 것과 안 본 것을 구별하는 게임이다.

## 난이도

| 난이도 | 노출 단어 | 노출 시간 | 목숨 | 리버스 배율 |
|--------|-----------|-----------|------|-------------|
| 🟢 EASY   | 8개 | 1.0초 | 3개 | ×1.2 |
| 🟡 MEDIUM | 10개 | 0.7초 | 2개 | ×1.4 |
| 🔴 HARD   | 12개 | 0.5초 | 1개 | ×1.6 |

## 점수 계산

```
점수 = 정답 수 × (기본점수 ÷ 목표 정답 수)
     - 오답 수 × 100
     - 다시보기 횟수 × 150
     - 소요 시간(초) × 5
     - 실패 시 200 (추가 패널티)
     × 리버스 배율 (리버스 모드일 때)
```

| 항목 | 값 |
|------|-----|
| 기본 점수 | EASY 800 / MEDIUM 1,000 / HARD 1,200 |
| 정답당 점수 | 기본점수 ÷ 목표 정답 수 (기본 모드 100점/개) |
| 오답 패널티 | -100점/회 |
| 다시보기 패널티 | -150점/회 |
| 시간 패널티 | -5점/초 |
| 실패 패널티 | -200점 |
| 리버스 배율 | ×1.2 / ×1.4 / ×1.6 |

- 성공 시 최대 점수 = 기본점수 (HARD 리버스 퍼펙트: 1,200 × 1.6 = **1,920점**)
- 실패 시 맞힌 정답 수만큼 부분 점수 적용

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프론트엔드 | React + TypeScript + Vite |
| 스타일링 | Tailwind CSS |
| 애니메이션 | Framer Motion |
| 상태 관리 | Zustand |
| 백엔드/DB | Supabase (PostgreSQL + RLS) |
| 모바일 | Capacitor (iOS + Android) |
| 배포 | Vercel (웹), Xcode (App Store), Android Studio (Google Play) |

## 프로젝트 구조

```
src/
├── pages/
│   ├── Home.tsx          # 모드 선택, 오늘의 카테고리 안내
│   ├── Game.tsx          # 암기 및 선택 화면
│   ├── Result.tsx        # 결과 및 점수 등록
│   └── Leaderboard.tsx   # 일간/주간 리더보드
├── components/
│   ├── game/
│   │   ├── WordDisplay.tsx   # 단어 순차 표시 (플립 애니메이션)
│   │   ├── ChoiceGrid.tsx    # 12개 선택지 그리드
│   │   ├── Timer.tsx         # 소요 시간 타이머
│   │   └── ReviewModal.tsx   # 다시 보기 모달
│   └── leaderboard/
│       ├── ScoreRow.tsx
│       └── TabSwitcher.tsx   # 일간/주간 탭
├── hooks/
│   ├── useGame.ts        # 게임 진행 로직, Supabase 카테고리 fetch
│   ├── useTimer.ts       # 타이머 관리
│   └── useLeaderboard.ts # 리더보드 조회 및 점수 제출
├── store/
│   └── gameStore.ts      # Zustand 전역 상태
└── lib/
    └── supabase.ts       # Supabase 클라이언트, 게스트 ID 관리
```

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일 생성 (Supabase 없이도 데모 데이터로 실행 가능):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

Supabase 연결 없이도 데모 카테고리(과일)로 바로 게임 테스트 가능하다.

## Supabase 설정 (리더보드 활성화)

[SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 참고.

DB 스키마는 `supabase/migrations/` 에 있다:
- `001_initial_schema.sql` — 테이블 및 RLS 정책
- `002_sample_data.sql` — 오늘 날짜 샘플 카테고리 (과일)
- `003_animal_category.sql` — 동물 (CURRENT_DATE + 1)
- `004_vehicle_category.sql` — 탈것 (CURRENT_DATE + 2)
- `005_country_category.sql` — 나라 (CURRENT_DATE + 3)
- `006_subject_category.sql` — 학교 과목 (CURRENT_DATE + 4)
- `007_food_category.sql` — 음식 (CURRENT_DATE + 5)
- `008_household_category.sql` — 집 안 물건 (CURRENT_DATE + 6)

## 모바일 빌드

### iOS (App Store)

```bash
npm run cap:ios
```

Xcode가 열리면 **Signing & Capabilities**에서 Team을 설정하고 실행.

라이브 리로드 테스트가 필요하면:

```bash
CAP_SERVER_URL=http://YOUR_IP:5173 npx cap sync ios
```

### Android (Google Play)

```bash
npm run cap:android
```

Android Studio가 열리면 Gradle Sync 완료 후 실행.

라이브 리로드 테스트가 필요하면:

```bash
CAP_SERVER_URL=http://YOUR_IP:5173 npx cap sync android
```

## 스토어 출시 준비

- 출시 체크리스트: [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)
- 중요: 프로덕션 배포 시 [`capacitor.config.ts`](./capacitor.config.ts)에 개발용 `server.url`이 들어가면 안 된다.

## 배포 (앱인토스 / 웹)

```bash
npm run build
# dist/ 폴더를 Vercel 등에 배포한 뒤, 해당 URL을 앱인토스 웹뷰로 등록
```

## 인증 전략

- **현재**: 게스트 플레이. 브라우저 `localStorage`에 UUID 저장, 닉네임만 입력하면 리더보드 참여 가능
- **추후**: Supabase Auth를 통한 카카오/구글 소셜 로그인 연동
