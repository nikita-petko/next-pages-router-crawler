import { Autocomplete, AutocompleteOption } from '@rbx/foundation-ui';
import { useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import {
  LocationExpandToggle,
  LocationSelectionCheckbox,
} from '@components/campaignBuilder/targeting/LocationAutocompleteExpandingSelectionRow';
import AppTooltip from '@components/common/AppTooltip';
import { FormField } from '@constants/advancedTargeting';
import { FlowTypes } from '@constants/campaignBuilder';
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
  GetRegionToCountryMap,
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

// Region and country `value`s overlap (for example Africa and Armenia are both 16), so the
// Foundation option value has to encode the row kind as well to stay unique.
const getLocationKey = (option: RegionsAndLocationsFormInputObj) => {
  const kind = option.parentRegion || option.superGroup ? 'R' : 'C';
  return `${kind}:${option.regionCode}:${option.countryCode || ''}:${option.value}`;
};

const LocationAutocomplete = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const [inputValue, setInputValue] = useState<string>('');
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

  const EURegionCodeList = useAppStore((state) => state.appMetadataState?.data?.EURegionCodeList);
  const localizedLocations = useLocalizedLocations();
  const regionsAndCountriesSortedAlph = useMemo(
    () =>
      localizedLocations.filter((region) => region.regionCode !== allNonEULocationsObj.regionCode),
    [localizedLocations],
  );
  const localizedLocationByKey = useMemo(() => {
    const map = new Map<string, RegionsAndLocationsFormInputObj>();
    localizedLocations.forEach((option) => {
      map.set(getLocationKey(option), option);
    });
    return map;
  }, [localizedLocations]);

  // MUI ran this through `filterOptions`; Foundation expects the caller to render the
  // rows it wants visible. With no query the list is gated to regions plus the countries
  // of whichever regions the user has expanded.
  const query = inputValue.trim().toLocaleLowerCase();
  const visibleOptions = query
    ? regionsAndCountriesSortedAlph.filter(({ title }) =>
        (title || '').toLocaleLowerCase().includes(query),
      )
    : regionsAndCountriesSortedAlph.filter(
        ({ parentRegion, regionCode, superGroup }) =>
          parentRegion || superGroup || expandedRegions[regionCode],
      );
  const visibleKeys = new Set(visibleOptions.map(getLocationKey));

  return (
    <Controller
      control={control}
      name={FormField.LOCATIONS}
      render={({ field: { onChange, value, ...rest }, fieldState: { error } }) => {
        const selectedLocations = GetFlattenedLocationOptions(value);
        const selectedKeys = selectedLocations.map(getLocationKey);
        // Foundation reads multi-select chip text from the `title` of the options it is
        // currently rendering, so selected countries whose region is collapsed are
        // rendered hidden purely to supply their label.
        const unlistedSelectedLocations = selectedLocations.filter(
          (option) => !visibleKeys.has(getLocationKey(option)),
        );

        const onToggleAttempt = (newValue: RegionsAndLocationsFormInputObj): void => {
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
          <AppTooltip
            title={translate(GetEditTooltipTitle({ campaignStatus, editable: false, flowType }))}>
            <div>
              <Autocomplete
                {...rest}
                // `multiSelectLayout='Expand'` makes the field `width-fit`, which would
                // collapse it while nothing is selected inside the drawer's stretch column.
                className='width-full'
                data-testid='advancedTargetingLocationAutocomplete'
                error={error?.message}
                hasError={!!error}
                inputValue={inputValue}
                isDisabled={editMode}
                label={translate('Label.Locations')}
                multiple
                multiSelectLayout='Expand'
                onInputValueChange={setInputValue}
                onValueChange={(nextValues) => {
                  // Foundation reports the whole next selection, but the location
                  // targeting model is driven one row at a time: a click adds a key and
                  // removing a chip drops one, so the difference identifies the row.
                  const toggledKey =
                    nextValues.find((nextValue) => !selectedKeys.includes(nextValue)) ??
                    selectedKeys.find((selectedKey) => !nextValues.includes(selectedKey));
                  // Match MUI, which reset the query after each selection.
                  setInputValue('');
                  if (!toggledKey) {
                    return;
                  }
                  const toggledLocation = localizedLocationByKey.get(toggledKey);
                  if (toggledLocation) {
                    onToggleAttempt(toggledLocation);
                  }
                }}
                size='Medium'
                value={selectedKeys}>
                {visibleOptions.map((option) => {
                  const locationKey = getLocationKey(option);
                  const isExpandable = Boolean(
                    option.parentRegion && GetRegionToCountryMap()[option.regionCode]?.length,
                  );
                  return (
                    <AutocompleteOption
                      key={locationKey}
                      leading={
                        <LocationSelectionCheckbox
                          checkboxState={GetCheckboxState(value, option)}
                          rowType={getRowType(option)}
                          title={option.title || ''}
                        />
                      }
                      title={option.title || ''}
                      trailing={
                        <LocationExpandToggle
                          isExpandable={isExpandable}
                          isExpanded={getExpandedState(option)}
                          onToggle={() => toggleExpandedState(option)}
                        />
                      }
                      value={locationKey}
                    />
                  );
                })}
                {unlistedSelectedLocations.map((option) => {
                  const locationKey = getLocationKey(option);
                  return (
                    <AutocompleteOption
                      className='hidden'
                      disabled
                      key={locationKey}
                      title={localizedLocationByKey.get(locationKey)?.title || option.title || ''}
                      value={locationKey}
                    />
                  );
                })}
              </Autocomplete>
            </div>
          </AppTooltip>
        );
      }}
    />
  );
};

export default LocationAutocomplete;
