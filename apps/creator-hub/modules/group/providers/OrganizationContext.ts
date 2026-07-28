import { createContext } from 'react';
import type { OrganizationPermissions, Organization } from '@modules/clients/organizationApi';

export interface OrganizationContextValue {
  isOrganizationRefreshRequired: boolean;
  organization: Organization | null | undefined;
  permissions: OrganizationPermissions | null | undefined;
  refreshOrganization: () => void;
  refreshPermission: () => Promise<void>;
  isOrganizationLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue>({
  isOrganizationRefreshRequired: false,
  organization: undefined,
  permissions: undefined,
  refreshOrganization: () => ({}),
  refreshPermission: () => Promise.resolve(),
  isOrganizationLoading: false,
});
OrganizationContext.displayName = 'Organization';

export default OrganizationContext;
