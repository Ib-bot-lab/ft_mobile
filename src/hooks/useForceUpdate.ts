/**
 * hooks/useForceUpdate.ts
 *
 * Checks the backend on app launch to see if this version is blocked.
 * Returns { forceUpdate, updateMessage, storeUrl, checked }
 */

import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

interface ForceUpdateState {
  checked:       boolean;
  forceUpdate:   boolean;
  updateMessage: string;
  storeUrl:      string;
}

export function useForceUpdate(): ForceUpdateState {
  const [state, setState] = useState<ForceUpdateState>({
    checked:       false,
    forceUpdate:   false,
    updateMessage: '',
    storeUrl:      '',
  });

  useEffect(() => {
    const check = async () => {
      try {
        const res  = await fetch(
          `${API_BASE}/system-setting/version-check?version=${APP_VERSION}`,
          { signal: AbortSignal.timeout(8000) }
        );
        const data = await res.json();

        const storeUrl = Platform.OS === 'ios'
          ? (data.storeUrlIos     || '')
          : (data.storeUrlAndroid || '');

        setState({
          checked:       true,
          forceUpdate:   data.forceUpdate ?? false,
          updateMessage: data.updateMessage ?? '',
          storeUrl,
        });
      } catch {
        // Network error or server down — never block the user
        setState({ checked: true, forceUpdate: false, updateMessage: '', storeUrl: '' });
      }
    };

    check();
  }, []);

  return state;
}
