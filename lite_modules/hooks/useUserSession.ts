import { useContext } from 'react';

import UserSessionContext from '@components/auth/UserSessionContext';

export default function useUserSession() {
  return useContext(UserSessionContext);
}
