import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { RobloxItemConfigurationApiCollectiblesMetadataResponse } from '@rbx/client-itemconfiguration/v1';
import { useSettings } from '@modules/settings';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import GenericVerificationAlert from './GenericVerificationAlert';
import { hasPremiumSubscription } from '../hooks/VerificationMetadataContext';
import useVerificationMetadata from '../hooks/useVerificationMetadata';

const ClassicItemVerificationAlert: FunctionComponent<
  React.PropsWithChildren<Record<string, never>>
> = () => {
  const { settings } = useSettings();
  const blackbirdEnabled = settings?.enableBlackbird ?? false;
  const { translate } = useTranslation();
  const verificationMetadata = useVerificationMetadata();
  const hasPremium = hasPremiumSubscription(verificationMetadata);

  const [collectiblesMetadata, setCollectiblesMetadata] = useState<
    RobloxItemConfigurationApiCollectiblesMetadataResponse | undefined
  >(undefined);

  useEffect(() => {
    const updateMetadata = async () => {
      const response = await itemConfigurationClient.getCollectiblesMetadata();
      setCollectiblesMetadata(response);
    };
    updateMetadata();
  }, [setCollectiblesMetadata]);

  if (hasPremium || !collectiblesMetadata?.unifyConfigureUI) {
    return null;
  }

  const subscriptionHref = blackbirdEnabled
    ? `https://${process.env.robloxSiteDomain}/blackbird`
    : `https://www.${process.env.robloxSiteDomain}/premium/membership`;

  return (
    <div style={{ marginBottom: '32px' }}>
      <GenericVerificationAlert
        alertTitle={translate(
          blackbirdEnabled ? 'Heading.BlackbirdRequired' : 'Heading.PremiumRequired',
        )}
        alertDescription={translate(
          blackbirdEnabled ? 'Description.BlackbirdRequired' : 'Description.PremiumRequiredUnified',
        )}
        severity='info'
        externalLink={subscriptionHref}
        linkLabel={translate(blackbirdEnabled ? 'Label.GetBlackbird' : 'Label.GetPremium')}
        allowCloseDialog={false}
      />
    </div>
  );
};

export default ClassicItemVerificationAlert;
