type TTileSize = {
  large: { width: number; height: number };
  small: { width: number; height: number };
};

// NOTE (jcountryman, 06/30/23): This is measured height from the DOM.
export const ExperienceWithAnalyticsTileSize: TTileSize = {
  large: { width: 400, height: 484 },
  small: { width: 250, height: 327 },
};

export const ExperienceWithAnalyticsTileSizeV2 = {
  width: 250,
  height: 258,
};

export const ExperienceTileSize: TTileSize = {
  large: { width: 400, height: 484 },
  small: { width: 250, height: 207 },
};

export const AvatarItemTileSize: TTileSize = {
  large: { width: 250, height: 447 },
  small: { width: 200, height: 307 },
};

export const AvatarItemWithAnalyticsTileSize: TTileSize = {
  large: { width: 400, height: 447 },
  small: { width: 250, height: 307 },
};

export const NextStepsTileSize: TTileSize = {
  large: { width: 330, height: 198 },
  small: { width: 250, height: 160 },
};

export const WhatsNewTileSize: TTileSize = {
  large: { width: 330, height: 192 },
  small: { width: 250, height: 200 },
};

export const WhatsNewRedesignedTileSize: TTileSize = {
  large: { width: 416, height: 176 },
  small: { width: 250, height: 200 },
};

export const ArticleTileSize: TTileSize = {
  large: { width: 330, height: 342 },
  small: { width: 250, height: 250 },
};

export const TileWithThumbnailSize = {
  width: 250,
  height: 140,
};

export type TShowMoreTile = { id: number; type: 'showMore' };
export const getShowMoreTileData = () => ({
  // NOTE (jcountryman, 07/05/23): Using an id of -1 since it will be used as
  // react element key. This prevents it from any possible collision with actual
  // ids (i.e. only positive numbers allowed in the backend)
  id: -1,
  type: 'showMore' as const,
});
