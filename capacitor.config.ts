const appUrl = process.env.CAP_SERVER_URL ?? "https://mmart4u.com";

const config = {
  appId: "com.mmart.store",
  appName: "Mmart",
  webDir: "mobile-web",
  bundledWebRuntime: false,
  server: {
    url: appUrl,
    cleartext: false,
    androidScheme: "https",
    allowNavigation: ["mmart4u.com", "www.mmart4u.com"],
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
