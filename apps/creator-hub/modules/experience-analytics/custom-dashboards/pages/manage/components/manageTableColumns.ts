/** Ordered manage-table column keys shared by header, body, and skeleton rows. */
// `permissions` is a placeholder column for a future sharing flag; v1 ships a
// static "Private" stub for every row until per-dashboard sharing lands.
export const MANAGE_TABLE_COLUMNS = [
  'name',
  'createdBy',
  'modifiedBy',
  'lastModified',
  'permissions',
  'pinToSidebar',
  'actions',
] as const;

export const MANAGE_TABLE_COLUMN_COUNT = MANAGE_TABLE_COLUMNS.length;
