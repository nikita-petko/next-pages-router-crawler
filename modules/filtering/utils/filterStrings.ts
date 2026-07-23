const FilterStrings: { [key: string]: string } = {
  'Action.Apply': 'Apply',
  'Action.Cancel': 'Close',
  // Chip/pills
  'Action.DeleteFilter': 'DELETE FILTER',
  // Filter button strings
  'Action.FilterBy': 'Filters',
  'Action.ResetAll': 'Reset All',
  // Drawer strings
  'Description.FilterDrawer.FilterByCategory': 'Filter',
  'Description.UnsupportedFilter': 'UNSUPPORTED FILTER',
};

export const getText = (key: string): string => {
  return FilterStrings[key] || '';
};
