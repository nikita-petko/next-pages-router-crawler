import React, { FunctionComponent, useCallback } from 'react';
import { Grid, Divider } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { CustomSignalType, MockServerSignalValues } from '@rbx/clients/matchmakingApi/v1';
import {
  getAggregationType,
  getComparisonTypeFromNumericalAttribute,
  getComparisonTypeFromServerAttribute,
  getDistributionType,
} from '../../utils/ConfigurationUtils';
import AggregationType from '../../enums/AggregationType';
import DefaultConfigurationSignals from '../../enums/DefaultConfigurationSignals';
import { aggregationTypeTranslationKeys } from '../../utils/translationGetter';
import {
  CustomSignal,
  CustomSignalServerValue,
  ServerSignalScores,
  ServerSignalValues,
} from '../../types/ConfigurationInfo';
import OccupancySimulationRow from './OccupancySimulationRow';
import PreferredPlayersSimulationRow from './PreferredPlayersSimulationRow';
import AgeSimulationRow from './AgeSimulationRow';
import LanguageSimulationRow from './LanguageSimulationRow';
import LatencySimulationRow from './LatencySimulationRow';
import DeviceSimulationRow from './DeviceSimulationRow';
import VoiceSimulationRow from './VoiceSimulationRow';
import TextChatSimulationRow from './TextChatSimulationRow';
import PlayHistorySimulationRow from './PlayHistorySimulationRow';
import NumericalPlayerRow from './NumericalPlayerRow';
import NumericalConstantRow from './NumericalConstantRow';
import PlayerCategoricalSimulationRow from './PlayerCategoricalSimulationRow';
import ComparisonType from '../../enums/ComparisonType';
import CategoricalPlayerRow from './CategoricalPlayerRow';
import CategoricalConstantRow from './CategoricalConstantRow';
import MockServerHeader from './MockServerHeader';

export type MockServerProps = {
  serverScore: number;
  serverNumber: number;
  isWinningServer: boolean;
  mockServerValue: ServerSignalValues;
  customSignalWeightsMap: Map<string, CustomSignal>;
  defaultSignalWeightsMap: Map<string, number>;
  signalScores: ServerSignalScores;
  onDefaultSignalValuesChange: (serverNumber: number, serverValue: MockServerSignalValues) => void;
  onCustomSignalValuesChange: (
    serverNumber: number,
    customSignalServerValues: Map<string, CustomSignalServerValue>,
  ) => void;
};

const MockServer: FunctionComponent<React.PropsWithChildren<MockServerProps>> = ({
  serverScore,
  serverNumber,
  isWinningServer,
  mockServerValue,
  customSignalWeightsMap,
  defaultSignalWeightsMap,
  signalScores,
  onDefaultSignalValuesChange,
  onCustomSignalValuesChange,
}) => {
  const { translate } = useTranslation();
  const handleDefaultSignalValuesChange = useCallback(
    (serverValues: MockServerSignalValues) => {
      onDefaultSignalValuesChange(serverNumber, serverValues);
    },
    [onDefaultSignalValuesChange, serverNumber],
  );
  const handleCustomSignalValuesChange = useCallback(
    (customSignalValues: Map<string, CustomSignalServerValue>) => {
      onCustomSignalValuesChange(serverNumber, customSignalValues);
    },
    [onCustomSignalValuesChange, serverNumber],
  );

  const handleOccupancyValuesChanges = useCallback(
    (occupancy: number, capacity: number) => {
      const newServerValues = {
        ...mockServerValue.defaultSignalServerValues,
        occupancy,
        capacity,
      };
      handleDefaultSignalValuesChange(newServerValues);
    },
    [handleDefaultSignalValuesChange, mockServerValue],
  );

  const handleAgeValuesChanges = useCallback(
    (playerAge: number, avgAge: number) => {
      const newServerValues = {
        ...mockServerValue.defaultSignalServerValues,
        serverAveragePlayerAge: avgAge,
        playerAge,
      };
      handleDefaultSignalValuesChange(newServerValues);
    },
    [handleDefaultSignalValuesChange, mockServerValue],
  );

  const handleLanguageValuesChanges = useCallback(
    (playerCount: number) => {
      const newServerValues = {
        ...mockServerValue.defaultSignalServerValues,
        commonLanguagePlayers: playerCount,
      };
      handleDefaultSignalValuesChange(newServerValues);
    },
    [handleDefaultSignalValuesChange, mockServerValue],
  );

  const handleLatencyValuesChanges = useCallback(
    (latency: number) => {
      const newServerValues = {
        ...mockServerValue.defaultSignalServerValues,
        latency,
      };
      handleDefaultSignalValuesChange(newServerValues);
    },
    [handleDefaultSignalValuesChange, mockServerValue],
  );

  const handlePreferredPlayerValuesChanges = useCallback(
    (hasPreferredPlayers: boolean) => {
      const newServerValues = {
        ...mockServerValue.defaultSignalServerValues,
        hasPreferredPlayers,
      };
      handleDefaultSignalValuesChange(newServerValues);
    },
    [handleDefaultSignalValuesChange, mockServerValue],
  );

  const handleDeviceValuesChanges = useCallback(
    (playerCount: number) => {
      const newServerValues = {
        ...mockServerValue.defaultSignalServerValues,
        commonDevicePlayers: playerCount,
      };
      handleDefaultSignalValuesChange(newServerValues);
    },
    [handleDefaultSignalValuesChange, mockServerValue],
  );
  const handleVoiceValuesChanges = useCallback(
    (playerCount: number) => {
      const newServerValues = {
        ...mockServerValue.defaultSignalServerValues,
        commonVoicePlayers: playerCount,
      };
      handleDefaultSignalValuesChange(newServerValues);
    },
    [handleDefaultSignalValuesChange, mockServerValue],
  );

  const handleTextValuesChanges = useCallback(
    (playerCount: number) => {
      const newServerValues = {
        ...mockServerValue.defaultSignalServerValues,
        commonTextChatPlayers: playerCount,
      };
      handleDefaultSignalValuesChange(newServerValues);
    },
    [handleDefaultSignalValuesChange, mockServerValue],
  );

  const handleHistoryValuesChanges = useCallback(
    (playerHistory: number, avgHistory: number) => {
      const newServerValues = {
        ...mockServerValue.defaultSignalServerValues,
        serverAveragePlayHistory: avgHistory,
        playerPlayHistory: playerHistory,
      };
      handleDefaultSignalValuesChange(newServerValues);
    },
    [handleDefaultSignalValuesChange, mockServerValue],
  );

  const handleNumericalValuesChanges = useCallback(
    (serverValue: number, playerValue: number, signalName: string) => {
      const newServerValues = new Map(mockServerValue.customSignalServerValues);
      newServerValues.set(signalName, {
        serverNumericValue: serverValue,
        playerNumericValue: playerValue,
      });
      handleCustomSignalValuesChange(newServerValues);
    },
    [handleCustomSignalValuesChange, mockServerValue.customSignalServerValues],
  );

  const handleStringValuesChanges = useCallback(
    (serverValue: string, playerValue: string, signalName: string) => {
      const newServerValues = new Map(mockServerValue.customSignalServerValues);
      newServerValues.set(signalName, {
        serverStringValue: serverValue,
        playerStringValue: playerValue,
      });
      handleCustomSignalValuesChange(newServerValues);
    },
    [handleCustomSignalValuesChange, mockServerValue.customSignalServerValues],
  );

  const handlePlayerCategoricalValueChanges = useCallback(
    (playerCount: number, occupancy: number, signalName: string) => {
      const newServerValues = new Map(mockServerValue.customSignalServerValues);
      newServerValues.set(signalName, {
        serverNumericValue: occupancy,
        playerNumericValue: playerCount,
      });
      handleCustomSignalValuesChange(newServerValues);
    },
    [handleCustomSignalValuesChange, mockServerValue.customSignalServerValues],
  );

  const getCustomSignalServerRow = (signal: CustomSignal) => {
    let aggregationType;
    let distributionType;
    let comparisonType;
    switch (signal.customSignalType) {
      case CustomSignalType.PlayerNumerical:
        aggregationType = getAggregationType(signal);
        if (aggregationType && aggregationType !== AggregationType.Sum) {
          return (
            <NumericalPlayerRow
              score={signalScores.customSignalScores.get(signal.name) ?? 0}
              serverValue={
                mockServerValue?.customSignalServerValues.get(signal.name)?.serverNumericValue ?? 0
              }
              playerValue={
                mockServerValue?.customSignalServerValues.get(signal.name)?.playerNumericValue ?? 0
              }
              maxDiff={signal.playerNumericalSignalConfiguration?.maxRelevantDifference ?? 0}
              aggregationType={translate(aggregationTypeTranslationKeys[aggregationType])}
              weight={customSignalWeightsMap.get(signal.name)?.weight ?? 0}
              onValuesChange={(playerValue: number, serverValue: number) =>
                handleNumericalValuesChanges(serverValue, playerValue, signal.name)
              }
            />
          );
        }
        if (aggregationType === AggregationType.Sum) {
          return (
            <NumericalConstantRow
              score={signalScores.customSignalScores.get(signal.name) ?? 0}
              serverValue={
                mockServerValue?.customSignalServerValues.get(signal.name)?.serverNumericValue ?? 0
              }
              constantValue={signal.playerNumericalSignalConfiguration?.constantValue ?? 0}
              maxDiff={signal.playerNumericalSignalConfiguration?.maxRelevantDifference ?? 0}
              weight={customSignalWeightsMap.get(signal.name)?.weight ?? 0}
              serverValueLabel={translate('Label.TotalServerValue')}
              onValuesChange={(serverValue: number) =>
                handleNumericalValuesChanges(
                  serverValue,
                  signal.playerNumericalSignalConfiguration?.constantValue ?? 0,
                  signal.name,
                )
              }
            />
          );
        }
        break;
      case CustomSignalType.PlayerCategorical:
        distributionType = getDistributionType(signal);
        if (distributionType) {
          return (
            <PlayerCategoricalSimulationRow
              score={signalScores.customSignalScores.get(signal.name) ?? 0}
              playerCount={
                mockServerValue?.customSignalServerValues.get(signal.name)?.playerNumericValue ?? 0
              }
              occupancy={mockServerValue?.defaultSignalServerValues.occupancy ?? 0}
              distributionType={distributionType}
              weight={customSignalWeightsMap.get(signal.name)?.weight ?? 0}
              onValuesChange={(playerCount: number) =>
                handlePlayerCategoricalValueChanges(
                  playerCount,
                  mockServerValue?.defaultSignalServerValues.occupancy ?? 0,
                  signal.name,
                )
              }
            />
          );
        }
        break;
      case CustomSignalType.ServerNumerical:
        comparisonType = getComparisonTypeFromNumericalAttribute(
          signal.serverNumericalSignalConfiguration?.comparisonType,
        );
        if (comparisonType === ComparisonType.Player) {
          return (
            <NumericalPlayerRow
              score={signalScores.customSignalScores.get(signal.name) ?? 0}
              serverValue={
                mockServerValue?.customSignalServerValues.get(signal.name)?.serverNumericValue ?? 0
              }
              playerValue={
                mockServerValue?.customSignalServerValues.get(signal.name)?.playerNumericValue ?? 0
              }
              maxDiff={signal.serverNumericalSignalConfiguration?.maxRelevantDifference ?? 0}
              weight={customSignalWeightsMap.get(signal.name)?.weight ?? 0}
              onValuesChange={(playerValue: number, serverValue: number) =>
                handleNumericalValuesChanges(serverValue, playerValue, signal.name)
              }
            />
          );
        }
        if (comparisonType === ComparisonType.ConstantValue) {
          return (
            <NumericalConstantRow
              score={signalScores.customSignalScores.get(signal.name) ?? 0}
              serverValue={
                mockServerValue?.customSignalServerValues.get(signal.name)?.serverNumericValue ?? 0
              }
              constantValue={signal.serverNumericalSignalConfiguration?.constantValue ?? 0}
              maxDiff={signal.serverNumericalSignalConfiguration?.maxRelevantDifference ?? 0}
              weight={customSignalWeightsMap.get(signal.name)?.weight ?? 0}
              serverValueLabel={translate('Dialog.ServerValue')}
              onValuesChange={(serverValue: number) =>
                handleNumericalValuesChanges(
                  serverValue,
                  signal.serverNumericalSignalConfiguration?.constantValue ?? 0,
                  signal.name,
                )
              }
            />
          );
        }
        break;
      case CustomSignalType.ServerCategorical:
        comparisonType = getComparisonTypeFromServerAttribute(
          signal.serverCategoricalSignalConfiguration?.comparisonType,
        );
        if (comparisonType === ComparisonType.Player) {
          return (
            <CategoricalPlayerRow
              score={signalScores.customSignalScores.get(signal.name) ?? 0}
              serverValue={
                mockServerValue?.customSignalServerValues.get(signal.name)?.serverStringValue ?? ''
              }
              playerValue={
                mockServerValue?.customSignalServerValues.get(signal.name)?.playerStringValue ?? ''
              }
              weight={customSignalWeightsMap.get(signal.name)?.weight ?? 0}
              onValuesChange={(playerValue: string, serverValue: string) =>
                handleStringValuesChanges(serverValue, playerValue, signal.name)
              }
            />
          );
        }
        if (comparisonType === ComparisonType.ConstantValue) {
          return (
            <CategoricalConstantRow
              score={signalScores.customSignalScores.get(signal.name) ?? 0}
              serverValue={
                mockServerValue?.customSignalServerValues.get(signal.name)?.serverStringValue ?? ''
              }
              constantValue={signal.serverCategoricalSignalConfiguration?.constantValue ?? ''}
              weight={customSignalWeightsMap.get(signal.name)?.weight ?? 0}
              serverValueLabel={translate('Dialog.ServerValue')}
              onValuesChange={(serverValue: string) =>
                handleStringValuesChanges(
                  serverValue,
                  signal.serverCategoricalSignalConfiguration?.constantValue ?? '',
                  signal.name,
                )
              }
            />
          );
        }
        break;
      default:
        break;
    }
    return null;
  };

  const geDefaultSignalServerRow = (signal: string) => {
    switch (signal) {
      case DefaultConfigurationSignals.AgeDifference:
        return (
          <AgeSimulationRow
            score={
              signalScores.defaultSignalScores.get(DefaultConfigurationSignals.AgeDifference) ?? 0
            }
            avgAge={mockServerValue?.defaultSignalServerValues.serverAveragePlayerAge ?? 0}
            playerAge={mockServerValue?.defaultSignalServerValues.playerAge ?? 0}
            weight={defaultSignalWeightsMap.get(DefaultConfigurationSignals.AgeDifference) ?? 0}
            onValuesChange={handleAgeValuesChanges}
          />
        );
      case DefaultConfigurationSignals.Occupancy:
        return (
          <OccupancySimulationRow
            score={signalScores.defaultSignalScores.get(DefaultConfigurationSignals.Occupancy) ?? 0}
            occupancy={mockServerValue?.defaultSignalServerValues.occupancy ?? 0}
            capacity={mockServerValue?.defaultSignalServerValues.capacity ?? 0}
            weight={defaultSignalWeightsMap.get(DefaultConfigurationSignals.Occupancy) ?? 0}
            onValuesChange={handleOccupancyValuesChanges}
          />
        );
      case DefaultConfigurationSignals.Latency:
        return (
          <LatencySimulationRow
            score={signalScores.defaultSignalScores.get(DefaultConfigurationSignals.Latency) ?? 0}
            latency={mockServerValue?.defaultSignalServerValues.latency ?? 0}
            weight={defaultSignalWeightsMap.get(DefaultConfigurationSignals.Latency) ?? 0}
            onValuesChange={handleLatencyValuesChanges}
          />
        );
      case DefaultConfigurationSignals.Language:
        return (
          <LanguageSimulationRow
            score={signalScores.defaultSignalScores.get(DefaultConfigurationSignals.Language) ?? 0}
            playerCount={mockServerValue?.defaultSignalServerValues.commonLanguagePlayers ?? 0}
            occupancy={mockServerValue?.defaultSignalServerValues.occupancy ?? 0}
            weight={defaultSignalWeightsMap.get(DefaultConfigurationSignals.Language) ?? 0}
            onValuesChange={handleLanguageValuesChanges}
          />
        );
      case DefaultConfigurationSignals.PreferredPlayers:
        return (
          <PreferredPlayersSimulationRow
            hasPreferredPlayer={
              mockServerValue?.defaultSignalServerValues.hasPreferredPlayers ?? false
            }
            score={
              signalScores.defaultSignalScores.get(DefaultConfigurationSignals.PreferredPlayers) ??
              0
            }
            weight={defaultSignalWeightsMap.get(DefaultConfigurationSignals.PreferredPlayers) ?? 0}
            onValuesChange={handlePreferredPlayerValuesChanges}
          />
        );
      case DefaultConfigurationSignals.DeviceType:
        return (
          <DeviceSimulationRow
            score={
              signalScores.defaultSignalScores.get(DefaultConfigurationSignals.DeviceType) ?? 0
            }
            playerCount={mockServerValue?.defaultSignalServerValues.commonDevicePlayers ?? 0}
            occupancy={mockServerValue?.defaultSignalServerValues.occupancy ?? 0}
            weight={defaultSignalWeightsMap.get(DefaultConfigurationSignals.DeviceType) ?? 0}
            onValuesChange={handleDeviceValuesChanges}
          />
        );
      case DefaultConfigurationSignals.VoiceChat:
        return (
          <VoiceSimulationRow
            score={signalScores.defaultSignalScores.get(DefaultConfigurationSignals.VoiceChat) ?? 0}
            playerCount={mockServerValue?.defaultSignalServerValues.commonVoicePlayers ?? 0}
            occupancy={mockServerValue?.defaultSignalServerValues.occupancy ?? 0}
            weight={defaultSignalWeightsMap.get(DefaultConfigurationSignals.VoiceChat) ?? 0}
            onValuesChange={handleVoiceValuesChanges}
          />
        );
      case DefaultConfigurationSignals.TextChat:
        return (
          <TextChatSimulationRow
            score={signalScores.defaultSignalScores.get(DefaultConfigurationSignals.TextChat) ?? 0}
            playerCount={mockServerValue?.defaultSignalServerValues.commonTextChatPlayers ?? 0}
            occupancy={mockServerValue?.defaultSignalServerValues.occupancy ?? 0}
            weight={defaultSignalWeightsMap.get(DefaultConfigurationSignals.TextChat) ?? 0}
            onValuesChange={handleTextValuesChanges}
          />
        );
      case DefaultConfigurationSignals.PlayHistory:
        return (
          <PlayHistorySimulationRow
            score={
              signalScores.defaultSignalScores.get(DefaultConfigurationSignals.PlayHistory) ?? 0
            }
            avgHistory={mockServerValue?.defaultSignalServerValues.serverAveragePlayHistory ?? 0}
            playerHistory={mockServerValue?.defaultSignalServerValues.playerPlayHistory ?? 0}
            weight={defaultSignalWeightsMap.get(DefaultConfigurationSignals.PlayHistory) ?? 0}
            onValuesChange={handleHistoryValuesChanges}
          />
        );
      default:
        break;
    }
    return null;
  };

  return (
    <Grid item style={{ flex: 1 }}>
      <MockServerHeader
        serverScore={serverScore}
        serverNumber={serverNumber}
        isWinningServer={isWinningServer}
        signalScores={signalScores}
      />
      <Divider style={{ marginTop: 20 }} />
      {Array.from(defaultSignalWeightsMap.keys()).map((signal) => geDefaultSignalServerRow(signal))}
      {Array.from(customSignalWeightsMap).map(([, signal]) => getCustomSignalServerRow(signal))}
    </Grid>
  );
};

export default MockServer;
