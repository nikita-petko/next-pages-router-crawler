/**
 * 1x2 tile copy defaults for experience-targeted (non-clickout) ads: empty
 * headline → experience name, empty subtitle → maturity label. Clickout ads
 * ignore the game, so they never receive these fallbacks.
 *
 * The creation preview uses this permanently (the tile is not the lua-apps
 * client). Persist-on-create uses {@link resolveOneByTwoTileServedCopy} only
 * until lua-apps does the same default itself.
 */
export const resolveOneByTwoTilePreviewCopy = ({
  ageRating,
  applyExperienceCopyDefaults = false,
  experienceName,
  headline,
  subtitle,
}: {
  ageRating?: string;
  applyExperienceCopyDefaults?: boolean;
  experienceName?: string;
  headline?: string;
  subtitle?: string;
}): { headline: string; subtitle: string } => ({
  headline:
    headline?.trim() || (applyExperienceCopyDefaults ? experienceName?.trim() : undefined) || '',
  subtitle: subtitle?.trim() || (applyExperienceCopyDefaults ? ageRating?.trim() : undefined) || '',
});

/**
 * TEMPORARY: lua-apps 1x2 does not yet default empty headline/subtitle to the
 * experience name and maturity label on non-clickout ads. Fill them on create
 * so the served tile matches the builder preview.
 *
 * Remove this function and its call in `useTransformFormToCampaign` once that
 * client change has rolled out. Keep {@link resolveOneByTwoTilePreviewCopy} —
 * the web preview still needs the defaults.
 */
export const resolveOneByTwoTileServedCopy = ({
  ageRating,
  applyExperienceCopyDefaults = false,
  experienceName,
  headline,
  subtitle,
}: {
  ageRating?: string;
  applyExperienceCopyDefaults?: boolean;
  experienceName?: string;
  headline?: string;
  subtitle?: string;
}): { headline: string; subtitle?: string } => {
  const preview = resolveOneByTwoTilePreviewCopy({
    ageRating,
    applyExperienceCopyDefaults,
    experienceName,
    headline,
    subtitle,
  });
  return {
    headline: preview.headline,
    ...(preview.subtitle ? { subtitle: preview.subtitle } : {}),
  };
};
