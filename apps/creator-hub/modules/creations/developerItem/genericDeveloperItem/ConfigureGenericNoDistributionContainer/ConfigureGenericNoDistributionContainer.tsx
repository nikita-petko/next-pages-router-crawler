import React, { FunctionComponent } from 'react';
import ConfigureGenericNoDistributionForm from '../ConfigureGenericNoDistributionForm/ConfigureGenericNoDistributionForm';
import { TConfigureDeveloperItemProps, useCurrentDeveloperItem } from '../../common';

const ConfigureGenericNoDistributionContainer: FunctionComponent<
  React.PropsWithChildren<TConfigureDeveloperItemProps>
> = ({ developerItemDetails, enableAssetAccessForm, isCreatorEligibleForAssetAccessBeta }) => {
  const { refreshDeveloperItemDetails } = useCurrentDeveloperItem();

  return (
    <ConfigureGenericNoDistributionForm
      developerItemDetails={developerItemDetails}
      enableAssetAccessForm={enableAssetAccessForm}
      isCreatorEligibleForAssetAccessBeta={isCreatorEligibleForAssetAccessBeta}
      refreshData={refreshDeveloperItemDetails}
    />
  );
};

export default ConfigureGenericNoDistributionContainer;
