import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chocoship.app',
  appName: 'CHOCO SHIP',
  webDir: 'www',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic'
  },
  android: {
    backgroundColor: '#f5f5f5'
  }
};

export default config;
