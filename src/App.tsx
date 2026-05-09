import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Leaderboard } from './pages/Leaderboard';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { Diagnosis } from './pages/Diagnosis';
import { Training } from './pages/Training';
import { SessionResult } from './pages/SessionResult';
import { Report } from './pages/Report';
import { Settings } from './pages/Settings';
import { useUserProfileStore } from './store/userProfileStore';
import { useGameStore } from './store/gameStore';
import { warmUpAdMob } from './lib/ads';
import { getGuestId } from './lib/supabase';

function buildRedirectPath(location: ReturnType<typeof useLocation>) {
  return normalizeAppPath(`${location.pathname}${location.search}${location.hash}`);
}

function isSmartEntryPath(location: ReturnType<typeof useLocation>) {
  const { pathname } = location;

  return isSmartEntryUrl(`${pathname}${location.search}`);
}

function normalizeAppPath(path: string) {
  if (!path) return '/';

  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return withLeadingSlash.replace(/^\/+/, '/');
}

function isSmartEntryUrl(path: string) {
  const normalized = normalizeAppPath(path);
  const [pathnameWithQuery] = normalized.split('#');
  const [pathname, search = ''] = pathnameWithQuery.split('?');
  const entry = new URLSearchParams(search).get('entry');

  return (
    (pathname === '/training/word-memory' && entry === 'test') ||
    (pathname === '/diagnosis' && entry === 'checkup')
  );
}

function getSafeRedirectPath(raw: string | null) {
  if (!raw) return null;

  try {
    const decoded = normalizeAppPath(decodeURIComponent(raw));
    return decoded.startsWith('/') ? decoded : null;
  } catch {
    const normalized = normalizeAppPath(raw);
    return normalized.startsWith('/') ? normalized : null;
  }
}

function isFeatureEntryPath(location: ReturnType<typeof useLocation>) {
  const { pathname } = location;
  return (
    isSmartEntryPath(location) ||
    pathname === '/diagnosis' ||
    pathname === '/report' ||
    pathname === '/leaderboard' ||
    pathname === '/session-result' ||
    pathname.startsWith('/training/')
  );
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const isOnboarded = useUserProfileStore(s => s.isOnboarded);
  const isDiagnosed = useUserProfileStore(s => s.isDiagnosed);
  const setProfile = useUserProfileStore(s => s.setProfile);
  const setNickname = useGameStore(s => s.setNickname);
  const diagnosisDeferred = useUserProfileStore(s => s.profile?.diagnosisDeferred === true);
  const location = useLocation();
  const onboardingRedirectPath = location.pathname === '/onboarding'
    ? getSafeRedirectPath(new URLSearchParams(location.search).get('redirect'))
    : null;
  const isSmartOnboardingRedirect =
    onboardingRedirectPath !== null && isSmartEntryUrl(onboardingRedirectPath);
  const shouldCreateGuestProfile =
    !isOnboarded &&
    (isSmartEntryPath(location) || isSmartOnboardingRedirect);

  useEffect(() => {
    if (!shouldCreateGuestProfile) return;

    const nickname = 'Guest';
    setProfile({
      userId: getGuestId(),
      nickname,
      goal: 'memory',
      dailyGoalMinutes: 3,
      currentDifficulty: 'medium',
      lastModuleId: 'word-memory',
      onboardingComplete: true,
      diagnosisComplete: false,
      diagnosisDeferred: true,
      baselineScore: 0,
      createdAt: new Date().toISOString(),
    });
    setNickname(nickname);
  }, [setNickname, setProfile, shouldCreateGuestProfile]);

  if (isSmartOnboardingRedirect && onboardingRedirectPath) {
    return <Navigate to={onboardingRedirectPath} replace />;
  }

  const isPublicPath =
    location.pathname === '/onboarding' ||
    isFeatureEntryPath(location);

  if (!isOnboarded && !isPublicPath && !shouldCreateGuestProfile) {
    const redirect = encodeURIComponent(buildRedirectPath(location));
    return <Navigate to={`/onboarding?redirect=${redirect}`} replace />;
  }
  if (isOnboarded && !isDiagnosed && !diagnosisDeferred && location.pathname === '/') {
    const redirect = encodeURIComponent(buildRedirectPath(location));
    return <Navigate to={`/diagnosis?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
}

function App() {
  useEffect(() => {
    warmUpAdMob();
  }, []);

  return (
    <OnboardingGuard>
      <Routes>
        {/* 신규 라우트 */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/diagnosis" element={<Diagnosis />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/training/:moduleId" element={<Training />} />
        <Route path="/session-result" element={<SessionResult />} />
        <Route path="/report" element={<Report />} />
        <Route path="/settings" element={<Settings />} />

        {/* 기존 라우트 유지 (하위 호환) */}
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </OnboardingGuard>
  );
}

export default App;
