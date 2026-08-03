import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ExperienceSafetyStatus } from '../../enums/ExperienceSafetyStatus';
import useGetExperienceSafetyStatus from '../../hooks/useGetExperienceSafetyStatus';
import GenericAnalyticsBreakglassBanner from './GenericAnalyticsBreakglassBanner';

export const useIsOrangeSequestrationBannerOn = () => {
  const safetyStatus = useGetExperienceSafetyStatus();
  return safetyStatus === ExperienceSafetyStatus.Orange;
};

const OrangeSequestrationBanner: React.FC = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { titleText, contentText } = useMemo(
    () => ({
      titleText: translate(
        translationKey('Heading.OrangeSequestered.BannerTitle', TranslationNamespace.Analytics),
      ),
      contentText: translate(
        translationKey(
          'Description.OrangeSequestered.BannerDescription',
          TranslationNamespace.Analytics,
        ),
      ),
    }),
    [translate],
  );

  return (
    <GenericAnalyticsBreakglassBanner
      titleText={titleText}
      contentText={contentText}
      severity='warning'
      logKey='orangeSequestration'
    />
  );
};

export default OrangeSequestrationBanner;
