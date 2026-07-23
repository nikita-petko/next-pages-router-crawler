import type { FunctionComponent } from 'react';
import React, { Fragment, useMemo } from 'react';
import { InlineCode } from '@rbx/ui';
import ComparisonType from '../enums/ComparisonType';
import type { AttributesInfo } from '../types/AttributesInfo';
import type { CustomSignalFormValues } from '../types/ConfigurationInfo';
import { getAttributeName, getInlineCodeFormattedString } from '../utils/ConfigurationUtils';
import useCustomSignalStyles from './CustomSignalDialog.styles';

export interface ServerCategoricalInlineCodeProps {
  signalValues?: CustomSignalFormValues;
  attributeValue: string;
  attribute?: AttributesInfo;
  selectedPlayerAttributeName?: string;
  playerAttributeName?: string;
  serverAttributeName?: string;
}

const ServerCategoricalInlineCode: FunctionComponent<
  React.PropsWithChildren<ServerCategoricalInlineCodeProps>
> = ({
  signalValues,
  attributeValue,
  attribute,
  selectedPlayerAttributeName,
  playerAttributeName,
  serverAttributeName,
}) => {
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

  const serverName = useMemo(() => {
    return `server_${attributeName}`;
  }, [attributeName]);

  const serverDisplayLabel = useMemo(() => {
    if (isConstantValue) {
      return `"${getInlineCodeFormattedString(attributeValue ?? '')}"`;
    }
    return `"${getInlineCodeFormattedString(serverAttributeName ?? '')}"`;
  }, [attributeValue, isConstantValue, serverAttributeName]);

  const ifDisplayLabel = useMemo(() => {
    if (isConstantValue) {
      return `"${getInlineCodeFormattedString(signalValues?.stringConstantValue ?? '')}"`;
    }
    return joiningPlayerName;
  }, [isConstantValue, joiningPlayerName, signalValues?.stringConstantValue]);

  return (
    <InlineCode classes={{ root: inlineCodeContainer }} variant='regular'>
      <span>{`local ${serverName} = ${serverDisplayLabel}`}</span>
      <br />
      {isPlayer && (
        <>
          <span>{`local ${joiningPlayerName} = "${getInlineCodeFormattedString(playerAttributeName ?? '')}"`}</span>
          <br />
        </>
      )}
      <br />
      <span>{`if ${serverName} == ${ifDisplayLabel} then`}</span>
      <br />
      <pre>{`   return 1`}</pre>
      <span>else</span>
      <br />
      <pre>{`   return 0`}</pre>
      <span>end</span>
    </InlineCode>
  );
};

export default ServerCategoricalInlineCode;
