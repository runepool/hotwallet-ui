import { ApiClient, HttpApiClient } from './api-client';
import { MockApiClient } from './mock-api-client';

let apiClient: ApiClient;

export function initializeApi(useMock: boolean = true, baseUrl?: string) {
  if (useMock) {
    apiClient = new MockApiClient();
  } else {
    if (!baseUrl) {
      throw new Error('Base URL is required for HTTP API client');
    }
    apiClient = new HttpApiClient(baseUrl);
  }
}

export function getApiClient(): ApiClient {
  if (!apiClient) {
    initializeApi(); // Default to mock client
  }
  return apiClient;
}