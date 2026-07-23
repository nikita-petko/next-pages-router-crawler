import { talentHubImage, fundingImage, ipLicensingImage } from './assetConstants';

export type TOpportunityData = {
  id: string;
  pillKey: string;
  titleKey: string;
  descriptionKey: string;
  imageSrc: string;
  imgAlt: string;
  href: string;
};

export const opportunityData: Array<TOpportunityData> = [
  {
    id: 'talent-hub',
    pillKey: 'Label.OpportunityTalentHub',
    titleKey: 'Heading.OpportunityTalentHub',
    descriptionKey: 'Description.OpportunityTalentHub',
    imageSrc: talentHubImage,
    imgAlt: 'Talent Hub Opportunity',
    href: '/hire',
  },
  {
    id: 'funding',
    pillKey: 'Label.OpportunityFunding',
    titleKey: 'Heading.OpportunityFunding',
    descriptionKey: 'Description.OpportunityFunding',
    imageSrc: fundingImage,
    imgAlt: 'Funding Opportunity',
    href: '/build',
  },
  {
    id: 'ip-licensing',
    pillKey: 'Label.OpportunityIPLicensing',
    titleKey: 'Heading.OpportunityIPLicensing',
    descriptionKey: 'Description.OpportunityIPLicensing',
    imageSrc: ipLicensingImage,
    imgAlt: 'IP Licensing Opportunity',
    href: '/explore/licenses',
  },
];
