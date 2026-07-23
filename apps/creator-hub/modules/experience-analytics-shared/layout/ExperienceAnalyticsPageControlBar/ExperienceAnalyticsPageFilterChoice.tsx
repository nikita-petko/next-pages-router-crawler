import React, { useCallback, FC, useMemo } from 'react';
import {
  FilterDrawerTextChoice,
  FilterDrawerEnumChoice,
  DebouncedTextField,
  FilterStringChoice,
  BlankHandlingType,
} from '@modules/charts-generic';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import getDimensionRenderer from '../../components/getDimensionRenderer';
import {
  EnumFilterDimensionConfigV2,
  FilterDimensionConfigV1,
  getRAQIFilterConfig,
  LegacyFilterDimensionConfigs,
  OptionType,
  raqiSupportedFilterBarDimensions,
} from '../../constants/FilterDimensionConfig';

import filterPositionOnPageByDimension from '../../utils/filterPositionOnPageByDimension';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import legacyFiltersToRAQIV2 from '../../adapters/legacyFiltersToRAQIV2';
import FilterPlaceVersionChoiceWrapper from './ExperienceAnalyticsPageFilterPlaceVersionChoiceWrapper';
import { NonRAQIUIDimension } from './filterUtils';
import ExperienceAnalyticsPageFilterChoiceProps from './ExperienceAnalyticsPageFilterChoiceProps';
import ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2 from './ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2';
import RAQIV2FilterRenderPosition from '../../types/RAQIV2FilterRenderPosition';

type ExperienceAnalyticsPageFilterChoiceV1Props = ExperienceAnalyticsPageFilterChoiceProps & {
  config: FilterDimensionConfigV1;
};
type ExperienceAnalyticsPageFilterChoiceV2Props<TEnum extends string> =
  ExperienceAnalyticsPageFilterChoiceProps & {
    config: EnumFilterDimensionConfigV2<TEnum>;
  };

const ExperienceAnalyticsPageFilterChoiceV1: FC<ExperienceAnalyticsPageFilterChoiceV1Props> = ({
  filterBarDimension,
  uiFilters,
  onUIFilterValueChange,
  config,
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
      onUIFilterValueChange([value], NonRAQIUIDimension.Text);
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
          <DebouncedTextField
            id='keywordSearchFilter'
            data-testid='filter-drawer-arbitrary-text-field'
            debounceTime={300}
            size='small'
            value={filter?.values.length ? filter.values[0] : ''}
            onDebouncedChange={textFieldOnChange}
            label={name}
          />
        );
      }
      return null;
    }
    default: {
      const exhaustiveCheck: never = optionType;
      throw new Error(`Unhandled option type ${exhaustiveCheck}`);
    }
  }
};

function ExperienceAnalyticsPageFilterChoiceV2<TEnum extends string>({
  uiFilters,
  onUIFilterValueChange,
  filterBarDimension,
  config: { raqiDimension, enumOptions, optionOrder, multiple, blankOption },
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

  switch (position) {
    case RAQIV2FilterRenderPosition.FilterDrawer:
      return (
        <FilterDrawerEnumChoice
          key={filterBarDimension}
          name={name}
          description={description}
          enumOptions={enumOptions}
          initial={(filter?.values ?? []) as TEnum[]}
          optionOrder={optionOrder}
          formatOption={formatOption}
          onChangeSubmit={onChangeSubmit}
          overrideSignal={(filter?.values ?? []) as TEnum[]}
          multiple={multiple}
          blankOption={blankOption}
        />
      );
    case RAQIV2FilterRenderPosition.PreControl:
    case RAQIV2FilterRenderPosition.Controls:
    case RAQIV2FilterRenderPosition.ControlsRight:
      /**
       * We never show checkboxes in the control bar,
       * so we shouldn't use EnumChoice which can become either a dropdown or checkboxes.
       */
      return (
        <FilterStringChoice
          key={filterBarDimension}
          label={name}
          onChange={onChangeSubmit}
          selectedOptions={(filter?.values ?? []) as TEnum[]}
          options={enumOptions}
          formatOption={formatOption}
          blankHandling={blankHandling}
          multiple={multiple}
        />
      );
    default: {
      const exhaustiveCheck: never = position;
      throw new Error(`Unhandled filter position ${exhaustiveCheck}`);
    }
  }
}

const ExperienceAnalyticsPageFilterChoice: FC<ExperienceAnalyticsPageFilterChoiceProps> = (
  props: ExperienceAnalyticsPageFilterChoiceProps,
) => {
  const { filterBarDimension } = props;
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
        throw new Error(`Unhandled hero card category ${exhaustiveCheck}`);
      }
    }
  }

  const config = LegacyFilterDimensionConfigs[filterBarDimension];
  return <ExperienceAnalyticsPageFilterChoiceV1 {...props} config={config} />;
};

export default ExperienceAnalyticsPageFilterChoice;
