import { SearchSortParameter } from '@rbx/clients/universesApi';
import { ExperimentState } from '@modules/remote-configs/api/universeExperimentationClientEnums';
import AggregationType from '../enums/AggregationType';
import AttributeDataType from '../enums/AttributeDataType';
import AttributeType from '../enums/AttributeType';
import BooleanValueType from '../enums/BooleanValueType';
import DefaultConfigurationSignals from '../enums/DefaultConfigurationSignals';
import { EqualityMatchAttributeType } from '../enums/MatchAttributeType';
import DistributionType from '../enums/DistributionType';
import ComparisonType from '../enums/ComparisonType';
import ConfigurationHeader from '../enums/ConfigurationHeader';
import PlaceHeader from '../enums/PlaceHeader';
import ServerAttributeHeader from '../enums/ServerAttributeHeader';

export const attributeTypeTranslationKeys: { [key in AttributeType]: string } = {
  [AttributeType.Server]: 'Label.ServerAttribute',
  [AttributeType.Player]: 'Label.PlayerAttribute',
};

export const booleanTypeTranslationKeys: { [key in BooleanValueType]: string } = {
  [BooleanValueType.True]: 'Label.True',
  [BooleanValueType.False]: 'Label.False',
};

export const dataTypeTranslationKeys: { [key in AttributeDataType]: string } = {
  [AttributeDataType.Boolean]: 'Label.Boolean',
  [AttributeDataType.Double]: 'Label.DoubleType',
  [AttributeDataType.String]: 'Label.String',
};

export const aggregationTypeTranslationKeys: { [key in AggregationType]: string } = {
  [AggregationType.Average]: 'Label.AverageAggregationType',
  [AggregationType.Median]: 'Label.Median',
  [AggregationType.Sum]: 'Label.Sum',
};

export const aggregationTranslationKeys: { [key in AggregationType]: string } = {
  [AggregationType.Average]: 'Dialog.Average',
  [AggregationType.Median]: 'Dialog.Median',
  [AggregationType.Sum]: 'Dialog.Sum',
};

export const aggregationTypeDescriptionTranslationKeys: { [key in AggregationType]: string } = {
  [AggregationType.Average]: 'Description.Average',
  [AggregationType.Median]: 'Description.Median',
  [AggregationType.Sum]: 'Description.Sum',
};

export const defaultValueTypeTranslationKeys: { [key in EqualityMatchAttributeType]: string } = {
  [EqualityMatchAttributeType.ConstantValue]: 'Label.ConstantValue',
  [EqualityMatchAttributeType.PlayerAttribute]: 'Label.InferPlayerAttribute',
};

export const getBooleanValueTypeTranslation = (value: string | undefined) => {
  if (value === 'True') {
    return booleanTypeTranslationKeys[BooleanValueType.True];
  }
  if (value === 'False') {
    return booleanTypeTranslationKeys[BooleanValueType.False];
  }
  return '';
};

export const defaultSignalsTranslationKeys: { [key in DefaultConfigurationSignals]: string } = {
  [DefaultConfigurationSignals.Occupancy]: 'Signal.Occupancy',
  [DefaultConfigurationSignals.PreferredPlayers]: 'Signal.Friends',
  [DefaultConfigurationSignals.AgeDifference]: 'Signal.Age',
  [DefaultConfigurationSignals.Language]: 'Signal.Language',
  [DefaultConfigurationSignals.Latency]: 'Signal.Latency',
  [DefaultConfigurationSignals.DeviceType]: 'Signal.Device',
  [DefaultConfigurationSignals.VoiceChat]: 'Signal.VoiceChat',
  [DefaultConfigurationSignals.PlayHistory]: 'Signal.PlayHistory',
  [DefaultConfigurationSignals.TextChat]: 'Signal.TextChat',
};

export const universeSortTranslationKeys: Record<SearchSortParameter, string> = {
  [SearchSortParameter.GameCreated]: 'Label.DateOfCreation',
  [SearchSortParameter.GameName]: 'Label.Alphabetical',
  [SearchSortParameter.LastUpdated]: 'Label.LastUpdatedDate',
};

export const distributionTypeTranslationKeys: { [key in DistributionType]: string } = {
  [DistributionType.Cluster]: 'Dialog.Cluster',
  [DistributionType.Diversify]: 'Dialog.Diversify',
};

export const distributionTypeDescriptionTranslationKeys: { [key in DistributionType]: string } = {
  [DistributionType.Cluster]: 'Description.Cluster',
  [DistributionType.Diversify]: 'Description.Diversify',
};

export const serverNumericalTranslationKeys: { [key in ComparisonType]: string } = {
  [ComparisonType.Player]: 'Label.ServerNumericalPlayer',
  [ComparisonType.ConstantValue]: 'Label.ConstantValueSelect',
};

export const serverCategoricalTranslationKeys: { [key in ComparisonType]: string } = {
  [ComparisonType.Player]: 'Label.ServerCategoricalPlayerAttribute',
  [ComparisonType.ConstantValue]: 'Label.ConstantValueLabel',
};

export const configurationHeadersTranslationKeys: { [key in ConfigurationHeader]: string } = {
  [ConfigurationHeader.Name]: 'Label.Name',
  [ConfigurationHeader.AppliedPlaces]: 'Label.AppliedPlaces',
  [ConfigurationHeader.LastModified]: 'Label.LastModified',
  [ConfigurationHeader.Edit]: '',
  [ConfigurationHeader.Actions]: '',
};

export const placeHeadersTranslationKeys: { [key in PlaceHeader]: string } = {
  [PlaceHeader.Name]: 'Label.Name',
  [PlaceHeader.AppliedConfiguration]: 'Label.AppliedConfiguration',
  [PlaceHeader.LastModified]: 'Label.LastModified',
  [PlaceHeader.Delete]: '',
};

export const serverAttributeHeadersTranslationKeys: { [key in ServerAttributeHeader]: string } = {
  [ServerAttributeHeader.Name]: 'Label.Name',
  [ServerAttributeHeader.DataType]: 'Label.DataType',
  [ServerAttributeHeader.DefaultValueType]: 'Label.DefaultValueType',
  [ServerAttributeHeader.DefaultValue]: 'Label.DefaultValue',
  [ServerAttributeHeader.Edit]: '',
};

export const defaultWeightTooltipLabels: { [key in DefaultConfigurationSignals]: string } = {
  [DefaultConfigurationSignals.Occupancy]: 'Tooltip.Occupancy',
  [DefaultConfigurationSignals.PreferredPlayers]: 'Tooltip.PreferredPlayers',
  [DefaultConfigurationSignals.AgeDifference]: 'Tooltip.Age',
  [DefaultConfigurationSignals.Language]: 'Tooltip.Language',
  [DefaultConfigurationSignals.Latency]: 'Tooltip.Latency',
  [DefaultConfigurationSignals.DeviceType]: 'Tooltip.DeviceType',
  [DefaultConfigurationSignals.VoiceChat]: 'Tooltip.VoiceChat',
  [DefaultConfigurationSignals.PlayHistory]: 'Tooltip.PlayHistory',
  [DefaultConfigurationSignals.TextChat]: 'Tooltip.TextChat',
};

export const ToMatchmakingExperimentCreateOrEditPageButtonLabel: Partial<
  Record<ExperimentState, string>
> = {
  [ExperimentState.Scheduled]: 'Label.CreateExperiment',
  [ExperimentState.Running]: 'Label.ScheduleExperiment',
};
