import React, { useEffect, useState } from 'react';
import { AutoRebalancing } from './AutoRebalancing';
import { getAutoRebalancing, updateAutoRebalancing } from '../api/autoRebalancing';
import { AutoRebalancingSettings } from '../types/api';

interface AutoRebalancingContainerProps {
  assetName: string;
}

export function AutoRebalancingContainer({ assetName }: AutoRebalancingContainerProps) {
  const [settings, setSettings] = useState<AutoRebalancingSettings>({
    enabled: false,
    spread: '0.5',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getAutoRebalancing(assetName);
        setSettings(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch auto rebalancing settings:', err);
        setError('Failed to load rebalancing settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [assetName]);

  const handleEnabledChange = async (enabled: boolean) => {
    try {
      const updatedSettings = { ...settings, enabled };
      setSettings(updatedSettings);
      await updateAutoRebalancing(assetName, updatedSettings);
      setError(null);
    } catch (err) {
      console.error('Failed to update auto rebalancing settings:', err);
      setError('Failed to update rebalancing settings');
      // Revert the UI state on error
      setSettings(settings);
    }
  };

  const handleSpreadChange = async (spread: string) => {
    setSettings({ ...settings, spread });
  };

  const handleSpreadBlur = async () => {
    try {
      await updateAutoRebalancing(assetName, settings);
      setError(null);
    } catch (err) {
      console.error('Failed to update auto rebalancing settings:', err);
      setError('Failed to update rebalancing settings');
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading rebalancing settings...</div>;
  }

  return (
    <div>
      {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
      <AutoRebalancing
        enabled={settings.enabled}
        spread={settings.spread}
        onEnabledChange={handleEnabledChange}
        onSpreadChange={handleSpreadChange}
        onSpreadBlur={handleSpreadBlur}
      />
    </div>
  );
}
