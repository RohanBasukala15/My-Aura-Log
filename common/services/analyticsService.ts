import { isFirebaseConfigured } from './firebase';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';

function getAnalyticsInstance() {
  return getAnalytics();
}

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (!isFirebaseConfigured) {
    if (__DEV__) {
      console.log('[Analytics]', eventName, params || {});
    }
    return;
  }

  try {
    logEvent(getAnalyticsInstance(), eventName, params ?? {});
  } catch (error) {
    if (__DEV__) {
      console.warn('Analytics logEvent failed:', error);
    }
  }
};

/** Fallback when screen name is empty or "/" (Firebase shows these as "(not set)") */
const SANITIZE_SCREEN_NAME = (name: string): string => {
  const trimmed = (name || '').trim();
  if (trimmed === '' || trimmed === '/') return 'app';
  return trimmed;
};

export const trackScreenView = (screenName: string, screenClass?: string) => {
  const name = SANITIZE_SCREEN_NAME(screenName);
  const screenClassSafe = screenClass ? SANITIZE_SCREEN_NAME(screenClass) : name;

  if (!isFirebaseConfigured) {
    if (__DEV__) {
      console.log('[Analytics Screen]', name);
    }
    return;
  }

  try {
    logEvent(getAnalyticsInstance(), 'screen_view', {
      screen_name: name,
      screen_class: screenClassSafe,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('Analytics screen_view failed:', error);
    }
  }
};

/**
 * Track button press event
 * @param buttonName - Name/identifier of the button
 * @param location - Where the button is located (e.g., 'dashboard', 'settings')
 * @param additionalParams - Any additional parameters
 */
export const trackButtonPress = (
  buttonName: string,
  location?: string,
  additionalParams?: Record<string, any>
) => {
  trackEvent('button_press', {
    button_name: buttonName,
    location: location || 'unknown',
    ...additionalParams,
  });
};

/**
 * Track navigation event
 * @param fromScreen - Screen navigating from
 * @param toScreen - Screen navigating to
 * @param method - Navigation method (e.g., 'tab', 'push', 'modal')
 */
export const trackNavigation = (
  fromScreen: string,
  toScreen: string,
  method?: string
) => {
  trackEvent('navigation', {
    from_screen: fromScreen,
    to_screen: toScreen,
    method: method || 'unknown',
  });
};

/**
 * Track tab navigation
 * @param tabName - Name of the tab selected
 */
export const trackTabNavigation = (tabName: string) => {
  trackEvent('tab_navigation', {
    tab_name: tabName,
  });
};

/**
 * Track paywall screen view (with optional source)
 */
export const trackPaywallView = (source?: string) => {
  trackEvent('paywall_view', source ? { source } : {});
};

/**
 * Track upgrade CTA click (Unlock Premium, See What's Included)
 */
export const trackUpgradeClick = (location: string) => {
  trackEvent('upgrade_click', { location });
};

/**
 * Track purchase flow events
 */
export const trackPurchaseStart = (type: 'monthly' | 'lifetime') => {
  trackEvent('purchase_start', { type });
};

export const trackPurchaseSuccess = (type: 'monthly' | 'lifetime') => {
  trackEvent('purchase_success', { type });
};

export const trackPurchaseCancel = (type: 'monthly' | 'lifetime') => {
  trackEvent('purchase_cancel', { type });
};

/**
 * Track referral invite share
 */
export const trackReferralInviteShare = () => {
  trackEvent('referral_invite_share', {});
};

/**
 * Track onboarding completion
 */
export const trackOnboardingComplete = () => {
  trackEvent('onboarding_complete', {});
};

/**
 * Track first journal entry saved
 */
export const trackFirstEntrySaved = () => {
  trackEvent('first_entry_saved', {});
};

/**
 * Track AI insight generated
 */
export const trackAIInsightGenerated = () => {
  trackEvent('ai_insight_generated', {});
};
