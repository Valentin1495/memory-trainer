# Project Brief: Memory Trainer

## One-Line Summary

Memory Trainer is a personalized memory and brain-training app that guides users through onboarding, baseline diagnosis, daily recommended training, session feedback, and weekly progress reports.

## Product Identity

- Korean name: 기억 트레이너
- English name: Memory Trainer
- Positioning: personalized brain training, not a one-off memory game
- Primary loop: Onboarding -> Diagnosis -> Dashboard -> Training -> Session Result -> Weekly Report
- Target platforms: web mini app plus iOS/Android shells through Capacitor

## Target Users

- People who want to improve focus for work or study
- People who want to maintain everyday memory ability
- People who want a light daily habit for brain health
- Users who prefer short, measurable training sessions over long lessons

## Core User Value

The app helps users train memory consistently by removing the question "what should I do today?" It collects simple profile and training data, recommends an appropriate module and difficulty, and shows progress through streaks, scores, accuracy, missed items, and weekly reports.

## Main Features

- Onboarding collects nickname, training goal, and daily goal minutes.
- Optional 3-step diagnosis uses word memory sessions at easy, medium, and hard levels to calculate baseline score and starting difficulty.
- Dashboard shows today's recommendation, daily progress, streak, recent activity heatmap, all training modules, report entry, leaderboard entry, and no-ads purchase entry.
- Training modules include word memory, color sequence, shape location, number sequence, and path memory.
- Word memory supports basic mode and reverse mode.
- Session result records score, accuracy, elapsed time, difficulty, missed words, wrong count, review count, and other metadata.
- Weekly report summarizes recent sessions, average score, accuracy trend, streak, module stats, and weak words.
- Leaderboard uses Supabase-backed score data.
- Ads and in-app purchase support are present, including a no-ads purchase flow.

## Personalization Rules

- User goals map to preferred modules:
  - focus: color sequence, number sequence
  - memory: shape location, word memory
  - health: path memory, shape location
- Baseline score affects tone and difficulty thresholds.
- If the user has no recent history, recommend a goal-aligned first module.
- If the user has two recent low-accuracy sessions, suggest lowering difficulty.
- If the user has three recent high-accuracy sessions, suggest raising difficulty.
- Otherwise, continue with a goal-weighted module and current difficulty.

## Important Data Concepts

- `UserProfile`: nickname, goal, daily goal, current difficulty, last module, diagnosis status, baseline score.
- `SessionRecord`: module id, score, accuracy, time, difficulty, completion time, and metadata.
- `RecommendedTraining`: module id, difficulty, recommendation reason, difficulty change hint, profile tone, and goal label.
- Local stores use Zustand persistence for user profile, game state, settings, and training history.
- Session history is trimmed to recent data to keep local state bounded.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Zustand
- Supabase
- Capacitor for Android/iOS
- Apps in Toss web framework and AIT build/deploy tooling
- AdMob and purchase integrations

## Key Paths

- App routes: `src/App.tsx`
- Dashboard: `src/pages/Dashboard.tsx`
- Onboarding: `src/pages/Onboarding.tsx`
- Diagnosis: `src/pages/Diagnosis.tsx`
- Training shell: `src/pages/Training.tsx`
- Training registry: `src/training/registry.ts`
- Training modules: `src/training/modules/`
- Recommendation logic: `src/lib/recommendation.ts`
- Types: `src/types/`
- Local stores: `src/store/`
- Supabase setup and migrations: `supabase/`
- Release and platform docs: `docs/`

## Development Principles

- Preserve the primary product loop: diagnose, recommend, train, review, report.
- Treat this as a guided training product, not just a collection of games.
- Keep sessions short, clear, and mobile-first.
- Do not add friction before starting today's training.
- When adding modules, register them through `TRAINING_REGISTRY` and make sure session results use the shared `TrainingSessionResult` contract.
- When changing recommendation behavior, update `src/lib/recommendation.ts` and keep the reasons user-facing and encouraging.
- Avoid exposing secrets. Do not read or quote `.env` values in documentation or AI prompts.
- Follow existing React, Zustand, and routing patterns before introducing new abstractions.

## Suggested Prompt For Future AI Sessions

Before making changes, read `PROJECT_BRIEF.md`, `README.md`, and the files relevant to the requested feature. Treat Memory Trainer as a personalized memory-training service with a diagnosis -> recommendation -> training -> report loop. Keep changes scoped, preserve existing mobile-first UX, and do not inspect or expose `.env` secrets unless the user explicitly asks for environment variable names only.
