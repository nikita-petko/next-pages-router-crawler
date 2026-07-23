// ─── Enums & Types ──────────────────────────────────────────────────────────

export enum TryAssetMode {
  Disabled = 'disabled',
  Default = 'default',
  Custom = 'custom',
}

export type TryAssetFormValue = {
  /** Which TBYB mode the user has selected: disabled, default (Roblox-provided), or custom (user-provided place ID). */
  mode: TryAssetMode;
  /**
   * The placeId is handled as a string to avoid scientific notation and overflow issues.
   * The frontend converts to a number only when needed (in useSocialLinks.ts).
   * Only meaningful when mode === TryAssetMode.Custom.
   */
  placeId: string | null;
};

// ─── Constants ──────────────────────────────────────────────────────────────

/** The literal value sent to / received from the backend for the default TBYB experience. */
export const TRY_ASSET_DEFAULT_PLACE_ID = 'DEFAULT' as const;

/**
 * Deep-link launch-data key shared with the TryInRobloxButton in creator-marketplace-web.
 * Changing this value will break the contract between Creator Hub and the marketplace.
 */
export const LAUNCH_DATA_ASSET_ID_KEY = 'creatorStoreAssetId';

// ─── Form Field Keys (react-hook-form) ─────────────────────────────────────

export const TRY_ASSET_MODE_KEY = 'tryAsset.mode' as const;
export const TRY_ASSET_PLACE_ID_KEY = 'tryAsset.placeId' as const;
export const TRY_ASSET_PLACE_ID_ELEMENT_ID = 'tryAsset-placeId' as const;

// Error types passed to react-hook-form's setError (no enum is exported by the library)
export const FORM_ERROR_TYPE_REQUIRED = 'required' as const;
export const FORM_ERROR_TYPE_VALIDATION = 'validation' as const;

// ─── Converters (backend ↔ form) ───────────────────────────────────────────

/**
 * Converts a raw placeId string (as stored in the backend) into the form value used by the UI.
 * - null or empty string → Disabled (no TBYB experience configured)
 * - 'DEFAULT'            → Default  (Roblox-provided TBYB experience)
 * - Any other string     → Custom   (user-provided Place ID)
 */
export const getTryAssetFormValueFromPlaceId = (placeId: string | null): TryAssetFormValue => {
  if (placeId === null || placeId.length === 0) {
    return { mode: TryAssetMode.Disabled, placeId: null };
  }
  if (placeId === TRY_ASSET_DEFAULT_PLACE_ID) {
    return { mode: TryAssetMode.Default, placeId: null };
  }
  return { mode: TryAssetMode.Custom, placeId };
};

/**
 * Derives the placeId string to send to the backend from the tryAsset form value.
 * Returns null for disabled, 'DEFAULT' for default, or the user-entered placeId for custom.
 */
export const getPlaceIdFromTryAssetFormValue = (tryAsset: TryAssetFormValue): string | null => {
  switch (tryAsset.mode) {
    case TryAssetMode.Disabled:
      return null;
    case TryAssetMode.Default:
      return TRY_ASSET_DEFAULT_PLACE_ID;
    case TryAssetMode.Custom:
      return tryAsset.placeId;
    default:
      return null;
  }
};

// ─── Preview URL ────────────────────────────────────────────────────────────

/**
 * Builds the preview URL for launching a TBYB experience in Roblox.
 * Matches the URL format used by the TryInRobloxButton in creator-marketplace-web:
 *   https://www.{domain}/games/start?placeId={placeId}&launchData={encodedLaunchData}
 */
export const buildTryAssetPreviewUrl = (placeId: string, assetId: number): string => {
  const launchData = JSON.stringify({ [LAUNCH_DATA_ASSET_ID_KEY]: assetId });
  const params = new URLSearchParams({
    placeId,
    launchData,
  });
  return `https://www.${process.env.robloxSiteDomain}/games/start?${params.toString()}`;
};
