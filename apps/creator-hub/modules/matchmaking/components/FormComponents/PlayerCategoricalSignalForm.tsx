import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, Grid } from '@rbx/ui';
import DistributionType from '../../enums/DistributionType';
import type { AttributesInfo } from '../../types/AttributesInfo';
import { getAttributeName } from '../../utils/ConfigurationUtils';
import DistributionTypeTitleSelector from './DistributionTypeTitleSelector';

export interface PlayerCategoricalSignalFormProps {
  attribute?: AttributesInfo;
  distributionType?: DistributionType;
  onDistributionTypeChange: (distributionType: DistributionType) => void;
}

const PlayerCategoricalSignalForm = function PlayerCategoricalSignalFormProps({
  attribute,
  distributionType,
  onDistributionTypeChange,
}: PlayerCategoricalSignalFormProps): React.JSX.Element {
  const { translate, translateHTML } = useTranslation();
  const attributeName = useMemo(() => {
    return getAttributeName(attribute) ?? '';
  }, [attribute]);

  return (
    <Grid container direction='column'>
      <Typography variant='captionBody' color='primary'>
        {translateHTML(`Dialog.PlayerCategorical`, [
          {
            opening: 'boldStart',
            closing: 'boldEnd',
            content: () => <strong>{attributeName}</strong>,
          },
        ])}
      </Typography>
      <DistributionTypeTitleSelector
        attributeName={attributeName}
        distributionType={distributionType}
        onSelect={onDistributionTypeChange}
      />
      {distributionType && distributionType === DistributionType.Cluster && (
        <Typography style={{ marginTop: 20 }} variant='captionBody' color='primary'>
          {translate('Dialog.ClusterDescription', {
            attribute: attributeName,
          })}
        </Typography>
      )}
      {distributionType && distributionType === DistributionType.Diversify && (
        <Grid item display='flex' direction='row' alignItems='center'>
          <Typography style={{ marginTop: 20 }} variant='captionBody' color='primary'>
            {translate('Dialog.DiversifyDescription', {
              attribute: attributeName,
            })}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};

export default PlayerCategoricalSignalForm;
