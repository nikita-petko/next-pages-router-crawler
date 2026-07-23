import type {
  RAQIBreakdownValue,
  RAQIDatapoint,
  RAQIMetricValue,
  RAQIResponse,
  RAQIUnvalidatedBreakdownValue,
  RAQIUnvalidatedDatapoint,
  RAQIUnvalidatedMetricValue,
  RAQIUnvalidatedQueryResponse,
} from '@modules/clients/analytics';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';

export class RAQIValidationError extends Error {
  public status = 418; // I'm a teapot
}
export class RAQIValidationUnhandledEnumValueError extends RAQIValidationError {}
export class RAQIValidationBreakdownValueNotFoundError extends RAQIValidationError {}
export class RAQIValidationBreakdownDimensionNotFoundError extends RAQIValidationError {}
export class RAQIValidationDatapointTimestampNotFoundError extends RAQIValidationError {}
export class RAQIValidationSeriesDatapointsNotFoundError extends RAQIValidationError {}
export class RAQIValidationResponseValuesNotFoundError extends RAQIValidationError {}

type EnumType<TEnum extends string> = { [key in string]: TEnum };
function validateEnum<TEnum extends string>(input: string, obj: EnumType<TEnum>): TEnum {
  const output = isValidEnumValue(obj, input) ? input : null;
  if (output === null) {
    throw new RAQIValidationUnhandledEnumValueError();
  }
  return output;
}

const validateArray = <TInput, TOutput, TConfig>(
  input: Array<TInput>,
  validateElementFn: (x: TInput, c: TConfig) => TOutput,
  config: TConfig,
): Array<TOutput> => {
  const output: Array<TOutput> = [];
  input.forEach((x) => output.push(validateElementFn(x, config)));
  return output;
};

export type ValidatorConfig<TDimension extends string> = {
  dimensionEnum: EnumType<TDimension>;
};

const validateBreakdown = <TDimension extends string>(
  input: RAQIUnvalidatedBreakdownValue,
  config: ValidatorConfig<TDimension>,
): RAQIBreakdownValue<TDimension> => {
  const { dimension, value } = input;
  if (!value) {
    throw new RAQIValidationBreakdownValueNotFoundError();
  }
  if (!dimension) {
    throw new RAQIValidationBreakdownDimensionNotFoundError();
  }
  // TODO: could we somehow specify that the value is constrained based on the dimension?
  return {
    dimension: validateEnum(dimension, config.dimensionEnum),
    value,
    displayValue: input.displayValue ?? undefined,
  };
};

const validateDatapoint = (input: RAQIUnvalidatedDatapoint): RAQIDatapoint => {
  const { timestamp, value, tag } = input;
  if (!timestamp) {
    throw new RAQIValidationDatapointTimestampNotFoundError();
  }
  return { timestamp, value, tag };
};

const validateMetricValue = <TDimension extends string>(
  input: RAQIUnvalidatedMetricValue,
  config: ValidatorConfig<TDimension>,
): RAQIMetricValue<TDimension> => {
  const { breakdowns, datapoints } = input;
  if (!datapoints) {
    throw new RAQIValidationSeriesDatapointsNotFoundError();
  }
  return {
    breakdowns: breakdowns ? validateArray(breakdowns, validateBreakdown, config) : [],
    datapoints: validateArray(datapoints, validateDatapoint, config),
  };
};

export const validateResponse = <TDimension extends string>(
  input: RAQIUnvalidatedQueryResponse,
  config: ValidatorConfig<TDimension>,
): RAQIResponse<TDimension> => {
  const { values } = input;
  if (!values) {
    throw new RAQIValidationResponseValuesNotFoundError();
  }
  return { values: validateArray(values, validateMetricValue, config) };
};

export type FilterConfigItem<TDimension extends string> = {
  dimension: TDimension;
  allowedValues: string[];
};

export type FilterConfig<TDimension extends string> = FilterConfigItem<TDimension>[];
