import { InlineCode } from '@rbx/ui';
import React, { Fragment, FunctionComponent, useMemo } from 'react';
import { CustomSignalFormValues } from '../types/ConfigurationInfo';
import useCustomSignalStyles from './CustomSignalDialog.styles';
import { getAttributeName, getInlineCodeFormattedString } from '../utils/ConfigurationUtils';
import { AttributesInfo } from '../types/AttributesInfo';
import ComparisonType from '../enums/ComparisonType';

export interface ServerNumericalInlineCodeProps {
  signalValues?: CustomSignalFormValues;
  attribute?: AttributesInfo;
  joiningPlayerValue?: number;
  serverValue?: number;
  selectedPlayerAttributeName?: string;
}

const ServerNumericalInlineCode: FunctionComponent<
  React.PropsWithChildren<ServerNumericalInlineCodeProps>
> = ({ signalValues, attribute, joiningPlayerValue, serverValue, selectedPlayerAttributeName }) => {
  const {
    classes: { inlineCodeContainer },
  } = useCustomSignalStyles();

  const isConstantValue = signalValues?.comparisonType === ComparisonType.ConstantValue;
  const isPlayer = signalValues?.comparisonType === ComparisonType.Player;

  const attributeName = useMemo(() => {
    return getInlineCodeFormattedString(getAttributeName(attribute) ?? '');
  }, [attribute]);

  const joiningPlayerName = useMemo(() => {
    return `joining_player_${selectedPlayerAttributeName}`;
  }, [selectedPlayerAttributeName]);

  const serverPlayerName = useMemo(() => {
    return `server_${attributeName}`;
  }, [attributeName]);

  return (
    <InlineCode classes={{ root: inlineCodeContainer }} variant='regular'>
      <span>{`local ${serverPlayerName} = ${getInlineCodeFormattedString(serverValue ?? 0)}`}</span>
      <br />
      {isPlayer && (
        <Fragment>
          <span>{`local ${joiningPlayerName} = ${getInlineCodeFormattedString(joiningPlayerValue ?? 0)}`}</span>
          <br />
        </Fragment>
      )}
      <span>{`local max_relevant_difference = ${getInlineCodeFormattedString(signalValues?.maxRelevantDifference ?? 0)}`}</span>
      <br />
      {isConstantValue && (
        <Fragment>
          <span>{`local constant_value = ${getInlineCodeFormattedString(signalValues?.numericalConstantValue ?? 0)}`}</span>
          <br />
        </Fragment>
      )}
      <br />
      <span>{`local diff = math.abs(${serverPlayerName} - ${isConstantValue ? 'constant_value' : joiningPlayerName})`}</span>
      <br />
      <span>{`local score = ${isPlayer ? `1 - ` : ''} math.min(diff / max_relevant_difference, 1)`}</span>
      <br />
      <span>return score</span>
    </InlineCode>
  );
};

export default ServerNumericalInlineCode;
