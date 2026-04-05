import { Capacitor } from '@capacitor/core';
import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { useSettingsStore } from '../store/settingsStore';

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function getInterstitialAdId(): string {
  if (Capacitor.getPlatform() === 'ios') {
    return import.meta.env.VITE_ADMOB_INTERSTITIAL_ID_IOS ?? '';
  }
  return import.meta.env.VITE_ADMOB_INTERSTITIAL_ID_ANDROID ?? '';
}

let interstitialReady = false;
let loadingInterstitial = false;
const AD_FREQUENCY = 3;
let sessionsSinceLastAd = 0;
const AD_COOLDOWN_MS = 3 * 60 * 1000; // 3분
let lastAdShownAt: number | null = null;

// AdMob.initialize()는 ATT API 호출 전에 반드시 완료되어야 함 (실기기)
// Promise로 관리해 중복 초기화 방지 및 동시 호출 시 동일 Promise 공유
let admobInitialized = false;
let admobInitPromise: Promise<void> | null = null;

async function ensureAdMobInitialized(): Promise<void> {
  if (admobInitialized) return;
  if (!admobInitPromise) {
    admobInitPromise = (async () => {
      try {
        await AdMob.initialize();
        admobInitialized = true;
      } catch (e) {
        console.warn('[AdMob] initialize failed', e);
      }
    })();
  }
  await admobInitPromise;
}

async function ensureTrackingAuthorization(): Promise<void> {
  if (Capacitor.getPlatform() !== 'ios') return;
  try {
    const { status } = await AdMob.trackingAuthorizationStatus();
    if (status === 'notDetermined') {
      await AdMob.requestTrackingAuthorization();
    }
  } catch (e) {
    console.warn('[AdMob] ATT check failed', e);
  }
}

/** 앱 시작 직후 AdMob 초기화를 백그라운드에서 미리 시작 */
export function warmUpAdMob(): void {
  if (!isNative()) return;
  void ensureAdMobInitialized();
}

/** 온보딩에서 호출: initialize 완료 후 ATT 팝업 표시 */
export async function requestTrackingPermission(): Promise<void> {
  if (!isNative()) return;
  await ensureAdMobInitialized(); // 실기기에서 ATT API 사용 전 필수
  await ensureTrackingAuthorization();
}

async function loadInterstitial(): Promise<void> {
  if (!isNative() || loadingInterstitial) return;
  loadingInterstitial = true;
  try {
    await AdMob.prepareInterstitial({ adId: getInterstitialAdId() });
    interstitialReady = true;
  } catch (e) {
    interstitialReady = false;
    console.warn('[AdMob] prepareInterstitial failed', e);
  } finally {
    loadingInterstitial = false;
  }
}

/** Dashboard에서 호출: 기존 사용자 ATT 처리 + 광고 로딩 */
export async function initAdMob(): Promise<void> {
  if (!isNative()) return;
  await ensureAdMobInitialized();
  await ensureTrackingAuthorization(); // 온보딩을 건너뛴 기존 사용자 대응
  await loadInterstitial();
}

export async function showInterstitialAd(): Promise<void> {
  if (!isNative() || !interstitialReady) return;
  if (useSettingsStore.getState().adRemoved) return;
  interstitialReady = false;

  await new Promise<void>(async (resolve) => {
    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      dismissedHandle.remove();
      failedHandle.remove();
      resolve();
    };

    const [dismissedHandle, failedHandle] = await Promise.all([
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, done),
      AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, done),
    ]);

    // 안전망: 60초 후에도 닫히지 않으면 강제 진행
    const timeout = setTimeout(done, 60_000);

    AdMob.showInterstitial().catch(done);
  });

  lastAdShownAt = Date.now();

  // 다음 광고 사전 로딩
  loadInterstitial();
}

export async function showInterstitialAdThrottled(): Promise<void> {
  sessionsSinceLastAd++;
  if (sessionsSinceLastAd < AD_FREQUENCY) return;

  if (lastAdShownAt !== null && Date.now() - lastAdShownAt < AD_COOLDOWN_MS) return;

  sessionsSinceLastAd = 0;
  await showInterstitialAd();
}
