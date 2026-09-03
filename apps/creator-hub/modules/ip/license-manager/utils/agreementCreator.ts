import { AccountOwnerTypeEnum } from '@rbx/client-rights/v1';
import groupsClient from '@modules/clients/groups';
import rightsClient from '@modules/clients/rights';
import usersClient from '@modules/clients/users';
import { CreatorType } from '@modules/miscellaneous/common';

export interface AgreementCreator {
  creatorName: string;
  creatorType?: CreatorType;
}

/**
 * Resolves the Roblox handle behind a Rights account owner. The creator's name is
 * supplementary to the rest of the page, so lookup failures resolve to no creator.
 */
export const getAccountOwnerCreator = async (
  ownerId?: string,
  ownerType?: AccountOwnerTypeEnum,
): Promise<AgreementCreator | undefined> => {
  const numericOwnerId = Number(ownerId);
  if (!(numericOwnerId > 0)) {
    return undefined;
  }

  if (ownerType === AccountOwnerTypeEnum.RobloxGroup) {
    const group = await groupsClient.getGroupInfo(numericOwnerId).catch(() => undefined);
    return group?.name ? { creatorName: group.name, creatorType: CreatorType.Group } : undefined;
  }

  if (ownerType === AccountOwnerTypeEnum.RobloxUser) {
    const user = await usersClient.getUserById(numericOwnerId).catch(() => undefined);
    return user?.name ? { creatorName: user.name, creatorType: CreatorType.User } : undefined;
  }

  return undefined;
};

/**
 * Resolves the creator behind the agreement's target Rights account. Licenses that
 * target a universe read the creator off the hydrated universe instead; this covers
 * the ones that do not, e.g. Avatar Marketplace.
 */
export const getTargetAccountCreator = async (
  targetAccountId: string,
): Promise<AgreementCreator | undefined> => {
  const account = await rightsClient.getAccount(targetAccountId).catch(() => undefined);
  return getAccountOwnerCreator(account?.ownerId, account?.ownerType);
};
