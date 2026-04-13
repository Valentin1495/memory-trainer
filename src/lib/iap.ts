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
let tossNoAdsSku: string | undefined;

type TossProductItem = {
  sku: string;
  displayAmount: string;
  type?: string;
};

type TossPendingOrder = {
  orderId: string;
  sku?: string;
};

type TossCompletedOrder = {
  orderId: string;
  sku?: string;
  status: 'COMPLETED' | 'REFUNDED';
  date?: string;
};

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function getIapProvider(): 'toss' | 'native' | 'none' {
  if (isNative()) return 'native';
  if (tossIapSupported) return 'toss';
  return 'none';
}

function isNoAdsSku(value: string | undefined): boolean {
  if (typeof value !== 'string') return false;
  if (value === PRODUCT_ID) return true;
  return typeof tossNoAdsSku === 'string' && value === tossNoAdsSku;
}

function setAdRemoved(value: boolean): void {
  useSettingsStore.getState().setAdRemoved(value);
}

function isGrantSuccess(result: boolean | undefined): boolean {
  // 문서 기준으로 지급 완료 성공은 true일 때만 인정한다.
  return result === true;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`timeout:${timeoutMs}`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function completeProductGrantWithRetry(
  orderId: string,
  maxAttempts = 3,
  attemptTimeoutMs = 7_000,
): Promise<boolean> {
  let lastResult: boolean | undefined = false;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const granted = await withTimeout(
        IAP.completeProductGrant({ params: { orderId } }),
        attemptTimeoutMs,
      );
      lastResult = granted;
      if (isGrantSuccess(granted)) {
        return true;
      }
    } catch (error) {
      lastError = error;
      console.warn('[IAP] completeProductGrant attempt failed', { orderId, attempt, attemptTimeoutMs, error });
    }

    if (attempt < maxAttempts) {
      await wait(200 * attempt);
    }
  }

  if (lastError) {
    console.warn('[IAP] completeProductGrant failed after retries', { orderId, maxAttempts, lastError });
  } else {
    console.warn('[IAP] completeProductGrant returned explicit failure after retries', { orderId, maxAttempts, lastResult });
  }
  return false;
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

function pickNoAdsProduct(products: TossProductItem[]): TossProductItem | undefined {
  const byEnvId = products.find((item) => item.sku === PRODUCT_ID);
  if (byEnvId) return byEnvId;

  // 토스에서 실제 내려온 SKU를 우선 사용하고, 비소모품을 우선 선택
  const nonConsumable = products.find((item) => item.type === 'NON_CONSUMABLE');
  if (nonConsumable) return nonConsumable;

  return products[0];
}

function cacheNoAdsProductFromTossProducts(products: { products: TossProductItem[] }): void {
  const target = pickNoAdsProduct(products.products);
  tossNoAdsSku = target?.sku;
  cachedNoAdsPrice = target?.displayAmount;
}

async function ensureTossNoAdsSku(): Promise<string | undefined> {
  if (tossNoAdsSku) return tossNoAdsSku;

  try {
    const products = await IAP.getProductItemList();
    if (products) {
      cacheNoAdsProductFromTossProducts(products as { products: TossProductItem[] });
    }
  } catch (error) {
    console.warn('[IAP] getProductItemList failed while resolving toss sku', error);
  }

  return tossNoAdsSku;
}

function getOrderDateMs(order: TossCompletedOrder): number {
  if (!order.date) return Number.NEGATIVE_INFINITY;
  const timestamp = Date.parse(order.date);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function pickLatestOrder(current: TossCompletedOrder | null, candidate: TossCompletedOrder): TossCompletedOrder {
  if (!current) return candidate;

  const currentDate = getOrderDateMs(current);
  const candidateDate = getOrderDateMs(candidate);

  if (candidateDate > currentDate) return candidate;
  return current;
}

async function getPendingNoAdsOrders(): Promise<TossPendingOrder[]> {
  const pending = await IAP.getPendingOrders();
  return (pending?.orders ?? []).filter((order) => isNoAdsSku(order.sku));
}

async function getLatestNoAdsCompletedOrRefundedOrder(): Promise<TossCompletedOrder | null> {
  // SDK 타입 선언 버전 차이 호환:
  // - 일부 타입 선언: getCompletedOrRefundedOrders(): Promise<...>
  // - 최신 문서/런타임: getCompletedOrRefundedOrders({ key? })
  const getCompletedOrRefundedOrdersCompat =
    IAP.getCompletedOrRefundedOrders as unknown as (params?: { key?: string | null }) => Promise<{
      hasNext?: boolean;
      nextKey?: string | null;
      orders?: TossCompletedOrder[];
    } | undefined>;

  const seenKeys = new Set<string>();
  let key: string | null | undefined = undefined;
  let latest: TossCompletedOrder | null = null;

  while (true) {
    const page = await getCompletedOrRefundedOrdersCompat(key ? { key } : undefined);
    const orders = page?.orders ?? [];
    const targetOrders = orders.filter((order) => isNoAdsSku(order.sku));

    for (const order of targetOrders) {
      latest = pickLatestOrder(latest, order);
    }

    const nextKey = page?.nextKey;
    if (!page?.hasNext || !nextKey) break;
    if (seenKeys.has(nextKey)) break;

    seenKeys.add(nextKey);
    key = nextKey;
  }

  return latest;
}

async function syncAdRemovedStateFromTossOrders(): Promise<void> {
  try {
    const targetPendingOrders = await getPendingNoAdsOrders();

    if (targetPendingOrders.length > 0) {
      for (const order of targetPendingOrders) {
        try {
          const granted = await completeProductGrantWithRetry(order.orderId);
          if (granted) {
            setAdRemoved(true);
          }
        } catch (error) {
          console.warn('[IAP] completeProductGrant failed during init', error);
        }
      }
    }
  } catch (error) {
    console.warn('[IAP] getPendingOrders failed during init', error);
  }

  try {
    const latest = await getLatestNoAdsCompletedOrRefundedOrder();
    if (!latest) return;

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
      cacheNoAdsProductFromTossProducts(products as { products: TossProductItem[] });
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
    const tossSku = await ensureTossNoAdsSku();
    if (!tossSku) {
      console.warn('[IAP] toss sku is not available from getProductItemList');
      return 'failed';
    }

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
            sku: tossSku,
            processProductGrant: async ({ orderId }) => {
              const startedAt = Date.now();
              console.info('[IAP] processProductGrant started', { orderId });
              try {
                const granted = await completeProductGrantWithRetry(orderId, 3, 7_000);
                const elapsedMs = Date.now() - startedAt;
                if (granted) {
                  setAdRemoved(true);
                  console.info('[IAP] processProductGrant succeeded', { orderId, elapsedMs });
                  return true;
                }
                console.warn('[IAP] processProductGrant failed', { orderId, elapsedMs });
                return false;
              } catch (error) {
                const elapsedMs = Date.now() - startedAt;
                console.warn('[IAP] processProductGrant threw', { orderId, elapsedMs, error });
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
            if (code === 'USER_CANCELED' || code === 'USER_CANCELLED') {
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
      const targetPendingOrders = await getPendingNoAdsOrders();

      if (targetPendingOrders.length > 0) {
        let grantedAny = false;

        for (const order of targetPendingOrders) {
          const granted = await completeProductGrantWithRetry(order.orderId);
          if (granted) {
            grantedAny = true;
          }
        }

        if (grantedAny) {
          setAdRemoved(true);
          return 'restored';
        }

        return 'failed';
      }

      const latest = await getLatestNoAdsCompletedOrRefundedOrder();
      if (!latest) {
        return 'not_found';
      }

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
