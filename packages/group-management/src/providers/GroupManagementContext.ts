import { createContext } from 'react';
import type { Organization, OrganizationPermissions } from '../clients/organizationApi';
import type {
  GroupData,
  AuthenticatedUser,
  GroupManagementSurface,
  GroupManagementNavigation,
  GroupManagementStudio,
  GroupManagementErrorComponents,
  GroupManagementLogger,
} from '../utils/types';

export interface GroupManagementContextValue {
  group: GroupData;
  user: AuthenticatedUser;
  surface: GroupManagementSurface;
  navigation: GroupManagementNavigation;
  organization: Organization | null | undefined;
  permissions: OrganizationPermissions | null | undefined;
  refreshOrganization: () => void;
  refreshPermission: () => Promise<void>;
  showToast: (message: string, isError?: boolean) => void;
  isOrganizationRefreshRequired: boolean;
  isOrganizationLoading: boolean;
  studio?: GroupManagementStudio;
  errorComponents?: GroupManagementErrorComponents;
  unifiedLogger?: GroupManagementLogger;
}

const GroupManagementContext = createContext<GroupManagementContextValue | null>(null);
GroupManagementContext.displayName = 'GroupManagement';

export default GroupManagementContext;
