import itemConfigurationClient from './itemconfiguration';
import getResponseFromError from './utils/getResponseFromError';

// item-configuration-api serializes these enums NUMERICALLY on the wire. Confirmed against
// sitetest3: creating with NonLimited/ShopAndAllExperiences returns
// `"publishingType": 2, "saleLocationType": 1`. The [EnumMember] string names on the C# enums
// are accepted on the way in but are never emitted on the way out, so anything that reads a
// response has to compare numbers.
// The generated client types these numerically too, but names its members NUMBER_0/NUMBER_1/...,
// so these readable aliases are what callers should use. The names match the C# [EnumMember]
// values so they line up with the API contract.
export const PublishingType = {
  Invalid: 0,
  Limited: 1,
  NonLimited: 2,
} as const;
export type PublishingType = (typeof PublishingType)[keyof typeof PublishingType];

export const SaleLocationType = {
  Invalid: 0,
  ShopAndAllExperiences: 1,
  ExperiencesAndDeveloperApi: 2,
  ShopOnly: 3,
  ShopAndExperiencesById: 4,
} as const;
export type SaleLocationType = (typeof SaleLocationType)[keyof typeof SaleLocationType];

// The generated response type has every field optional, because the spec carries no `required`
// arrays — none of the 100+ definitions in it do. The API always populates these, so narrowing
// once here keeps every caller from re-checking. Anything genuinely nullable server-side
// (creatorGroupId for an individual creator) stays optional.
export type PublishingPreferencesResponse = {
  id: string;
  creatorUserId?: number;
  creatorGroupId?: number;
  publishingType: PublishingType;
  saleLocationType: SaleLocationType;
  places: number[];
  priceInRobux: number;
  priceOffset: number;
  isFree: boolean;
  enableRegionalPricing: boolean;
  isRentalOptIn: boolean;
  autoPublishEnabled: boolean;
  created?: Date;
  updated?: Date;
};

export type CreatePublishingPreferencesRequest = {
  creatorUserId: number;
  // Omitted rather than null for an individual creator: the generated request type has no null,
  // and ICA binds a missing field to its nullable long the same way it binds an explicit null.
  creatorGroupId?: number;
  publishingType: PublishingType;
  saleLocationType: SaleLocationType;
  places: number[];
  priceInRobux: number;
  priceOffset: number;
  isFree: boolean;
  enableRegionalPricing: boolean;
  isRentalOptIn: boolean;
  autoPublishEnabled: boolean;
};

export type UpdatePublishingPreferencesRequest = Partial<CreatePublishingPreferencesRequest> & {
  creatorUserId: number;
};

/**
 * Status of a failed preferences request, or undefined when the failure was not an HTTP response
 * (a network error, or a malformed body). Callers need this to tell "no preferences saved yet",
 * which is a 404 and an expected state, apart from a read that actually broke.
 */
export function getPreferencesErrorStatus(error: unknown): number | undefined {
  // Duck-typed via the shared getResponseFromError rather than `instanceof ResponseError`.
  // The generated client re-exports that class from @rbx/clients-core, and more than one copy of
  // that package can exist in the tree, so instanceof compares against a different class identity
  // and silently returns false — which would make every failure look like a non-404.
  return getResponseFromError(error)?.status;
}

function isPublishingPreferencesResponse(data: {
  id?: string;
  autoPublishEnabled?: boolean;
}): data is PublishingPreferencesResponse {
  return data.id !== undefined && data.autoPublishEnabled !== undefined;
}

function narrow(data: {
  id?: string;
  autoPublishEnabled?: boolean;
}): PublishingPreferencesResponse {
  if (!isPublishingPreferencesResponse(data)) {
    throw new Error('Publishing preferences response was malformed');
  }
  return data;
}

export async function getPublishingPreferences(
  groupId?: number,
): Promise<PublishingPreferencesResponse> {
  return narrow(await itemConfigurationClient.getPublishingPreferences(groupId));
}

export async function createPublishingPreferences(
  body: CreatePublishingPreferencesRequest,
): Promise<PublishingPreferencesResponse> {
  return narrow(await itemConfigurationClient.createPublishingPreferences(body));
}

export async function updatePublishingPreferences(
  body: UpdatePublishingPreferencesRequest,
): Promise<PublishingPreferencesResponse> {
  // PATCH carries the creator in the body (creatorUserId + optional creatorGroupId), mirroring
  // POST — not a groupId query param.
  return narrow(await itemConfigurationClient.updatePublishingPreferences(body));
}

export async function deletePublishingPreferences(groupId?: number): Promise<void> {
  return itemConfigurationClient.deletePublishingPreferences(groupId);
}
