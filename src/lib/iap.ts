/// <reference types="cordova-plugin-purchase" />

import { Capacitor } from '@capacitor/core';
import { IAP } from '@apps-in-toss/web-framework';
import { useSettingsStore } from '../store/settingsStore';

const PRODUCT_ID =
  import.meta.env.VITE_IAP_NO_ADS_ID ?? 'com.memorychallenge.app.no_ads';

let iapInitPromise: Promise<void> | null = null;
let iapListenersRegistered = false;
let restoreInFlight: Promise<RestoreResult> | null = null;

let cachedNoAdsPrice: string | undefined;
let tossIapSupported = false;

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function getIapProvider(): 'toss' | 'native' | 'none' {
  if (isNative()) return 'native';
  if (tossIapSupported) return 'toss';
  return 'none';
}

function isNoAdsSku(value: string | undefined): boolean {
  return typeof value === 'string' && value === PRODUCT_ID;
}

function setAdRemoved(value: boolean): void {
  useSettingsStore.getState().setAdRemoved(value);
}

function syncAdRemovedStateFromNative(): void {
  if (typeof CdvPurchase === 'undefined') return;
  setAdRemoved(CdvPurchase.store.owned(PRODUCT_ID));
}

function getPlatform(): CdvPurchase.Platform {
  return Capacitor.getPlatform() === 'ios'
    ? CdvPurchase.Platform.APPLE_APPSTORE
    : CdvPurchase.Platform.GOOGLE_PLAY;
}

async function detectTossIapSupport(): Promise<boolean> {
  try {
    const products = await IAP.getProductItemList();
    tossIapSupported = !!products;
    return tossIapSupported;
  } catch {
    tossIapSupported = false;
    return false;
  }
}

function cacheNoAdsPriceFromTossProducts(products: { products: Array<{ sku: string; displayAmount: string }> }): void {
  const target = products.products.find((item) => isNoAdsSku(item.sku));
  cachedNoAdsPrice = target?.displayAmount;
}

async function syncAdRemovedStateFromTossOrders(): Promise<void> {
  try {
    const pending = await IAP.getPendingOrders();
    const targetPendingOrders = pending.orders.filter((order) => isNoAdsSku(order.sku));

    if (targetPendingOrders.length > 0) {
      for (const order of targetPendingOrders) {
        try {
          await IAP.completeProductGrant({ params: { orderId: order.orderId } });
          setAdRemoved(true);
        } catch (error) {
          console.warn('[IAP] completeProductGrant failed during init', error);
        }
      }
    }
  } catch (error) {
    console.warn('[IAP] getPendingOrders failed during init', error);
  }

  try {
    const completedOrRefunded = await IAP.getCompletedOrRefundedOrders();
    const targetOrders = completedOrRefunded.orders.filter((order) => isNoAdsSku(order.sku));
    if (targetOrders.length === 0) return;

    // 최신 상태를 우선 적용
    const latest = targetOrders[targetOrders.length - 1];
    if (latest.status === 'COMPLETED') {
      setAdRemoved(true);
    } else if (latest.status === 'REFUNDED') {
      setAdRemoved(false);
    }
  } catch (error) {
    console.warn('[IAP] getCompletedOrRefundedOrders failed during init', error);
  }
}

async function initNativeIap(): Promise<void> {
  if (typeof CdvPurchase === 'undefined') {
    console.warn('[IAP] CdvPurchase is not available');
    return;
  }

  const platform = getPlatform();
  CdvPurchase.store.register([
    {
      id: PRODUCT_ID,
      type: CdvPurchase.ProductType.NON_CONSUMABLE,
      platform,
    },
  ]);

  if (!iapListenersRegistered) {
    CdvPurchase.store
      .when()
      .approved((transaction) => {
        if (transaction.products.some((p) => p.id === PRODUCT_ID)) {
          syncAdRemovedStateFromNative();
        }
        transaction.finish();
      });

    CdvPurchase.store
      .when()
      .receiptUpdated(() => {
        syncAdRemovedStateFromNative();
      });

    iapListenersRegistered = true;
  }

  try {
    await CdvPurchase.store.initialize([platform]);
    syncAdRemovedStateFromNative();
  } catch (e) {
    console.warn('[IAP] initialize failed', e);
  }
}

async function initTossIap(): Promise<void> {
  try {
    const products = await IAP.getProductItemList();
    if (products) {
      cacheNoAdsPriceFromTossProducts(products);
    }
  } catch (error) {
    console.warn('[IAP] getProductItemList failed during init', error);
  }

  await syncAdRemovedStateFromTossOrders();
}

export async function initIAP(): Promise<void> {
  if (iapInitPromise) {
    return iapInitPromise;
  }

  iapInitPromise = (async () => {
    if (isNative()) {
      await initNativeIap();
      return;
    }

    const supported = await detectTossIapSupport();
    if (!supported) return;

    await initTossIap();
  })().catch((error) => {
    iapInitPromise = null;
    throw error;
  });

  await iapInitPromise;
}

/** 상품 가격 문자열 반환 (로드 전이면 undefined) */
export function getNoAdsPrice(): string | undefined {
  const provider = getIapProvider();

  if (provider === 'native') {
    const product = CdvPurchase?.store?.get(PRODUCT_ID);
    return product?.getOffer()?.pricingPhases[0]?.price;
  }

  if (provider === 'toss') {
    return cachedNoAdsPrice;
  }

  return undefined;
}

export type PurchaseResult = 'started' | 'cancelled' | 'failed';
export type RestoreResult = 'restored' | 'not_found' | 'cancelled' | 'failed';

/** 광고 제거 결제 시작 */
export async function purchaseNoAds(): Promise<PurchaseResult> {
  await initIAP();

  const provider = getIapProvider();

  if (provider === 'native') {
    const offer = CdvPurchase?.store?.get(PRODUCT_ID)?.getOffer();
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

  if (provider === 'toss') {
    return await new Promise<PurchaseResult>((resolve) => {
      let done = false;
      const finish = (result: PurchaseResult) => {
        if (done) return;
        done = true;
        resolve(result);
      };

      let cleanup: (() => void) | null = null;

      try {
        cleanup = IAP.createOneTimePurchaseOrder({
          options: {
            sku: PRODUCT_ID,
            processProductGrant: async ({ orderId }) => {
              try {
                setAdRemoved(true);
                await IAP.completeProductGrant({ params: { orderId } });
                return true;
              } catch (error) {
                console.warn('[IAP] completeProductGrant failed in purchase flow', error);
                return false;
              }
            },
          },
          onEvent: (event) => {
            if (event.type === 'success') {
              setAdRemoved(true);
              cleanup?.();
              finish('started');
            }
          },
          onError: (error: unknown) => {
            const code = (error as { code?: string })?.code;
            cleanup?.();
            if (code === 'USER_CANCELED') {
              finish('cancelled');
              return;
            }
            console.warn('[IAP] toss purchase failed', error);
            finish('failed');
          },
        });
      } catch (error) {
        console.warn('[IAP] createOneTimePurchaseOrder failed to start', error);
        finish('failed');
      }
    });
  }

  return 'failed';
}

/** 기존 구매 복원 */
export async function restorePurchases(): Promise<RestoreResult> {
  await initIAP();

  const provider = getIapProvider();

  if (provider === 'native') {
    if (restoreInFlight) {
      return restoreInFlight;
    }

    if (typeof CdvPurchase === 'undefined') {
      console.warn('[IAP] CdvPurchase is not available');
      return 'failed';
    }

    const wasOwned = CdvPurchase.store.owned(PRODUCT_ID);
    restoreInFlight = CdvPurchase.store.restorePurchases()
      .then((err) => {
        syncAdRemovedStateFromNative();

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

  if (provider === 'toss') {
    try {
      const pending = await IAP.getPendingOrders();
      const targetPendingOrders = pending.orders.filter((order) => isNoAdsSku(order.sku));

      if (targetPendingOrders.length > 0) {
        for (const order of targetPendingOrders) {
          await IAP.completeProductGrant({ params: { orderId: order.orderId } });
        }
        setAdRemoved(true);
        return 'restored';
      }

      const completedOrRefunded = await IAP.getCompletedOrRefundedOrders();
      const targetOrders = completedOrRefunded.orders.filter((order) => isNoAdsSku(order.sku));
      if (targetOrders.length === 0) {
        return 'not_found';
      }

      const latest = targetOrders[targetOrders.length - 1];
      if (latest.status === 'COMPLETED') {
        setAdRemoved(true);
        return 'restored';
      }

      setAdRemoved(false);
      return 'not_found';
    } catch (error) {
      console.warn('[IAP] toss restore failed', error);
      return 'failed';
    }
  }

  return 'failed';
}
