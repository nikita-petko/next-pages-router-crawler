import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRobloxAuthentication } from '@rbx/auth';
import type { GenericCreatorSettingType } from '@rbx/client-creator-settings/v1';
import { useSearchConfig } from '../../contexts/SearchConfigContext';
import { createCreatorSettingsClient } from '../../clients/creatorSettingsClient';

const STORAGE_KEY_PREFIX = 'CreatorHubSearch.TooltipDismissed';

function getStorageKey(userId?: number): string {
  return userId != null ? `${STORAGE_KEY_PREFIX}.${userId}` : STORAGE_KEY_PREFIX;
}

// TODO(@neoxu): Replace with the generated enum value once @rbx/clients is regenerated
// with GENERIC_CREATOR_SETTING_TYPE_SEARCH_TOOLTIP_DISMISSED from creator_settings.proto
const SEARCH_TOOLTIP_SETTING_TYPE =
  'GENERIC_CREATOR_SETTING_TYPE_SEARCH_TOOLTIP_DISMISSED' as GenericCreatorSettingType;

/**
 * Date the announcement tooltip feature launched.
 * After TOOLTIP_EXPIRY_DAYS from this date, the tooltip is no longer shown.
 */
export const FEATURE_LAUNCH_DATE = new Date('2026-03-24');
export const TOOLTIP_EXPIRY_DAYS = 34; // NOTE(@neoxu): We are progress lunching this feature, add additional days here

function isTooltipExpired(): boolean {
  const expiryMs = TOOLTIP_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() > FEATURE_LAUNCH_DATE.getTime() + expiryMs;
}

/**
 * Manages the visibility of the one-time search announcement tooltip.
 *
 * Constraints:
 * - Only shown on the homepage
 * - Auto-expires 30 days after FEATURE_LAUNCH_DATE
 * - Dismissed on any click, page navigation, or page leave
 * - Shown at most once per creator (persisted via localStorage + creator-settings API)
 *
 * Flow:
 * 1. Default: hidden (avoid flash)
 * 2. Guard: not homepage or expired → stay hidden
 * 3. Check localStorage — if dismissed, stay hidden
 * 4. If not dismissed locally, call creator-settings API
 * 5. If API says dismissed, sync to localStorage and stay hidden
 * 6. Otherwise, show the tooltip
 * 7. On dismiss: hide immediately, persist to localStorage + API
 */
export default function useSearchTooltipVisibility() {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const dismissedRef = useRef(false);

  const { user, isFetched: isAuthLoaded } = useRobloxAuthentication();
  const userId = user?.id;

  const { robloxSiteDomain } = useSearchConfig();
  const client = useMemo(() => createCreatorSettingsClient(robloxSiteDomain), [robloxSiteDomain]);

  useEffect(() => {
    if (!isAuthLoaded || dismissedRef.current || isTooltipExpired()) {
      return undefined;
    }

    let cancelled = false;

    const storageKey = getStorageKey(userId);

    async function checkVisibility() {
      try {
        const localValue = localStorage.getItem(storageKey);
        if (localValue === 'true') {
          dismissedRef.current = true;
          if (!cancelled) {
            setVisible(false);
            setLoaded(true);
          }
          return;
        }

        if (userId != null) {
          const { settingValue } = await client.getGenericCreatorSetting(
            userId,
            SEARCH_TOOLTIP_SETTING_TYPE,
          );

          if (cancelled) return;

          if (settingValue === 'true') {
            dismissedRef.current = true;
            localStorage.setItem(storageKey, 'true');
            setVisible(false);
          } else {
            setVisible(true);
          }
        } else if (!cancelled) {
          setVisible(true);
        }
      } catch {
        if (!cancelled) {
          setVisible(true);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    checkVisibility();

    return () => {
      cancelled = true;
    };
  }, [isAuthLoaded, userId, client]);

  const dismiss = useCallback(async () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);
    localStorage.setItem(getStorageKey(userId), 'true');

    if (userId != null) {
      try {
        await client.updateGenericCreatorSetting(userId, SEARCH_TOOLTIP_SETTING_TYPE, 'true');
      } catch {
        // Best-effort: localStorage is set so tooltip won't reappear in this browser.
      }
    }
  }, [userId, client]);

  return { visible: visible && loaded, dismiss };
}
