const config = {
  appId: "com.mmart.store",
  appName: "Mmart",
  webDir: ".next",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#E10600",
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#E10600",
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#E10600",
      showSpinner: false,
      androidSplashResourceName: "splash",
      iosSpinnerStyle: "small",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#E10600",
      overlaysWebView: false,
    },
  },
};

export default config;
