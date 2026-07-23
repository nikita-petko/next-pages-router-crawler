import type { AffiliateLink } from '@rbx/client-affiliate-links-api/v1';

const getShareLink = (affiliateLink: Partial<AffiliateLink>) => {
  const { referralCode } = affiliateLink;
  return `https://www.${process.env.robloxSiteDomain}/join/${referralCode}`;
};

export default getShareLink;
