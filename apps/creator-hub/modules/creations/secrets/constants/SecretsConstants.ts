export const confirmButtonInactiveTime = 2000;
export const MAX_SECRETS = 500;
export const SECRETS_TABLE_ROWS_PER_PAGE_OPTIONS = [10, 20, 50];
export const DEFAULT_SECRETS_TABLE_ROWS_PER_PAGE = 10; // must be an element in above variable
export const MAX_ID_LENGTH = 64;
export const MAX_SECRET_LENGTH = 1024;
export const MAX_DOMAIN_LENGTH = 255;

export const translateEditStatusCode: { [id: string]: string } = {
  409: 'Description.SecretExists',
  403: 'Heading.AccessDenied',
  404: 'Description.SecretDoesNotExist',
};

export const translateDeleteStatusCode: { [id: string]: string } = {
  404: 'Description.SecretDoesNotExist',
  403: 'Heading.AccessDenied',
  400: 'Label.SecretIdRequirements',
};
