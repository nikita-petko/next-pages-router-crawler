import React, { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { isGeneralBreakGlassBannerEnabled as isGeneralBreakGlassBannerEnabledFlag } from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import GenericAnalyticsBreakglassBanner from './GenericAnalyticsBreakglassBanner';

export const useIsGeneralBreakglassBannerOn = () => {
  const { ready, value: isGeneralBreakGlassBannerEnabled } = useFlag(
    isGeneralBreakGlassBannerEnabledFlag,
  );
  return ready && isGeneralBreakGlassBannerEnabled;
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
