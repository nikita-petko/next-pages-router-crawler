import { InlineCode } from '@rbx/ui';
import React, { Fragment, FunctionComponent, useMemo } from 'react';
import { CustomSignalFormValues } from '../types/ConfigurationInfo';
import useCustomSignalStyles from './CustomSignalDialog.styles';
import { getAttributeName, getInlineCodeFormattedString } from '../utils/ConfigurationUtils';
import { AttributesInfo } from '../types/AttributesInfo';
import AggregationType from '../enums/AggregationType';

export interface PlayerNumericalInlineCodeProps {
  signalValues?: CustomSignalFormValues;
  attribute?: AttributesInfo;
  joiningPlayerValue?: number;
  serverValue?: number;
}

const PlayerNumericalInlineCode: FunctionComponent<
  React.PropsWithChildren<PlayerNumericalInlineCodeProps>
> = ({ signalValues, attribute, joiningPlayerValue, serverValue }) => {
  const {
    classes: { inlineCodeContainer },
  } = useCustomSignalStyles();

  const attributeName = useMemo(() => {
    return getInlineCodeFormattedString(getAttributeName(attribute) ?? '');
  }, [attribute]);

  const aggregationTypeString = useMemo(() => {
    return `${signalValues?.aggregationType?.toString().toLowerCase() ?? ''}`;
  }, [signalValues?.aggregationType]);

  const isAggregationTypeSum = useMemo(() => {
    if (!signalValues?.aggregationType || signalValues?.aggregationType !== AggregationType.Sum) {
      return false;
    }
    return true;
  }, [signalValues?.aggregationType]);

  return (
    <InlineCode classes={{ root: inlineCodeContainer }} variant='regular'>
      <span>{`local server_${aggregationTypeString}_${attributeName} = ${getInlineCodeFormattedString(serverValue ?? 0)}`}</span>
      <br />
      <span>{`local joining_player_${attributeName} = ${getInlineCodeFormattedString(joiningPlayerValue ?? 0)}`}</span>
      <br />
      <span>{`local max_relevant_difference = ${getInlineCodeFormattedString(signalValues?.maxRelevantDifference ?? 0)}`}</span>
      <br />
      {isAggregationTypeSum && (
        <Fragment>
          <span>{`local constant_value = ${getInlineCodeFormattedString(signalValues?.numericalConstantValue ?? 0)}`}</span>
          <br />
        </Fragment>
      )}
      <br />
      {isAggregationTypeSum && (
        <span>{`local diff = math.abs(server_sum_${attributeName} + joining_player_${attributeName} - constant_value)`}</span>
      )}
      {!isAggregationTypeSum && (
        <span>{`local diff = math.abs(server_${aggregationTypeString}_${attributeName} - joining_player_${attributeName})`}</span>
      )}
      <br />
      <span>local score = 1 - math.min(diff / max_relevant_difference, 1)</span>
      <br />
      <span>return score</span>
    </InlineCode>
  );
};

export default PlayerNumericalInlineCode;
