import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import FilterDrawerEnumChoice from '@modules/charts-generic/components/FilterDrawer/FilterDrawerEnumChoice';
import FilterDrawerTextChoice from '@modules/charts-generic/components/FilterDrawer/FilterDrawerTextChoice';
import FilterStringChoice, {
  BlankHandlingType,
} from '@modules/charts-generic/components/FilterStringChoice';
import FoundationDebouncedTextInput from '@modules/charts-generic/components/FoundationDebouncedTextInput';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import legacyFiltersToRAQIV2 from '../../adapters/legacyFiltersToRAQIV2';
import getDimensionRenderer from '../../components/getDimensionRenderer';
import type {
  EnumFilterDimensionConfigV2,
  FilterDimensionConfigV1,
} from '../../constants/FilterDimensionConfig';
import {
  getRAQIFilterConfig,
  LegacyFilterDimensionConfigs,
  OptionType,
  raqiSupportedFilterBarDimensions,
} from '../../constants/FilterDimensionConfig';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import RAQIV2FilterRenderPosition from '../../types/RAQIV2FilterRenderPosition';
import filterPositionOnPageByDimension from '../../utils/filterPositionOnPageByDimension';
import ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2 from './ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2';
import type ExperienceAnalyticsPageFilterChoiceProps from './ExperienceAnalyticsPageFilterChoiceProps';
import FilterPlaceVersionChoiceWrapper from './ExperienceAnalyticsPageFilterPlaceVersionChoiceWrapper';
import { NonRAQIUIDimension } from './filterUtils';

// Delay between the last keystroke and firing the filter change.
const KEYWORD_FILTER_DEBOUNCE_MS = 300;

type ExperienceAnalyticsPageFilterChoiceV1Props = ExperienceAnalyticsPageFilterChoiceProps & {
  config: FilterDimensionConfigV1;
};
type ExperienceAnalyticsPageFilterChoiceV2Props<TEnum extends string> =
  ExperienceAnalyticsPageFilterChoiceProps & {
    config: EnumFilterDimensionConfigV2<TEnum>;
  };

const ExperienceAnalyticsPageFilterKeywordChoice: FC<ExperienceAnalyticsPageFilterChoiceProps> = ({
  filterBarDimension,
  uiFilters,
  onUIFilterValueChange,
  className,
}) => {
  const dimensionNameKey = LegacyFilterDimensionConfigs[NonRAQIUIDimension.Text].dimensionNameKey;
  const translationDependencies = useRAQIV2TranslationDependencies();
  const name = useMemo(() => {
    const { translate } = translationDependencies;
    return translate(dimensionNameKey);
  }, [dimensionNameKey, translationDependencies]);

  const filter = uiFilters.find((f) => f.dimension === filterBarDimension);
  const renderFilterInDrawer =
    filterPositionOnPageByDimension(filterBarDimension) === RAQIV2FilterRenderPosition.FilterDrawer;

  const textFieldOnChange = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      onUIFilterValueChange(trimmed ? [trimmed] : null, filterBarDimension);
    },
    [filterBarDimension, onUIFilterValueChange],
  );

  const onDrawerChangeSubmit = useCallback(
    (given: Array<string>) => {
      const keyword = given[0]?.trim();
      onUIFilterValueChange(keyword ? [keyword] : null, filterBarDimension);
    },
    [filterBarDimension, onUIFilterValueChange],
  );

  if (renderFilterInDrawer) {
    return (
      <FilterDrawerTextChoice
        key={filterBarDimension}
        name={name}
        initial={filter?.values.length ? filter.values[0] : ''}
        onChangeSubmit={onDrawerChangeSubmit}
      />
    );
  }

  return (
    <FoundationDebouncedTextInput
      id='raqiKeywordSearchFilter'
      data-testid='filter-keyword-text-field'
      debounceTime={KEYWORD_FILTER_DEBOUNCE_MS}
      size='Medium'
      value={filter?.values.length ? filter.values[0] : ''}
      onDebouncedChange={textFieldOnChange}
      label={name}
      className={className}
    />
  );
};

const ExperienceAnalyticsPageFilterChoiceV1: FC<ExperienceAnalyticsPageFilterChoiceV1Props> = ({
  filterBarDimension,
  uiFilters,
  onUIFilterValueChange,
  config,
  className,
}: ExperienceAnalyticsPageFilterChoiceV1Props) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { dimensionNameKey, optionType } = config;
  const name = translate(dimensionNameKey);
  const filter = uiFilters.find((f) => f.dimension === filterBarDimension);

  const onChangeSubmit = useCallback(
    (given: Array<string>) => {
      const value = given.length === 1 && given[0] === config.blankOption ? null : given;
      onUIFilterValueChange(value, filterBarDimension);
    },
    [config.blankOption, filterBarDimension, onUIFilterValueChange],
  );

  const textFieldOnChange = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      onUIFilterValueChange(trimmed ? [trimmed] : null, NonRAQIUIDimension.Text);
    },
    [onUIFilterValueChange],
  );

  const renderFilterInDrawer =
    filterPositionOnPageByDimension(filterBarDimension) === RAQIV2FilterRenderPosition.FilterDrawer;

  switch (optionType) {
    case OptionType.Legacy: {
      if (filterBarDimension === NonRAQIUIDimension.Version) {
        return (
          <FilterPlaceVersionChoiceWrapper
            key={filterBarDimension}
            filter={filter}
            onChangeSubmit={onChangeSubmit}
            renderFilterInDrawer={renderFilterInDrawer}
            className={className}
          />
        );
      }
      if (filterBarDimension === NonRAQIUIDimension.Text) {
        return renderFilterInDrawer ? (
          <FilterDrawerTextChoice
            key={filterBarDimension}
            name={name}
            initial={filter?.values.length ? filter.values[0] : ''}
            onChangeSubmit={onChangeSubmit}
          />
        ) : (
          <FoundationDebouncedTextInput
            id='keywordSearchFilter'
            data-testid='filter-drawer-arbitrary-text-field'
            debounceTime={KEYWORD_FILTER_DEBOUNCE_MS}
            size='Medium'
            value={filter?.values.length ? filter.values[0] : ''}
            onDebouncedChange={textFieldOnChange}
            label={name}
            className={className}
          />
        );
      }
      return null;
    }
    default: {
      const exhaustiveCheck: never = optionType;
      throw new Error(`Unhandled option type ${String(exhaustiveCheck)}`);
    }
  }
};

function ExperienceAnalyticsPageFilterChoiceV2<TEnum extends string>({
  uiFilters,
  onUIFilterValueChange,
  filterBarDimension,
  config: { raqiDimension, enumOptions, optionOrder, multiple, blankOption },
  className,
}: ExperienceAnalyticsPageFilterChoiceV2Props<TEnum>) {
  const filter = useMemo(() => {
    const filtersV2 = legacyFiltersToRAQIV2(uiFilters);
    return filtersV2.find((f) => f.dimension === raqiDimension);
  }, [uiFilters, raqiDimension]);
  const onChangeSubmit = useCallback(
    (value: Array<TEnum>) => onUIFilterValueChange(value, filterBarDimension),
    [filterBarDimension, onUIFilterValueChange],
  );
  const {
    name: dimensionNameKey,
    getBreakdownDescription,
    getBreakdownValueName,
    renderEmpty,
  } = getDimensionRenderer(raqiDimension);
  const translationDependencies = useRAQIV2TranslationDependencies();
  const name = useMemo(() => {
    const { translate } = translationDependencies;
    return translate(dimensionNameKey);
  }, [dimensionNameKey, translationDependencies]);
  const description = useMemo(() => {
    return getBreakdownDescription?.(translationDependencies);
  }, [getBreakdownDescription, translationDependencies]);

  const position = filterPositionOnPageByDimension(filterBarDimension);
  const formatOption = useCallback(
    (option: TEnum) => getBreakdownValueName({ value: option }, translationDependencies),
    [getBreakdownValueName, translationDependencies],
  );
  const blankValue = useMemo(() => {
    return renderEmpty && renderEmpty(translationDependencies);
  }, [renderEmpty, translationDependencies]);
  const blankHandling = useMemo(() => {
    if (blankValue) {
      return { type: BlankHandlingType.Value as const, value: blankValue };
    }
    if (blankOption) {
      return { type: BlankHandlingType.Option as const, option: blankOption };
    }
    return undefined;
  }, [blankOption, blankValue]);

  // `filter?.values` is typed broadly (string-union across all RAQI
  // dimensions) but, at this call site, the surrounding filter is
  // constrained to `TEnum` by `raqiDimension`. Use the `isValidArrayEnumValue`
  // type guard to runtime-narrow rather than cast through `as TEnum[]`, which
  // oxlint's `no-unsafe-type-assertion` (rightly) flags as widening-to-narrow.
  // Defensive filtering also drops any stale persisted values that no longer
  // appear in `enumOptions`.
  const selectedValues = useMemo<TEnum[]>(() => {
    const rawValues = filter?.values ?? [];
    return rawValues.filter((v): v is TEnum => isValidArrayEnumValue(enumOptions, v));
  }, [enumOptions, filter?.values]);

  switch (position) {
    case RAQIV2FilterRenderPosition.FilterDrawer:
      return (
        <FilterDrawerEnumChoice
          key={filterBarDimension}
          name={name}
          description={description}
          enumOptions={enumOptions}
          initial={selectedValues}
          optionOrder={optionOrder}
          formatOption={formatOption}
          onChangeSubmit={onChangeSubmit}
          overrideSignal={selectedValues}
          multiple={multiple}
          blankOption={blankOption}
        />
      );
    case RAQIV2FilterRenderPosition.PreControl:
    case RAQIV2FilterRenderPosition.Controls:
    case RAQIV2FilterRenderPosition.ControlsRight:
    case RAQIV2FilterRenderPosition.ControlsRow2:
      /**
       * We never show checkboxes in the control bar,
       * so we shouldn't use EnumChoice which can become either a dropdown or checkboxes.
       */
      return (
        <FilterStringChoice
          key={filterBarDimension}
          label={name}
          onChange={onChangeSubmit}
          selectedOptions={selectedValues}
          options={enumOptions}
          formatOption={formatOption}
          blankHandling={blankHandling}
          multiple={multiple}
          className={className}
        />
      );
    default: {
      const exhaustiveCheck: never = position;
      throw new Error(`Unhandled filter position ${String(exhaustiveCheck)}`);
    }
  }
}

const ExperienceAnalyticsPageFilterChoice: FC<ExperienceAnalyticsPageFilterChoiceProps> = (
  props: ExperienceAnalyticsPageFilterChoiceProps,
) => {
  const { filterBarDimension } = props;
  if (filterBarDimension === RAQIV2Dimension.Keyword) {
    return <ExperienceAnalyticsPageFilterKeywordChoice {...props} />;
  }

  if (isValidArrayEnumValue(raqiSupportedFilterBarDimensions, filterBarDimension)) {
    const config = getRAQIFilterConfig(filterBarDimension);
    const { optionType } = config;
    switch (optionType) {
      case OptionType.RAQIV2StaticEnum:
        return <ExperienceAnalyticsPageFilterChoiceV2 {...props} config={config} />;
      case OptionType.RAQIV2DynamicEnum:
        return <ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2 {...props} config={config} />;
      default: {
        const exhaustiveCheck: never = optionType;
        throw new Error(`Unhandled option type ${String(exhaustiveCheck)}`);
      }
    }
  }

  const config = LegacyFilterDimensionConfigs[filterBarDimension];
  return <ExperienceAnalyticsPageFilterChoiceV1 {...props} config={config} />;
};

export default ExperienceAnalyticsPageFilterChoice;
