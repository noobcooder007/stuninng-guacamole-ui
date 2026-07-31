export const environment = {
    production: true,
    apiBaseUrl: (window as unknown as { __env?: { apiBaseUrl?: string } }).__env?.apiBaseUrl ?? '/api'
};
