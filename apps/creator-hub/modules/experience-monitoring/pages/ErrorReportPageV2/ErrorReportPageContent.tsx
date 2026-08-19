import { useMemo, type FC } from 'react';
import { withTranslation } from '@rbx/intl';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getErrorReportPageV2Config } from './errorReportPageV2Config';
import { useNewPlaceVersionLiveBannerElement } from './NewPlaceVersionLiveBanner';
import { useRobloxOwnedScriptErrorsRemovedBannerElement } from './RobloxOwnedScriptErrorsRemovedBanner';

const ErrorReportPageContent: FC = () => {
  const { isLoading: isResourceLoading } = useUniverseResource();
  const newPlaceVersionLiveBannerElement = useNewPlaceVersionLiveBannerElement();
  const robloxOwnedScriptErrorsRemovedBannerElement =
    useRobloxOwnedScriptErrorsRemovedBannerElement();
  const bannerElements = useMemo(
    () => [
      ...(robloxOwnedScriptErrorsRemovedBannerElement
        ? [robloxOwnedScriptErrorsRemovedBannerElement]
        : []),
      ...(newPlaceVersionLiveBannerElement ? [newPlaceVersionLiveBannerElement] : []),
    ],
    [newPlaceVersionLiveBannerElement, robloxOwnedScriptErrorsRemovedBannerElement],
  );

  const config = useMemo(() => getErrorReportPageV2Config(bannerElements), [bannerElements]);

  if (isResourceLoading) {
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
