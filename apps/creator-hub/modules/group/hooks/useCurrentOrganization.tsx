import { useContext } from 'react';
import organizationContext from '../providers/OrganizationContext';

export default function useCurrentOrganization() {
  return useContext(organizationContext);
}
