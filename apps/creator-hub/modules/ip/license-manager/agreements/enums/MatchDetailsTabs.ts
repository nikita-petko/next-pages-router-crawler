enum MatchDetailsTabs {
  Details = 'Details',
  Gallery = 'Gallery',
}

export function isMatchDetailsTab(value: string | undefined): value is MatchDetailsTabs {
  return value === MatchDetailsTabs.Details || value === MatchDetailsTabs.Gallery;
}

export default MatchDetailsTabs;
