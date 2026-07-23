import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRobloxAuthentication } from '@rbx/auth';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { getAgeVerificationUpsellFeatureAccess } from '../clients/ageVerificationUpsellFeatureAccess';
import { getIsDismissedToday, setIsDismissedToday } from '../repositories/bannerDismissal';

export type UpsellMode = 'ageVerification' | 'establishTrust';
export type UpsellEligibility = 'doNotShow' | UpsellMode;

export type AgeVerificationUpsellContextValue = {
  isBannerVisible: boolean;
  isBannerEligible: boolean;
  isHighPriority: boolean;
  variant: UpsellMode;
  dismissBanner: () => Promise<void>;
};

export const AgeVerificationUpsellContext = createContext<AgeVerificationUpsellContextValue>({
  isBannerVisible: false,
  isBannerEligible: false,
  isHighPriority: false,
  dismissBanner: () => Promise.reject(new Error('dismissBanner not implemented')),
  variant: 'ageVerification',
});

export const isoDateStringToLocalDate = (isoDateString: string) => {
  // Note (lhoward 2025-11-18): the date string is UTC, when we parse it as a date it becomes TZ aware; ie, offset is applied.
  // We use the date strings to store the date of the control flow / the priority of the banner (start / end dates, high priority date).
  // If we want to know if this user's local timezone applies to the setting date, we need to convert to local time.
  // For example:
  //   Let's say start date is '2026-02-04T00:00:00Z', and the user is in PDT with -8 offset. When we parse '2026-02-04T00:00:00Z' via
  //   `new Date('2026-02-04T00:00:00Z')`, this gets converted to `2026-02-03T16:00:00` because of PDT's -8 offset, but we don't want
  //   that, we want to know if it's past `2026-02-04T00:00:00` for this user's timezone, not UTC timezone. Therefore we use the UTC
  //   year / month / date to generate the tz-aware Date
  const tzAwareDate = new Date(isoDateString);
  return new Date(
    tzAwareDate.getUTCFullYear(),
    tzAwareDate.getUTCMonth(),
    tzAwareDate.getUTCDate(),
  );
};

export const getEligibility = async (): Promise<UpsellEligibility> => {
  const eligibleForAgeVerification = await getAgeVerificationUpsellFeatureAccess();
  if (eligibleForAgeVerification) {
    return 'ageVerification';
  }

  return 'doNotShow';
};

export const AgeVerificationUpsellProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const {
    settings: {
      enableAgeVerificationUpsellBanner,
      ageVerificationUpsellBannerStartDate,
      ageVerificationUpsellBannerEndDate,
      ageVerificationUpsellBannerHighPriorityDate,
    },
  } = useSettings();
  const [isDismissed, setIsDismissed] = useState(true);
  const [upsellEligibility, setUpsellEligibility] = useState<UpsellEligibility>('doNotShow');
  const { isFetched: isAuthLoaded, user } = useRobloxAuthentication();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const memoizedValues = useMemo(() => {
    const startDate = isoDateStringToLocalDate(ageVerificationUpsellBannerStartDate);
    const endDate = isoDateStringToLocalDate(ageVerificationUpsellBannerEndDate);
    const highPriorityDate = isoDateStringToLocalDate(ageVerificationUpsellBannerHighPriorityDate);
    const now = new Date();

    const isHighPriority = highPriorityDate <= now;
    const isInWindow = startDate <= now && now < endDate;
    const isEnabled = enableAgeVerificationUpsellBanner && isInWindow;

    return {
      isHighPriority,
      isEnabled,
    };
  }, [
    enableAgeVerificationUpsellBanner,
    ageVerificationUpsellBannerEndDate,
    ageVerificationUpsellBannerStartDate,
    ageVerificationUpsellBannerHighPriorityDate,
  ]);

  const { isHighPriority, isEnabled } = memoizedValues;

  const dismissBanner = useCallback(async () => {
    await setIsDismissedToday();
    setIsDismissed(true);
  }, [setIsDismissed]);

  useEffect(() => {
    if (!isEnabled || !isAuthLoaded || !user?.id) {
      return;
    }

    const runAsync = async () => {
      let isDismissedToday = false;
      try {
        isDismissedToday = await getIsDismissedToday();
      } catch (error) {
        unifiedLogger.logErrorEvent({
          eventName: CreatorDashboardEventType.AgeVerificationUpsellBannerError,
          parameters: {
            branch: 'isDismissedToday',
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }

      setIsDismissed(isDismissedToday);

      let upsellEligibilityShadow: UpsellEligibility = 'doNotShow';
      try {
        upsellEligibilityShadow = await getEligibility();
      } catch (error) {
        unifiedLogger.logErrorEvent({
          eventName: CreatorDashboardEventType.AgeVerificationUpsellBannerError,
          parameters: {
            branch: 'getEligibility',
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }

      setUpsellEligibility(upsellEligibilityShadow);
    };

    runAsync().catch((error: unknown) => {
      unifiedLogger.logErrorEvent({
        eventName: CreatorDashboardEventType.AgeVerificationUpsellBannerError,
        parameters: {
          branch: 'runAsync',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    });
  }, [isEnabled, isAuthLoaded, user, unifiedLogger]);

  const value: AgeVerificationUpsellContextValue = useMemo(() => {
    const isBannerEligible = isEnabled && upsellEligibility !== 'doNotShow';

    return {
      isBannerVisible: isBannerEligible && !isDismissed,
      isBannerEligible,
      isHighPriority,
      variant: upsellEligibility !== 'doNotShow' ? upsellEligibility : 'ageVerification',
      dismissBanner,
    };
  }, [isEnabled, upsellEligibility, isDismissed, isHighPriority, dismissBanner]);

  return (
    <AgeVerificationUpsellContext.Provider value={value}>
      {children}
    </AgeVerificationUpsellContext.Provider>
  );
};

export const useAgeVerificationUpsellContext = () => {
  return useContext(AgeVerificationUpsellContext);
};
