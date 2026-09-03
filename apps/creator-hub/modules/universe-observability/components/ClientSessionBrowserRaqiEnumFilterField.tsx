import type { FC } from 'react';
import { useCallback } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import ControlledFilterEnumChoice from '@modules/charts-generic/components/ControlledFilterEnumChoice';
import {
  UniverseSessionOperatingSystem,
  UniverseSessionPlatform,
} from '@modules/clients/analytics/universeSessionMetadataApi';
import getDimensionRenderer from '@modules/experience-analytics-shared/components/getDimensionRenderer';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { SessionBrowserDrawerFilters } from '../types/SessionBrowserFilters';
import {
  getSessionBrowserOperatingSystemFilterOptions,
  getSessionBrowserPlatformFilterOptions,
} from '../utils/sessionBrowserRaqiFilterOptions';

const EMPTY_SELECTED_OPTIONS: string[] = [];
const FILTER_OVERFLOW_CLASS_NAME = 'min-width-0';

const RAQI_ENUM_FILTER_FIELDS = {
  platforms: {
    dimension: RAQIV2Dimension.Platform,
    allowedEnum: UniverseSessionPlatform,
    ...getSessionBrowserPlatformFilterOptions(),
  },
  operatingSystems: {
    dimension: RAQIV2Dimension.OperatingSystem,
    allowedEnum: UniverseSessionOperatingSystem,
    ...getSessionBrowserOperatingSystemFilterOptions(),
  },
} as const;

export type ClientSessionBrowserRaqiEnumFilterFieldProps = {
  readonly name: keyof typeof RAQI_ENUM_FILTER_FIELDS;
};

const ClientSessionBrowserRaqiEnumFilterField: FC<ClientSessionBrowserRaqiEnumFilterFieldProps> = ({
  name,
}) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { control } = useFormContext<SessionBrowserDrawerFilters>();
  const {
    field: { value: selectedValues, onChange },
  } = useController({ control, name });
  const { dimension, allowedEnum, options, multiple } = RAQI_ENUM_FILTER_FIELDS[name];
  const { name: dimensionNameKey, getBreakdownValueName } = getDimensionRenderer(dimension);
  const label = translationDependencies.translate(dimensionNameKey);
  const selectedOptions = selectedValues ?? EMPTY_SELECTED_OPTIONS;

  const formatOption = useCallback(
    (option: string) => getBreakdownValueName({ value: option }, translationDependencies),
    [getBreakdownValueName, translationDependencies],
  );

  const handleChange = useCallback(
    (nextValues: string[]) => {
      onChange(nextValues.filter((value) => isValidEnumValue(allowedEnum, value)));
    },
    [allowedEnum, onChange],
  );

  return (
    <ControlledFilterEnumChoice
      className={FILTER_OVERFLOW_CLASS_NAME}
      label={label}
      multiple={multiple}
      selectedOptions={selectedOptions}
      options={options}
      formatOption={formatOption}
      onChange={handleChange}
    />
  );
};

export default ClientSessionBrowserRaqiEnumFilterField;
