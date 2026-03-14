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
  if (!isNative()) return;
  try {
    await AdMob.initialize();
    // iOS 14+ ATT 권한 요청
    if (Capacitor.getPlatform() === 'ios') {
      await AdMob.requestTrackingAuthorization().catch(() => {});
    }
    await loadInterstitial();
  } catch (e) {
    console.warn('[AdMob] initialize failed', e);
  }
}

export async function showInterstitialAd(): Promise<void> {
  if (!isNative() || !interstitialReady) return;
  if (useSettingsStore.getState().adRemoved) return;
  interstitialReady = false;

  await new Promise<void>((resolve) => {
    let resolved = false;
    const done = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, done);
    AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, done);
    // 안전망: 60초 후에도 닫히지 않으면 강제 진행
    const timeout = setTimeout(done, 60_000);

    AdMob.showInterstitial().catch(() => {
      clearTimeout(timeout);
      done();
    });
  });

  // 다음 광고 사전 로딩
  loadInterstitial();
}
