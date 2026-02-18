import type { ExpoConfig } from 'expo/config';

const basePlugins: NonNullable<ExpoConfig['plugins']> = [
  [
    'expo-audio',
    {
      recordAudioAndroid: false,
      microphonePermission: false,
    },
  ],
  [
    'expo-navigation-bar',
    {
      backgroundColor: '#000000',
      barStyle: 'light',
      visibility: 'visible',
    },
  ],
];

const isNative = process.env.EXPO_OS === 'ios' || process.env.EXPO_OS === 'android';

const config: ExpoConfig = {
  name: 'Lumepo',
  slug: 'wellnessapp',
  scheme: 'wellnessapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  plugins: isNative ? [...basePlugins, 'expo-notifications'] : basePlugins,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.wellnessapp.mobile',
    infoPlist: {
      UIBackgroundModes: ['audio'],
      NSUserNotificationUsageDescription:
        'Aplikasi menggunakan notifikasi untuk pengingat ritual malam harian.',
    },
  },
  android: {
    package: 'com.wellnessapp.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: false,
    predictiveBackGestureEnabled: false,
  },
  updates: {
    url: 'https://u.expo.dev/03b17f91-5b62-4954-98b7-f4b70a8ec29f',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    eas: {
      projectId: '03b17f91-5b62-4954-98b7-f4b70a8ec29f',
    },
  },
};

export default config;
