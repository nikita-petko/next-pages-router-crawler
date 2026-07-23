import { RAQIV2BreakdownValue, RAQIV2ReservedDimensionValues } from '@modules/clients/analytics';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { FormattedText } from '@modules/analytics-translations';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import RAQIV2ReservedDimensionValuesTranslationKeys from './RAQIV2ReservedDimensionValuesTranslationKeys';
import getDimensionRenderer from '../components/getDimensionRenderer';

type RAQIV2MultiDimensionRenderer = {
  getBreakdownValueName: (
    breakdownValues: RAQIV2BreakdownValue[],
    dependencies: RAQIV2TranslationDependencies,
  ) => FormattedText;
};

const getRAQIV2DimensionsHash = (dimensions: RAQIV2Dimension[]): string => {
  return [...dimensions].sort().join(',');
};

const tryGetDimensionTranslation = (
  breakdownValue: RAQIV2BreakdownValue,
  dependencies: RAQIV2TranslationDependencies,
): string | undefined => {
  if (!breakdownValue.dimension || !breakdownValue.value) {
    return undefined;
  }
  if (isValidEnumValue(RAQIV2Dimension, breakdownValue.dimension)) {
    const { getBreakdownValueName } = getDimensionRenderer(breakdownValue.dimension);
    const nonNullableBreakdownValue = { ...breakdownValue, value: breakdownValue.value };
    return getBreakdownValueName(nonNullableBreakdownValue, dependencies);
  }
  return undefined;
};

const RAQIV2MultiDimensionRenderers: Map<string, RAQIV2MultiDimensionRenderer> = new Map();

const TransactionTypeFlowTypeRenderer: RAQIV2MultiDimensionRenderer = {
  getBreakdownValueName: (breakdownValues, dependencies) => {
    const transactionType = breakdownValues.find(
      (breakdownValue) => breakdownValue.dimension === RAQIV2Dimension.TransactionType,
    );
    const flowType = breakdownValues.find(
      (breakdownValue) => breakdownValue.dimension === RAQIV2Dimension.FlowType,
    );
    const transactionTypeTranslation = transactionType
      ? tryGetDimensionTranslation(transactionType, dependencies)
      : undefined;
    const flowTypeTranslation = flowType
      ? tryGetDimensionTranslation(flowType, dependencies)
      : undefined;
    if (transactionTypeTranslation && flowTypeTranslation) {
      return `${transactionTypeTranslation} (${flowTypeTranslation})` as FormattedText;
    }
    return (transactionTypeTranslation ||
      flowTypeTranslation ||
      dependencies.translate(
        RAQIV2ReservedDimensionValuesTranslationKeys[RAQIV2ReservedDimensionValues.Unknown],
      )) as FormattedText;
  },
};

const TransactionTypeFlowTypeRendererHash = getRAQIV2DimensionsHash([
  RAQIV2Dimension.TransactionType,
  RAQIV2Dimension.FlowType,
]);
RAQIV2MultiDimensionRenderers.set(
  TransactionTypeFlowTypeRendererHash,
  TransactionTypeFlowTypeRenderer,
);

// Renderer for AvatarItemId + AvatarItemTargetType combination
const AvatarItemIdTargetTypeRenderer: RAQIV2MultiDimensionRenderer = {
  getBreakdownValueName: (breakdownValues, dependencies) => {
    const avatarItemId = breakdownValues.find(
      (breakdownValue) => breakdownValue.dimension === RAQIV2Dimension.AvatarItemId,
    );

    if (!avatarItemId?.value) {
      return dependencies.translate(
        RAQIV2ReservedDimensionValuesTranslationKeys[RAQIV2ReservedDimensionValues.Unknown],
      );
    }

    // Prioritize displayValue from backend (for explore mode / custom dashboards)
    if (avatarItemId.displayValue) {
      return avatarItemId.displayValue as FormattedText;
    }

    // Fallback to avatarItemNamesMap context
    const itemName = dependencies.avatarItemNamesMap.get(avatarItemId.value);
    if (itemName) {
      return itemName as FormattedText;
    }

    // Ultimate fallback to the raw ID
    return avatarItemId.value as FormattedText;
  },
};

const AvatarItemIdTargetTypeRendererHash = getRAQIV2DimensionsHash([
  RAQIV2Dimension.AvatarItemId,
  RAQIV2Dimension.AvatarItemTargetType,
]);
RAQIV2MultiDimensionRenderers.set(
  AvatarItemIdTargetTypeRendererHash,
  AvatarItemIdTargetTypeRenderer,
);

const tryGetRAQIV2MultiBreakdownValueName = (
  breakdownValues: RAQIV2BreakdownValue[],
  dependencies: RAQIV2TranslationDependencies,
): FormattedText | undefined => {
  const unvalidatedDimensions = breakdownValues.map(({ dimension }) => dimension);
  // check if dimensions is all strings and no undefined
  const dimensions: RAQIV2Dimension[] = [];
  unvalidatedDimensions.forEach((dimension) => {
    if (dimension && isValidEnumValue(RAQIV2Dimension, dimension)) {
      dimensions.push(dimension);
    }
  });
  const allDimensionsAreValid = dimensions.length === unvalidatedDimensions.length;
  if (allDimensionsAreValid) {
    const hash = getRAQIV2DimensionsHash(dimensions);
    const renderer = RAQIV2MultiDimensionRenderers.get(hash);
    if (renderer) {
      return renderer.getBreakdownValueName(breakdownValues, dependencies);
    }
  }
  return undefined;
};

export default tryGetRAQIV2MultiBreakdownValueName;
