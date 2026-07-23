import React, { useMemo } from 'react';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useTranslation } from '@rbx/intl';
import GenericAnalyticsBreakglassBanner from './GenericAnalyticsBreakglassBanner';

export const useIsGeneralBreakglassBannerOn = () => {
  const { IsGeneralBreakGlassBannerEnabled } = useFeatureFlagsForNamespace(
    'IsGeneralBreakGlassBannerEnabled',
    FeatureFlagNamespace.Analytics,
  );
  return IsGeneralBreakGlassBannerEnabled;
};

const GeneralBreakglassBanner: React.FC = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { titleText, contentText } = useMemo(
    () => ({
      titleText: translate(
        translationKey('Title.GeneralBreakglassBanner', TranslationNamespace.Analytics),
      ),
      contentText: translate(
        translationKey('Description.GeneralBreakglassBanner', TranslationNamespace.Analytics),
      ),
    }),
    [translate],
  );

  return <GenericAnalyticsBreakglassBanner titleText={titleText} contentText={contentText} />;
};

export default GeneralBreakglassBanner;
