import {
  AttributeAggregationFunction,
  CustomSignalType,
  MatchmakingCategoricalAttributeComparisonType,
  MatchmakingNumericalAttributeComparisonType,
  MatchmakingSignalCurveType,
  MockServerSignalValues,
} from '@rbx/clients/matchmakingApi/v1';
import { defaultCustomSignalValues, maxDecimalPoints } from '../constants';
import DefaultConfigurationSignals from '../enums/DefaultConfigurationSignals';
import {
  CustomSignalServerValue,
  CustomSignal,
  ServerSignalValues,
  ServerSignalScores,
} from '../types/ConfigurationInfo';

export function roundToDecimalPlaces(value: number) {
  const result = parseFloat((Math.round(value * 1000) / 1000).toFixed(maxDecimalPoints));
  const isInvalidValue = Number.isNaN(result) || !Number.isFinite(result);
  return isInvalidValue ? 0 : result;
}

export function getDivisionResult(numerator: number, denominator: number, weight: number) {
  return roundToDecimalPlaces((numerator / denominator) * weight);
}

export function calculateAgeScore(playerAge: number, avgAge: number, weight: number) {
  const unweightedScore = 1 - Math.min(1, Math.abs(playerAge - avgAge) / 25);
  return roundToDecimalPlaces(unweightedScore * weight);
}

export function calculateLatencyScore(latency: number, weight: number) {
  const unweightedScore = 1 - Math.min(1, latency / 250);
  return roundToDecimalPlaces(unweightedScore * weight);
}

export function calculatePlayHistory(playerHistory: number, avgHistory: number, weight: number) {
  const unweightedScore = 1 - Math.min(1, Math.abs(playerHistory - avgHistory) / 4.6);
  return roundToDecimalPlaces(unweightedScore * weight);
}

export function calculateCustomNumerical(
  serverValue: number,
  playerValue: number,
  maxDiff: number,
  weight: number,
) {
  const unweightedScore = 1 - Math.min(1, Math.abs(serverValue - playerValue) / maxDiff);
  return roundToDecimalPlaces(unweightedScore * weight);
}

export function calculatePlayerCategorical(
  distributionType: MatchmakingSignalCurveType | undefined,
  serverValue: number,
  playerWithCategory: number,
  weight: number,
) {
  if (distributionType === MatchmakingSignalCurveType.PositiveLinear) {
    return getDivisionResult(playerWithCategory, serverValue, weight);
  }
  if (distributionType === MatchmakingSignalCurveType.NegativeLinear) {
    const unweightedScore = 1 - playerWithCategory / serverValue;
    return roundToDecimalPlaces(unweightedScore * weight);
  }
  return 0;
}

export function calculateServerCategorical(
  serverValue: string | undefined,
  joiningPlayerValue: string | undefined,
  weight: number,
) {
  if (!serverValue || !joiningPlayerValue) {
    return 0;
  }
  return roundToDecimalPlaces((serverValue === joiningPlayerValue ? 1 : 0) * weight);
}

export function getCustomSignalServerValues(
  customSignals: CustomSignal[],
  defaultSignalServerValues: MockServerSignalValues,
) {
  const customSignalServerValues = new Map<string, CustomSignalServerValue>();
  customSignals.forEach((signal) => {
    if (
      signal.customSignalType === CustomSignalType.PlayerNumerical &&
      signal.playerNumericalSignalConfiguration?.aggregation?.aggregationFunction ===
        AttributeAggregationFunction.Sum
    ) {
      customSignalServerValues.set(signal.name, {
        ...defaultCustomSignalValues,
        playerNumericValue: signal.playerNumericalSignalConfiguration.constantValue ?? 0,
      });
    } else if (
      signal.customSignalType === CustomSignalType.ServerNumerical &&
      signal.serverNumericalSignalConfiguration?.comparisonType ===
        MatchmakingNumericalAttributeComparisonType.AbsoluteDifferentToConstant
    ) {
      customSignalServerValues.set(signal.name, {
        ...defaultCustomSignalValues,
        playerNumericValue: signal.serverNumericalSignalConfiguration.constantValue ?? 0,
      });
    } else if (
      signal.customSignalType === CustomSignalType.ServerCategorical &&
      signal.serverCategoricalSignalConfiguration?.comparisonType ===
        MatchmakingCategoricalAttributeComparisonType.EqualityToConstant
    ) {
      customSignalServerValues.set(signal.name, {
        ...defaultCustomSignalValues,
        playerStringValue: signal.serverCategoricalSignalConfiguration.constantValue ?? '',
      });
    } else if (signal.customSignalType === CustomSignalType.PlayerCategorical) {
      customSignalServerValues.set(signal.name, {
        ...defaultCustomSignalValues,
        serverNumericValue: defaultSignalServerValues?.occupancy ?? 0,
      });
    } else {
      customSignalServerValues.set(signal.name, defaultCustomSignalValues);
    }
  });
  return customSignalServerValues;
}

export function getServerValues(
  defaultServerValues: MockServerSignalValues[],
  customSignals: CustomSignal[],
): ServerSignalValues[] {
  return defaultServerValues.map((value) => {
    return {
      defaultSignalServerValues: value,
      customSignalServerValues: getCustomSignalServerValues(customSignals, value),
    };
  });
}

export function getScoreFromScoreMap(scoreMap: Map<string, number>) {
  const scores = Array.from(scoreMap.values()).filter((num) => !Number.isNaN(num));
  const totalScore = scores.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  return roundToDecimalPlaces(totalScore);
}

export function calculateTotalScore(signalScores: ServerSignalScores) {
  const defaultSignalScores = getScoreFromScoreMap(signalScores.defaultSignalScores);
  const customSignalScores = getScoreFromScoreMap(signalScores.customSignalScores);
  return defaultSignalScores + customSignalScores;
}

export function getDefaultSignalsScoresMap(
  signalValues: MockServerSignalValues | undefined,
  defaultSignalWeightsMap: Map<string, number>,
): Map<string, number> {
  const signalToScoresMap: Map<DefaultConfigurationSignals, number> = new Map();
  if (!signalValues) {
    return signalToScoresMap;
  }
  let score = 0;
  Object.values(DefaultConfigurationSignals).forEach((signal) => {
    switch (signal) {
      case DefaultConfigurationSignals.AgeDifference:
        score = calculateAgeScore(
          signalValues?.playerAge ?? 0,
          signalValues?.serverAveragePlayerAge ?? 0,
          defaultSignalWeightsMap.get(DefaultConfigurationSignals.AgeDifference) ?? 0,
        );
        signalToScoresMap.set(DefaultConfigurationSignals.AgeDifference, score);
        break;
      case DefaultConfigurationSignals.Occupancy:
        score = getDivisionResult(
          signalValues?.occupancy ?? 0,
          signalValues?.capacity ?? 0,
          defaultSignalWeightsMap.get(DefaultConfigurationSignals.Occupancy) ?? 0,
        );
        signalToScoresMap.set(DefaultConfigurationSignals.Occupancy, score);
        break;
      case DefaultConfigurationSignals.Language:
        score = getDivisionResult(
          signalValues?.commonLanguagePlayers ?? 0,
          signalValues?.occupancy ?? 0,
          defaultSignalWeightsMap.get(DefaultConfigurationSignals.Language) ?? 0,
        );
        signalToScoresMap.set(DefaultConfigurationSignals.Language, score);
        break;
      case DefaultConfigurationSignals.Latency:
        score = calculateLatencyScore(
          signalValues?.latency ?? 0,
          defaultSignalWeightsMap.get(DefaultConfigurationSignals.Latency) ?? 0,
        );
        signalToScoresMap.set(DefaultConfigurationSignals.Latency, score);
        break;
      case DefaultConfigurationSignals.PreferredPlayers:
        score =
          (signalValues.hasPreferredPlayers ? 1 : 0) *
          (defaultSignalWeightsMap.get(DefaultConfigurationSignals.PreferredPlayers) ?? 0);
        signalToScoresMap.set(DefaultConfigurationSignals.PreferredPlayers, score);
        break;
      case DefaultConfigurationSignals.DeviceType:
        score = getDivisionResult(
          signalValues?.commonDevicePlayers ?? 0,
          signalValues?.occupancy ?? 0,
          defaultSignalWeightsMap.get(DefaultConfigurationSignals.DeviceType) ?? 0,
        );
        signalToScoresMap.set(DefaultConfigurationSignals.DeviceType, score);
        break;
      case DefaultConfigurationSignals.VoiceChat:
        score = getDivisionResult(
          signalValues?.commonVoicePlayers ?? 0,
          signalValues?.occupancy ?? 0,
          defaultSignalWeightsMap.get(DefaultConfigurationSignals.VoiceChat) ?? 0,
        );
        signalToScoresMap.set(DefaultConfigurationSignals.VoiceChat, score);
        break;
      case DefaultConfigurationSignals.TextChat:
        score = getDivisionResult(
          signalValues?.commonTextChatPlayers ?? 0,
          signalValues?.occupancy ?? 0,
          defaultSignalWeightsMap.get(DefaultConfigurationSignals.TextChat) ?? 0,
        );
        signalToScoresMap.set(DefaultConfigurationSignals.TextChat, score);
        break;
      case DefaultConfigurationSignals.PlayHistory:
        score = calculatePlayHistory(
          signalValues?.playerPlayHistory ?? 0,
          signalValues?.serverAveragePlayHistory ?? 0,
          defaultSignalWeightsMap.get(DefaultConfigurationSignals.PlayHistory) ?? 0,
        );
        signalToScoresMap.set(DefaultConfigurationSignals.PlayHistory, score);
        break;
      default:
        break;
    }
  });
  return signalToScoresMap;
}

export function getCustomSignalsScoresMap(
  signalValuesMap: Map<string, CustomSignalServerValue>,
  customSignalWeightsMap: Map<string, CustomSignal>,
): Map<string, number> {
  const signalToScoresMap: Map<string, number> = new Map();
  if (signalValuesMap.size === 0 || customSignalWeightsMap.size === 0) {
    return signalToScoresMap;
  }
  let score = 0;
  Array.from(customSignalWeightsMap).forEach((signalKvp) => {
    const signalName = signalKvp[0];
    const serverValue = signalValuesMap.get(signalName);
    if (!serverValue) {
      return;
    }
    const signal = signalKvp[1];
    switch (signal.customSignalType) {
      case CustomSignalType.PlayerCategorical:
        score = calculatePlayerCategorical(
          signal.playerCategoricalSignalConfiguration?.curveType,
          serverValue.serverNumericValue ?? 0,
          serverValue.playerNumericValue ?? 0,
          signal.weight ?? 0,
        );
        signalToScoresMap.set(signalName, score);
        break;
      case CustomSignalType.PlayerNumerical:
        score = calculateCustomNumerical(
          serverValue.serverNumericValue ?? 0,
          serverValue.playerNumericValue ?? 0,
          signal.playerNumericalSignalConfiguration?.maxRelevantDifference ?? 0,
          signal.weight ?? 0,
        );
        signalToScoresMap.set(signalName, score);
        break;
      case CustomSignalType.ServerCategorical:
        score = calculateServerCategorical(
          serverValue.serverStringValue ?? undefined,
          serverValue.playerStringValue ?? undefined,
          signal.weight ?? 0,
        );
        signalToScoresMap.set(signalName, score);
        break;
      case CustomSignalType.ServerNumerical:
        score = calculateCustomNumerical(
          serverValue.serverNumericValue ?? 0,
          serverValue.playerNumericValue ?? 0,
          signal.serverNumericalSignalConfiguration?.maxRelevantDifference ?? 0,
          signal.weight ?? 0,
        );
        signalToScoresMap.set(signalName, score);
        break;
      default:
        break;
    }
  });
  return signalToScoresMap;
}

export function getServerScoreMaps(
  defaultSignalServerValues: MockServerSignalValues | undefined,
  defaultSignalWeightsMap: Map<string, number>,
  customSignalsValues: Map<string, CustomSignalServerValue>,
  customSignalWeightsMap: Map<string, CustomSignal>,
): ServerSignalScores {
  const defaultSignalScores = getDefaultSignalsScoresMap(
    defaultSignalServerValues,
    defaultSignalWeightsMap,
  );
  const customSignalScores = getCustomSignalsScoresMap(customSignalsValues, customSignalWeightsMap);
  return {
    defaultSignalScores,
    customSignalScores,
  };
}
