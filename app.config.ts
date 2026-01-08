import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Hold',
  slug: 'hold',
  scheme: 'hold',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.hold.app',
  },
  android: {
    package: 'com.hold.app',
    adaptiveIcon: {
      backgroundColor: '#F6F1EA',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#2C6E63',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#F6F1EA',
      },
    ],
  ],
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
