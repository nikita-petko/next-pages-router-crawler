import { AllLocationsObj } from '@constants/locationAutocomplete';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import { GenericAutocompleteOption, TargetingCriteriaType } from '@type/advancedTargeting';
import { GenreOption } from '@type/genreAutocomplete';

export enum ServerAgeBucketType {
  // Do not use.
  AGE_BUCKET_TYPE_UNDEFINED_INVALID = 0,

  AGE_BUCKET_TYPE_13_TO_17 = 1,

  AGE_BUCKET_TYPE_18_TO_24 = 2,

  AGE_BUCKET_TYPE_25_PLUS = 3,

  AGE_BUCKET_TYPE_5_TO_12 = 4,

  ALL_AGES = 5,
}

export enum DeviceType {
  // Do not use.
  DEVICE_TYPE_UNDEFINED_INVALID = 0,

  DEVICE_TYPE_ALL = 1,

  DEVICE_TYPE_COMPUTER = 2,

  DEVICE_TYPE_PHONE = 3,

  DEVICE_TYPE_TABLET = 4,

  DEVICE_TYPE_CONSOLE = 5,
}

export enum ServerGenderType {
  // Do not use.
  GENDER_UNDEFINED_INVALID = 0,

  GENDER_ANY = 1,

  GENDER_FEMALE = 2,

  GENDER_MALE = 3,
}

export enum ServerRetargetingType {
  RETARGETING_UNSPECIFIED = 0,

  RETARGETING_NEW_USERS_FIRST_30_DAYS = 1,

  RETARGETING_LAPSED_USERS_30_DAYS = 2,

  RETARGETING_EXCLUDE_USERS_180_DAYS = 3,
}

export const AllAgesOption: GenericAutocompleteOption = {
  isAll: true,
  label: 'Label.AllAges',
  value: ServerAgeBucketType.ALL_AGES, // TODO: ADS-7898 Transform this when making request to create campaign
};
export const U13AgeOption: GenericAutocompleteOption = {
  label: 'Label.Age5To12',
  value: ServerAgeBucketType.AGE_BUCKET_TYPE_5_TO_12,
};
export const AgeOptions = [
  AllAgesOption,
  { label: 'Label.Age13To17', value: ServerAgeBucketType.AGE_BUCKET_TYPE_13_TO_17 },
  { label: 'Label.Age18To24', value: ServerAgeBucketType.AGE_BUCKET_TYPE_18_TO_24 },
  { label: 'Label.Age25Plus', value: ServerAgeBucketType.AGE_BUCKET_TYPE_25_PLUS },
];
export const GetAgeOptions = (isAge5To12TargetingEnabled: boolean): GenericAutocompleteOption[] =>
  isAge5To12TargetingEnabled ? [AllAgesOption, U13AgeOption, ...AgeOptions.slice(1)] : AgeOptions;
export const KnownAgeOptions: GenericAutocompleteOption[] = [...AgeOptions, U13AgeOption];
export const EighteenPlusAges = [
  { label: 'Label.Age18To24', value: ServerAgeBucketType.AGE_BUCKET_TYPE_18_TO_24 },
  { label: 'Label.Age25Plus', value: ServerAgeBucketType.AGE_BUCKET_TYPE_25_PLUS },
];

export const AllDevicesOption: GenericAutocompleteOption = {
  isAll: true,
  label: 'Label.AllDevices',
  value: DeviceType.DEVICE_TYPE_ALL,
};
export const DeviceOptions: GenericAutocompleteOption[] = [
  AllDevicesOption,
  { label: 'Label.Computer', value: DeviceType.DEVICE_TYPE_COMPUTER },
  { label: 'Label.Mobile', value: DeviceType.DEVICE_TYPE_PHONE },
  { label: 'Label.Tablet', value: DeviceType.DEVICE_TYPE_TABLET },
  { label: 'Label.Console', value: DeviceType.DEVICE_TYPE_CONSOLE },
];

export const AllGenresObj: GenreOption = {
  deprecated: false,
  description: '',
  title: 'Label.AllGenres',
  value: 1,
};

export const AllGendersOption: GenericAutocompleteOption = {
  isAll: true,
  label: 'Label.AllGenders',
  value: ServerGenderType.GENDER_ANY,
};
export const GenderOptions: GenericAutocompleteOption[] = [
  AllGendersOption,
  { label: 'Label.Male', value: ServerGenderType.GENDER_MALE },
  { label: 'Label.Female', value: ServerGenderType.GENDER_FEMALE },
];

export enum FormField {
  AGES = 'ages',
  DEVICES = 'devices',
  GENDERS = 'genders',
  GENRES = 'genres',
  LOCATIONS = 'locations',
  UNIVERSE = 'universe',
}

export const AdvancedTargetingFormDefaults: AdvancedTargetingFormType = {
  [FormField.AGES]: [AllAgesOption],
  [FormField.DEVICES]: [AllDevicesOption],
  [FormField.GENDERS]: [AllGendersOption],
  [FormField.GENRES]: [AllGenresObj],
  [FormField.LOCATIONS]: {
    countries: [],
    includesEUCountry: true,
    regions: [AllLocationsObj],
  },
};

export const DefaultAdvancedTargeting: TargetingCriteriaType = {
  age_bucket_criteria: {
    age_buckets: null,
    all_ages: true,
  },
  device_criteria: {
    devices: [1],
  },
  gender_criteria: {
    gender: 1,
  },
  genre_criteria: {
    genres: [1],
  },
  keyword_criteria: {
    keywords: null,
  },
  language_criteria: {
    languages: [1],
  },
  location_criteria: {
    countries: null,
    regions: [1],
  },
  retargeting_criteria: {
    retargeting_audiences: null,
  },
};

// New genres taxonomy
export const NewGenres: GenreOption[] = [
  AllGenresObj,
  {
    deprecated: false,
    description: 'Description.GenreNewAction',
    title: 'Label.GenreNewAction',
    value: 25,
  },
  {
    deprecated: false,
    description: 'Description.GenreNewAdventure',
    title: 'Label.GenreNewAdventure',
    value: 26,
  },
  {
    deprecated: false,
    description: 'Description.GenreNewEntertainment',
    title: 'Label.GenreNewEntertainment',
    value: 16,
  },
  {
    deprecated: false,
    description: 'Description.GenreNewRoleplayAvatarSim',
    title: 'Label.GenreNewRoleplayAvatarSim',
    value: 17,
  },
  {
    deprecated: false,
    description: 'Description.GenreNewObbyPlatformer',
    title: 'Label.GenreNewObbyPlatformer',
    value: 18,
  },
  {
    deprecated: false,
    description: 'Description.GenreNewPartyCasual',
    title: 'Label.GenreNewPartyCasual',
    value: 19,
  },
  {
    deprecated: false,
    description: 'Description.GenreNewRPG',
    title: 'Label.GenreNewRPG',
    value: 20,
  },
  {
    deprecated: false,
    description: 'Description.GenreNewShooter',
    title: 'Label.GenreNewShooter',
    value: 21,
  },
  {
    deprecated: false,
    description: 'Description.GenreNewSimulation',
    title: 'Label.GenreNewSimulation',
    value: 27,
  },
  {
    deprecated: false,
    description: 'Description.GenreNewSportsRacing',
    title: 'Label.GenreNewSportsRacing',
    value: 22,
  },
  {
    deprecated: false,
    description: 'Description.GenreNewSurvival',
    title: 'Label.GenreNewSurvival',
    value: 23,
  },
  {
    deprecated: false,
    description: 'Description.GenreNewStrategy',
    title: 'Label.GenreNewStrategy',
    value: 28,
  },
  {
    deprecated: false,
    description: 'Description.GenreNewOther',
    title: 'Label.GenreNewOther',
    value: 24,
  },
];

// Old genres taxonomy, should only be used for backwards compatibility and display purposes
export const Genres: GenreOption[] = [
  AllGenresObj,
  {
    deprecated: false,
    description: 'Description.GenreAction',
    title: 'Label.GenreAction',
    value: 2,
  },
  {
    deprecated: false,
    description: 'Description.GenreAdventure',
    title: 'Label.GenreAdventure',
    value: 3,
  },
  {
    deprecated: false,
    description: 'Description.GenreObby',
    title: 'Label.GenreObby',
    value: 5,
  },
  {
    deprecated: true,
    description: '',
    title: 'Label.GenrePuzzle',
    value: 6,
  },
  {
    deprecated: false,
    description: 'Description.GenreRoleplaying',
    title: 'Label.GenreRoleplaying',
    value: 7,
  },
  {
    deprecated: true,
    description: '',
    title: 'Label.GenreSandbox',
    value: 8,
  },
  {
    deprecated: true,
    description: '',
    title: 'Label.GenreShopping',
    value: 9,
  },
  {
    deprecated: false,
    description: 'Description.GenreSimulation',
    title: 'Label.GenreSimulation',
    value: 10,
  },
  {
    deprecated: false,
    description: 'Description.GenreSocial',
    title: 'Label.GenreSocial',
    value: 11,
  },
  {
    deprecated: false,
    description: 'Description.GenreSports',
    title: 'Label.GenreSports',
    value: 12,
  },
  {
    deprecated: false,
    description: 'Description.GenreStrategy',
    title: 'Label.GenreStrategy',
    value: 13,
  },
  {
    deprecated: true,
    description: '',
    title: 'Label.GenreTabletop',
    value: 14,
  },
  {
    deprecated: false,
    description: 'Description.GenreTycoon',
    title: 'Label.GenreTycoon',
    value: 15,
  },
];
