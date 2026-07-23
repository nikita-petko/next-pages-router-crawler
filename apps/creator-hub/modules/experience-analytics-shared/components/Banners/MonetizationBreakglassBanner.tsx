import React, { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { isMonetizationBreakGlassBannerEnabled as isMonetizationBreakGlassBannerEnabledFlag } from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import GenericAnalyticsBreakglassBanner from './GenericAnalyticsBreakglassBanner';

export const useIsMonetizationBreakglassBannerOn = () => {
  const { ready, value: isMonetizationBreakGlassBannerEnabled } = useFlag(
    isMonetizationBreakGlassBannerEnabledFlag,
  );
  return ready && isMonetizationBreakGlassBannerEnabled;
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
