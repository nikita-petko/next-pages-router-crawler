const CREATIONS_PATH = '/dashboard/creations';
const CREDENTIALS_PATH = '/credentials';
const CREATIONS_UPLOAD_PATH = '/dashboard/creations/upload';
const HOME_PATH = '/';
const ANALYTICS_HOME_PATH = '/dashboard/analytics';

const GROUP_PROFILE_PATH = '/dashboard/group/profile';
const GROUP_MEMBERS_PATH = '/dashboard/group/members';
const GROUP_ACTIVITY_HISTORY_PATH = '/dashboard/group/activity-history';
const GROUP_PAYOUTS_PATH = '/dashboard/group/payouts';
const GROUP_ROLES_PATH = '/dashboard/group/roles';

// Helper for identiyfing dynamic group paths
const isGroupPath = (pathname: string | undefined): boolean => {
  return !!pathname && pathname.startsWith('/dashboard/group/');
};

const groupSelectAcceptedPaths = new Set([
  CREATIONS_PATH,
  CREDENTIALS_PATH,
  CREATIONS_UPLOAD_PATH,
  HOME_PATH,
  ANALYTICS_HOME_PATH,
  GROUP_PROFILE_PATH,
  GROUP_MEMBERS_PATH,
  GROUP_ACTIVITY_HISTORY_PATH,
  GROUP_PAYOUTS_PATH,
  GROUP_ROLES_PATH,
]);

export const isAcceptedGroupPath = (pathname: string | undefined): boolean => {
  if (!pathname) return false;
  return groupSelectAcceptedPaths.has(pathname) || isGroupPath(pathname);
};

export const groupsMembershipLimit = 100;
