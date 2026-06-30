import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sjs.erp',
  appName: 'SJS School',
  webDir: 'web',
  server: {
    url: 'https://sjs-school.vercel.app'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  }
};

export default config;
