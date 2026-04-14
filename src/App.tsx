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
import { warmUpAdMob } from './lib/ads';

function buildRedirectPath(location: ReturnType<typeof useLocation>) {
  return `${location.pathname}${location.search}${location.hash}`;
}

function isFeatureEntryPath(pathname: string) {
  return (
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
  const diagnosisDeferred = useUserProfileStore(s => s.profile?.diagnosisDeferred === true);
  const location = useLocation();

  const isPublicPath =
    location.pathname === '/onboarding' ||
    isFeatureEntryPath(location.pathname);

  if (!isOnboarded && !isPublicPath) {
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
