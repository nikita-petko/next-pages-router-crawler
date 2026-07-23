import { AdAssetType } from '@rbx/client-ads-management-api/v1';

import type { AdAsset } from '@type/adAsset';
import type { AspectRatioValidation } from '@type/fileUpload';

// Lowercase + snake_case mirrors `ContentModerationStatus` so future
// server-emitted values can drop in without translation. SPONSORED_TILE
// (16:9, Visits/Spend) and REACH_AD (2:1, Reach) are distinct placements
// even though both renderers use `object-fit: cover`; the difference is
// which ratio counts as `exact` and which flag gates the badge.
export const AD_CREATIVE_FORMAT = {
  AD_INTEGRATION: 'ad_integration',
  REACH_AD: 'reach_ad',
  SPONSORED_LOGO_SQUARE: 'sponsored_logo_square',
  SPONSORED_LOGO_WIDE: 'sponsored_logo_wide',
  SPONSORED_TILE: 'sponsored_tile',
} as const;

type AdCreativeFormat = (typeof AD_CREATIVE_FORMAT)[keyof typeof AD_CREATIVE_FORMAT];

// `exact` = within tolerance (no cropping). `crop` = renderer will trim
// pixels to fit the placement frame.
export const FIT = {
  CROP: 'crop',
  EXACT: 'exact',
} as const;

type Fit = (typeof FIT)[keyof typeof FIT];

interface FormatCompatibility {
  fit: Fit;
  format: AdCreativeFormat;
}

interface FormatSpec {
  acceptedAssetTypes: ReadonlyArray<string>;
  // Omit for asset-type-only formats (AD_INTEGRATION) where placement-time
  // validation handles ratio enforcement.
  allowedRatios?: ReadonlyArray<readonly [number, number]>;
  // True for renderers using `object-fit: cover` (off-ratio = crop).
  // False/undefined for `object-fit: contain` (off-ratio = exclude, since
  // letterboxing under contain looks bad).
  cropsOffRatio?: boolean;
  exactTolerance?: number;
  format: AdCreativeFormat;
}

// Absolute tolerance on |sourceRatio − allowedRatio|. Shared by every
// shape-gated format here and re-exported via LOGO_ASPECT_RATIO_VALIDATION
// so the upload validator and library badges stay in lock-step.
const ASPECT_RATIO_TOLERANCE = 0.1;

// Source of truth for the logo placements' aspect-ratio buckets. Referenced
// by FORMAT_SPECS' two logo specs, LOGO_ASPECT_RATIO_VALIDATION, and the
// `bucketLogoAspectRatio` return type — so adding a bucket here can't
// desync the upload validator, library filter, or form transform from the
// strings the backend's `logo_asset_aspect_width` parser accepts.
const LOGO_ALLOWED_RATIOS = [
  [1, 1],
  [3, 1],
] as const;

type LogoAspectRatioString = (typeof LOGO_ALLOWED_RATIOS)[number] extends readonly [
  infer W extends number,
  infer H extends number,
]
  ? `${W}:${H}`
  : never;

// Order is the on-screen badge order (most-common shapes first).
const FORMAT_SPECS: ReadonlyArray<FormatSpec> = [
  {
    acceptedAssetTypes: [AdAssetType.AdAssetTypeImage],
    allowedRatios: [[16, 9]],
    cropsOffRatio: true,
    exactTolerance: ASPECT_RATIO_TOLERANCE,
    format: AD_CREATIVE_FORMAT.SPONSORED_TILE,
  },
  {
    acceptedAssetTypes: [AdAssetType.AdAssetTypeImage],
    allowedRatios: [[2, 1]],
    cropsOffRatio: true,
    exactTolerance: ASPECT_RATIO_TOLERANCE,
    format: AD_CREATIVE_FORMAT.REACH_AD,
  },
  {
    acceptedAssetTypes: [AdAssetType.AdAssetTypeImage],
    allowedRatios: [LOGO_ALLOWED_RATIOS[0]],
    exactTolerance: ASPECT_RATIO_TOLERANCE,
    format: AD_CREATIVE_FORMAT.SPONSORED_LOGO_SQUARE,
  },
  {
    acceptedAssetTypes: [AdAssetType.AdAssetTypeImage],
    allowedRatios: [LOGO_ALLOWED_RATIOS[1]],
    exactTolerance: ASPECT_RATIO_TOLERANCE,
    format: AD_CREATIVE_FORMAT.SPONSORED_LOGO_WIDE,
  },
  {
    // No shape gate; ratio enforcement happens at placement time. Last
    // so shape badges render before this one.
    acceptedAssetTypes: [
      AdAssetType.AdAssetTypeImage,
      AdAssetType.AdAssetTypeVideo,
      AdAssetType.AdAssetTypeAdsVideo,
      AdAssetType.AdAssetTypeModel,
    ],
    format: AD_CREATIVE_FORMAT.AD_INTEGRATION,
  },
];

/**
 * Returns the [w, h] from `allowedRatios` that this image fits within
 * `tolerance`, or null. Single source of truth for the upload-time
 * validator, the library compatibility matcher, and bucketing dims
 * into the `logo_asset_aspect_width` value the sponsored-ads backend
 * accepts (1 or 3). Returns null on non-positive dimensions.
 */
export const findMatchingAspectRatio = (
  width: number,
  height: number,
  allowedRatios: ReadonlyArray<readonly [number, number]>,
  tolerance: number,
): readonly [number, number] | null => {
  if (width <= 0 || height <= 0) {
    return null;
  }
  const sourceRatio = width / height;
  return allowedRatios.find(([w, h]) => Math.abs(sourceRatio - w / h) <= tolerance) ?? null;
};

export const isWithinAspectRatioTolerance = (
  width: number,
  height: number,
  allowedRatios: ReadonlyArray<readonly [number, number]>,
  tolerance: number,
): boolean => findMatchingAspectRatio(width, height, allowedRatios, tolerance) !== null;

// Accepts both the strict library shape (`AdAsset`, dims `number | null`)
// and the looser registry shape (`EnrichedAdCreativeAsset`, dims optional)
// since the runtime logic already handles missing fields and dims.
type AspectShape = {
  assetType?: AdAsset['assetType'];
  height?: number | null;
  width?: number | null;
};

const matchSpec = (spec: FormatSpec, asset: AspectShape): Fit | null => {
  if (asset.assetType == null || !spec.acceptedAssetTypes.includes(asset.assetType)) {
    return null;
  }
  if (!spec.allowedRatios || spec.exactTolerance == null) {
    return FIT.EXACT;
  }
  // Without dimensions we can't evaluate the ratio; bail explicitly so
  // missing/zero dims aren't downgraded to CROP via cropsOffRatio.
  if (asset.width == null || asset.height == null || asset.width <= 0 || asset.height <= 0) {
    return null;
  }
  if (
    isWithinAspectRatioTolerance(asset.width, asset.height, spec.allowedRatios, spec.exactTolerance)
  ) {
    return FIT.EXACT;
  }
  return spec.cropsOffRatio ? FIT.CROP : null;
};

/**
 * Formats this asset can serve, each tagged `exact` (renders as-is) or
 * `crop` (renderer trims to fit). Output order is stable (FORMAT_SPECS
 * order) so callers can rely on it for badge layout.
 */
export const computeCompatibleFormats = (asset: AspectShape): ReadonlyArray<FormatCompatibility> =>
  FORMAT_SPECS.flatMap((spec) => {
    const fit = matchSpec(spec, asset);
    return fit ? [{ fit, format: spec.format }] : [];
  });

const LOGO_FORMATS: ReadonlySet<AdCreativeFormat> = new Set([
  AD_CREATIVE_FORMAT.SPONSORED_LOGO_SQUARE,
  AD_CREATIVE_FORMAT.SPONSORED_LOGO_WIDE,
]);

/**
 * True when `asset` is a near-square or near-3:1 image. The logo drawer's
 * "Select from library" tab uses this to hide assets the upload tab would
 * have rejected (logos render with `object-fit: contain`, so off-ratio
 * sources letterbox badly instead of cropping).
 */
export const isCompatibleWithLogoPlacement = (asset: AspectShape): boolean =>
  computeCompatibleFormats(asset).some(({ format }) => LOGO_FORMATS.has(format));

/**
 * Logo upload-validator config consumed by `ImageUploadDragAndDropZone`'s
 * `aspectRatioValidation` prop. Derived from `FORMAT_SPECS` so a logo
 * spec change above can't desync the upload tab from the library filter.
 */
export const LOGO_ASPECT_RATIO_VALIDATION: AspectRatioValidation = {
  allowedRatios: LOGO_ALLOWED_RATIOS.map(([w, h]) => [w, h] as [number, number]),
  tolerance: ASPECT_RATIO_TOLERANCE,
};

/**
 * Bucket a logo's pixel dimensions into the `'1:1'` or `'3:1'` string the
 * sponsored-ads form stores on its logo items (`ThumbnailType.aspectRatio`).
 * The transform hook reads the `w` from this string and sends it as
 * `logo_asset_aspect_width`, which the backend strict-checks for `1` or
 * `3`. Returns null if the image isn't within tolerance of either bucket.
 */
export const bucketLogoAspectRatio = (
  width: number | null | undefined,
  height: number | null | undefined,
): LogoAspectRatioString | null => {
  if (width == null || height == null) {
    return null;
  }
  const matched = findMatchingAspectRatio(
    width,
    height,
    LOGO_ASPECT_RATIO_VALIDATION.allowedRatios,
    LOGO_ASPECT_RATIO_VALIDATION.tolerance ?? ASPECT_RATIO_TOLERANCE,
  );
  if (!matched) {
    return null;
  }
  return `${matched[0]}:${matched[1]}` as LogoAspectRatioString;
};
