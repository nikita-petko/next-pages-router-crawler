import {
  CustomSignalType,
  MatchmakingNumericalAttributeComparisonType,
} from '@rbx/clients/matchmakingApi/v1';
import AttributeDataType from '../enums/AttributeDataType';
import BooleanValueType from '../enums/BooleanValueType';
import { EqualityMatchAttributeType } from '../enums/MatchAttributeType';
import { PlayerAttributesDetailedInfo, ServerAttributesInfo } from '../types/AttributesInfo';
import {
  ConfigurationDetailedInfo,
  CustomSignal,
  CustomSignalFormValues,
} from '../types/ConfigurationInfo';
import {
  getClientNumericalComparisonType,
  getClientCategoricalComparisonType,
  getClientCurveType,
  getClientAggregationType,
  getAggregationType,
  getComparisonTypeFromNumericalAttribute,
  getComparisonTypeFromServerAttribute,
  getDistributionType,
} from './ConfigurationUtils';
import AggregationType from '../enums/AggregationType';

export function IsNumericValue(value: string) {
  const regex = /^-?\d*\.?\d+$/;
  return regex.test(value);
}

export const ValidateDataType = (
  value: string | number | boolean | undefined,
  dataType: AttributeDataType | null,
) => {
  // Allow empty strings for String data type
  if (value === undefined || value === null) {
    return 'Error.InvalidDataType';
  }
  if (dataType === AttributeDataType.Boolean) {
    return true;
  }
  if (dataType === AttributeDataType.Double && IsNumericValue(value.toString())) {
    return true;
  }
  if (dataType === AttributeDataType.String) {
    return true;
  }
  return 'Error.InvalidDataType';
};

export const GetValidatedNumber = (value: number | string | null) => {
  if (!value) {
    return undefined;
  }
  const stringValue = value.toString();
  if (IsNumericValue(stringValue)) {
    return parseFloat(stringValue);
  }
  return undefined;
};

export const ValidateNumber = (value: number | string | null) => {
  const numericValue = GetValidatedNumber(value);
  if (numericValue === undefined) {
    return 'Error.InvalidDataType';
  }
  return true;
};

export const ValidateData = (value: string | null | undefined) => {
  if (!value) {
    return 'Error.InvalidDataType';
  }

  // valid number
  if (IsNumericValue(value.toString()) || value === '0') {
    return true;
  }
  // valid boolean value
  if (value === 'true' || value === 'false') {
    return true;
  }
  // check if valid string
  if (value && value !== '') {
    return true;
  }
  return 'Error.InvalidDataType';
};

export function getServerAttributesFormOptions(
  dataType: AttributeDataType | null,
  defaultValueType?: EqualityMatchAttributeType,
) {
  return {
    name: {
      required: 'Error.Required',
      maxLength: 50,
    },
    attributeType: {
      required: 'Error.Required',
    },
    dataType: {
      required: 'Error.Required',
      maxLength: 100,
    },
    defaultValueType: {
      required: 'Error.Required',
    },
    matchingPlayerAttribute: {
      required:
        defaultValueType === EqualityMatchAttributeType.PlayerAttribute ? 'Error.Required' : false,
    },
    constantValue: {
      required:
        defaultValueType === EqualityMatchAttributeType.ConstantValue ? 'Error.Required' : false,
      maxLength: 50,
      validate: {
        validDataType: (value: string | number | boolean) => ValidateDataType(value, dataType),
      },
    },
  };
}

export function getPlayerAttributesFormOptions(dataType: AttributeDataType | null) {
  return {
    name: {
      required: 'Error.Required',
      maxLength: 50,
    },
    constantValue: {
      required: 'Error.Required',
      maxLength: 50,
      validate: {
        validDataType: (value: string | number | boolean) => ValidateDataType(value, dataType),
      },
    },
    attributeType: {
      required: 'Error.Required',
    },
    dataType: {
      required: 'Error.Required',
      maxLength: 100,
    },
    dataStoreLocation: {
      dataStoreName: {
        required: 'Error.Required',
      },
      keyTemplate: {
        required: 'Error.Required',
      },
      valuePath: {
        maxLength: 100,
        required: false,
      },
      scope: {
        maxLength: 100,
        required: false,
      },
    },
  };
}

const getDefaultValue = (
  attributeDataType: AttributeDataType | null | undefined,
  value: number | string | boolean | null | undefined,
): string => {
  switch (attributeDataType) {
    case AttributeDataType.Boolean:
      return value ? 'True' : 'False';
    case AttributeDataType.Double:
      return value?.toString() ?? '';
    case AttributeDataType.String:
      return value?.toString() ?? '';
    default:
      return '';
  }
};

export function getPlayerAttributesFormDefaultValues(
  currentAttributes: PlayerAttributesDetailedInfo | undefined,
) {
  return {
    name: currentAttributes?.name ?? '',
    dataType: currentAttributes?.dataType ?? undefined,
    constantValue:
      getDefaultValue(currentAttributes?.dataType, currentAttributes?.constantValue) ?? '',
    dataStoreLocation: currentAttributes?.dataStoreLocation,
  };
}

export function getServerAttributesFormDefaultValues(
  currentAttributes: ServerAttributesInfo | undefined,
) {
  return {
    name: currentAttributes?.name ?? '',
    dataType: currentAttributes?.dataType ?? undefined,
    defaultValueType: currentAttributes?.defaultValueType ?? undefined,
    constantValue:
      getDefaultValue(currentAttributes?.dataType, currentAttributes?.constantValue) ?? '',
    matchingPlayerAttribute: currentAttributes?.matchingPlayerAttribute ?? undefined,
  };
}

export function getBooleanValueType(value: string | null): BooleanValueType | null {
  if (value !== null) {
    if (value === 'True') {
      return BooleanValueType.True;
    }
    if (value === 'False') {
      return BooleanValueType.False;
    }
  }
  return null;
}

export const getRuleSuccessLabel = (isDelete: boolean, isEditing: boolean) => {
  if (isDelete) {
    return 'Message.RuleDeleteSuccess';
  }
  if (isEditing) {
    return 'Message.RuleUpdateSuccess';
  }
  return 'Message.RuleCreationSuccess';
};

export const getAttributeSuccessLabel = (isDelete: boolean, isEditing: boolean) => {
  if (isDelete) {
    return 'Message.AttributeDeleteSuccess';
  }
  if (isEditing) {
    return 'Message.AttributeUpdateSuccess';
  }
  return 'Message.AttributeCreationSuccess';
};

export const getAttributeFailureLabel = (isDelete: boolean, isEditing: boolean) => {
  if (isDelete) {
    return 'Error.AttributeDelete';
  }
  if (isEditing) {
    return 'Error.AttributeUpdate';
  }
  return 'Error.AttributeCreation';
};

export const getCustomSignalSuccessLabel = (isDelete: boolean, isEditing: boolean) => {
  if (isDelete) {
    return 'Message.SignalDelete';
  }
  if (isEditing) {
    return 'Message.SignalUpdate';
  }
  return 'Message.SignalCreationSuccess';
};

export const getCustomSignalFailureLabel = (isDelete: boolean, isEditing: boolean) => {
  if (isDelete) {
    return 'Error.SignalDelete';
  }
  if (isEditing) {
    return 'Error.SignalUpdate';
  }
  return 'Error.SignalCreation';
};

export function getConfigurationDefaultValues(
  currentConfiguration: ConfigurationDetailedInfo | undefined,
) {
  return {
    name: currentConfiguration?.name ?? '',
    id: currentConfiguration?.id ?? undefined,
    appliedPlaces: currentConfiguration?.appliedPlaces ?? undefined,
    modifiedTime: currentConfiguration?.modifiedTime ?? undefined,
    defaultSignals: currentConfiguration?.defaultSignals ?? undefined,
    customSignals: currentConfiguration?.customSignals ?? undefined,
  };
}

export function getCustomSignalFormOptions() {
  return {
    name: {
      required: 'Error.Required',
      maxLength: 50,
    },
    description: {
      maxLength: 100,
    },
    weight: {
      required: 'Error.Required',
      maxLength: 50,
      validate: {
        validDataType: (value: string | number) => ValidateNumber(value),
      },
    },
    serverAttributeId: {
      required: 'Error.Required',
    },
    playerAttributeId: {
      required: 'Error.Required',
    },
    stringConstantValue: {
      required: 'Error.Required',
      maxLength: 50,
      validate: {
        validDataType: (value: string | undefined) => ValidateData(value),
      },
    },
    numericalConstantValue: {
      required: 'Error.Required',
      maxLength: 20,
    },
    maxRelevantDifference: {
      required: 'Error.Required',
      maxLength: 20,
      validate: {
        validDataType: (value: string | number) => ValidateNumber(value),
      },
    },
  };
}

export function getCustomSignalFromFormValues(formValues: CustomSignalFormValues): CustomSignal {
  return {
    name: formValues?.name ?? '',
    description: formValues?.description ?? '',
    customSignalType: formValues?.customSignalType,
    playerNumericalSignalConfiguration:
      formValues?.customSignalType === CustomSignalType.PlayerNumerical
        ? {
            playerAttribute: { id: formValues?.playerAttributeId },
            aggregation: getClientAggregationType(formValues?.aggregationType),
            maxRelevantDifference: formValues?.maxRelevantDifference,
            constantValue: formValues?.numericalConstantValue,
            comparisonType:
              formValues?.aggregationType === AggregationType.Sum
                ? MatchmakingNumericalAttributeComparisonType.AbsoluteDifferentToConstant
                : MatchmakingNumericalAttributeComparisonType.AbsoluteDifferentToPlayer,
          }
        : undefined,
    serverNumericalSignalConfiguration:
      formValues?.customSignalType === CustomSignalType.ServerNumerical
        ? {
            serverAttribute: { id: formValues?.serverAttributeId },
            playerAttribute: { id: formValues?.playerAttributeId },
            comparisonType: getClientNumericalComparisonType(formValues?.comparisonType),
            maxRelevantDifference: formValues?.maxRelevantDifference,
            constantValue: formValues?.numericalConstantValue,
          }
        : undefined,
    serverCategoricalSignalConfiguration:
      formValues?.customSignalType === CustomSignalType.ServerCategorical
        ? {
            serverAttribute: { id: formValues?.serverAttributeId },
            playerAttribute: { id: formValues?.playerAttributeId },
            comparisonType: getClientCategoricalComparisonType(formValues?.comparisonType),
            constantValue: formValues?.stringConstantValue,
          }
        : undefined,
    playerCategoricalSignalConfiguration:
      formValues?.customSignalType === CustomSignalType.PlayerCategorical
        ? {
            playerAttribute: { id: formValues?.playerAttributeId },
            curveType: getClientCurveType(formValues?.distributionType),
          }
        : undefined,
  };
}

export function getCustomSignalDefaultValues(
  currentSignal: CustomSignal | undefined,
): CustomSignalFormValues | undefined {
  if (!currentSignal) {
    return undefined;
  }

  const response = {
    name: currentSignal?.name ?? '',
    description: currentSignal?.description ?? '',
    weight: currentSignal?.weight ?? 0,
    customSignalType: currentSignal?.customSignalType,
  };

  switch (currentSignal?.customSignalType) {
    case CustomSignalType.PlayerNumerical:
      return {
        ...response,
        playerAttributeId:
          currentSignal?.playerNumericalSignalConfiguration?.playerAttribute?.id ?? undefined,
        aggregationType: getAggregationType(currentSignal),
        comparisonType: getComparisonTypeFromNumericalAttribute(
          currentSignal?.playerNumericalSignalConfiguration?.comparisonType,
        ),
        maxRelevantDifference:
          currentSignal?.playerNumericalSignalConfiguration?.maxRelevantDifference ?? undefined,
        numericalConstantValue:
          currentSignal?.playerNumericalSignalConfiguration?.constantValue ?? undefined,
      };
    case CustomSignalType.PlayerCategorical:
      return {
        ...response,
        playerAttributeId:
          currentSignal?.playerCategoricalSignalConfiguration?.playerAttribute?.id ?? undefined,
        distributionType: getDistributionType(currentSignal),
      };
    case CustomSignalType.ServerNumerical:
      return {
        ...response,
        playerAttributeId:
          currentSignal?.serverNumericalSignalConfiguration?.playerAttribute?.id ?? undefined,
        serverAttributeId:
          currentSignal?.serverNumericalSignalConfiguration?.serverAttribute?.id ?? undefined,
        numericalConstantValue:
          currentSignal?.serverNumericalSignalConfiguration?.constantValue ?? undefined,
        comparisonType: getComparisonTypeFromNumericalAttribute(
          currentSignal?.serverNumericalSignalConfiguration?.comparisonType,
        ),
        maxRelevantDifference:
          currentSignal?.serverNumericalSignalConfiguration?.maxRelevantDifference ?? undefined,
      };
    case CustomSignalType.ServerCategorical:
      return {
        ...response,
        playerAttributeId:
          currentSignal?.serverCategoricalSignalConfiguration?.playerAttribute?.id ?? undefined,
        serverAttributeId:
          currentSignal?.serverCategoricalSignalConfiguration?.serverAttribute?.id ?? undefined,
        stringConstantValue:
          currentSignal?.serverCategoricalSignalConfiguration?.constantValue ?? undefined,
        comparisonType: getComparisonTypeFromServerAttribute(
          currentSignal?.serverCategoricalSignalConfiguration?.comparisonType,
        ),
      };
    default:
      return undefined;
  }
}
