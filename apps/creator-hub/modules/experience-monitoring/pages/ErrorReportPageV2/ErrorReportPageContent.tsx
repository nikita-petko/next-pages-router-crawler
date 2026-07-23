import { useMemo, type FC } from 'react';
import { useFlag } from '@rbx/flags';
import { withTranslation } from '@rbx/intl';
import {
  isErrorReportNewPlaceVersionLiveBannerEnabled,
  isErrorReportV2Enabled,
  isFirstSeenColumnEnabled,
} from '@generated/flags/creatorAnalytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getErrorReportPageV2Config } from './errorReportPageV2Config';
import { useNewPlaceVersionLiveBannerElement } from './NewPlaceVersionLiveBanner';

const ErrorReportPageContent: FC = () => {
  const { id: universeId, isLoading: isResourceLoading } = useUniverseResource();
  const { ready: isFlagReady, value: isErrorReportV2EnabledFlag } = useFlag(
    isErrorReportV2Enabled,
    {
      universeId,
    },
  );
  const { ready: isFirstSeenColumnFlagReady, value: isFirstSeenColumnEnabledFlag } = useFlag(
    isFirstSeenColumnEnabled,
    {
      universeId,
    },
  );
  const {
    ready: isNewPlaceVersionLiveBannerFlagReady,
    value: isNewPlaceVersionLiveBannerEnabledFlag,
  } = useFlag(isErrorReportNewPlaceVersionLiveBannerEnabled, {
    universeId,
  });
  const shouldEnableNewPlaceVersionLiveBanner =
    isFlagReady &&
    isErrorReportV2EnabledFlag &&
    isNewPlaceVersionLiveBannerFlagReady &&
    isNewPlaceVersionLiveBannerEnabledFlag;
  const newPlaceVersionLiveBannerElement = useNewPlaceVersionLiveBannerElement(
    shouldEnableNewPlaceVersionLiveBanner,
  );

  const config = useMemo(
    () =>
      getErrorReportPageV2Config(
        Boolean(isErrorReportV2EnabledFlag),
        Boolean(isFirstSeenColumnEnabledFlag),
        newPlaceVersionLiveBannerElement,
      ),
    [isErrorReportV2EnabledFlag, isFirstSeenColumnEnabledFlag, newPlaceVersionLiveBannerElement],
  );

  if (isResourceLoading || !isFlagReady || !isFirstSeenColumnFlagReady) {
    return <PageLoading />;
  }

  return <CreatorAnalyticsLayout config={config} />;
};

export default withTranslation(ErrorReportPageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
]);
