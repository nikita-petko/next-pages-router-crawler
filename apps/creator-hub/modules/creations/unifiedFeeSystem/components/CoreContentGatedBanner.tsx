import React from 'react';
import { useTranslation } from '@rbx/intl';
import GenericVerificationAlert from '../../verification/components/GenericVerificationAlert';

const CoreContentGatedBanner: React.FC = () => {
  const { translate } = useTranslation();

  return (
    <GenericVerificationAlert
      alertTitle={undefined}
      alertDescription={translate('Message.CoreContentGated')}
      severity='warning'
      externalLink='https://create.roblox.com/docs/marketplace/marketplace-policy#general-creation-guidelines'
      linkLabel={translate('Label.LearnMore')}
      allowCloseDialog={false}
    />
  );
};

export default CoreContentGatedBanner;
