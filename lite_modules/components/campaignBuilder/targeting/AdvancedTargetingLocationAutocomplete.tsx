import { Autocomplete, FormControl, TextField, Tooltip } from '@rbx/ui';
import { useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useAdvancedTargetingLocationAutocompleteStyles from '@components/campaignBuilder/targeting/AdvancedTargetingLocationAutocomplete.styles';
import LocationAutocompleteExpandingSelectionRow from '@components/campaignBuilder/targeting/LocationAutocompleteExpandingSelectionRow';
import { FormField } from '@constants/advancedTargeting';
import { FlowTypes, FORM_HELPER_TEXT_PROPS, INPUT_LABEL_PROPS } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import { allNonEULocationsObj, RowType } from '@constants/locationAutocomplete';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import useLocalizedLocations from '@hooks/useLocalizedLocations';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { LocationTargetingType, RegionsAndLocationsFormInputObj } from '@type/locationAutocomplete';
import { AwaitErrorsThenMaybeGetAudienceEstimate } from '@utils/advancedTargeting';
import { GetEditTooltipTitle } from '@utils/campaignBuilder';
import {
  CalculateLocationsTargetingAfterToggle,
  GetCheckboxState,
  GetFlattenedLocationOptions,
  IncludesEUCountry,
} from '@utils/locationAutocomplete';

const getRowType = (locationInfo: RegionsAndLocationsFormInputObj) => {
  if (locationInfo.superGroup) {
    return RowType.SUPER_GROUP;
  }
  if (locationInfo.parentRegion) {
    return RowType.REGION;
  }
  return RowType.COUNTRY;
};

const getLocationKey = (option: RegionsAndLocationsFormInputObj) => {
  const kind = option.parentRegion || option.superGroup ? 'R' : 'C';
  return `${kind}:${option.regionCode}:${option.countryCode || ''}:${option.value}`;
};

const LocationAutocomplete = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const [regionInputSearchText, setRegionInputSearchText] = useState<string>('');
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  const { control, getValues, trigger } = useFormContext<AdvancedTargetingFormType>();
  const { flowType, getAudienceEstimate } = useCampaignBuilderStore();
  const editMode = flowType === FlowTypes.EDIT;
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );

  const getExpandedState = (locationInfo: RegionsAndLocationsFormInputObj) => {
    if (expandedRegions[locationInfo.regionCode]) {
      return true;
    }
    return false;
  };

  const toggleExpandedState = (locationInfo: RegionsAndLocationsFormInputObj) => {
    const newExpandedRegions = { ...expandedRegions };
    if (expandedRegions[locationInfo.regionCode]) {
      delete newExpandedRegions[locationInfo.regionCode];
      setExpandedRegions(newExpandedRegions);
    } else {
      newExpandedRegions[locationInfo.regionCode] = true;
      setExpandedRegions(newExpandedRegions);
    }
  };

  const {
    classes: { autocompleteBox, inputBaseRootOverride },
  } = useAdvancedTargetingLocationAutocompleteStyles();

  const EURegionCodeList = useAppStore((state) => state.appMetadataState?.data?.EURegionCodeList);
  const localizedLocations = useLocalizedLocations();
  const regionsAndCountriesSortedAlph = useMemo(
    () =>
      localizedLocations.filter((region) => region.regionCode !== allNonEULocationsObj.regionCode),
    [localizedLocations],
  );
  const localizedTitleByKey = useMemo(() => {
    const map = new Map<string, string>();
    localizedLocations.forEach((option) => {
      if (option.title) {
        map.set(getLocationKey(option), option.title);
      }
    });
    return map;
  }, [localizedLocations]);

  return (
    <Controller
      control={control}
      name={FormField.LOCATIONS}
      render={({ field: { onChange, value, ...rest }, fieldState: { error } }) => {
        const onToggleAttempt = (newValue: RegionsAndLocationsFormInputObj | string): void => {
          if (typeof newValue === 'string') {
            // This is a special case where the user hits enter after typing text
            return;
          }
          const targetingAfterToggle: LocationTargetingType =
            CalculateLocationsTargetingAfterToggle({
              newValue,
              previousValues: value,
            });
          targetingAfterToggle.includesEUCountry = IncludesEUCountry(
            targetingAfterToggle,
            EURegionCodeList,
          );
          setTimeout(() => {
            onChange(targetingAfterToggle);
            logNativeClickEvent(EventName.AudienceTargetingFieldChanged, {
              field: FormField.LOCATIONS,
              newValue: JSON.stringify(targetingAfterToggle),
              previousValue: JSON.stringify(value),
            });
            AwaitErrorsThenMaybeGetAudienceEstimate({
              formField: FormField.LOCATIONS,
              getAudienceEstimate,
              getValues,
              newSelectedOptions: targetingAfterToggle,
              trigger,
            });
          }, 100);
        };

        return (
          <Tooltip
            placement='top-start'
            title={translate(GetEditTooltipTitle({ campaignStatus, editable: false, flowType }))}>
            <Autocomplete
              {...rest}
              classes={{
                inputRoot: autocompleteBox,
                root: inputBaseRootOverride,
              }}
              data-testid='advancedTargetingLocationAutocomplete'
              disableCloseOnSelect
              disabled={editMode}
              // Render the dropdown inside the Sheet (Radix Dialog) rather than
              // portaling to <body>, which is inert while the Sheet is open and
              // would treat a dropdown click as an outside dismiss.
              disablePortal
              filterOptions={(options, state) => {
                const { inputValue } = state;
                if (inputValue) {
                  return (options || []).filter(({ title }) => {
                    const regionContainsSearchText = (title || '')
                      .toLowerCase()
                      .includes(regionInputSearchText.toLowerCase());
                    return regionContainsSearchText;
                  });
                }
                return (options || []).filter(
                  ({ parentRegion, regionCode, superGroup }) =>
                    parentRegion || superGroup || expandedRegions[regionCode],
                );
              }}
              freeSolo
              getOptionLabel={(option) => {
                if (typeof option === 'string') {
                  return option;
                }
                if (!option) {
                  return '';
                }
                return localizedTitleByKey.get(getLocationKey(option)) || option.title || '';
              }}
              isOptionEqualToValue={(option, val) => option?.value === val?.value}
              limitTags={15}
              multiple
              onChange={(_event, _newFlatLocationValues, action, optionToRemove) => {
                if (action === 'clear') {
                  onChange({
                    countries: [],
                    regions: [],
                  });
                  AwaitErrorsThenMaybeGetAudienceEstimate({
                    formField: FormField.LOCATIONS,
                    getAudienceEstimate,
                    getValues,
                    newSelectedOptions: {
                      countries: [],
                      regions: [],
                    },
                    trigger,
                  });
                }
                if (optionToRemove) {
                  onToggleAttempt(optionToRemove.option);
                }
              }}
              onInputChange={(_ev, newVal) => {
                if (!_ev) {
                  return;
                }
                setRegionInputSearchText(newVal);
              }}
              options={regionsAndCountriesSortedAlph}
              renderInput={(params) => (
                <FormControl error={!!error} variant='outlined' {...params}>
                  <TextField
                    {...params}
                    error={!!error}
                    FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                    helperText={error?.message}
                    InputLabelProps={INPUT_LABEL_PROPS}
                    label={translate('Label.Locations')}
                    name='locations'
                  />
                </FormControl>
              )}
              renderOption={(_el, option) => (
                <LocationAutocompleteExpandingSelectionRow
                  carrotExpanded={getExpandedState(option)}
                  checkboxState={GetCheckboxState(value, option)}
                  locationInfo={option}
                  onCarrotClick={toggleExpandedState}
                  onRowToggle={() => {
                    onToggleAttempt(option);
                  }}
                  rowType={getRowType(option)}
                  showTooltipOnhover={false}
                />
              )}
              value={GetFlattenedLocationOptions(value)}
            />
          </Tooltip>
        );
      }}
    />
  );
};

export default LocationAutocomplete;
