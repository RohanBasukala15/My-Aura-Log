const AppConstants = {
  Config: {
    Api: {
      apiURL: process.env.EXPO_PUBLIC_apiEndpoint,
      authURL: process.env.EXPO_PUBLIC_authEndpoint,
      maxConnectionTimeout: 20000, // twenty-second
    },
    Validation: {
      otp: {
        otpLength: 6,
        resendTimeout: 60, // 1 minutes
      },
      passwordLength: 8,
      supportedImages: ["image/png", "image/jpeg", "image/jpg"],
    },
  },
  StorageKey: {
    appSession: "app-session",
    appLanguage: "app_language",
    onboardingState: "onboarding-state",
    rememberUser: "remember-user",
    fcmRegistryToken: "fcmRegistryToken",
    fcmToken: "fcm-token",
    fcmRegistryCompleted: "fcm-registration-status",
  },
  ApiKeys: {
    editProfile: "/api/v1/user/edit/user",
    signIn: "/api/v1/auth/login",
    signup: {
      registrations: "/api/v1/user/registration",
      addRelatives: "/api/v1/user/add-relatives",
      setPassword: "/api/v1/user/set-password",
    },
    changePassword: "/api/v1/auth/password/change",
    forgotPassword: {
      init: "/api/v1/auth/password/reset/init",
      resendOtp: "/api/v1/auth/password/resentOtp",
      verify: "/api/v1/auth/password/reset/verify",
      setPassword: "/api/v1/auth/password/reset/complete",
    },
    fcmRegistration: "/api/v1/device/register",

    logout: "/api/v1/auth/logout",
    user: "/api/v1/user",
  },
  Resources: {
    contactEmail: "myauralog@gmail.com",
  },
};

export default AppConstants;
