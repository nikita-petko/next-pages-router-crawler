import React, { useMemo } from 'react';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useTranslation } from '@rbx/intl';
import GenericAnalyticsBreakglassBanner from './GenericAnalyticsBreakglassBanner';

export const useIsMonetizationBreakglassBannerOn = () => {
  const { IsMonetizationBreakGlassBannerEnabled } = useFeatureFlagsForNamespace(
    'IsMonetizationBreakGlassBannerEnabled',
    FeatureFlagNamespace.Analytics,
  );
  return IsMonetizationBreakGlassBannerEnabled;
};

const MonetizationBreakglassBanner: React.FC = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { titleText, contentText } = useMemo(
    () => ({
      titleText: translate(
        translationKey('Title.MonetizationBreakglassBanner', TranslationNamespace.Analytics),
      ),
      contentText: translate(
        translationKey('Description.MonetizationBreakglassBanner', TranslationNamespace.Analytics),
      ),
    }),
    [translate],
  );

  return <GenericAnalyticsBreakglassBanner titleText={titleText} contentText={contentText} />;
};

export default MonetizationBreakglassBanner;
