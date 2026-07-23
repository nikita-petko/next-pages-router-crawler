import { getProductionCreatorHubUrl } from '@rbx/env-utils';

export const priceFloorLink: string = `${getProductionCreatorHubUrl(process.env.buildTarget)}/dashboard/creations/pricing`;

export const publishingAdvanceLink: string = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/en-us/art/marketplace/marketplace-fees-and-commissions#publishing-advance`;
