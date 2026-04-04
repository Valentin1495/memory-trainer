/// <reference types="@capacitor/keyboard" />

import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

const installAppName = env.APP_INSTALL_NAME?.trim() || '기억 코치';
const liveReloadUrl = env.CAP_SERVER_URL?.trim();
const isLiveReloadEnabled =
  process.env.CAP_LIVE_RELOAD === '1' && Boolean(liveReloadUrl);

const config: CapacitorConfig = {
  appId: 'com.memorychallenge.app',
  appName: installAppName,
  webDir: 'dist',
  ...(isLiveReloadEnabled
    ? {
        server: {
          url: liveReloadUrl,
          cleartext: liveReloadUrl?.startsWith('http://') ?? false,
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#667eea',
      showSpinner: false,
    },
    AdMob: {
      appIdAndroid: env.ADMOB_APP_ID_ANDROID,
      appIdIos: env.ADMOB_APP_ID_IOS,
    },
    Keyboard: {
      resize: KeyboardResize.None,
    },
  },
};

export default config;
