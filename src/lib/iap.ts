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
let lastIapErrorCode: string | undefined;
const KNOWN_TOSS_NO_ADS_ORDER_IDS_KEY = 'memory-trainer:iap:known-toss-no-ads-order-ids';
const knownTossNoAdsOrderIds = new Set<string>();

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

function loadKnownNoAdsOrderIds(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const raw = window.localStorage.getItem(KNOWN_TOSS_NO_ADS_ORDER_IDS_KEY);
    if (!raw) return;
    const values = JSON.parse(raw) as string[];
    if (!Array.isArray(values)) return;
    values.forEach((value) => {
      if (typeof value === 'string' && value.length > 0) {
        knownTossNoAdsOrderIds.add(value);
      }
    });
  } catch (error) {
    console.warn('[IAP] failed to load known no-ads order ids', error);
  }
}

function persistKnownNoAdsOrderIds(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(
      KNOWN_TOSS_NO_ADS_ORDER_IDS_KEY,
      JSON.stringify(Array.from(knownTossNoAdsOrderIds)),
    );
  } catch (error) {
    console.warn('[IAP] failed to persist known no-ads order ids', error);
  }
}

function rememberKnownNoAdsOrderId(orderId: string | undefined): void {
  if (!orderId) return;
  if (knownTossNoAdsOrderIds.has(orderId)) return;
  knownTossNoAdsOrderIds.add(orderId);
  persistKnownNoAdsOrderIds();
}

function isKnownNoAdsOrderId(orderId: string | undefined): boolean {
  if (!orderId) return false;
  return knownTossNoAdsOrderIds.has(orderId);
}

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

function isNoAdsOrder(order: { orderId?: string; sku?: string }): boolean {
  if (isNoAdsSku(order.sku)) return true;
  if (isKnownNoAdsOrderId(order.orderId)) return true;
  return false;
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
  const allOrders = pending?.orders ?? [];
  const matched = allOrders.filter((order) => isNoAdsOrder(order));

  if (matched.length > 0) {
    console.info('[IAP] getPendingOrders matched no-ads orders', {
      allCount: allOrders.length,
      matchedCount: matched.length,
    });
    return matched;
  }

  if (allOrders.length === 1) {
    console.warn('[IAP] getPendingOrders fallback to single order (sku missing or unmatched)', {
      orderId: allOrders[0]?.orderId,
      sku: allOrders[0]?.sku,
    });
    return allOrders;
  }

  console.info('[IAP] getPendingOrders no matching no-ads order', {
    allCount: allOrders.length,
  });
  return [];
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
    let targetOrders = orders.filter((order) => isNoAdsOrder(order));

    if (targetOrders.length === 0 && orders.length === 1) {
      console.warn('[IAP] getCompletedOrRefundedOrders fallback to single order (sku missing or unmatched)', {
        orderId: orders[0]?.orderId,
        sku: orders[0]?.sku,
        status: orders[0]?.status,
      });
      targetOrders = orders;
    }

    for (const order of targetOrders) {
      rememberKnownNoAdsOrderId(order.orderId);
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
    loadKnownNoAdsOrderIds();

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
export type NoAdsOrderStatusResult = {
  provider: 'toss' | 'native' | 'none';
  status: 'owned' | 'pending' | 'completed' | 'refunded' | 'not_found' | 'failed';
  orderId?: string;
  sku?: string;
  source?: 'native_store' | 'pending_orders' | 'completed_or_refunded_orders';
  errorCode?: string;
};

export function getLastIapErrorCode(): string | undefined {
  return lastIapErrorCode;
}

export async function inspectNoAdsOrderStatus(): Promise<NoAdsOrderStatusResult> {
  await initIAP();

  const provider = getIapProvider();

  if (provider === 'native') {
    const owned = CdvPurchase?.store?.owned(PRODUCT_ID) === true;
    return {
      provider,
      status: owned ? 'owned' : 'not_found',
      sku: PRODUCT_ID,
      source: 'native_store',
    };
  }

  if (provider === 'toss') {
    try {
      const pendingOrders = await getPendingNoAdsOrders();
      if (pendingOrders.length > 0) {
        const latestPendingOrder = pendingOrders[0];
        return {
          provider,
          status: 'pending',
          orderId: latestPendingOrder.orderId,
          sku: latestPendingOrder.sku,
          source: 'pending_orders',
        };
      }

      const latestOrder = await getLatestNoAdsCompletedOrRefundedOrder();
      if (!latestOrder) {
        return {
          provider,
          status: 'not_found',
        };
      }

      return {
        provider,
        status: latestOrder.status === 'COMPLETED' ? 'completed' : 'refunded',
        orderId: latestOrder.orderId,
        sku: latestOrder.sku,
        source: 'completed_or_refunded_orders',
      };
    } catch (error) {
      console.warn('[IAP] inspectNoAdsOrderStatus failed', error);
      return {
        provider,
        status: 'failed',
        errorCode: lastIapErrorCode,
      };
    }
  }

  return {
    provider,
    status: 'failed',
    errorCode: 'IAP_PROVIDER_NOT_AVAILABLE',
  };
}

/** 광고 제거 결제 시작 */
export async function purchaseNoAds(): Promise<PurchaseResult> {
  await initIAP();
  lastIapErrorCode = undefined;

  const provider = getIapProvider();

  if (provider === 'native') {
    const offer = CdvPurchase?.store?.get(PRODUCT_ID)?.getOffer();
    if (!offer) {
      lastIapErrorCode = 'OFFER_NOT_READY';
      console.warn('[IAP] offer not loaded yet');
      return 'failed';
    }

    const err = await offer.order();
    if (err) {
      if (err.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
        return 'cancelled';
      }
      lastIapErrorCode = String(err.code);
      console.warn('[IAP] order failed', err.message);
      return 'failed';
    }

    return 'started';
  }

  if (provider === 'toss') {
    const tossSku = await ensureTossNoAdsSku();
    if (!tossSku) {
      lastIapErrorCode = 'SKU_NOT_AVAILABLE';
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
              rememberKnownNoAdsOrderId(orderId);
              const startedAt = Date.now();
              console.info('[IAP] processProductGrant started', { orderId });
              try {
                const granted = await completeProductGrantWithRetry(orderId, 3, 7_000);
                const elapsedMs = Date.now() - startedAt;
                if (granted) {
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
            console.info('[IAP] createOneTimePurchaseOrder event', event);
            if (event.type === 'success') {
              const data = (event as { data?: { orderId?: string; amount?: number; sku?: string } }).data;
              rememberKnownNoAdsOrderId(data?.orderId);
              console.info('[IAP] toss purchase success event', {
                orderId: data?.orderId,
                amount: data?.amount,
                sku: data?.sku,
              });
              setAdRemoved(true);
              cleanup?.();
              finish('started');
              return;
            }
            console.info('[IAP] toss purchase non-success event', { type: event.type });
          },
          onError: (error: unknown) => {
            const code = (error as { code?: string })?.code;
            console.warn('[IAP] createOneTimePurchaseOrder onError', { code, error });
            cleanup?.();
            if (code === 'USER_CANCELED' || code === 'USER_CANCELLED') {
              finish('cancelled');
              return;
            }
            lastIapErrorCode = code ?? 'TOSS_PURCHASE_FAILED';
            console.warn('[IAP] toss purchase failed', error);
            finish('failed');
          },
        });
      } catch (error) {
        lastIapErrorCode = 'PURCHASE_FLOW_START_FAILED';
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
