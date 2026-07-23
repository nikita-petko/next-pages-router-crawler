import { cloneDeep, isEqual } from 'lodash';
import { UseFormGetValues, UseFormSetValue, UseFormTrigger } from 'react-hook-form';

import { ServerAdType } from '@constants/ad';
import { ServerAdSetBrandSuitabilityType } from '@constants/adSet';
import {
  AdvancedTargetingFormDefaults,
  FormField as AdvancedTargetingFormField,
  AllAgesOption,
  DeviceOptions,
  EighteenPlusAges,
  FormField,
  GenderOptions,
  Genres,
  KnownAgeOptions,
  NewGenres,
  ServerAgeBucketType,
} from '@constants/advancedTargeting';
import { DefaultServerDetailedTargetingMatchType } from '@constants/campaign';
import { RegionsAndCountriesSortedAlph } from '@constants/locationAutocomplete';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { GenericAutocompleteOption, GetAudienceEstimateParams } from '@type/advancedTargeting';
import { SimplifiedCampaignType } from '@type/campaignBuilder';
import { GenreOption } from '@type/genreAutocomplete';
import { LocationTargetingType, RegionsAndLocationsFormInputObj } from '@type/locationAutocomplete';
import { SponsoredUniverseShapeType } from '@type/universe';
import { GetObjectiveTargetingCriteriaRequestJson } from '@utils/campaignBuilder';

export const GetAdvancedTargetingFormDefaults = (activeUniverse?: SponsoredUniverseShapeType) => {
  if (activeUniverse && activeUniverse.seventeen_plus_age_rating) {
    return {
      ...AdvancedTargetingFormDefaults,
      [FormField.AGES]: EighteenPlusAges,
    };
  }
  return AdvancedTargetingFormDefaults;
};

interface HaveFormValuesChangedParams {
  getValues: UseFormGetValues<AdvancedTargetingFormType>;
  isDirty: boolean;
}

export const HaveFormValuesChanged = (
  getValues: HaveFormValuesChangedParams['getValues'],
): boolean => {
  const { [FormField.UNIVERSE]: universe, ...formValues } = getValues();
  return !isEqual(
    formValues,
    GetAdvancedTargetingFormDefaults(universe as SponsoredUniverseShapeType),
  );
};

export const ContainsUnder18Ages = (ageOptions: GenericAutocompleteOption[]) =>
  ageOptions
    .map((ageOption) => ageOption.value)
    .includes(ServerAgeBucketType.AGE_BUCKET_TYPE_13_TO_17) ||
  ageOptions.some(({ label }) => label === AllAgesOption.label);

export const ContainsAge5To12 = (ageOptions: GenericAutocompleteOption[]) =>
  ageOptions
    .map((ageOption) => ageOption.value)
    .includes(ServerAgeBucketType.AGE_BUCKET_TYPE_5_TO_12) ||
  ageOptions.some(({ label }) => label === AllAgesOption.label);

const AllAgesServerOption = {
  all_ages: true,
};

export const FormatTargetingCriteriaRequestJson = (formValues: AdvancedTargetingFormType) => {
  const ages = formValues[AdvancedTargetingFormField.AGES];
  const { countries, regions } = formValues[AdvancedTargetingFormField.LOCATIONS];
  return {
    age_bucket_criteria:
      ages.length && ages[0].isAll
        ? AllAgesServerOption
        : { age_buckets: ages.map((ageBucket) => ageBucket.value) },
    device_criteria: {
      devices: formValues[AdvancedTargetingFormField.DEVICES].map((device) => device.value),
    },
    gender_criteria: {
      gender: formValues[AdvancedTargetingFormField.GENDERS][0].value,
    },
    genre_criteria: {
      genres: formValues[AdvancedTargetingFormField.GENRES].map((genre) => genre.value),
    },
    language_criteria: {
      languages: [1],
    },
    location_criteria: {
      countries: countries.map((country) => country.value),
      regions: regions.map((region) => region.value),
    },
  };
};

const getGenreStringFromProtoVal = (protoVal: number) =>
  [...Genres, ...NewGenres].find((genreObj: GenreOption) => genreObj.value === protoVal);

export const FormatSimplifiedCampaignTargetingResponseJson = (campaign: SimplifiedCampaignType) => {
  const targetingCriteria = cloneDeep(AdvancedTargetingFormDefaults) as AdvancedTargetingFormType;
  const responseCriteria = campaign.targeting_criteria;
  if (!responseCriteria) {
    return targetingCriteria;
  }

  if (responseCriteria.age_bucket_criteria?.age_buckets) {
    targetingCriteria[AdvancedTargetingFormField.AGES] =
      responseCriteria.age_bucket_criteria.age_buckets
        .map((age) => KnownAgeOptions.find((option) => option.value === age))
        .filter((option) => !!option);
  }

  if (responseCriteria.device_criteria?.devices) {
    targetingCriteria[AdvancedTargetingFormField.DEVICES] = responseCriteria.device_criteria.devices
      .map((device) => DeviceOptions.find((option) => option.value === device))
      .filter((option) => !!option);
  }

  if (responseCriteria.gender_criteria?.gender) {
    const genderOption = GenderOptions.find(
      (option) => option.value === responseCriteria.gender_criteria.gender,
    );
    if (genderOption) {
      targetingCriteria[AdvancedTargetingFormField.GENDERS] = [genderOption];
    }
  }

  if (responseCriteria.genre_criteria?.genres) {
    targetingCriteria[AdvancedTargetingFormField.GENRES] = responseCriteria.genre_criteria.genres
      .map((genre) => getGenreStringFromProtoVal(genre))
      .filter((option) => !!option);
  }

  if (responseCriteria.location_criteria?.countries) {
    targetingCriteria[AdvancedTargetingFormField.LOCATIONS].countries =
      responseCriteria.location_criteria.countries
        .map((country) =>
          RegionsAndCountriesSortedAlph.find(
            (regionOrCountry) => regionOrCountry.value === country && !regionOrCountry.parentRegion,
          ),
        )
        .filter((option): option is RegionsAndLocationsFormInputObj => !!option);
  } else {
    targetingCriteria[AdvancedTargetingFormField.LOCATIONS].countries = [];
  }

  if (responseCriteria.location_criteria?.regions) {
    targetingCriteria[AdvancedTargetingFormField.LOCATIONS].regions =
      responseCriteria.location_criteria.regions
        .map((region) =>
          RegionsAndCountriesSortedAlph.find(
            (regionOrCountry) =>
              regionOrCountry.value === region &&
              (!!regionOrCountry.parentRegion || !!regionOrCountry.superGroup),
          ),
        )
        .filter((option): option is RegionsAndLocationsFormInputObj => !!option);
  } else {
    targetingCriteria[AdvancedTargetingFormField.LOCATIONS].regions = [];
  }

  return targetingCriteria;
};

export const AwaitErrorsThenMaybeGetAudienceEstimate = async ({
  formField,
  getAudienceEstimate,
  getValues,
  newSelectedOptions,
  trigger,
}: {
  formField: FormField;
  getAudienceEstimate: (data: GetAudienceEstimateParams) => void;
  getValues: UseFormGetValues<AdvancedTargetingFormType>;
  newSelectedOptions?:
    | GenericAutocompleteOption[]
    | LocationTargetingType
    | GenreOption[]
    | SponsoredUniverseShapeType;
  trigger: () => Promise<boolean>;
}) => {
  const isValid = await trigger();
  if (isValid) {
    const detailedTargetingMatchType =
      useCampaignBuilderStore.getState().detailedTargetingMatchType ??
      DefaultServerDetailedTargetingMatchType;

    // Build targeting criteria from form values. Only override a specific
    // field if it is being changed. This can be called externally to
    // refresh the audience estimate without changing the form values.
    const baseTargetingCriteria = FormatTargetingCriteriaRequestJson(
      newSelectedOptions !== undefined
        ? {
            ...getValues(),
            [formField]: newSelectedOptions,
          }
        : getValues(),
    );

    const advancedTargetingCriteria = GetObjectiveTargetingCriteriaRequestJson(
      detailedTargetingMatchType,
    );

    const universeId = getValues(FormField.UNIVERSE)?.universe_id || 0;

    const request = {
      ad_type: [ServerAdType.SPONSORED_UNIVERSE],
      targeting_criteria: {
        ...baseTargetingCriteria,
        ...advancedTargetingCriteria,
      },
      universe_id: universeId,
      universe_suitability_filter:
        ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_UNSPECIFIED,
    };

    getAudienceEstimate({
      detailedTargetingMatchType,
      request,
      universeId,
    });
  }
};

interface ResetFormParams {
  getAudienceEstimate: (data: GetAudienceEstimateParams) => void;
  getValues: UseFormGetValues<AdvancedTargetingFormType>;
  reset: () => void;
  setValue: UseFormSetValue<AdvancedTargetingFormType>;
  trigger: UseFormTrigger<AdvancedTargetingFormType>;
  universe?: SponsoredUniverseShapeType;
}

export const ResetForm = async ({
  getAudienceEstimate,
  getValues,
  reset,
  setValue,
  trigger,
  universe,
}: ResetFormParams) => {
  const existingUniverse = universe || getValues(FormField.UNIVERSE);
  reset();
  setValue(FormField.UNIVERSE, existingUniverse);
  if (existingUniverse?.seventeen_plus_age_rating) {
    setValue(FormField.AGES, EighteenPlusAges);
  }
  AwaitErrorsThenMaybeGetAudienceEstimate({
    formField: FormField.UNIVERSE,
    getAudienceEstimate,
    getValues,
    newSelectedOptions: existingUniverse,
    trigger,
  });
};
