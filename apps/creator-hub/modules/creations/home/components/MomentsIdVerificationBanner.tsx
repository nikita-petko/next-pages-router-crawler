import type { FC } from 'react';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { idVerificationActionUrl } from '@modules/publishing-permissions/constants/tiers';

const handlePrimaryAction = () => {
  window.open(idVerificationActionUrl, '_blank', 'noopener,noreferrer');
};

const MomentsIdVerificationBanner: FC = () => {
  const { translate } = useTranslation();

  return (
    <FeedbackBanner
      className='width-full'
      layout='Inline'
      variant='Emphasis'
      severity='Warning'
      title={translate(
        'Heading.MomentsIdVerificationRequired' /* TranslationNamespace.Creations */,
      )}
      description={translate(
        'Message.MomentsIdVerificationRequired' /* TranslationNamespace.Creations */,
      )}
      primaryActionLabel={translate('Label.VerifyId' /* TranslationNamespace.Creations */)}
      onPrimaryAction={handlePrimaryAction}
      data-testid='moments-id-verification-banner'
    />
  );
};

export default withTranslation(MomentsIdVerificationBanner, [TranslationNamespace.Creations]);
