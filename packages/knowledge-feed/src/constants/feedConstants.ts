export const TileSize = {
  width: 250,
  height: 140,
};

export const formatKnowledgeFeedLocalStorageKey = (surfaceType: string, feedTypes?: string[]) => {
  if (!feedTypes || feedTypes.length === 0) {
    return `knowledgeFeed-${surfaceType}`;
  }
  return `knowledgeFeed-${surfaceType}-${feedTypes.join(',')}`;
};
