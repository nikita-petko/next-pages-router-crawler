import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useRobloxAuthentication } from '@rbx/auth';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSettings } from '@modules/settings';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import {
  getAgeVerificationUpsellFeatureAccess,
  getEstablishTrustFeatureAccess,
} from '../clients/ageVerificationUpsellFeatureAccess';
import { getIsDismissedToday, setIsDismissedToday } from '../repositories/bannerDismissal';

export type UpsellMode = 'ageVerification' | 'establishTrust';
export type UpsellEligibility = 'doNotShow' | UpsellMode;

export type AgeVerificationUpsellContextValue = {
  isBannerVisible: boolean;
  isBannerEligible: boolean;
  isHighPriority: boolean;
  variant: UpsellMode;
  dismissBanner: () => void;
};

export const AgeVerificationUpsellContext = createContext<AgeVerificationUpsellContextValue>({
  isBannerVisible: false,
  isBannerEligible: false,
  isHighPriority: false,
  dismissBanner: () => {
    throw new Error('dismissBanner not implemented');
  },
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

export const getEligibility = async (
  isEstablishTrustEnabled: boolean,
): Promise<UpsellEligibility> => {
  // Note (lhoward 2026-02-09):
  // see: https://github.rbx.com/Roblox/amp-v2-configuration/blob/master/configurations/studio/CollaborationSettings.yml
  //   getAgeVerificationUpsellFeatureAccess
  //     - false: They have already FAE'd or they are not eligible to FAE due to locale
  //     - true: They have not performed FAE and they are eligible for FAE
  //   getEstablishTrustFeatureAccess
  //     - false: They have not FAE'd or they have completed FAE and are 16+ or they are U16 and they have enabled trusted connections
  //     - true: They have FAE'd and they are U16 and have not enabled trusted connections
  const eligibleForAgeVerification = await getAgeVerificationUpsellFeatureAccess();
  if (eligibleForAgeVerification) {
    return 'ageVerification';
  }

  if (!isEstablishTrustEnabled) {
    // The next calls to AMP are only for Establish Trust; if EstablishTrust is disabled, go with original flow -- DoNotShow
    return 'doNotShow';
  }

  // The user has FAE'd or is ineligible for FAE, let's check whether they have FAE'd and are U16 and have not enabled trusted connections
  return (await getEstablishTrustFeatureAccess()) ? 'establishTrust' : 'doNotShow';
};

export const AgeVerificationUpsellProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const {
    settings: {
      enableAgeVerificationUpsellBanner,
      ageVerificationUpsellBannerStartDate,
      ageVerificationUpsellBannerEndDate,
      ageVerificationUpsellBannerHighPriorityDate,
      enableEstablishTrustUpsellBanner,
      establishTrustUpsellBannerStartDate,
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
    const establishTrustStartDate = isoDateStringToLocalDate(establishTrustUpsellBannerStartDate);

    const now = new Date();

    const isHighPriority = highPriorityDate <= now;
    const isInWindow = startDate <= now && now < endDate;
    const isEnabled = enableAgeVerificationUpsellBanner && isInWindow;
    const isEstablishTrustEnabled =
      isEnabled && enableEstablishTrustUpsellBanner && establishTrustStartDate <= now;

    return {
      isHighPriority,
      isEnabled,
      isEstablishTrustEnabled,
    };
  }, [
    enableAgeVerificationUpsellBanner,
    ageVerificationUpsellBannerEndDate,
    ageVerificationUpsellBannerStartDate,
    ageVerificationUpsellBannerHighPriorityDate,
    enableEstablishTrustUpsellBanner,
    establishTrustUpsellBannerStartDate,
  ]);

  const { isHighPriority, isEnabled, isEstablishTrustEnabled } = memoizedValues;

  const dismissBanner = useCallback(async () => {
    await setIsDismissedToday();
    setIsDismissed(true);
  }, [setIsDismissed]);

  useEffect(() => {
    if (!isEnabled || !isAuthLoaded || !user?.id) return;

    const runAsync = async () => {
      let isDismissedToday = false;
      try {
        isDismissedToday = await getIsDismissedToday();
      } catch (error) {
        unifiedLogger.logErrorEvent({
          eventName: CreatorDashboardEventType.AgeVerificationUpsellBannerError,
          parameters: {
            branch: 'isDismissedToday',
            error: (error as Error).message,
          },
        });
      }

      setIsDismissed(isDismissedToday);

      let upsellEligibilityShadow: UpsellEligibility = 'doNotShow';
      try {
        upsellEligibilityShadow = await getEligibility(enableEstablishTrustUpsellBanner);
      } catch (error) {
        unifiedLogger.logErrorEvent({
          eventName: CreatorDashboardEventType.AgeVerificationUpsellBannerError,
          parameters: {
            branch: 'getEligibility',
            error: (error as Error).message,
          },
        });
      }

      setUpsellEligibility(upsellEligibilityShadow);
    };

    runAsync().catch((error) => {
      unifiedLogger.logErrorEvent({
        eventName: CreatorDashboardEventType.AgeVerificationUpsellBannerError,
        parameters: {
          branch: 'runAsync',
          error: (error as Error).message,
        },
      });
    });
  }, [isEnabled, isAuthLoaded, user, unifiedLogger, enableEstablishTrustUpsellBanner]);

  const value: AgeVerificationUpsellContextValue = useMemo(() => {
    const isBannerEligible =
      (isEnabled || isEstablishTrustEnabled) && upsellEligibility !== 'doNotShow';

    return {
      isBannerVisible: isBannerEligible && !isDismissed,
      isBannerEligible,
      isHighPriority,
      variant:
        upsellEligibility !== 'doNotShow' ? (upsellEligibility as UpsellMode) : 'ageVerification',
      dismissBanner,
    };
  }, [
    isEnabled,
    isEstablishTrustEnabled,
    upsellEligibility,
    isDismissed,
    isHighPriority,
    dismissBanner,
  ]);

  return (
    <AgeVerificationUpsellContext.Provider value={value}>
      {children}
    </AgeVerificationUpsellContext.Provider>
  );
};

export const useAgeVerificationUpsellContext = () => {
  return useContext(AgeVerificationUpsellContext);
};
