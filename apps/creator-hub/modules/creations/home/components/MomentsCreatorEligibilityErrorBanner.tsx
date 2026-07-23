import type { FC } from 'react';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type MomentsCreatorEligibilityErrorBannerProps = {
  onRetry: () => void;
};

const MomentsCreatorEligibilityErrorBanner: FC<MomentsCreatorEligibilityErrorBannerProps> = ({
  onRetry,
}) => {
  const { translate } = useTranslation();

  return (
    <FeedbackBanner
      className='width-full'
      layout='Inline'
      variant='Emphasis'
      severity='Error'
      title={translate('Heading.GenericError' /* TranslationNamespace.Error */)}
      description={translate('Message.FailedToLoadPage' /* TranslationNamespace.Error */)}
      primaryActionLabel={translate('Action.FailedToLoadPage' /* TranslationNamespace.Error */)}
      onPrimaryAction={onRetry}
      data-testid='moments-creator-eligibility-error-banner'
    />
  );
};

export default withTranslation(MomentsCreatorEligibilityErrorBanner, [TranslationNamespace.Error]);
