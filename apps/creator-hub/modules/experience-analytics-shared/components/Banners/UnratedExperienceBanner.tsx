import React, { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfToday } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Link, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import experienceGuidelinesService from '@modules/clients/experienceGuidelinesService';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { isPrivateAudience } from '@modules/creations/common/audiences';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { developerForum } from '@modules/miscellaneous/urls/creatorHub';
import { useUniverseEligibility } from '@modules/questionnaire/utils/queries';
import { getUniverseConfiguration } from '@modules/react-query/develop/universeApiRequest';
import { useUniverseResource } from '../../hooks/useChartResourceProvider';
import GenericAnalyticsBreakglassBanner from './GenericAnalyticsBreakglassBanner';

const AGE_RECOMMENDATION_QUERY_KEY = 'experienceGuidelinesService/getDetailedGuidelinesForBanner';
const UNRATED_CONTENT_MATURITY = 'unrated';
const LOG_KEY = 'unratedExperience';

export enum UnratedExperienceBannerType {
  Unrated = 'unrated',
  GracePeriod = 'gracePeriod',
}

interface UnratedExperienceBannerConfig {
  severity: 'warning' | 'error';
  titleKey: string;
  descriptionKey: string;
  includePolicyDetailsLink: boolean;
}

const BANNER_TYPE_CONFIG: Record<UnratedExperienceBannerType, UnratedExperienceBannerConfig> = {
  [UnratedExperienceBannerType.Unrated]: {
    severity: 'error',
    titleKey: 'Heading.UnratedExperience.PostDeadline.BannerTitle',
    descriptionKey: 'Description.UnratedExperience.PostDeadline.BannerDescription',
    includePolicyDetailsLink: true,
  },
  [UnratedExperienceBannerType.GracePeriod]: {
    severity: 'warning',
    titleKey: 'Heading.UnratedExperience.GracePeriod.BannerTitle',
    descriptionKey: 'Description.UnratedExperience.GracePeriod.BannerDescription',
    includePolicyDetailsLink: false,
  },
};

const isUniversePublic = async (universeId: number, enableAudiencesReplacement: boolean) => {
  const universeDetails = await getUniverseConfiguration(universeId);
  if (enableAudiencesReplacement) {
    return !isPrivateAudience(universeDetails?.audiences);
  }
  return universeDetails?.privacyType === 'Public';
};

export const useGetExperienceUnratedBannerTypeOrNull = () => {
  const { id: universeId } = useUniverseResource();
  const {
    params: { enableAudiencesReplacement },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);
  const audiencesReplacementOn = enableAudiencesReplacement === true;

  const { data } = useQuery({
    queryKey: [AGE_RECOMMENDATION_QUERY_KEY, universeId, audiencesReplacementOn],
    queryFn: async () => {
      if (!universeId) {
        return null;
      }

      // Check if the universe is public first
      const universeIsPublic = await isUniversePublic(universeId, audiencesReplacementOn);
      if (!universeIsPublic) {
        return null;
      }

      const response = await experienceGuidelinesService.getDetailedGuidelines(universeId);
      const submitBy = response.submitBy ? new Date(response.submitBy) : null;
      const contentMaturity =
        response.ageRecommendationDetails?.ageRecommendationSummary?.ageRecommendation
          ?.contentMaturity;

      if (submitBy && startOfToday() < submitBy) {
        return UnratedExperienceBannerType.GracePeriod;
      }

      return contentMaturity === UNRATED_CONTENT_MATURITY
        ? UnratedExperienceBannerType.Unrated
        : null;
    },
    enabled: !!universeId,
  });

  const { data: eligibilityData, isLoading } = useUniverseEligibility(universeId);
  if (isLoading || eligibilityData?.eligibility !== 'Allowed') {
    return null;
  }

  return data ?? null;
};

interface UnratedExperienceBannerProps {
  bannerType: UnratedExperienceBannerType;
}

const UnratedExperienceBanner: React.FC<UnratedExperienceBannerProps> = ({ bannerType }) => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { id: universeId } = useUniverseResource();

  const { severity, titleKey, descriptionKey, includePolicyDetailsLink } =
    BANNER_TYPE_CONFIG[bannerType];

  const questionnaireUrl = useMemo(
    () => `/dashboard/creations/experiences/${universeId}/experience-questionnaire`,
    [universeId],
  );

  const titleText = useMemo(
    () => translate(translationKey(titleKey, TranslationNamespace.Analytics)),
    [translate, titleKey],
  );

  const handlePolicyClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: 'analytics/banner/unratedExperiencePolicyClick',
      parameters: { universe_id: `${universeId}`, name: LOG_KEY },
    });
  }, [unifiedLogger, universeId]);

  const contentText = useMemo(() => {
    if (includePolicyDetailsLink) {
      return translateHTML(translationKey(descriptionKey, TranslationNamespace.Analytics), [
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content(chunks) {
            return (
              <Link
                href={`${developerForum.getBaseUrl()}/t/important-updates-unrated-experiences-and-changes-to-experience-pages/3899317`}
                target='_blank'
                underline='always'
                color='inherit'
                onClick={handlePolicyClick}>
                <Typography variant='body2' color='inherit'>
                  {chunks}
                </Typography>
              </Link>
            );
          },
        },
      ]);
    }

    return translate(translationKey(descriptionKey, TranslationNamespace.Analytics));
  }, [translate, translateHTML, descriptionKey, includePolicyDetailsLink, handlePolicyClick]);

  const ctaText = useMemo(
    () => translate(translationKey('Action.ViewQuestionnaire', TranslationNamespace.Analytics)),
    [translate],
  );

  return (
    <GenericAnalyticsBreakglassBanner
      titleText={titleText}
      contentText={contentText}
      severity={severity}
      logKey={LOG_KEY}
      primaryActionConfig={{
        text: ctaText,
        link: questionnaireUrl,
      }}
    />
  );
};

export default UnratedExperienceBanner;
