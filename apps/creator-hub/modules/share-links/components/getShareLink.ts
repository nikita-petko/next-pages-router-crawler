import { AffiliateLink } from '@rbx/clients/affiliateLinksApi';

const getShareLink = (affiliateLink: Partial<AffiliateLink>) => {
  const { referralCode } = affiliateLink;
  return `https://www.${process.env.robloxSiteDomain}/join/${referralCode}`;
};

export default getShareLink;
