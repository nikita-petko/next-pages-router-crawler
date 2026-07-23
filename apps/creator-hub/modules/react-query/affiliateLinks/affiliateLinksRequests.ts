import type { SortOrder, FallbackType } from '@rbx/client-affiliate-links-api/v1';
import { AffiliateLinksApi, ReferralCodeType } from '@rbx/client-affiliate-links-api/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

export { ReferralCodeType };

const configuration = createClientConfiguration('affiliate-links', 'bedev2');

const affiliateLinksApi = new AffiliateLinksApi(configuration);

export type TGetAffiliateLinksProps = {
  maxPageSize?: number;
  sortOrder?: SortOrder;
  pageToken?: string;
};
export const getAffiliateLinks = (requestProps: TGetAffiliateLinksProps) => {
  return affiliateLinksApi.affiliateLinksListAffiliateLinksByUser(requestProps);
};

export type TGetGroupAffiliateLinksProps = TGetAffiliateLinksProps & { groupId: number };
export const getGroupAffiliateLinks = (requestProps: TGetGroupAffiliateLinksProps) => {
  return affiliateLinksApi.affiliateLinksListAffiliateLinksByGroup(requestProps);
};

export const getUserCreatorMetadata = () => {
  return affiliateLinksApi.affiliateLinksGetCreatorMetadataByUser();
};

export const getGroupCreatorMetadata = (groupId: number) => {
  return affiliateLinksApi.affiliateLinksGetCreatorMetadataByGroup({ groupId });
};

export const getRequirements = () => {
  return affiliateLinksApi.affiliateLinksGetRequirementsByUser();
};

export const getGroupEligibility = (groupId: number) => {
  return affiliateLinksApi.affiliateLinksGetEligibilityByGroup({ groupId });
};

export const getUniverseEligibility = (universeId: number) => {
  return affiliateLinksApi.affiliateLinksGetUniverseEligibilityById({ universeId });
};

export type TCreateAffiliateLinkProps = {
  campaignName: string;
  universeId?: number;
  launchData?: string;
  fallbackType?: FallbackType;
};
export const createAffiliateLink = (requestProps: TCreateAffiliateLinkProps) => {
  return affiliateLinksApi.affiliateLinksCreateAffiliateLinkByUser({
    affiliateLinksCreateAffiliateLinkByUserRequest: requestProps,
  });
};

export type TEditAffiliateLinkProps = {
  linkId: string;
  universeId?: number;
  launchData?: string;
  fallbackType?: FallbackType;
};
export const editAffiliateLink = (requestProps: TEditAffiliateLinkProps) => {
  return affiliateLinksApi.affiliateLinksUpdateAffiliateLinkByUser({
    affiliateLinksUpdateAffiliateLinkByUserRequest: requestProps,
  });
};

export type TCreateGroupAffiliateLinkProps = TCreateAffiliateLinkProps & { groupId: number };
export const createGroupAffiliateLink = ({
  groupId,
  ...requestProps
}: TCreateGroupAffiliateLinkProps) => {
  return affiliateLinksApi.affiliateLinksCreateAffiliateLinkByGroup({
    groupId,
    affiliateLinksCreateAffiliateLinkByUserRequest: requestProps,
  });
};

export type TEditGroupAffiliateLinkProps = TEditAffiliateLinkProps & { groupId: number };
export const editGroupAffiliateLink = ({
  groupId,
  ...requestProps
}: TEditGroupAffiliateLinkProps) => {
  return affiliateLinksApi.affiliateLinksUpdateAffiliateLinkByGroup({
    groupId,
    affiliateLinksUpdateAffiliateLinkByUserRequest: requestProps,
  });
};
