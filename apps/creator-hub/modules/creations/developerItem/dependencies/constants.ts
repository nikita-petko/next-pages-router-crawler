import {
  AssetType as AssetTypeEnum,
  ChildAccessReason as ChildAccessReasonEnum,
  type AssetType,
  type ChildAccessReason,
} from '@rbx/client-creator-asset-tooling-api/v1';

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [1, 10, 25, 50, 100];
export const FILTER_DROPDOWN_MIN_WIDTH = 160;

export const ASSET_TYPE_OPTIONS: ReadonlyArray<{ value: AssetType; labelKey: string }> = [
  { value: AssetTypeEnum.Image, labelKey: 'Label.Image' },
  { value: AssetTypeEnum.Mesh, labelKey: 'Label.Mesh' },
  { value: AssetTypeEnum.Audio, labelKey: 'Label.Audio' },
  { value: AssetTypeEnum.Video, labelKey: 'Label.Video' },
  { value: AssetTypeEnum.TexturePack, labelKey: 'Label.TexturePack' },
];

export const ACCESS_REASON_OPTIONS: ReadonlyArray<{ value: ChildAccessReason; labelKey: string }> =
  [
    { value: ChildAccessReasonEnum.NoPermission, labelKey: 'Label.AccessReasonNoPermission' },
    { value: ChildAccessReasonEnum.SameCreator, labelKey: 'Label.AccessReasonSameCreator' },
    { value: ChildAccessReasonEnum.OpenUse, labelKey: 'Label.AccessReasonOpenUse' },
    { value: ChildAccessReasonEnum.Shared, labelKey: 'Label.AccessReasonShared' },
    {
      value: ChildAccessReasonEnum.HasPermissionReasonUnspecified,
      labelKey: 'Label.AccessReasonHasPermissionReasonUnspecified',
    },
  ];
