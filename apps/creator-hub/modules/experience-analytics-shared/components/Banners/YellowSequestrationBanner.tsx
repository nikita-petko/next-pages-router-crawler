import React, { useMemo } from 'react';
import { developerForum } from '@modules/miscellaneous/common/urls/creatorHub';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import { ExperienceSafetyStatus } from '../../enums/ExperienceSafetyStatus';
import useGetExperienceSafetyStatus from '../../hooks/useGetExperienceSafetyStatus';
import GenericAnalyticsBreakglassBanner from './GenericAnalyticsBreakglassBanner';

export const useIsYellowSequestrationBannerOn = () => {
  const safetyStatus = useGetExperienceSafetyStatus();
  return safetyStatus === ExperienceSafetyStatus.Yellow;
};

const YellowSequestrationBanner: React.FC = () => {
  const { translate } = useTranslationWrapper(useTranslation());

  const { titleText, contentText } = useMemo(
    () => ({
      titleText: translate(
        translationKey('Heading.YellowSequestered.BannerTitle', TranslationNamespace.Analytics),
      ),
      contentText: translate(
        translationKey(
          'Description.YellowSequestered.BannerDescription',
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
      logKey='yellowSequestration'
      primaryActionConfig={{
        text: translate(translationKey('Message.Alert.LearnMore', TranslationNamespace.Analytics)),
        link: `${developerForum.getBaseUrl()}/t/strengthening-our-safety-policies-and-tools/3882864`,
      }}
    />
  );
};

export default YellowSequestrationBanner;
