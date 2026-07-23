import { getProductionCreatorHubUrl } from '@rbx/env-utils';

export const ASSET_BASE_PATH = `${process.env.assetPathPrefix}/referral-reward-details`;
export const REFERRAL_SYSTEM_DOCS_URL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/promotion/referral-system`;
export const GIFT_BOX_ICON_URL = `${ASSET_BASE_PATH}/giftBox.png`;
export const GIFT_BOX_BACKGROUND_COLOR = '#222328';
export const CONTENT_MUTED_COLOR = '#BBBCBE';
