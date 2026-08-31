import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import useVerificationMetadata from '../hooks/useVerificationMetadata';
import { hasPremiumSubscription } from '../hooks/VerificationMetadataContext';
import GenericVerificationAlert from './GenericVerificationAlert';

const ClassicItemVerificationAlert: FunctionComponent<
  React.PropsWithChildren<Record<string, never>>
> = () => {
  const { translate } = useTranslation();
  const verificationMetadata = useVerificationMetadata();
  const hasPremium = hasPremiumSubscription(verificationMetadata);

  if (hasPremium) {
    return null;
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <GenericVerificationAlert
        alertTitle={translate('Heading.BlackbirdRequired')}
        alertDescription={translate('Description.BlackbirdRequired')}
        severity='info'
        externalLink={`https://${process.env.robloxSiteDomain}/plus`}
        linkLabel={translate('Label.GetBlackbird')}
        allowCloseDialog={false}
      />
    </div>
  );
};

export default ClassicItemVerificationAlert;
