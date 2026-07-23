const rootIpFamilitiesKey = 'am_ipFamilies';
export const IP_FAMILIES_QUERY_KEY = [rootIpFamilitiesKey];
export const GET_IP_FAMILY_QUERY_KEY = (id: string) => [rootIpFamilitiesKey, id];
export const LIST_IP_FAMILIES = (
  id: string,
  pageSize: number | undefined,
  pageToken: string | undefined,
) => [rootIpFamilitiesKey, id, pageSize || 0, pageToken || ''];

const rootIpContentKey = 'am_ipContent';
export const IP_CONTENTS_QUERY_KEY = [rootIpContentKey];
export const LIST_IP_CONTENTS_BY_FAMILY = (id: string) => [rootIpContentKey, id];
export const LIST_IP_CONTENTS_BY_FAMILY_PAGINATED = (
  id: string,
  pageSize: number | undefined,
  pageToken: string | undefined,
) => [rootIpContentKey, id, pageSize || 0, pageToken || ''];
