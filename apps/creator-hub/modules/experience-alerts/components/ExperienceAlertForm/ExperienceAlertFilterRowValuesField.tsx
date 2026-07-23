import { FC } from 'react';
import { Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  FoundationLikeMenu as MultiSelectMenu,
  FoundationLikeMenuItem as MultiSelectMenuItem,
  FoundationLikeMultiSelect,
} from '@modules/charts-generic';
import { RAQIV2ChartResource } from '@modules/clients/analytics';
import {
  useRAQIV2DimensionChoiceRenderBundle,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import type { TRAQIV2APIMetric, TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { isPseudoAlertDimension } from '../../constants/alertFormConstants';

const NS = TranslationNamespace.ExperienceAlerts;

type FilterRowValuesLoadedProps = {
  resource: RAQIV2ChartResource;
  dimension: TRAQIV2Dimension;
  contextMetrics: TRAQIV2APIMetric[];
  value: string[];
  onChange: (next: string[]) => void;
  onBlur: () => void;
  multiple: boolean;
  hasError: boolean;
  hint?: string;
};

/** Renders multi/single value UI once a filter dimension is chosen; owns {@link useRAQIV2DimensionChoiceRenderBundle}. */
const FilterRowValuesLoaded: FC<FilterRowValuesLoadedProps> = ({
  resource,
  dimension,
  contextMetrics,
  value,
  onChange,
  onBlur,
  multiple,
  hasError,
  hint,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { enumOptions, isDataLoading, formatOption } = useRAQIV2DimensionChoiceRenderBundle(
    resource,
    dimension,
    contextMetrics,
  );

  const placeholderValues = translate(translationKey('Placeholder.SelectCategories', NS));

  const isChoiceDisabled = isDataLoading || enumOptions.length === 0;

  if (multiple) {
    const formatValue = (selected: string[]) =>
      selected.length === 0 ? '' : selected.map((v) => formatOption(v)).join(', ');

    return (
      <FoundationLikeMultiSelect
        size='Medium'
        placeholder={placeholderValues}
        value={value}
        onValueChange={onChange}
        onOpenChange={(open) => {
          if (!open) onBlur();
        }}
        isDisabled={isChoiceDisabled}
        hasError={hasError}
        hint={hint}
        formatValue={formatValue}>
        <MultiSelectMenu>
          {enumOptions.map((opt) => (
            <MultiSelectMenuItem key={opt} value={opt} title={formatOption(opt)} />
          ))}
        </MultiSelectMenu>
      </FoundationLikeMultiSelect>
    );
  }

  const singleValue = value[0];
  const dropdownValue = singleValue && enumOptions.includes(singleValue) ? singleValue : undefined;

  return (
    <Dropdown
      size='Medium'
      placeholder={placeholderValues}
      value={dropdownValue}
      isDisabled={isChoiceDisabled}
      hasError={hasError}
      hint={hint}
      onOpenChange={(open) => {
        if (!open) onBlur();
      }}
      onValueChange={(v) => {
        onChange([v]);
        onBlur();
      }}>
      <Menu>
        {enumOptions.map((opt) => (
          <MenuItem key={opt} value={opt} title={String(formatOption(opt))} />
        ))}
      </Menu>
    </Dropdown>
  );
};

export type ExperienceAlertFilterRowValuesCellProps = {
  hasMetric: boolean;
  dimension: TRAQIV2Dimension | '';
  value: string[];
  onChange: (next: string[]) => void;
  onBlur: () => void;
  resource: RAQIV2ChartResource;
  contextMetrics: TRAQIV2APIMetric[];
  hasError: boolean;
  hint?: string;
};

/**
 * Disabled placeholders when metric/dimension are missing; otherwise {@link FilterRowValuesLoaded}.
 * Split so the dimension bundle hook only runs with a real `TRAQIV2Dimension` (Rules of Hooks).
 */
export const ExperienceAlertFilterRowValuesCell: FC<ExperienceAlertFilterRowValuesCellProps> = ({
  hasMetric,
  dimension,
  value,
  onChange,
  onBlur,
  resource,
  contextMetrics,
  hasError,
  hint,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  if (!hasMetric || !dimension) {
    const placeholderKey = !hasMetric
      ? 'Placeholder.SelectMetricFirst'
      : 'Placeholder.SelectFilterDimensionFirst';
    return (
      <Dropdown
        size='Medium'
        isDisabled
        placeholder={String(translate(translationKey(placeholderKey, NS)))}
        value={undefined}>
        <Menu>{null}</Menu>
      </Dropdown>
    );
  }

  return (
    <FilterRowValuesLoaded
      resource={resource}
      dimension={dimension}
      contextMetrics={contextMetrics}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      multiple={!isPseudoAlertDimension(dimension)}
      hasError={hasError}
      hint={hint}
    />
  );
};
