import type { FC } from 'react';
import { Button, FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface AudienceReachExpediteConfirmationBannerProps {
  universeId: number;
  isUnderReview: boolean | null;
}

const AudienceReachExpediteConfirmationBanner: FC<AudienceReachExpediteConfirmationBannerProps> = ({
  universeId,
  isUnderReview,
}) => {
  const { translateWithNamespace } = useTranslation();

  // Note: we check false here and not falsey: the backend may return null when the review
  // is not complete yet.
  if (isUnderReview === false) {
    return (
      <FeedbackBanner
        title={translateWithNamespace(
          TranslationNamespace.AudienceReach,
          'Heading.ExpeditedCompleteBanner',
        )}
        description={translateWithNamespace(
          TranslationNamespace.AudienceReach,
          'Description.ExpeditedCompleteBanner',
        )}
        layout='Inline'
        variant='Emphasis'
        severity='Success'
        actions={
          <Button
            as='a'
            href={`/dashboard/creations/experiences/${universeId}/configure`}
            variant='Standard'
            size='Small'>
            {translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.Settings')}
          </Button>
        }
      />
    );
  }

  return (
    <FeedbackBanner
      title={translateWithNamespace(
        TranslationNamespace.AudienceReach,
        'Heading.ExpeditedPendingBanner',
      )}
      description={translateWithNamespace(
        TranslationNamespace.AudienceReach,
        'Description.ExpeditedPendingBannerV2',
      )}
      layout='Inline'
      variant='Emphasis'
      severity='Success'
    />
  );
};

export default AudienceReachExpediteConfirmationBanner;
