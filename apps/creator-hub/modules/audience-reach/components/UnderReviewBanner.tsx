import type { FC } from 'react';
import { SelectStatusEnum } from '@rbx/client-core-content-api/v1';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface UnderReviewBannerProps {
  selectStatus: SelectStatusEnum;
  underReview: boolean | null;
}

const UnderReviewBanner: FC<UnderReviewBannerProps> = ({ selectStatus, underReview }) => {
  const { translateWithNamespace } = useTranslation();

  // Note: this evaluates to true when underReview is null to keep the existing behavior, though this
  // handling is different from the expedited banner.
  if (!underReview || selectStatus !== SelectStatusEnum.Eligible) {
    return null;
  }

  return (
    <FeedbackBanner
      title={translateWithNamespace(
        TranslationNamespace.AudienceReach,
        'Heading.PendingFinalReview',
      )}
      description={translateWithNamespace(
        TranslationNamespace.AudienceReach,
        'Description.PendingFinalReview',
      )}
      layout='Inline'
      variant='Emphasis'
      severity='Success'
    />
  );
};

export default UnderReviewBanner;
