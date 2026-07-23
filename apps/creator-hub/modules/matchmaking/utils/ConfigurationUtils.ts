import {
  AttributeAggregationFunction,
  CustomSignalType,
  MatchmakingCategoricalAttributeComparisonType,
  MatchmakingNumericalAttributeComparisonType,
  MatchmakingScoringConfiguration,
  MatchmakingSignalCurveType,
} from '@rbx/clients/matchmakingApi/v1';
import AggregationType from '../enums/AggregationType';
import AttributeType from '../enums/AttributeType';
import ComparisonType from '../enums/ComparisonType';
import DistributionType from '../enums/DistributionType';
import { AttributesInfo } from '../types/AttributesInfo';
import {
  ConfigurationBriefInfo,
  CustomSignal,
  CustomSignalFormValues,
  DefaultSignalsWeights,
  PlayerValues,
} from '../types/ConfigurationInfo';
import { PlaceInfo } from '../types/PlaceInfo';
import { defaultCustomConfigName } from '../constants';
import DefaultConfigurationSignals from '../enums/DefaultConfigurationSignals';

export function getInlineCodeFormattedString(value: string | number | undefined) {
  if (typeof value === 'undefined') {
    return '';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return value.replaceAll(' ', '_');
}

export const initialPlayerRowValues: PlayerValues[] = [
  {
    id: 0,
    value: 0,
  },
  {
    id: 1,
    value: 0,
  },
];

export function getSumFromPlayerRows(playerRows: PlayerValues[]) {
  return playerRows.reduce((accumulator, row) => accumulator + row.value, 0);
}

export function getAverageValue(sum: number, length: number) {
  const avg = sum / length;
  return Math.round(avg * 1000) / 1000;
}

export function getMedian(playerRows: PlayerValues[]): number {
  if (playerRows.length === 0) {
    return 0;
  }
  const values = playerRows.map((row) => row.value);
  const sortedValues = [...values].sort((a, b) => a - b);
  const middleIndex = Math.floor(sortedValues.length / 2);

  const median =
    sortedValues.length % 2
      ? sortedValues[middleIndex]
      : (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;

  return Math.round(median * 1000) / 1000;
}

export function getAttributeFromId(
  attributeId: string | undefined,
  allAttributes: AttributesInfo[] | undefined,
) {
  if (!attributeId || !allAttributes) {
    return undefined;
  }
  return allAttributes?.find((attr) => attr.id === attributeId);
}

export function getAttributeInfoFromCustomSignal(
  signal: CustomSignalFormValues | undefined,
  allAttributes: AttributesInfo[] | undefined,
): AttributesInfo | undefined {
  if (!signal || allAttributes?.length === 0) {
    return undefined;
  }
  let signalAttrId: string | undefined;
  switch (signal.customSignalType) {
    case CustomSignalType.PlayerNumerical:
    case CustomSignalType.PlayerCategorical:
      signalAttrId = signal?.playerAttributeId ?? undefined;
      break;
    case CustomSignalType.ServerNumerical:
    case CustomSignalType.ServerCategorical:
      signalAttrId = signal?.serverAttributeId ?? undefined;
      break;
    default:
      return undefined;
  }
  return getAttributeFromId(signalAttrId, allAttributes);
}

export function getAttributeTypeFromCustomSignalType(signalType: CustomSignalType | undefined) {
  switch (signalType) {
    case CustomSignalType.PlayerNumerical:
    case CustomSignalType.PlayerCategorical:
      return AttributeType.Player;
    case CustomSignalType.ServerNumerical:
    case CustomSignalType.ServerCategorical:
      return AttributeType.Server;
    default:
      return undefined;
  }
}

export function getAttributeName(attribute: AttributesInfo | undefined) {
  if (!attribute) {
    return undefined;
  }
  const attributeType = getAttributeTypeFromCustomSignalType(attribute.customSignalType);
  switch (attributeType) {
    case AttributeType.Player:
      return attribute?.playerAttribute?.name;
    case AttributeType.Server:
      return attribute?.serverAttribute?.name;
    default:
      return undefined;
  }
}

export function getAggregationType(signal: CustomSignal | undefined) {
  if (!signal) {
    return undefined;
  }
  if (signal.customSignalType !== CustomSignalType.PlayerNumerical) {
    return undefined;
  }
  switch (signal.playerNumericalSignalConfiguration?.aggregation?.aggregationFunction) {
    case AttributeAggregationFunction.Average:
      return AggregationType.Average;
    case AttributeAggregationFunction.Median:
      return AggregationType.Median;
    case AttributeAggregationFunction.Sum:
      return AggregationType.Sum;
    default:
      return undefined;
  }
}

export function getDistributionType(signal: CustomSignal | undefined) {
  if (!signal) {
    return undefined;
  }
  if (signal.customSignalType !== CustomSignalType.PlayerCategorical) {
    return undefined;
  }
  switch (signal.playerCategoricalSignalConfiguration?.curveType) {
    case MatchmakingSignalCurveType.PositiveLinear:
      return DistributionType.Cluster;
    case MatchmakingSignalCurveType.NegativeLinear:
      return DistributionType.Diversify;
    default:
      return undefined;
  }
}

export function getComparisonTypeFromNumericalAttribute(
  numericalComparisonType: MatchmakingNumericalAttributeComparisonType | undefined,
) {
  if (!numericalComparisonType) {
    return undefined;
  }
  switch (numericalComparisonType) {
    case MatchmakingNumericalAttributeComparisonType.AbsoluteDifferentToConstant:
      return ComparisonType.ConstantValue;
    case MatchmakingNumericalAttributeComparisonType.AbsoluteDifferentToPlayer:
      return ComparisonType.Player;
    default:
      return undefined;
  }
}

export function getComparisonTypeFromServerAttribute(
  categoricalComparisonType: MatchmakingCategoricalAttributeComparisonType | undefined,
) {
  if (!categoricalComparisonType) {
    return undefined;
  }
  switch (categoricalComparisonType) {
    case MatchmakingCategoricalAttributeComparisonType.EqualityToConstant:
      return ComparisonType.ConstantValue;
    case MatchmakingCategoricalAttributeComparisonType.EqualityToPlayer:
      return ComparisonType.Player;
    default:
      return undefined;
  }
}

export function getCustomSignalsMapFromConfig(
  signals: CustomSignal[] | undefined,
): Map<string, CustomSignal> {
  if (!signals) {
    return new Map();
  }
  return new Map(signals.map((signal) => [signal.name, signal]));
}

export function getCustomSignalsWeightsMapFromConfig(
  signals: CustomSignal[] | undefined,
): Map<string, CustomSignal> {
  if (!signals) {
    return new Map();
  }
  return new Map(signals.map((signal) => [signal.name, signal]));
}

export function getDefaultSignalsWeightsMap(
  signals: DefaultSignalsWeights | undefined,
): Map<string, number> {
  const signalToWeightsMap: Map<DefaultConfigurationSignals, number> = new Map();
  if (!signals) {
    return signalToWeightsMap;
  }
  Object.values(DefaultConfigurationSignals).forEach((signal) => {
    switch (signal) {
      case DefaultConfigurationSignals.AgeDifference:
        signalToWeightsMap.set(DefaultConfigurationSignals.AgeDifference, signals?.age ?? 0);
        break;
      case DefaultConfigurationSignals.Occupancy:
        signalToWeightsMap.set(DefaultConfigurationSignals.Occupancy, signals?.occupancy ?? 0);
        break;
      case DefaultConfigurationSignals.Language:
        signalToWeightsMap.set(DefaultConfigurationSignals.Language, signals?.language ?? 0);
        break;
      case DefaultConfigurationSignals.Latency:
        signalToWeightsMap.set(DefaultConfigurationSignals.Latency, signals?.latency ?? 0);
        break;
      case DefaultConfigurationSignals.PreferredPlayers:
        signalToWeightsMap.set(
          DefaultConfigurationSignals.PreferredPlayers,
          signals?.preferredPlayers ?? 0,
        );
        break;
      case DefaultConfigurationSignals.DeviceType:
        signalToWeightsMap.set(DefaultConfigurationSignals.DeviceType, signals?.deviceType ?? 0);
        break;
      case DefaultConfigurationSignals.VoiceChat:
        signalToWeightsMap.set(DefaultConfigurationSignals.VoiceChat, signals?.voiceChat ?? 0);
        break;
      case DefaultConfigurationSignals.TextChat:
        signalToWeightsMap.set(DefaultConfigurationSignals.TextChat, signals?.textChat ?? 0);
        break;
      case DefaultConfigurationSignals.PlayHistory:
        signalToWeightsMap.set(DefaultConfigurationSignals.PlayHistory, signals?.playHistory ?? 0);
        break;
      default:
        break;
    }
  });
  return signalToWeightsMap;
}

export function getClientCurveType(distributionType: DistributionType | undefined) {
  if (!distributionType) {
    return undefined;
  }
  switch (distributionType) {
    case DistributionType.Cluster:
      return MatchmakingSignalCurveType.PositiveLinear;
    case DistributionType.Diversify:
      return MatchmakingSignalCurveType.NegativeLinear;
    default:
      return undefined;
  }
}

export function getClientNumericalComparisonType(comparisonType: ComparisonType | undefined) {
  if (!comparisonType) {
    return undefined;
  }
  switch (comparisonType) {
    case ComparisonType.ConstantValue:
      return MatchmakingNumericalAttributeComparisonType.AbsoluteDifferentToConstant;
    case ComparisonType.Player:
      return MatchmakingNumericalAttributeComparisonType.AbsoluteDifferentToPlayer;
    default:
      return undefined;
  }
}

export function getClientCategoricalComparisonType(comparisonType: ComparisonType | undefined) {
  if (!comparisonType) {
    return undefined;
  }
  switch (comparisonType) {
    case ComparisonType.ConstantValue:
      return MatchmakingCategoricalAttributeComparisonType.EqualityToConstant;
    case ComparisonType.Player:
      return MatchmakingCategoricalAttributeComparisonType.EqualityToPlayer;
    default:
      return undefined;
  }
}

export function getServerValueFromAggregationType(
  aggregationType: AggregationType | undefined,
  playerRows: PlayerValues[],
) {
  switch (aggregationType) {
    case AggregationType.Average:
      return getAverageValue(getSumFromPlayerRows(playerRows), playerRows.length);
    case AggregationType.Median:
      return getMedian(playerRows);
    case AggregationType.Sum:
    default:
      return getSumFromPlayerRows(playerRows);
  }
}

export function getClientAggregationType(aggregationType: AggregationType | undefined) {
  if (!aggregationType) {
    return undefined;
  }
  switch (aggregationType) {
    case AggregationType.Average:
      return {
        aggregationFunction: AttributeAggregationFunction.Average,
      };
    case AggregationType.Median:
      return {
        aggregationFunction: AttributeAggregationFunction.Median,
      };
    case AggregationType.Sum:
      return {
        aggregationFunction: AttributeAggregationFunction.Sum,
      };
    default:
      return undefined;
  }
}

export function getAppliedPlaceInfoFromConfigId(
  configId: string | null | undefined,
  placeToConfigurationMap: Map<PlaceInfo, MatchmakingScoringConfiguration> | undefined,
) {
  const appliedPlaces = new Map<number, PlaceInfo>();
  if (configId) {
    placeToConfigurationMap?.forEach((configs, placeInfo) => {
      if (configs.id === configId && placeInfo?.placeId) {
        appliedPlaces.set(placeInfo?.placeId, placeInfo);
      }
    });
  }
  return appliedPlaces;
}

export function getConfigurationDetailedInfo(
  scoringConfiguration: MatchmakingScoringConfiguration | undefined,
  placeToConfigurationMap: Map<PlaceInfo, MatchmakingScoringConfiguration> | undefined,
) {
  if (scoringConfiguration === undefined || !placeToConfigurationMap) {
    return undefined;
  }
  const appliedPlaces = getAppliedPlaceInfoFromConfigId(
    scoringConfiguration.id,
    placeToConfigurationMap,
  );

  const customSignals: CustomSignal[] = [];
  if (scoringConfiguration?.customSignals) {
    Object.values(scoringConfiguration?.customSignals).forEach((signal) => {
      const customSignal: CustomSignal = {
        name: signal.name ?? '',
        description: signal.description ?? '',
        weight: signal.weight ?? undefined,
        customSignalType: signal.customSignalType,
        playerCategoricalSignalConfiguration:
          signal.customSignalType === CustomSignalType.PlayerCategorical
            ? signal.playerCategoricalSignalConfiguration
            : undefined,
        serverCategoricalSignalConfiguration:
          signal.customSignalType === CustomSignalType.ServerCategorical
            ? signal.serverCategoricalSignalConfiguration
            : undefined,
        serverNumericalSignalConfiguration:
          signal.customSignalType === CustomSignalType.ServerNumerical
            ? signal.serverNumericalSignalConfiguration
            : undefined,
        playerNumericalSignalConfiguration:
          signal.customSignalType === CustomSignalType.PlayerNumerical
            ? signal.playerNumericalSignalConfiguration
            : undefined,
      };
      customSignals.push(customSignal);
    });
  }
  return {
    name: scoringConfiguration.name ?? '',
    id: scoringConfiguration.id ?? '',
    appliedPlaces,
    modifiedTime: scoringConfiguration.updatedTime,
    defaultSignals: {
      occupancy: scoringConfiguration?.signalWeights?.occupancy?.weight,
      age: scoringConfiguration?.signalWeights?.age?.weight,
      language: scoringConfiguration?.signalWeights?.language?.weight,
      latency: scoringConfiguration?.signalWeights?.latency?.weight,
      preferredPlayers: scoringConfiguration?.signalWeights?.preferredPlayers?.weight,
      deviceType: scoringConfiguration?.signalWeights?.deviceType?.weight,
      voiceChat: scoringConfiguration?.signalWeights?.voiceChat?.weight,
      playHistory: scoringConfiguration?.signalWeights?.playHistory?.weight,
      textChat: scoringConfiguration?.signalWeights?.textChat?.weight,
    },
    customSignals,
  };
}

export function getDefaultConfigName(
  existingAttributes: ConfigurationBriefInfo[] | undefined,
): string {
  if (!existingAttributes) {
    return defaultCustomConfigName;
  }
  let defaultNameCount = 0;
  existingAttributes.forEach((attr) => {
    if (attr.name?.startsWith(defaultCustomConfigName)) {
      defaultNameCount += 1;
    }
  });
  if (defaultNameCount === 0) {
    return defaultCustomConfigName;
  }
  return `${defaultCustomConfigName} (${defaultNameCount})`;
}

export function getPlacesInfoFromConfigId(
  configId: string | undefined,
  allConfigurations: ConfigurationBriefInfo[] | undefined,
) {
  if (!configId || !allConfigurations) {
    return [];
  }
  const currConfig = allConfigurations.find((config) => config.id === configId);
  if (currConfig && currConfig?.appliedPlaces) {
    return Array.from(currConfig?.appliedPlaces.values());
  }
  return [];
}

export function getDefaultSignalValues(
  defaultSignalsMap: Map<string, number>,
): DefaultSignalsWeights {
  return {
    occupancy: defaultSignalsMap.get(DefaultConfigurationSignals.Occupancy),
    age: defaultSignalsMap.get(DefaultConfigurationSignals.AgeDifference),
    language: defaultSignalsMap.get(DefaultConfigurationSignals.Language),
    latency: defaultSignalsMap.get(DefaultConfigurationSignals.Latency),
    preferredPlayers: defaultSignalsMap.get(DefaultConfigurationSignals.PreferredPlayers),
    voiceChat: defaultSignalsMap.get(DefaultConfigurationSignals.VoiceChat),
    deviceType: defaultSignalsMap.get(DefaultConfigurationSignals.DeviceType),
    playHistory: defaultSignalsMap.get(DefaultConfigurationSignals.PlayHistory),
    textChat: defaultSignalsMap.get(DefaultConfigurationSignals.TextChat),
  };
}

export function usingDefaultWeights(
  currWeights: DefaultSignalsWeights | undefined,
  defaultWeights: DefaultSignalsWeights | undefined,
) {
  if (
    currWeights === defaultWeights ||
    (currWeights?.age === defaultWeights?.age &&
      currWeights?.deviceType === defaultWeights?.deviceType &&
      currWeights?.language === defaultWeights?.language &&
      currWeights?.occupancy === defaultWeights?.occupancy &&
      currWeights?.playHistory === defaultWeights?.playHistory &&
      currWeights?.latency === defaultWeights?.latency &&
      currWeights?.preferredPlayers === defaultWeights?.preferredPlayers &&
      currWeights?.voiceChat === defaultWeights?.voiceChat &&
      currWeights?.textChat === defaultWeights?.textChat)
  ) {
    return true;
  }

  return false;
}
