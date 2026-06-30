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
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#1890ff",
      splashFullScreen: true,
      splashImmersive: true,
    },
  }
};

export default config;
