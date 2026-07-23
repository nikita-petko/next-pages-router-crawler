import type { FunctionComponent } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { CustomSignalType } from '@rbx/client-matchmaking-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandLessIcon,
} from '@rbx/ui';
import type { AttributesInfo } from '../types/AttributesInfo';
import type { CustomSignalFormValues } from '../types/ConfigurationInfo';
import { GetValidatedNumber } from '../utils/FormUtils';
import useCustomSignalStyles from './CustomSignalDialog.styles';
import PlayerCategoricalInlineCode from './PlayerCategoricalInlineCode';
import PlayerNumericalInlineCode from './PlayerNumericalInlineCode';
import ServerCategoricalInlineCode from './ServerCategoricalInlineCode';
import ServerNumericalInlineCode from './ServerNumericalInlineCode';
import TestSignalExistingPlayers from './TestSignalExistingPlayers';
import TestSignalServerAttribute from './TestSignalServerAttribute';
import TestSignalServerOccupancy from './TestSignalServerOccupancy';
import TestSignalServerValue from './TestSignalServerValue';

export interface SignalPreviewAccordionProps {
  disabled?: boolean;
  signalValues?: CustomSignalFormValues;
  selectedPlayerAttributeName?: string;
  attribute?: AttributesInfo;
}

const SignalPreviewAccordion: FunctionComponent<
  React.PropsWithChildren<SignalPreviewAccordionProps>
> = ({ disabled, signalValues, selectedPlayerAttributeName, attribute }) => {
  const { translate } = useTranslation();
  const {
    classes: { accordionSummary, gridBorder },
    cx,
  } = useCustomSignalStyles();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [joiningPlayerValue, setJoiningPlayerValue] = useState<number>(0);
  const [serverValue, setServerValue] = useState<number>(0);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [serverOccupancy, setServerOccupancy] = useState<number>(0);
  const [attributeValue, setAttributeValue] = useState<string>('');
  const [serverAttributeName, setServerAttributeName] = useState<string>('');
  const [playerAttributeName, setPlayerAttributeName] = useState<string>('');

  useEffect(() => {
    if (signalValues?.comparisonType || attribute?.customSignalType) {
      setJoiningPlayerValue(0);
      setServerValue(0);
      setServerOccupancy(0);
    }
  }, [attribute?.customSignalType, signalValues?.comparisonType]);

  const previewConfigPanel = useMemo(() => {
    switch (attribute?.customSignalType) {
      case CustomSignalType.PlayerNumerical:
        return (
          <TestSignalExistingPlayers
            attribute={attribute}
            aggregationType={signalValues?.aggregationType}
            onJoiningPlayerChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const numericValue = GetValidatedNumber(event.target.value);
              setJoiningPlayerValue(numericValue ?? 0);
            }}
            onServerValueChange={(value: number) => setServerValue(value)}
          />
        );
      case CustomSignalType.PlayerCategorical:
        return (
          <TestSignalServerOccupancy
            attribute={attribute}
            onPlayerCountChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const numericValue = GetValidatedNumber(event.target.value);
              setPlayerCount(numericValue ?? 0);
            }}
            onServerOccupancyChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const numericValue = GetValidatedNumber(event.target.value);
              setServerOccupancy(numericValue ?? 0);
            }}
          />
        );
      case CustomSignalType.ServerNumerical:
        return (
          <TestSignalServerValue
            attribute={attribute}
            playerAttributeName={selectedPlayerAttributeName}
            comparisonType={signalValues?.comparisonType}
            onJoiningPlayerChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const numericValue = GetValidatedNumber(event.target.value);
              setJoiningPlayerValue(numericValue ?? 0);
            }}
            onServerValueChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const numericValue = GetValidatedNumber(event.target.value);
              setServerValue(numericValue ?? 0);
            }}
          />
        );
        break;
      case CustomSignalType.ServerCategorical:
        return (
          <TestSignalServerAttribute
            attribute={attribute}
            comparisonType={signalValues?.comparisonType}
            onAttributeValueChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setAttributeValue(event.target.value);
            }}
            onServerAttributeNameChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setServerAttributeName(event.target.value);
            }}
            onPlayerAttributeNameChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setPlayerAttributeName(event.target.value);
            }}
          />
        );
      default:
        return;
    }
  }, [
    attribute,
    selectedPlayerAttributeName,
    signalValues?.aggregationType,
    signalValues?.comparisonType,
  ]);

  const previewCode = useMemo(() => {
    switch (attribute?.customSignalType) {
      case CustomSignalType.PlayerNumerical:
        return (
          <PlayerNumericalInlineCode
            joiningPlayerValue={joiningPlayerValue}
            signalValues={signalValues}
            attribute={attribute}
            serverValue={serverValue}
          />
        );
      case CustomSignalType.PlayerCategorical:
        return (
          <PlayerCategoricalInlineCode
            totalPlayerCount={playerCount}
            serverOccupancy={serverOccupancy}
            attribute={attribute}
            distributionType={signalValues?.distributionType}
          />
        );
      case CustomSignalType.ServerNumerical:
        return (
          <ServerNumericalInlineCode
            joiningPlayerValue={joiningPlayerValue}
            signalValues={signalValues}
            attribute={attribute}
            selectedPlayerAttributeName={selectedPlayerAttributeName}
            serverValue={serverValue}
          />
        );
      case CustomSignalType.ServerCategorical:
        return (
          <ServerCategoricalInlineCode
            signalValues={signalValues}
            attributeValue={attributeValue}
            attribute={attribute}
            selectedPlayerAttributeName={selectedPlayerAttributeName}
            serverAttributeName={serverAttributeName}
            playerAttributeName={playerAttributeName}
          />
        );
      default:
        return;
    }
  }, [
    attribute,
    attributeValue,
    joiningPlayerValue,
    playerAttributeName,
    playerCount,
    selectedPlayerAttributeName,
    serverAttributeName,
    serverOccupancy,
    serverValue,
    signalValues,
  ]);

  return (
    <Accordion
      disabled={disabled}
      variant='filled'
      square
      defaultExpanded={!disabled}
      expanded={!disabled && isExpanded}
      sx={{ marginTop: -2 }}>
      <AccordionSummary
        expandIcon={<ExpandLessIcon fontSize='large' color='primary' sx={{ marginRight: 1 }} />}
        onClick={() => setIsExpanded(!isExpanded)}
        className={accordionSummary}>
        <Typography variant='buttonLarge' color='info'>
          {translate('Dialog.Preview')}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container display='flex' direction='row'>
          {previewConfigPanel}
          <Grid item XSmall={7} className={cx(gridBorder)} display='flex' direction='column'>
            <Typography style={{ marginLeft: 10, marginTop: 10, marginBottom: 10 }} variant='h6'>
              {translate('Dialog.PreviewScore')}
            </Typography>
            {previewCode}
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default SignalPreviewAccordion;
