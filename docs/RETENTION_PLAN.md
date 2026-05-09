# Retention Improvement Plan

## Current Diagnosis

Memory Trainer already has the right retention ingredients: onboarding, diagnosis, daily goal, recommendation, streak, weekly report, leaderboard, and smart message docs. The weak point is that these pieces are not yet packaged as a strong habit loop.

Recent campaign baseline:

- 2026-04-19~2026-04-26 targeted message CTR: 0.43%
- 2026-04-19 cohort D1: 2.0%
- Overall D1: 3.64%
- D1 excluding the 2026-04-19 spike: 5.41%
- Age mix is heavily 40+; 40s, 50s, and 60+ are about 73% of observed users.

The current loop is:

Onboarding -> Diagnosis -> Dashboard -> Training -> Result -> Home/Retry/Leaderboard

The desired loop is:

Onboarding -> Quick Win -> Clear Tomorrow Reason -> Reminder/Re-entry -> Personalized Progress -> Next Training

## Primary Metrics

- Activation: onboarding completion rate
- First value: first training completion rate
- D1 retention: users returning the next day
- D3 retention: users completing 2 or more active days
- D7 retention: users completing 3 or more active days
- Habit depth: sessions per active user per week
- Training quality: average accuracy and difficulty progression

## Highest-Priority Bets

### 1. Make the first session happen faster

Problem:
The diagnosis is useful, but a 3-step diagnosis can delay the first rewarding moment. Users who defer or abandon diagnosis may never feel the app's value.

Recommendation:
After onboarding, offer a lighter path:

- "1분 체험 훈련"
- "정확한 추천을 위한 진단"

Default should favor the fastest successful completion. Diagnosis can be reintroduced after the first completed session.

Expected effect:
Improves activation and first training completion.

### 2. Turn the result screen into a next-day hook

Problem:
The result screen shows performance, but it does not strongly answer "why come back tomorrow?"

Recommendation:
Add a compact "내일 목표" block after each result:

- tomorrow's recommended module
- one personal reason based on missed words, accuracy, or streak
- progress toward a 3-day starter streak
- CTA: "내일 이어서 하기" or "오늘 한 번 더"

Expected effect:
Improves D1 retention by making the next visit feel unfinished in a good way.

### 3. Add starter missions

Problem:
Streak only becomes motivating after the user already has a habit.

Recommendation:
Create beginner missions:

- Day 1: 첫 훈련 완료
- Day 2: 같은 시간에 1회 훈련
- Day 3: 주간 리포트 확인

Show this on Dashboard and Result until the user completes 3 active days.

Expected effect:
Improves D3 retention and gives early users a reason to return before weekly report data is meaningful.

### 4. Make weekly report visible before it is fully useful

Problem:
Weekly report is valuable after enough data, but new users do not know it is becoming useful.

Recommendation:
On Dashboard, show a "리포트 준비 중" preview for users with fewer than 3 sessions:

- "2회 더 훈련하면 약점 분석이 보여요"
- "이번 주 기록이 쌓이고 있어요"

Expected effect:
Increases repeated sessions and makes reports feel earned.

### 5. Segment smart messages by lifecycle

Problem:
The current smart message plan is acquisition-oriented. Retention needs lifecycle messaging.

Recommendation:
Use separate campaigns:

- D0 incomplete diagnosis: `/diagnosis`
- D1 no session after onboarding: `/training/word-memory`
- D1 completed one session: `/`
- D3 inactive after at least one session: `/report`
- Weekly active users: `/report`

Message principles:

- Avoid guilt or anxiety.
- Mention a concrete, short action.
- Land users on the next best screen, not always home.

Expected effect:
Improves D1 and D7 re-entry.

## Suggested First Experiment

### Experiment A: Result Screen Next-Day Hook

Why first:
It is low-risk, uses existing local data, and targets the moment of highest motivation.

Scope:

- Add a compact card to `src/pages/SessionResult.tsx`.
- Use existing `useRecommendation`, `useHistoryStore`, and result metadata.
- Show different copy for:
  - first session ever
  - completed today's goal
  - missed words exist
  - streak is about to continue

Example copy:

- "첫 훈련 완료. 내일 한 번만 더 하면 2일 루틴이 시작돼요."
- "오늘 목표를 채웠어요. 내일은 정확도를 5%만 더 올려볼게요."
- "놓친 단어가 쌓였어요. 다음 훈련에서 다시 잡아볼 수 있어요."

Success metric:

- D1 retention lift compared with previous baseline
- Secondary: next-day training completion rate

## Suggested Second Experiment

### Experiment B: 3-Day Starter Mission

Scope:

- Add mission state derived from existing session history.
- Show mission progress on Dashboard and SessionResult.
- No new backend required.

Mission logic:

- active day count in the last 7 days
- session count
- report viewed event can be added later, but start without it

Success metric:

- D3 retention
- users with 2+ active days in first 3 days

## Product Guardrails

- Do not make users feel medically judged.
- Avoid anxiety-based copy such as "기억력이 나빠지고 있어요."
- Keep training start one tap away from Dashboard.
- Do not overemphasize leaderboard for new users; it can demotivate low scorers.
- Prefer personal progress over competition in the first week.
- Keep ads away from the first successful training moment if possible.

## Implementation Order

1. Result screen next-day hook
2. Dashboard starter mission card
3. Report preview for low-data users
4. Lifecycle smart message copy and segment table
5. Lightweight analytics events for funnel and retention measurement

## Smart Message Experiment

Next campaign should not scale the previous setup directly. Split by audience and landing:

- 40+ audience: position as a 1-minute memory/focus check and land on `/diagnosis`.
- 10~30 audience: position as a quick test/challenge and land on `/training/word-memory`.

Success thresholds:

- CTR target: 0.8% or higher
- D1 target: 5% or higher
- Expansion candidate: CTR 1.0% or higher plus D1 7% or higher

See `docs/SMART_NOTIFICATION.md` for copy, landing URLs, and stop/scale rules.
