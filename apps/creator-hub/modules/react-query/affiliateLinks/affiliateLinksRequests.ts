import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  AffiliateLinksApi,
  SortOrder,
  ReferralCodeType,
  FallbackType,
} from '@rbx/clients/affiliateLinksApi';

export { ReferralCodeType };

const basePath = getBEDEV2ServiceBasePath('affiliate-links');
const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

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
