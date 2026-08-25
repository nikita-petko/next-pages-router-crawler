import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Link, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  useGetExperienceUnratedBannerTypeOrNull,
  UnratedExperienceBannerType,
} from '@modules/experience-analytics-shared/components/Banners/UnratedExperienceBanner';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { developerForum } from '@modules/miscellaneous/urls/creatorHub';
import type { UnifiedAlertItem, UnifiedAlertSeverity } from '@modules/unified-alerts/types';
import { ExperienceOverviewAlertId } from '../ExperienceOverviewAlertIds';

const POLICY_DETAILS_URL = `${developerForum.getBaseUrl()}/t/important-updates-unrated-experiences-and-changes-to-experience-pages/3899317`;

const BANNER_TYPE_CONFIG: Record<
  UnratedExperienceBannerType,
  {
    id: ExperienceOverviewAlertId;
    severity: UnifiedAlertSeverity;
    titleKey: string;
    descriptionKey: string;
    includePolicyDetailsLink: boolean;
  }
> = {
  [UnratedExperienceBannerType.Unrated]: {
    id: ExperienceOverviewAlertId.UnratedExperience,
    severity: 'Error',
    titleKey: 'Heading.UnratedExperience.PostDeadline.BannerTitle',
    descriptionKey: 'Description.UnratedExperience.PostDeadline.BannerDescription',
    includePolicyDetailsLink: true,
  },
  [UnratedExperienceBannerType.GracePeriod]: {
    id: ExperienceOverviewAlertId.UnratedExperienceGracePeriod,
    severity: 'Warning',
    titleKey: 'Heading.UnratedExperience.GracePeriod.BannerTitle',
    descriptionKey: 'Description.UnratedExperience.GracePeriod.BannerDescription',
    includePolicyDetailsLink: false,
  },
};

const useGetUnratedExperienceAlertItem = (): UnifiedAlertItem | null => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();
  const bannerType = useGetExperienceUnratedBannerTypeOrNull();

  return useMemo((): UnifiedAlertItem | null => {
    if (!bannerType) {
      return null;
    }

    const { id, severity, titleKey, descriptionKey, includePolicyDetailsLink } =
      BANNER_TYPE_CONFIG[bannerType];
    const questionnaireUrl = `/dashboard/creations/experiences/${universeId}/experience-questionnaire`;

    const description = includePolicyDetailsLink
      ? translateHTML(translationKey(descriptionKey, TranslationNamespace.Analytics), [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <Link href={POLICY_DETAILS_URL} target='_blank' underline='always' color='inherit'>
                  <Typography variant='body2' color='inherit'>
                    {chunks}
                  </Typography>
                </Link>
              );
            },
          },
        ])
      : translate(translationKey(descriptionKey, TranslationNamespace.Analytics));

    return {
      id,
      title: translate(translationKey(titleKey, TranslationNamespace.Analytics)),
      description,
      severity,
      ctaText: translate(
        translationKey('Action.ViewQuestionnaire', TranslationNamespace.Analytics),
      ),
      ctaOnClick: () => {
        window.location.href = questionnaireUrl;
      },
      dismissible: false,
    };
  }, [bannerType, translate, translateHTML, universeId]);
};

export default useGetUnratedExperienceAlertItem;
