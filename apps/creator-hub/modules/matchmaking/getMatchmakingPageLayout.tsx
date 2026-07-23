import type { ReactNode } from 'react';
import { Translate } from '@rbx/intl';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import UniversePlacesProvider from './providers/UniversePlacesProvider';

export default function getMatchmakingPageLayout(page: ReactNode) {
  return getCreationsPageLayout(<UniversePlacesProvider>{page}</UniversePlacesProvider>, {
    title: (
      <Translate
        namespace='CreatorDashboard.Navigation'
        translationKey='Heading.CustomMatchmaking'
      />
    ),
  });
}
