import React, { ReactNode } from 'react';
import { getCreationsPageLayout } from '@modules/creations';
import UserBansPermissionsContainer from '../components/UserBansPermissionsContainer';
import { UserBansStateProvider } from './UserBansStateProvider';

export default function getUserBansPageLayout(page: ReactNode) {
  return getCreationsPageLayout(
    <UserBansStateProvider>
      <UserBansPermissionsContainer>{page}</UserBansPermissionsContainer>
    </UserBansStateProvider>,
    { title: 'Heading.Moderation' },
  );
}
