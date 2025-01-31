import { AutoRebalancingSettings } from '../types/api';
import { getApiClient } from '../services/api-provider';

export async function updateAutoRebalancing(asset: string, settings: AutoRebalancingSettings): Promise<void> {
  return getApiClient().updateAutoRebalancing(asset, settings);
}

export async function getAutoRebalancing(asset: string): Promise<AutoRebalancingSettings> {
  return getApiClient().getAutoRebalancing(asset);
}
