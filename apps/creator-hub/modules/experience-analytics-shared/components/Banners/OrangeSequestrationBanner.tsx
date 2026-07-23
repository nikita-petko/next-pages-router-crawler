import React, { useMemo } from 'react';
import { developerForum } from '@modules/miscellaneous/common/urls/creatorHub';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import GenericAnalyticsBreakglassBanner from './GenericAnalyticsBreakglassBanner';
import useGetExperienceSafetyStatus from '../../hooks/useGetExperienceSafetyStatus';
import { ExperienceSafetyStatus } from '../../enums/ExperienceSafetyStatus';

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
      primaryActionConfig={{
        text: translate(translationKey('Message.Alert.LearnMore', TranslationNamespace.Analytics)),
        link: `${developerForum.getBaseUrl()}/t/strengthening-our-safety-policies-and-tools/3882864`,
      }}
    />
  );
};

export default OrangeSequestrationBanner;
