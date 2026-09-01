import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chocoship.app',
  appName: 'CHOCO SHIP',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    cleartext: false
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    backgroundColor: '#ffffff'
  }
};

export default config;
