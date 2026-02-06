import { useCallback } from 'react';
import { usePathname } from 'expo-router';
import { trackButtonPress, trackEvent } from '@common/services/analyticsService';

/**
 * Hook to create a tracked press handler
 * @param buttonName - Name/identifier of the button
 * @param onPress - Original onPress handler
 * @param additionalParams - Additional parameters to track
 * @returns Wrapped onPress handler that tracks the event
 */
export const useTrackedPress = (
  buttonName: string,
  onPress?: () => void,
  additionalParams?: Record<string, any>
) => {
  const pathname = usePathname();

  return useCallback(() => {
    // Extract location from pathname
    const location = pathname?.match(/\(tabs\)\/([^/]+)/)?.[1] || 
                    pathname?.replace(/^\//, '').replace(/\//g, '_') || 
                    'unknown';
    
    trackButtonPress(buttonName, location, additionalParams);
    onPress?.();
  }, [buttonName, onPress, pathname, additionalParams]);
};

/**
 * Hook to track custom events
 * @returns Function to track events
 */
export const useTrackEvent = () => {
  return useCallback((eventName: string, params?: Record<string, any>) => {
    trackEvent(eventName, params);
  }, []);
};
