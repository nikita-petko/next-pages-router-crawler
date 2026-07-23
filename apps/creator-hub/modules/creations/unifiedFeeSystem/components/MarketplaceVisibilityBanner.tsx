import { useTranslation } from '@rbx/intl';
import React from 'react';
import GenericVerificationAlert from '../../verification/components/GenericVerificationAlert';

const MarketplaceVisibilityBanner: React.FC = () => {
  const { translate } = useTranslation();

  return (
    <GenericVerificationAlert
      alertTitle={translate('Heading.ReducedMarketplaceVisibility')}
      alertDescription={translate('Message.ReducedMarketplaceVisibility')}
      severity='warning'
      externalLink='https://create.roblox.com/docs/marketplace/marketplace-policy#general-creation-guidelines'
      linkLabel={translate('Label.LearnMore')}
      allowCloseDialog={false}
    />
  );
};

export default MarketplaceVisibilityBanner;
