import mockApi from './index';

export function setupMockApi() {
    if (__DEV__) {
        try {
            const { authApiMock, apiMock } = mockApi({
                delayResponse: 1000,
                onNoMatch: 'passthrough'
            });


            // Add this to verify mock is working
            authApiMock.onAny().reply((config) => {
                return [404, { message: 'No mock handler found for this request' }];
            });
        } catch (error) {
            // Silently fail in dev mode
        }
    }
} 