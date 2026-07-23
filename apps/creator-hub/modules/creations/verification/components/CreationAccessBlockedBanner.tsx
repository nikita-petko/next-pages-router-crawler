import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { MARKETPLACE_POLICY } from '@modules/miscellaneous/common/constants/linkConstants';
import { VerificationMetadataContextValue } from '../hooks/VerificationMetadataContext';
import GenericVerificationAlert from './GenericVerificationAlert';

interface CreationAccessBlockedBannerProps {
  data: VerificationMetadataContextValue | undefined;
}

const CreationAccessBlockedBanner: FunctionComponent<
  React.PropsWithChildren<CreationAccessBlockedBannerProps>
> = ({ data }) => {
  const { translate } = useTranslation();

  // Check if user is creation banned
  const isCreationBanned = data?.creationAccessMetadata?.accessAllowed === false;

  if (!isCreationBanned) {
    return null;
  }

  const daysToUnblock = data?.creationAccessMetadata?.daysToUnblock ?? 0;
  const isPermanentlyBanned = isCreationBanned && daysToUnblock === -1;

  return (
    <GenericVerificationAlert
      alertTitle={
        isPermanentlyBanned
          ? translate('Heading.PermanentlyCreationBanned')
          : translate('Heading.TemporaryCreationBanned', { days: daysToUnblock.toString() })
      }
      alertDescription={
        isPermanentlyBanned
          ? translate('Description.PermanentlyCreationBanned')
          : translate('Description.TemporaryCreationBanned')
      }
      severity='warning'
      externalLink={MARKETPLACE_POLICY}
      linkLabel={translate('Label.MarketplacePolicy')}
      allowCloseDialog={false}
    />
  );
};

export default CreationAccessBlockedBanner;
