/// <reference types="cordova-plugin-purchase" />

import { Capacitor } from '@capacitor/core';
import { useSettingsStore } from '../store/settingsStore';

const PRODUCT_ID =
  import.meta.env.VITE_IAP_NO_ADS_ID ?? 'com.memorychallenge.app.no_ads';

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

  const platform = getPlatform();

  CdvPurchase.store.register([
    {
      id: PRODUCT_ID,
      type: CdvPurchase.ProductType.NON_CONSUMABLE,
      platform,
    },
  ]);

  // 결제 승인 시 광고 제거 활성화
  CdvPurchase.store
    .when()
    .approved((transaction) => {
      if (transaction.products.some((p) => p.id === PRODUCT_ID)) {
        useSettingsStore.getState().setAdRemoved(true);
      }
      transaction.finish();
    });

  // 영수증 로드 후 소유 여부 확인 (앱 재시작 시 복원)
  CdvPurchase.store
    .when()
    .receiptUpdated(() => {
      if (CdvPurchase.store.owned(PRODUCT_ID)) {
        useSettingsStore.getState().setAdRemoved(true);
      }
    });

  try {
    await CdvPurchase.store.initialize([platform]);
  } catch (e) {
    console.warn('[IAP] initialize failed', e);
  }
}

/** 상품 가격 문자열 반환 (로드 전이면 undefined) */
export function getNoAdsPrice(): string | undefined {
  if (!isNative()) return undefined;
  const product = CdvPurchase.store.get(PRODUCT_ID);
  return product?.getOffer()?.pricingPhases[0]?.price;
}

/** 광고 제거 결제 시작 */
export async function purchaseNoAds(): Promise<void> {
  if (!isNative()) return;
  const offer = CdvPurchase.store.get(PRODUCT_ID)?.getOffer();
  if (!offer) {
    console.warn('[IAP] offer not loaded yet');
    return;
  }
  const err = await offer.order();
  if (err) {
    console.warn('[IAP] order failed', err.message);
  }
}

/** 기존 구매 복원 */
export async function restorePurchases(): Promise<void> {
  if (!isNative()) return;
  await CdvPurchase.store.restorePurchases();
}
