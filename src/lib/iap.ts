/// <reference types="cordova-plugin-purchase" />

import { Capacitor } from '@capacitor/core';
import { useSettingsStore } from '../store/settingsStore';

const PRODUCT_ID =
  import.meta.env.VITE_IAP_NO_ADS_ID ?? 'com.memorychallenge.app.no_ads';

let iapInitPromise: Promise<void> | null = null;
let iapListenersRegistered = false;
let restoreInFlight: Promise<RestoreResult> | null = null;

function syncAdRemovedState(): void {
  if (typeof CdvPurchase === 'undefined') return;
  useSettingsStore.getState().setAdRemoved(CdvPurchase.store.owned(PRODUCT_ID));
}

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function getPlatform(): CdvPurchase.Platform {
  return Capacitor.getPlatform() === 'ios'
    ? CdvPurchase.Platform.APPLE_APPSTORE
    : CdvPurchase.Platform.GOOGLE_PLAY;
}

export async function initIAP(): Promise<void> {
  if (!isNative()) return;
  if (typeof CdvPurchase === 'undefined') {
    console.warn('[IAP] CdvPurchase is not available');
    return;
  }
  if (iapInitPromise) {
    return iapInitPromise;
  }

  const platform = getPlatform();
  iapInitPromise = (async () => {
    CdvPurchase.store.register([
      {
        id: PRODUCT_ID,
        type: CdvPurchase.ProductType.NON_CONSUMABLE,
        platform,
      },
    ]);

    if (!iapListenersRegistered) {
      // 결제 승인 시 광고 제거 활성화
      CdvPurchase.store
        .when()
        .approved((transaction) => {
          if (transaction.products.some((p) => p.id === PRODUCT_ID)) {
            syncAdRemovedState();
          }
          transaction.finish();
        });

      // 영수증 로드 후 소유 여부 확인 (앱 재시작 시 복원)
      CdvPurchase.store
        .when()
        .receiptUpdated(() => {
          syncAdRemovedState();
        });

      iapListenersRegistered = true;
    }

    try {
      await CdvPurchase.store.initialize([platform]);
      syncAdRemovedState();
    } catch (e) {
      iapInitPromise = null;
      console.warn('[IAP] initialize failed', e);
    }
  })();

  await iapInitPromise;
}

/** 상품 가격 문자열 반환 (로드 전이면 undefined) */
export function getNoAdsPrice(): string | undefined {
  if (!isNative()) return undefined;
  const product = CdvPurchase.store.get(PRODUCT_ID);
  return product?.getOffer()?.pricingPhases[0]?.price;
}

export type PurchaseResult = 'started' | 'cancelled' | 'failed';
export type RestoreResult = 'restored' | 'not_found' | 'cancelled' | 'failed';

/** 광고 제거 결제 시작 */
export async function purchaseNoAds(): Promise<PurchaseResult> {
  if (!isNative()) return 'failed';
  const offer = CdvPurchase.store.get(PRODUCT_ID)?.getOffer();
  if (!offer) {
    console.warn('[IAP] offer not loaded yet');
    return 'failed';
  }
  const err = await offer.order();
  if (err) {
    if (err.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
      return 'cancelled';
    }
    console.warn('[IAP] order failed', err.message);
    return 'failed';
  }

  return 'started';
}

/** 기존 구매 복원 */
export async function restorePurchases(): Promise<RestoreResult> {
  if (!isNative()) return 'failed';
  if (typeof CdvPurchase === 'undefined') {
    console.warn('[IAP] CdvPurchase is not available');
    return 'failed';
  }
  if (restoreInFlight) {
    return restoreInFlight;
  }

  const wasOwned = CdvPurchase.store.owned(PRODUCT_ID);
  restoreInFlight = CdvPurchase.store.restorePurchases()
    .then((err) => {
      syncAdRemovedState();

      if (err?.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
        return 'cancelled' as const;
      }
      if (err) {
        console.warn('[IAP] restorePurchases error', err.message);
        return 'failed' as const;
      }

      const isOwned = CdvPurchase.store.owned(PRODUCT_ID);
      if (isOwned && !wasOwned) {
        return 'restored' as const;
      }
      if (isOwned) {
        return 'restored' as const;
      }

      return 'not_found' as const;
    })
    .finally(() => {
      restoreInFlight = null;
    });

  return restoreInFlight;
}
