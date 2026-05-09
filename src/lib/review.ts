import { requestReview } from '@apps-in-toss/web-framework';
import { useSettingsStore } from '../store/settingsStore';
import type { SessionRecord, TrainingSessionResult } from '../types/training';

const MIN_TRAINING_SESSIONS = 3;
const MIN_SESSION_GAP = 5;
const REVIEW_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

interface ReviewRequestContext {
  result: TrainingSessionResult;
  trainingSessions: SessionRecord[];
  activeDayCount: number;
  dailyGoalReached: boolean;
  streak: number;
}

function isReviewSupported(): boolean {
  try {
    return typeof requestReview.isSupported === 'function' && requestReview.isSupported();
  } catch {
    return false;
  }
}

function hasEnoughRecentValue({
  trainingSessions,
  activeDayCount,
  dailyGoalReached,
  streak,
}: ReviewRequestContext): boolean {
  return (
    trainingSessions.length >= MIN_TRAINING_SESSIONS &&
    (dailyGoalReached || activeDayCount >= 2 || streak >= 2)
  );
}

function hasPositiveResult(result: TrainingSessionResult): boolean {
  if (result.metadata.isDiagnosis === true) return false;

  const isSuccess = (result.metadata.isSuccess as boolean | undefined) ?? result.accuracy >= 1;
  return isSuccess && result.accuracy >= 0.8;
}

function isCooldownClear(sessionCount: number): boolean {
  const {
    reviewLastRequestedAt,
    reviewLastRequestedSessionCount,
  } = useSettingsStore.getState();

  if (sessionCount - reviewLastRequestedSessionCount < MIN_SESSION_GAP) return false;
  if (!reviewLastRequestedAt) return true;

  const lastRequestedTime = new Date(reviewLastRequestedAt).getTime();
  if (!Number.isFinite(lastRequestedTime)) return true;

  return Date.now() - lastRequestedTime >= REVIEW_COOLDOWN_MS;
}

function shouldRequestMiniAppReview(context: ReviewRequestContext): boolean {
  if (!isReviewSupported()) return false;
  if (!hasPositiveResult(context.result)) return false;
  if (!hasEnoughRecentValue(context)) return false;

  return isCooldownClear(context.trainingSessions.length);
}

export async function requestMiniAppReviewIfAppropriate(context: ReviewRequestContext): Promise<void> {
  if (!shouldRequestMiniAppReview(context)) return;

  useSettingsStore.getState().markReviewRequested(context.trainingSessions.length);

  try {
    await requestReview();
  } catch (error) {
    console.warn('[Review] requestReview failed', error);
  }
}
