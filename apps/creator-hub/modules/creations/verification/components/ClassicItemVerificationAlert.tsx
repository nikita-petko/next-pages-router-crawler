import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import type { RobloxItemConfigurationApiCollectiblesMetadataResponse } from '@rbx/client-itemconfiguration/v1';
import { useTranslation } from '@rbx/intl';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import useVerificationMetadata from '../hooks/useVerificationMetadata';
import { hasPremiumSubscription } from '../hooks/VerificationMetadataContext';
import GenericVerificationAlert from './GenericVerificationAlert';

const ClassicItemVerificationAlert: FunctionComponent<
  React.PropsWithChildren<Record<string, never>>
> = () => {
  const { translate } = useTranslation();
  const verificationMetadata = useVerificationMetadata();
  const hasPremium = hasPremiumSubscription(verificationMetadata);

  const [collectiblesMetadata, setCollectiblesMetadata] = useState<
    RobloxItemConfigurationApiCollectiblesMetadataResponse | undefined
  >(undefined);

  useEffect(() => {
    const updateMetadata = async () => {
      try {
        const response = await itemConfigurationClient.getCollectiblesMetadata();
        setCollectiblesMetadata(response);
      } catch {
        setCollectiblesMetadata(undefined);
      }
    };
    void updateMetadata();
  }, [setCollectiblesMetadata]);

  if (hasPremium || !collectiblesMetadata?.unifyConfigureUI) {
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
