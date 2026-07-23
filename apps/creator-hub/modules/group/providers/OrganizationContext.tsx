import { createContext } from 'react';
import type { OrganizationPermissions, Organization } from '@modules/clients/organizationApi';

export interface OrganizationContextValue {
  isOrganizationRefreshRequired: boolean;
  organization: Organization | null | undefined;
  permissions: OrganizationPermissions | null | undefined;
  refreshOrganization: () => void;
  refreshPermission: () => void;
  isOrganizationLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue>({
  isOrganizationRefreshRequired: false,
  organization: undefined,
  permissions: undefined,
  refreshOrganization: () => ({}),
  refreshPermission: () => ({}),
  isOrganizationLoading: false,
});
OrganizationContext.displayName = 'Organization';

export default OrganizationContext;
