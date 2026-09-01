import { ResourceType } from '@rbx/client-ownership-transfer-api/v1';
import { AccessTimeIcon, CancelPresentationIcon, ShieldIcon, WarningIcon } from '@rbx/ui';
import { getActivitiesUrl } from '@modules/cloud-services/utils/common';
import { Asset } from '@modules/miscellaneous/common';
import { creatorHub, www } from '@modules/miscellaneous/urls';
import type {
  TOwnershipTransferDialogVariant,
  TOwnershipTransferResource,
  TSupportedEligibilityChecks,
  TSupportedOwnershipTransferResourceTypes,
} from '../types';

type TDisclaimerItem = {
  IconComponent: typeof AccessTimeIcon;
  title: string;
  description: string;
};

const durationDisclaimerItem: TDisclaimerItem = {
  IconComponent: AccessTimeIcon,
  title: 'Heading.Duration',
  description: 'Description.GroupDuration',
};

const immersiveAdsDisclaimerItem: TDisclaimerItem = {
  IconComponent: CancelPresentationIcon,
  title: 'Heading.ImmersiveAdsDisclaimer',
  description: 'Description.ImmersiveAdsDisclaimer',
};

const groupOwnershipTransferInitiateContent: Array<TDisclaimerItem> = [
  {
    ...durationDisclaimerItem,
  },
  { ...immersiveAdsDisclaimerItem },
  {
    IconComponent: WarningIcon,
    title: 'Heading.LoseGroupPermissions',
    description: 'Description.LoseGroupPermissions',
  },
];

const groupOwnershipTransferReceiveContent: Array<TDisclaimerItem> = [
  {
    IconComponent: ShieldIcon,
    title: 'Heading.AssumptionOfResponsibility',
    description: 'Description.GroupAssumptionOfResponsibility',
  },
  {
    ...durationDisclaimerItem,
  },
  { ...immersiveAdsDisclaimerItem },
];

type TVariantToResourceTypeMap<Content> = {
  [RT in TSupportedOwnershipTransferResourceTypes]?: {
    [DV in TOwnershipTransferDialogVariant]?: Content;
  };
};

const variantToContentMap: TVariantToResourceTypeMap<Array<TDisclaimerItem>> = {
  Group: {
    Initiate: groupOwnershipTransferInitiateContent,
    Receive: groupOwnershipTransferReceiveContent,
  },
};

type TVerificationContent = {
  description: string;
  inputLabel: string;
};

const ownershipTransferVerificationContent: Record<
  TSupportedOwnershipTransferResourceTypes,
  TVerificationContent
> = {
  [ResourceType.Group]: {
    description: 'Description.GroupVerification',
    inputLabel: 'Label.GroupName',
  },
};

type TOwnerSelectionContent = {
  description: string;
};
const ownershipTransferOwnerSelectionContent: Record<
  TSupportedOwnershipTransferResourceTypes,
  TOwnerSelectionContent
> = {
  [ResourceType.Group]: {
    description: 'Description.GroupOwnerSelection',
  },
};

const ownershipTransferResourceTypeToTranslationString: Record<
  TSupportedOwnershipTransferResourceTypes,
  string
> = {
  Group: 'Label.Group',
};

type TActionLinkFunctionParams = TOwnershipTransferResource;

export type TOwnershipTransferEligibilityContent = {
  title: string;
  description: string;
  actionText?: string;
  actionLink?: (params: TActionLinkFunctionParams) => string;
};

const ownershipTransferEligibilityContent: {
  [R in TSupportedOwnershipTransferResourceTypes]: Record<
    TSupportedEligibilityChecks<R>,
    TOwnershipTransferEligibilityContent
  >;
} = {
  Group: {
    // `isUsingSupportedMfaMethod` is the server-side OR of EPP enrollment and a
    // non-recovery 2SV method (see `MfaEligibilityUtils` in `ownership-transfer-api`).
    isUsingSupportedMfaMethod: {
      title: 'Title.HasTwoFactorAuthentication',
      description: 'Description.HasTwoFactorAuthentication',
      actionText: 'Action.HasTwoFactorAuthentication',
      actionLink: () => www.getAccountSecurityUrl(),
    },
    isEligibleExtendedServices: {
      title: 'Title.IsEligibleExtendedServices',
      description: 'Description.IsEligibleExtendedServices',
      actionText: 'Action.IsEligibleExtendedServices',
      actionLink: ({ resourceId: groupId }) => getActivitiesUrl(undefined, groupId.toString()),
    },
    isEligiblePaidAccessInLocalCurrency: {
      title: 'Title.IsEligiblePaidAccessInLocalCurrency',
      description: 'Description.IsEligiblePaidAccessInLocalCurrency',
      actionText: 'Action.IsEligiblePaidAccessInLocalCurrency',
      actionLink: ({ resourceId: groupId }) =>
        creatorHub.dashboard.getUrl(groupId.toString(), Asset.MyExperiences),
    },
    // NOTE: There is no good place to link to for this, and a decision was made to have no action.
    isEligibleCommerceProducts: {
      title: 'Title.IsEligibleCommerceItems',
      description: 'Description.IsEligibleCommerceItems',
    },
    isEligibleForumAgeVerification: {
      title: 'Title.IsEligibleForumAgeVerification',
      description: 'Description.IsEligibleForumAgeVerification',
      actionText: 'Action.IsEligibleForumAgeVerification',
      actionLink: () => www.getAccountSettingsUrl(),
    },
    isEligibleForRestrictedCategories: {
      title: 'Title.IsEligibleForumAgeVerification',
      description: 'Description.IsEligibleForRestrictedCategories',
      actionText: 'Action.IsEligibleForumAgeVerification',
      actionLink: () => www.getAccountSettingsUrl(),
    },
  },
};

const getTransferDisclaimerContent = (
  variant: TOwnershipTransferDialogVariant | null,
  resourceType: TSupportedOwnershipTransferResourceTypes,
) => {
  if (variant === null) {
    return [];
  }
  return variantToContentMap[resourceType]?.[variant] ?? [];
};

export {
  ownershipTransferVerificationContent,
  ownershipTransferOwnerSelectionContent,
  ownershipTransferResourceTypeToTranslationString,
  ownershipTransferEligibilityContent,
  getTransferDisclaimerContent,
};
