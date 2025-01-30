import { ApiClient, HttpApiClient } from './api-client';

let apiClient: ApiClient;

export function initializeApi(baseUrl?: string) {
  if (!baseUrl) {
    throw new Error('Base URL is required for HTTP API client');
  }
  apiClient = new HttpApiClient(baseUrl);

}

export function getApiClient(): ApiClient {
  return apiClient;
}