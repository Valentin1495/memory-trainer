import * as TossFramework from '@apps-in-toss/web-framework';
import { createConstantBridge, createEventBridge, isMinVersionSupported } from '@apps-in-toss/web-framework';

type ContactsViralEvent =
  | {
      type: 'sendViral';
      data: {
        rewardAmount: number;
        rewardUnit: string;
      };
    }
  | {
      type: 'close';
      data: {
        closeReason: 'clickBackButton' | 'noReward';
        sentRewardAmount?: number;
        sendableRewardsCount?: number;
        sentRewardsCount: number;
        rewardUnit?: string;
      };
    };

type ContactsViralBridge = {
  (params: {
    options: { moduleId: string };
    onEvent: (event: ContactsViralEvent) => void;
    onError: (error: unknown) => void;
  }): () => void;
  isSupported?: () => boolean;
};

interface StartContactsViralRewardParams {
  onReward: (rewardAmount: number, rewardUnit: string) => void;
  onClose: (event: Extract<ContactsViralEvent, { type: 'close' }>['data']) => void;
  onError: (error: unknown) => void;
}

const contactsViralModuleId =
  import.meta.env.VITE_TOSS_CONTACTS_VIRAL_MODULE_ID?.trim() ?? '';
const CONTACTS_VIRAL_MIN_VERSION = '5.223.0';

const fallbackContactsViralBridge: ContactsViralBridge = Object.assign(
  createEventBridge<{ moduleId: string }, ContactsViralEvent>('contactsViral'),
  {
    isSupported: createConstantBridge<boolean>('contactsViral_isSupported'),
  },
);

function getContactsViralBridge(): ContactsViralBridge | null {
  const bridge = (TossFramework as { contactsViral?: ContactsViralBridge }).contactsViral;
  return typeof bridge === 'function' ? bridge : fallbackContactsViralBridge;
}

export function isContactsViralConfigured(): boolean {
  return contactsViralModuleId.length > 0;
}

function isContactsViralMinVersionSupported(): boolean {
  try {
    return isMinVersionSupported({
      android: CONTACTS_VIRAL_MIN_VERSION,
      ios: CONTACTS_VIRAL_MIN_VERSION,
    });
  } catch {
    return false;
  }
}

export function canUseContactsViral(): boolean {
  if (!isContactsViralConfigured()) return false;
  if (!isContactsViralMinVersionSupported()) return false;

  const bridge = getContactsViralBridge();
  if (!bridge) return false;

  try {
    return typeof bridge.isSupported !== 'function' || bridge.isSupported();
  } catch {
    return false;
  }
}

export const isContactsViralSupported = canUseContactsViral;

export function startContactsViralReward({
  onReward,
  onClose,
  onError,
}: StartContactsViralRewardParams): (() => void) | null {
  const bridge = getContactsViralBridge();
  if (!bridge || !canUseContactsViral()) return null;

  return bridge({
    options: { moduleId: contactsViralModuleId },
    onEvent: (event) => {
      if (event.type === 'sendViral') {
        onReward(event.data.rewardAmount, event.data.rewardUnit);
        return;
      }

      onClose(event.data);
    },
    onError,
  });
}
