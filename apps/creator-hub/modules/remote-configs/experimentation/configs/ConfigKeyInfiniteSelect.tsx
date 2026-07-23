import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Autocomplete, makeStyles, CircularProgress } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import DebouncedTextField from '@modules/charts-generic/charts/DebouncedTextField';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { SortKey, SortOrder } from '../../api/universeConfigsClientEnums';
import type { ValidConfigEntryDetail } from '../../api/validTypes';
import { useLatestConfigurations } from '../../hooks/useLatestConfigurations';
import { configEntryToBestEntryValue, configEntryToKey } from '../../utils/configEntryAccessors';
import type { ConfigurationStepFormDataInExperience } from '../types/FormData';

type ConfigKeyInfiniteSelectRenderProps = {
  label: string;
  error?: boolean;
  helperText?: React.ReactNode;
  fullWidth?: boolean;
};

const LOADING_OPTION_KEY = '__loading__' as const;

type MenuItemType = NonNullable<ConfigurationStepFormDataInExperience['chosenConfig']>;
type LoadingOptionType = { key: typeof LOADING_OPTION_KEY; valueType: 'loading' };
type OptionType = MenuItemType | LoadingOptionType;

const filterConfigDetailsToMenuItem = (details: ValidConfigEntryDetail[]): MenuItemType[] => {
  const filteredItems: Array<MenuItemType> = [];
  details.forEach((detail) => {
    const entryValue = configEntryToBestEntryValue(detail);
    if (entryValue?.valueType) {
      filteredItems.push({
        key: configEntryToKey(detail),
        valueType: entryValue.valueType,
      });
    }
  });
  return filteredItems;
};

const useStyles = makeStyles()(() => ({
  loadingOption: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
  },
}));

const useConfigKeyInfiniteSelect = () => {
  const {
    classes: { loadingOption },
  } = useStyles();
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const { translate } = useTranslationWrapper(useTranslation());

  // State for search query
  const [searchKey, setSearchKey] = useState<string>('');

  const {
    isLoading,
    entries: allConfigEntries,
    refetch,
  } = useLatestConfigurations({
    searchKey,
    sortKey: SortKey.LastModifiedTime,
    sortOrder: SortOrder.Descending,
    universeId,
    isUniverseLoading,
  });

  const guardedRefetch = useCallback(() => {
    // If already refreshing, skip this call
    if (isLoading) {
      return;
    }
    refetch();
  }, [refetch, isLoading]);

  // refetch when doc is visible again
  useEffect(() => {
    window.addEventListener('focus', guardedRefetch);
    document.addEventListener('visibilitychange', guardedRefetch);

    return () => {
      window.addEventListener('focus', guardedRefetch);
      document.removeEventListener('visibilitychange', guardedRefetch);
    };
  }, [guardedRefetch]);

  // Convert to menu items
  const accumulatedEntries = useMemo(() => {
    return filterConfigDetailsToMenuItem(allConfigEntries);
  }, [allConfigEntries]);

  // Handle debounced search changes
  const onDebouncedSearchChange = useCallback((searchValue: string) => {
    setSearchKey(searchValue);
  }, []);

  const getOptionLabel = useCallback((option: OptionType) => {
    return option.key === LOADING_OPTION_KEY ? '' : option.key;
  }, []);

  // Custom filter to prevent Autocomplete from filtering the options
  // since we handle filtering on the server side
  const filterOptions = useCallback((options: OptionType[]) => options, []);

  // Disable loading option so it can't be selected
  const getOptionDisabled = useCallback((option: OptionType) => {
    return option.key === LOADING_OPTION_KEY;
  }, []);

  // Custom render for options including loading indicator
  const renderOption = useCallback(
    (props: React.HTMLAttributes<HTMLLIElement>, option: OptionType) => {
      if (option.key === LOADING_OPTION_KEY) {
        return (
          <li {...props} key={option.key} className={loadingOption}>
            <CircularProgress size={18} />
          </li>
        );
      }
      return (
        <li {...props} key={option.key}>
          {option.key}
        </li>
      );
    },
    [loadingOption],
  );

  // Determine what to show when there are no options
  const getNoOptionsText = useCallback(() => {
    if (isLoading) {
      return translate(
        translationKey(
          'ConfigKeySelect.Loading',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    }
    return translate(
      translationKey(
        'ConfigKeySelect.NoOptions',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    );
  }, [isLoading, translate]);

  // Show loading state when loading initial data
  const showLoading = isLoading && accumulatedEntries.length === 0;

  // Return memoized render function that accepts field and props
  const renderConfigSelect = useCallback(
    (
      field: ControllerRenderProps<ConfigurationStepFormDataInExperience, 'chosenConfig'>,
      props: ConfigKeyInfiniteSelectRenderProps,
      ref?: React.Ref<HTMLDivElement>,
    ) => {
      // Create local handlers that use the field
      const localOnChange = (event: React.SyntheticEvent, selectedValue: OptionType | null) => {
        // Don't allow selection of loading option
        if (selectedValue && selectedValue.key === LOADING_OPTION_KEY) {
          return;
        }

        const actualValue = selectedValue as MenuItemType | null;
        field.onChange(actualValue);
      };

      const localRenderInput = (
        params: Parameters<
          NonNullable<React.ComponentProps<typeof Autocomplete>['renderInput']>
        >[0],
      ) => (
        <DebouncedTextField
          {...params}
          label={props.label}
          error={props.error}
          helperText={props.helperText}
          fullWidth={props.fullWidth}
          value={field.value?.key || ''}
          onDebouncedChange={onDebouncedSearchChange}
          debounceTime={150}
        />
      );

      return (
        <Autocomplete
          ref={ref}
          value={field.value}
          options={accumulatedEntries}
          getOptionLabel={getOptionLabel}
          filterOptions={filterOptions}
          onChange={localOnChange}
          renderInput={localRenderInput}
          getOptionDisabled={getOptionDisabled}
          renderOption={renderOption}
          data-testid='config-key-select'
          ListboxProps={{
            style: {
              maxHeight: '400px',
              padding: 0,
              overflow: 'auto',
            },
          }}
          loading={showLoading}
          loadingText={
            <div className={loadingOption}>
              <CircularProgress size={18} />
              <span style={{ marginLeft: '8px' }}>
                {translate(
                  translationKey(
                    'ConfigKeySelect.Loading',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
              </span>
            </div>
          }
          noOptionsText={getNoOptionsText()}
          freeSolo={false}
          autoComplete
          autoHighlight
          openOnFocus
        />
      );
    },
    [
      accumulatedEntries,
      getOptionLabel,
      filterOptions,
      getOptionDisabled,
      renderOption,
      onDebouncedSearchChange,
      showLoading,
      loadingOption,
      translate,
      getNoOptionsText,
    ],
  );

  return { renderConfigSelect };
};

export default useConfigKeyInfiniteSelect;
