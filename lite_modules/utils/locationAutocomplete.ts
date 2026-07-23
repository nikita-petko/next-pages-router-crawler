import { uniq } from 'lodash';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import {
  AllLocationsObj,
  allNonEULocationsObj,
  CheckboxState,
  RegionsAndCountriesSortedAlph,
  ServerRegionCode,
} from '@constants/locationAutocomplete';
import {
  LocationTargetingType,
  RegionsAndLocationsFormInputObj,
  RegionToCountryMap,
} from '@type/locationAutocomplete';

export const AllLocationsSelected = (targeting: LocationTargetingType) =>
  targeting.regions.some(
    (locationObj: RegionsAndLocationsFormInputObj) => locationObj.regionCode === 'All',
  );

export const GetCountryValuesForRegion = (regionCode: string): number[] =>
  RegionsAndCountriesSortedAlph.filter((regionOrCountry) => {
    if (regionOrCountry.parentRegion) {
      return false;
    }
    return regionOrCountry.regionCode === regionCode;
  }).map((regionOrCountry: RegionsAndLocationsFormInputObj) => regionOrCountry.value);

const regionToCountryMap: RegionToCountryMap = {};
export const GetRegionToCountryMap = () => {
  if (regionToCountryMap && Object.keys(regionToCountryMap).length > 0) {
    return regionToCountryMap;
  }
  RegionsAndCountriesSortedAlph.forEach((locationObj: RegionsAndLocationsFormInputObj) => {
    const { countryCode, regionCode } = locationObj;
    if (countryCode) {
      if (regionToCountryMap[regionCode]) {
        regionToCountryMap[regionCode].push(locationObj);
      } else {
        regionToCountryMap[regionCode] = [locationObj];
      }
    } else {
      regionToCountryMap[regionCode] = [];
    }
  });
  return regionToCountryMap;
};

export const MergeCountriesIntoRegions = (listOfCountryObjs: RegionsAndLocationsFormInputObj[]) => {
  let finalCountries: RegionsAndLocationsFormInputObj[] = [];
  const finalRegions: RegionsAndLocationsFormInputObj[] = [];
  const groupedCountries: Record<string, RegionsAndLocationsFormInputObj[]> = {};

  listOfCountryObjs.forEach((locationObj: RegionsAndLocationsFormInputObj) => {
    const { regionCode } = locationObj;
    groupedCountries[regionCode] = [];
  });

  listOfCountryObjs.forEach((locationObj: RegionsAndLocationsFormInputObj) => {
    const { countryCode, regionCode } = locationObj;
    if (countryCode) {
      groupedCountries[regionCode].push(locationObj);
    }
  });

  const RegionToChildrenCountryComposite: Record<string, string> = {};
  Object.entries(GetRegionToCountryMap()).forEach(([key, val]) => {
    RegionToChildrenCountryComposite[key] = val
      .map((obj: RegionsAndLocationsFormInputObj) => obj.countryCode)
      .sort()
      .join('');
  });

  Object.entries(groupedCountries).forEach(([regionCode, selectedCountries]) => {
    const countriesCompositeKey = (selectedCountries as RegionsAndLocationsFormInputObj[])
      .map((obj: RegionsAndLocationsFormInputObj) => obj.countryCode)
      .sort()
      .join('');
    if (RegionToChildrenCountryComposite[regionCode] === countriesCompositeKey) {
      const parentRegion = RegionsAndCountriesSortedAlph.find(
        (locationObj) => locationObj.regionCode === regionCode && locationObj.parentRegion,
      );
      if (parentRegion) {
        finalRegions.push(parentRegion);
      }
    } else {
      finalCountries = finalCountries.concat(
        selectedCountries as RegionsAndLocationsFormInputObj[],
      );
    }
  });

  return {
    countries: finalCountries,
    regions: finalRegions,
  };
};

export function GetFlattenedLocationOptions(locationTargeting: LocationTargetingType) {
  const { countries = [], regions: flatRegions = [] } = locationTargeting || {};
  return [...flatRegions, ...countries];
}

export const ConvertCountriesToTargetingType = (locations: number[]): LocationTargetingType => {
  if (locations.length === 1 && locations[0] === 1) {
    return { countries: [], regions: [AllLocationsObj] };
  }
  const countryObjects: RegionsAndLocationsFormInputObj[] = RegionsAndCountriesSortedAlph.filter(
    (location: RegionsAndLocationsFormInputObj) =>
      !location.parentRegion && locations.includes(location.value),
  );
  return MergeCountriesIntoRegions(countryObjects);
};

const allNonEUStandAloneCountries = RegionsAndCountriesSortedAlph.filter(
  (locationObj: RegionsAndLocationsFormInputObj) =>
    locationObj.nonEU && !locationObj.parentRegion && !locationObj.superGroup,
);

const allNonEURegionsMixedRegionAndCountries: RegionsAndLocationsFormInputObj[] =
  RegionsAndCountriesSortedAlph.filter(
    (locationObj: RegionsAndLocationsFormInputObj) =>
      locationObj.nonEU && locationObj.parentRegion && !locationObj.superGroup,
  );

const allRegions: RegionsAndLocationsFormInputObj[] = RegionsAndCountriesSortedAlph.filter(
  (locationObj: RegionsAndLocationsFormInputObj) => locationObj.parentRegion,
);

const allNonEULocationsSelected = (targeting: LocationTargetingType, exactMatch?: boolean) => {
  if (AllLocationsSelected(targeting)) {
    if (exactMatch) {
      return false;
    }
    return true;
  }
  const targetingRegionCodes = targeting.regions.map(
    (locationObj: RegionsAndLocationsFormInputObj) => locationObj.regionCode,
  );
  const allIncluded = !allNonEURegionsMixedRegionAndCountries.some(
    (locationObj: RegionsAndLocationsFormInputObj) =>
      !targetingRegionCodes.includes(locationObj.regionCode),
  );
  if (exactMatch) {
    return (
      allIncluded &&
      targeting.countries.length === 0 &&
      targetingRegionCodes.length === allNonEURegionsMixedRegionAndCountries.length
    );
  }
  return allIncluded;
};

const locationExistsInArr = (
  locationObjs: RegionsAndLocationsFormInputObj[],
  locationObj: RegionsAndLocationsFormInputObj,
): boolean =>
  locationObjs.some((item: RegionsAndLocationsFormInputObj) => item.value === locationObj.value);

export const CalculateLocationsTargetingAfterToggle = ({
  newValue,
  previousValues,
}: {
  newValue: RegionsAndLocationsFormInputObj;
  previousValues: LocationTargetingType;
}): LocationTargetingType => {
  const useAllLocationsSpecialCase = AllLocationsSelected(previousValues);
  const isCountry = !newValue.parentRegion && !newValue.superGroup;
  const isRegion = newValue.parentRegion;
  if (useAllLocationsSpecialCase) {
    const isAllRegions = newValue.regionCode === 'All';
    if (isAllRegions) {
      return {
        countries: [],
        regions: [],
      };
    }
    if (isRegion) {
      return {
        countries: [],
        regions: allRegions.filter(
          (locationObj: RegionsAndLocationsFormInputObj) =>
            locationObj.regionCode !== newValue.regionCode,
        ),
      };
    }

    if (isCountry) {
      if (!GetRegionToCountryMap()[newValue.regionCode]) {
        logNativeClickEvent(EventName.LocationAutocompleteRegionUndefinedError, {
          newValue: JSON.stringify(newValue),
        });
      }
      return {
        countries: GetRegionToCountryMap()[newValue.regionCode].filter(
          (locationObj: RegionsAndLocationsFormInputObj) => locationObj.value !== newValue.value,
        ),
        regions: allRegions.filter(
          (locationObj: RegionsAndLocationsFormInputObj) =>
            locationObj.regionCode !== newValue.regionCode,
        ),
      };
    }
  }

  let selectedRegions: RegionsAndLocationsFormInputObj[] = Array.from(previousValues.regions);
  let selectedCountries: RegionsAndLocationsFormInputObj[] = Array.from(previousValues.countries);

  if (newValue.regionCode === 'AllNonEU') {
    if (allNonEULocationsSelected(previousValues, true)) {
      selectedRegions = [];
      selectedCountries = [];
    } else {
      selectedRegions = allNonEURegionsMixedRegionAndCountries;
      selectedCountries = allNonEUStandAloneCountries;
    }
  } else if (newValue.regionCode === 'All') {
    if (locationExistsInArr(selectedRegions, newValue)) {
      selectedRegions = [];
      selectedCountries = [];
    } else {
      selectedRegions = [newValue];
      selectedCountries = [];
    }
  } else if (newValue.parentRegion) {
    if (locationExistsInArr(selectedRegions, newValue)) {
      selectedRegions = selectedRegions.filter(
        (regionObj: RegionsAndLocationsFormInputObj) => regionObj.value !== newValue.value,
      );
    } else if (
      selectedCountries.some(
        (countryObj: RegionsAndLocationsFormInputObj) =>
          countryObj.regionCode === newValue.regionCode,
      )
    ) {
      selectedRegions = selectedRegions.concat([newValue]);
      selectedCountries = selectedCountries.filter(
        (countryObj: RegionsAndLocationsFormInputObj) =>
          countryObj.regionCode !== newValue.regionCode,
      );
    } else {
      selectedRegions.push(newValue);
    }
  } else if (locationExistsInArr(selectedCountries, newValue)) {
    selectedCountries = selectedCountries.filter(
      (countryObj: RegionsAndLocationsFormInputObj) => countryObj.value !== newValue.value,
    );
  } else if (
    selectedRegions.some(
      (locationObj: RegionsAndLocationsFormInputObj) =>
        locationObj.regionCode === newValue.regionCode,
    )
  ) {
    selectedRegions = selectedRegions.filter(
      (regionObj: RegionsAndLocationsFormInputObj) => regionObj.regionCode !== newValue.regionCode,
    );

    selectedCountries = selectedCountries
      .concat(GetRegionToCountryMap()[newValue.regionCode])
      .filter(
        (locationObj: RegionsAndLocationsFormInputObj) => locationObj.value !== newValue.value,
      );
  } else {
    selectedCountries.push(newValue);
  }

  const { countries: finalCountries, regions: augmentedRegions } = MergeCountriesIntoRegions(
    uniq(selectedCountries),
  );

  let finalRegions = uniq(selectedRegions.concat(augmentedRegions));

  const finalRegionsCompositeKey = finalRegions
    .map((obj: RegionsAndLocationsFormInputObj) => obj.regionCode)
    .sort()
    .join('');

  const allRegionsCompositeKey = allRegions
    .map((obj: RegionsAndLocationsFormInputObj) => obj.regionCode)
    .sort()
    .join('');

  if (
    allRegionsCompositeKey === finalRegionsCompositeKey ||
    (finalRegions.length && finalRegions.every((locationObj) => locationObj.regionCode === 'All'))
  ) {
    finalRegions = [AllLocationsObj];
  } else {
    finalRegions = finalRegions.filter(
      (locationObj: RegionsAndLocationsFormInputObj) => locationObj.regionCode !== 'All',
    );
  }

  return {
    countries: uniq(finalCountries),
    regions: finalRegions,
  };
};

export const GetCheckboxState = (
  targeting: LocationTargetingType,
  locationInfo: RegionsAndLocationsFormInputObj,
): CheckboxState => {
  const isCountry: boolean = !locationInfo.parentRegion && !locationInfo.superGroup;
  const isRegion: boolean = !!locationInfo.parentRegion;

  const inSelectedRegions: boolean = targeting?.regions?.some(
    (regionObj: RegionsAndLocationsFormInputObj) => regionObj.value === locationInfo.value,
  );

  const inSelectedCountries: boolean = targeting?.countries?.some(
    (countryObj: RegionsAndLocationsFormInputObj) => countryObj.value === locationInfo.value,
  );

  const childCountriesSelected: boolean = targeting?.countries?.some(
    (countryObj: RegionsAndLocationsFormInputObj) =>
      isRegion && countryObj.regionCode === locationInfo.regionCode,
  );

  const isCountryUnderSelectedRegion: boolean = targeting?.regions?.some(
    (regionObj: RegionsAndLocationsFormInputObj) =>
      regionObj.regionCode === locationInfo.regionCode,
  );

  if (locationInfo.regionCode === allNonEULocationsObj.regionCode) {
    return allNonEULocationsSelected(targeting) ? CheckboxState.CHECKED : CheckboxState.UNCHECKED;
  }

  if (
    AllLocationsSelected(targeting) ||
    (isRegion && inSelectedRegions) ||
    isCountryUnderSelectedRegion
  ) {
    return CheckboxState.CHECKED;
  }

  // Only region rows can show indeterminate
  if (isRegion && !inSelectedRegions && childCountriesSelected) {
    return CheckboxState.PARTIAL;
  }

  if (isCountry && inSelectedCountries) {
    return CheckboxState.CHECKED;
  }

  return CheckboxState.UNCHECKED;
};

const convertAdSetMixedRegionAndCountryTargetingIntoRegions = (
  adSetMixedRegionAndCountryTargetingInfo: LocationTargetingType,
): Array<Partial<RegionsAndLocationsFormInputObj>> => {
  const includedRegions = adSetMixedRegionAndCountryTargetingInfo?.regions || [];
  const includedCountries = adSetMixedRegionAndCountryTargetingInfo?.countries || [];
  const allParentRegionCodesOfCountries = includedCountries.map(
    (countryObj: RegionsAndLocationsFormInputObj) => countryObj.regionCode,
  );

  const regionCodeToRegionsList = allParentRegionCodesOfCountries.map((regionCode: string) => {
    const foundRegion = RegionsAndCountriesSortedAlph.find(
      (regionAndCountryObj: RegionsAndLocationsFormInputObj) =>
        regionAndCountryObj.regionCode === regionCode && regionAndCountryObj.parentRegion,
    );
    return foundRegion;
  });

  const allSelectedRegions = [...includedRegions, ...regionCodeToRegionsList];
  const regionSet: Record<string, RegionsAndLocationsFormInputObj> = {};

  allSelectedRegions
    .filter((regionObj?: RegionsAndLocationsFormInputObj) => !!regionObj)
    .forEach((regionObj: RegionsAndLocationsFormInputObj) => {
      const { regionCode } = regionObj;
      regionSet[regionCode] = regionObj;
    });

  return Object.values(regionSet);
};

export const IncludesEUCountry = (
  targeting: LocationTargetingType,
  EURegionCodeList?: ServerRegionCode[],
) => {
  // Default to true if no regions are selected
  if (!EURegionCodeList) {
    return false;
  }
  return convertAdSetMixedRegionAndCountryTargetingIntoRegions(targeting || []).some(
    (r) => EURegionCodeList && EURegionCodeList.includes(r.value as ServerRegionCode),
  );
};
