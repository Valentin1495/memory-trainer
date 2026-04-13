import { Capacitor } from '@capacitor/core';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { useSettingsStore } from '../store/settingsStore';
import {
  warmUpAdMob as nativeWarmUpAdMob,
  requestTrackingPermission as nativeRequestTrackingPermission,
  initAdMob as nativeInitAdMob,
  showInterstitialAd as nativeShowInterstitialAd,
} from './admob';

export const TOSS_INTERSTITIAL_AD_GROUP_ID = 'ait-ad-test-interstitial-id';

// 테스트 편의를 위해 결과 화면 진입 시 바로 광고 시도
const AD_FREQUENCY = 1;
const AD_COOLDOWN_MS = 0;

let sessionsSinceLastAd = 0;
let lastAdShownAt: number | null = null;

let tossInterstitialReady = false;
let tossLoadingInterstitial = false;
let tossLoadUnregister: (() => void) | null = null;
let tossShowUnregister: (() => void) | null = null;

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function isTossSupported(): boolean {
  try {
    return (
      typeof loadFullScreenAd.isSupported === 'function' &&
      typeof showFullScreenAd.isSupported === 'function' &&
      loadFullScreenAd.isSupported() &&
      showFullScreenAd.isSupported()
    );
  } catch {
    return false;
  }
}

function getAdProvider(): 'toss' | 'native' | 'none' {
  if (isTossSupported()) return 'toss';
  if (isNative()) return 'native';
  return 'none';
}

function cleanupTossLoadListener(): void {
  if (!tossLoadUnregister) return;
  try {
    tossLoadUnregister();
  } catch {
    // no-op
  }
  tossLoadUnregister = null;
}

function cleanupTossShowListener(): void {
  if (!tossShowUnregister) return;
  try {
    tossShowUnregister();
  } catch {
    // no-op
  }
  tossShowUnregister = null;
}

function preloadTossInterstitial(): void {
  if (tossLoadingInterstitial || tossInterstitialReady) return;
  if (useSettingsStore.getState().adRemoved) {
    tossInterstitialReady = false;
    return;
  }

  // 샌드박스/미지원 환경에서는 isSupported()가 false일 수 있으므로 안전하게 no-op 처리
  if (!isTossSupported()) return;

  tossLoadingInterstitial = true;
  cleanupTossLoadListener();

  try {
    const unregister = loadFullScreenAd({
      options: { adGroupId: TOSS_INTERSTITIAL_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          tossInterstitialReady = true;
          tossLoadingInterstitial = false;
          cleanupTossLoadListener();
        }
      },
      onError: (error) => {
        tossInterstitialReady = false;
        tossLoadingInterstitial = false;
        cleanupTossLoadListener();
        console.warn('[TossAds] loadFullScreenAd failed', error);
      },
    });

    tossLoadUnregister = () => {
      unregister();
    };
  } catch (error) {
    tossInterstitialReady = false;
    tossLoadingInterstitial = false;
    cleanupTossLoadListener();
    console.warn('[TossAds] loadFullScreenAd threw', error);
  }
}

export function warmUpAdMob(): void {
  switch (getAdProvider()) {
    case 'toss':
      preloadTossInterstitial();
      return;
    case 'native':
      nativeWarmUpAdMob();
      return;
    default:
      return;
  }
}

export async function requestTrackingPermission(): Promise<void> {
  if (getAdProvider() === 'native') {
    await nativeRequestTrackingPermission();
  }
}

export async function initAdMob(): Promise<void> {
  if (useSettingsStore.getState().adRemoved) {
    tossInterstitialReady = false;
    return;
  }

  switch (getAdProvider()) {
    case 'toss':
      preloadTossInterstitial();
      return;
    case 'native':
      await nativeInitAdMob();
      return;
    default:
      return;
  }
}

export async function showInterstitialAd(): Promise<void> {
  if (useSettingsStore.getState().adRemoved) return;

  const provider = getAdProvider();
  if (provider === 'native') {
    await nativeShowInterstitialAd();
    return;
  }
  if (provider !== 'toss') return;

  if (!tossInterstitialReady) {
    preloadTossInterstitial();
    return;
  }

  tossInterstitialReady = false;
  cleanupTossShowListener();

  await new Promise<void>((resolve) => {
    let resolved = false;

    const done = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      cleanupTossShowListener();
      resolve();
    };

    const timeout = setTimeout(done, 60_000);

    try {
      const unregister = showFullScreenAd({
        options: { adGroupId: TOSS_INTERSTITIAL_AD_GROUP_ID },
        onEvent: (event) => {
          if (event.type === 'dismissed' || event.type === 'failedToShow') {
            done();
          }
        },
        onError: (error) => {
          console.warn('[TossAds] showFullScreenAd failed', error);
          done();
        },
      });

      tossShowUnregister = () => {
        unregister();
      };
    } catch (error) {
      console.warn('[TossAds] showFullScreenAd threw', error);
      done();
    }
  });

  lastAdShownAt = Date.now();
  preloadTossInterstitial();
}

export async function showInterstitialAdThrottled(): Promise<void> {
  if (useSettingsStore.getState().adRemoved) return;

  sessionsSinceLastAd++;
  if (sessionsSinceLastAd < AD_FREQUENCY) return;

  if (lastAdShownAt !== null && Date.now() - lastAdShownAt < AD_COOLDOWN_MS) return;

  sessionsSinceLastAd = 0;
  await showInterstitialAd();
}
