const rootIpFamilitiesKey = 'am_ipFamilies';
export const IP_FAMILIES_QUERY_KEY = [rootIpFamilitiesKey];
export const GET_IP_FAMILY_QUERY_KEY = (id: string) => [rootIpFamilitiesKey, id];
export const LIST_IP_FAMILIES = (
  id: string,
  pageSize: number | undefined,
  pageToken: string | undefined,
) => [rootIpFamilitiesKey, id, pageSize ?? 0, pageToken ?? ''];

const rootIpContentKey = 'am_ipContent';
export const IP_CONTENTS_QUERY_KEY = [rootIpContentKey];
export const GET_IP_CONTENT_BY_ID = (
  accountId: string | undefined,
  ipContentId: string | undefined,
) => [...IP_CONTENTS_QUERY_KEY, 'by-id', accountId, ipContentId];
export const LIST_IP_CONTENTS_BY_FAMILY = (id: string) => [rootIpContentKey, id];
export const LIST_IP_CONTENTS_BY_FAMILY_PAGINATED = (
  id: string,
  pageSize: number | undefined,
  pageToken: string | undefined,
) => [rootIpContentKey, id, pageSize ?? 0, pageToken ?? ''];

const rootIpContentByAccountKey = 'am_ipContent_by_account';
export const LIST_IP_CONTENTS_BY_ACCOUNT = (accountId: string, filter: string | undefined) => [
  rootIpContentByAccountKey,
  accountId,
  filter ?? '',
];
export const HAS_APPROVED_SEARCHABLE_IMAGES = (accountId: string) => [
  rootIpContentByAccountKey,
  accountId,
  'has_approved_searchable_images',
];
export const LIST_IP_CONTENTS_BY_ACCOUNT_PAGINATED = (
  accountId: string,
  filter: string | undefined,
  pageSize: number | undefined,
  pageToken: string | undefined,
) => [rootIpContentByAccountKey, accountId, filter ?? '', pageSize ?? 0, pageToken ?? ''];
export const LIST_IP_CONTENTS_BY_ACCOUNT_INFINITE = (
  accountId: string,
  filter: string | undefined,
  pageSize: number | undefined,
) => [rootIpContentByAccountKey, accountId, filter ?? '', 'infinite', pageSize ?? 0];
