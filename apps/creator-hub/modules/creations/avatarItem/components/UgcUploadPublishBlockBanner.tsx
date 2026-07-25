import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import GenericVerificationAlert from '../../verification/components/GenericVerificationAlert';

const UgcUploadPublishBlockBanner: FC = () => {
  const { translate } = useTranslation();
  const { settings } = useSettings();

  if (!settings.enableUgcUploadPublishBlockBanner) {
    return null;
  }

  return (
    <GenericVerificationAlert
      alertTitle={translate('Heading.UgcUploadPublishBlockTitle')}
      alertDescription={translate('Label.UgcUploadPublishBlock')}
      severity='warning'
      externalLink={undefined}
      linkLabel={undefined}
      allowCloseDialog
    />
  );
};

export default UgcUploadPublishBlockBanner;
