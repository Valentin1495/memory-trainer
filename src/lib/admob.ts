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
let initializingAdMob = false;
const AD_FREQUENCY = 3;
let sessionsSinceLastAd = 0;
const AD_COOLDOWN_MS = 3 * 60 * 1000; // 3분
let lastAdShownAt: number | null = null;

async function ensureTrackingAuthorization(): Promise<void> {
  if (Capacitor.getPlatform() !== 'ios') return;

  try {
    const trackingStatus = await AdMob.trackingAuthorizationStatus();

    if (trackingStatus.status === 'notDetermined') {
      await AdMob.requestTrackingAuthorization();
      const updatedStatus = await AdMob.trackingAuthorizationStatus();
      console.info('[AdMob] ATT status after prompt:', updatedStatus.status);
      return;
    }

    console.info('[AdMob] ATT status before init:', trackingStatus.status);
  } catch (e) {
    console.warn('[AdMob] tracking authorization check failed', e);
  }
}

export async function requestTrackingPermission(): Promise<void> {
  if (!isNative()) return;
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

export async function initAdMob(): Promise<void> {
  if (!isNative() || initializingAdMob) return;
  initializingAdMob = true;
  try {
    await requestTrackingPermission();
    await AdMob.initialize();
    await loadInterstitial();
  } catch (e) {
    console.warn('[AdMob] initialize failed', e);
  } finally {
    initializingAdMob = false;
  }
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
