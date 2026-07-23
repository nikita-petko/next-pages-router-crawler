import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { InlineCode } from '@rbx/ui';
import DistributionType from '../enums/DistributionType';
import type { AttributesInfo } from '../types/AttributesInfo';
import { getAttributeName, getInlineCodeFormattedString } from '../utils/ConfigurationUtils';
import useCustomSignalStyles from './CustomSignalDialog.styles';

export interface PlayerCategoricalInlineCodeProps {
  totalPlayerCount?: number;
  serverOccupancy?: number;
  distributionType?: DistributionType;
  attribute?: AttributesInfo;
}

const PlayerCategoricalInlineCode: FunctionComponent<
  React.PropsWithChildren<PlayerCategoricalInlineCodeProps>
> = ({ totalPlayerCount, serverOccupancy, distributionType, attribute }) => {
  const {
    classes: { inlineCodeContainer },
  } = useCustomSignalStyles();

  const attributeName = useMemo(() => {
    return getInlineCodeFormattedString(getAttributeName(attribute) ?? '');
  }, [attribute]);

  return (
    <InlineCode classes={{ root: inlineCodeContainer }} variant='regular'>
      <span>{`local num_players_same_${attributeName} = ${getInlineCodeFormattedString(totalPlayerCount ?? 0)}`}</span>
      <br />
      <span>{`local occupancy = ${getInlineCodeFormattedString(serverOccupancy ?? 0)}`}</span>
      <br />
      <br />
      <span>{`local score = num_players_same_${getInlineCodeFormattedString(attributeName)} / occupancy`}</span>
      <br />
      <span>{`return ${distributionType === DistributionType.Diversify ? '1 -' : ''} score`}</span>
    </InlineCode>
  );
};

export default PlayerCategoricalInlineCode;
