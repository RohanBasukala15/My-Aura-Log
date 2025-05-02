import mockApi from './index';

export function setupMockApi() {
    if (__DEV__) {
        console.log('Setting up mock API in development mode');
        try {
            const { authApiMock, apiMock } = mockApi({
                delayResponse: 1000,
                onNoMatch: 'passthrough'
            });


            // Add this to verify mock is working
            authApiMock.onAny().reply((config) => {
                console.log('Mock intercepted request:', config.url);
                return [404, { message: 'No mock handler found for this request' }];
            });
        } catch (error) {
            console.error('Failed to setup mock API:', error);
        }
    }
} 