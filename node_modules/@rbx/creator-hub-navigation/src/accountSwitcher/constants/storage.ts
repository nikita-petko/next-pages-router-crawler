export const SWITCHED_ACCOUNT_USERS_STORAGE_KEY = 'creatorHubSwitchedAccounts';

export type SwitchedAccountUsersStorage = {
  switchedFromUserId: number;
  switchedToUserId: number;
};
