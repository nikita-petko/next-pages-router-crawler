import type { ReactNode } from 'react';
import { Translate } from '@rbx/intl';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import UserBansPermissionsContainer from '../components/UserBansPermissionsContainer';
import { UserBansStateProvider } from './UserBansStateProvider';

export default function getUserBansPageLayout(page: ReactNode) {
  return getCreationsPageLayout(
    <UserBansStateProvider>
      <UserBansPermissionsContainer>{page}</UserBansPermissionsContainer>
    </UserBansStateProvider>,
    {
      title: (
        <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Moderation' />
      ),
    },
  );
}
