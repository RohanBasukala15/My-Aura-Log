
import { analytics, isFirebaseConfigured } from './firebase';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';

const logEvent = firebaseLogEvent;

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (!isFirebaseConfigured || !analytics) {
    // Silently fail in development or if Firebase is not configured
    if (__DEV__) {
      console.log('[Analytics]', eventName, params || {});
    }
    return;
  }

  try {
    logEvent(analytics, eventName, params);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

export const trackScreenView = (screenName: string, screenClass?: string) => {
  if (!isFirebaseConfigured || !analytics) {
    if (__DEV__) {
      console.log('[Analytics Screen]', screenName);
    }
    return;
  }

  try {
    logEvent(analytics, 'screen_view_event', {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  } catch (error) {
    console.error('Error tracking screen view:', error);
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
