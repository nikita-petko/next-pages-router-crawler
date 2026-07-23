import AllowedGearType from '../../common/enums/AllowedGearType';

export enum GearGenresAllowPolicy {
  All = 'All',
  ExperienceGenre = 'ExperienceGenre',
}

export enum InGamePermissionType {
  UpdateFromRcc = 'UpdateFromRcc',
  CopyFromRcc = 'CopyFromRcc',
}

export type PlacePermissionsFormType = {
  isCopyAllowed: boolean;
  genresAllowedPolicy: GearGenresAllowPolicy;
  allowedGearTypes: Array<AllowedGearType>;
  isUpdateFromRcc: boolean;
  isCopyFromRcc: boolean;
};
