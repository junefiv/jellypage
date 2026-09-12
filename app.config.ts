import type { ExpoConfig } from 'expo/config';

import { colors } from './src/theme/tokens';

const config: ExpoConfig = {
  name: 'HEXy',
  slug: 'hexy',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'hexy',
  userInterfaceStyle: 'dark',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.hexy.app',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.hexy.app',
    adaptiveIcon: {
      backgroundColor: colors.bg,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: ['CAMERA', 'READ_MEDIA_IMAGES', 'ACCESS_COARSE_LOCATION'],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-audio',
    'expo-dev-client',
    'expo-router',
    'expo-secure-store',
    'expo-sensors',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: colors.bg,
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'CAM',
        microphonePermission: 'CAM',
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'ROLL',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'GEO',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
};

export default config;
