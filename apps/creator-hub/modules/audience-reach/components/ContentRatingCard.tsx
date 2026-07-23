import type { FC } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { ExperienceQuestionnaireRoute } from '../constants/audienceReachConstants';
import type { ContentRatingDetails } from '../types/audienceReach';
import AudienceReachCard, { type CardMessage } from './AudienceReachCard';

interface ContentRatingCardProps {
  contentRating: ContentRatingDetails;
  isPrivate: boolean;
  universeId: string;
}

const ContentRatingCard: FC<ContentRatingCardProps> = ({
  contentRating,
  isPrivate,
  universeId,
}) => {
  const { translate } = useTranslation();
  const router = useRouter();

  const questionnaireHref = `/dashboard/creations/experiences/${universeId}${ExperienceQuestionnaireRoute}`;
  const isUnrated = contentRating.isUnrated;

  // The page-level RestrictedExperienceBanner handles the separate
  // "removed for policy violation" surface.
  const message: CardMessage | undefined =
    isUnrated && !isPrivate
      ? {
          severity: 'Error',
          title: translate('Heading.GameUnplayableUnrated'),
          description: translate('Description.GameUnplayableUnrated'),
        }
      : undefined;

  const valueLabel = isUnrated ? translate('Label.Unrated') : (contentRating.ratingLabel ?? '');

  const description = isUnrated
    ? translate('Description.UnratedWarning')
    : contentRating.descriptors.length > 0
      ? contentRating.descriptors.join(', ')
      : undefined;

  return (
    <AudienceReachCard
      message={message}
      title={translate('Label.ExperienceContentRating')}
      value={valueLabel}
      description={description}
      action={{
        label: translate('Action.ViewQuestionnaire'),
        onClick: () => {
          void router.push(questionnaireHref);
        },
        variant: isUnrated ? 'Emphasis' : 'Standard',
      }}
    />
  );
};

export default ContentRatingCard;
