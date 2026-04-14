# Supabase 설정 가이드

> Supabase 없이도 데모 데이터(과일 카테고리)로 게임은 바로 실행 가능하다.  
> 리더보드 기능을 사용하려면 아래 설정을 완료해야 한다.

## 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속 후 로그인
2. **New Project** 클릭
3. 프로젝트 이름과 DB 비밀번호 입력
4. Region: `Northeast Asia (Seoul)` 선택 권장
5. 프로젝트 생성 완료까지 약 1분 대기

## 2. 데이터베이스 스키마 적용

Supabase 대시보드 → **SQL Editor** 에서 아래 순서로 실행:

1. `supabase/migrations/001_initial_schema.sql` 내용 전체 복사 후 실행
2. `supabase/migrations/002_sample_data.sql` 내용 전체 복사 후 실행 (오늘 날짜 샘플 데이터)

## 3. 환경 변수 설정

Supabase 대시보드 → **Settings** → **API** 에서 값을 복사한다:

| 항목 | 환경 변수 |
|------|----------|
| Project URL | `VITE_SUPABASE_URL` |
| anon public key | `VITE_SUPABASE_ANON_KEY` |

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## 4. DB 스키마 구조

### daily_categories — 일간 카테고리

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 자동 생성 |
| date | DATE | 날짜 (YYYY-MM-DD, unique) |
| name | VARCHAR | 카테고리 이름 (예: 과일, 동물) |

### words — 단어 목록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 자동 생성 |
| category_id | UUID | daily_categories.id 참조 |
| word | VARCHAR | 단어 (카테고리에 속하는 단어) |
| not_shown | BOOLEAN | `false` = 암기 단계에서 보여주는 단어 (10개) / `true` = 보여주지 않는 단어 (2개) |

> **중요**: `not_shown = true` 인 단어도 같은 카테고리에 속하는 단어여야 한다.  
> 예) 카테고리가 "과일"이면 12개 모두 과일이어야 한다.  
> 플레이어는 카테고리 적합성이 아닌, **순수 기억력**으로 봤던 단어와 안 봤던 단어를 구분한다.

**카테고리당 단어 수**: 반드시 12개 (`not_shown = false` 10개 + `not_shown = true` 2개)

### scores — 점수 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 자동 생성 |
| guest_id | UUID | 기기 고유 ID (localStorage) |
| nickname | VARCHAR | 닉네임 (최대 20자) |
| score | INTEGER | 최종 점수 |
| time_ms | INTEGER | 소요 시간 (밀리초) |
| missed_count | INTEGER | 놓친 단어 수 |
| mode | VARCHAR | `basic` 또는 `reverse` |
| date | DATE | 플레이 날짜 |
| created_at | TIMESTAMP | 자동 생성 |

## 5. 일간 카테고리 등록 방법

매일 Supabase 대시보드 **Table Editor** 또는 **SQL Editor**에서 등록한다.

SQL 예시 (내일 날짜 "동물" 카테고리):

```sql
-- 카테고리 등록
INSERT INTO daily_categories (date, name)
VALUES ('2026-03-01', '동물');

-- 단어 12개 등록 (10개 표시 + 2개 미표시, 모두 동물)
WITH cat AS (
  SELECT id FROM daily_categories WHERE date = '2026-03-01'
)
INSERT INTO words (category_id, word, not_shown)
SELECT cat.id, word_data.word, word_data.not_shown
FROM cat,
(VALUES
  ('강아지', false), ('고양이', false), ('토끼',  false),
  ('햄스터', false), ('앵무새', false), ('거북이', false),
  ('금붕어', false), ('고슴도치', false),('페럿',  false),
  ('이구아나', false),
  ('카멜레온', true),  -- 암기 단계에서 안 보여주는 동물
  ('도마뱀',  true)   -- 암기 단계에서 안 보여주는 동물
) AS word_data(word, not_shown);
```

## 6. 연동 테스트

```bash
npm run dev
```

1. 게임을 처음부터 끝까지 플레이
2. 결과 화면에서 **점수 등록하기** 클릭
3. Supabase 대시보드 **Table Editor → scores** 에서 데이터가 쌓이는지 확인
4. `/leaderboard` 페이지에서 내 점수가 표시되면 연동 완료

## 7. (선택) Supabase CLI

로컬에서 마이그레이션을 관리하려면:

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```
