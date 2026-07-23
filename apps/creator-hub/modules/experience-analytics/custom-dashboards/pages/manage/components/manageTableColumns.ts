/** Ordered manage-table column keys shared by header, body, and skeleton rows. */
export const MANAGE_TABLE_COLUMNS = [
  'name',
  'createdBy',
  'modifiedBy',
  'lastModified',
  'pinToSidebar',
  'actions',
] as const;

export const MANAGE_TABLE_COLUMN_COUNT = MANAGE_TABLE_COLUMNS.length;
