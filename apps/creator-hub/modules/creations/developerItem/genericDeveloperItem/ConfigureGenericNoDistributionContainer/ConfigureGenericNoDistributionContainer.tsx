import type { FunctionComponent } from 'react';
import React from 'react';
import { useCurrentDeveloperItem } from '../../common/DeveloperItemProvider';
import type { TConfigureDeveloperItemProps } from '../../common/types';
import ConfigureGenericNoDistributionForm from '../ConfigureGenericNoDistributionForm/ConfigureGenericNoDistributionForm';

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
