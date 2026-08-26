import type { ReactNode } from 'react';
import { Translate } from '@rbx/intl';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';

/**
 * Showcase pages render their own heading under the breadcrumb, so the layout
 * title is only used for the browser tab.
 */
const getShowcasePageLayout = (page: ReactNode) => (
  <CreatorHubLayout
    omitPageTitle
    title={
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Creations' />
    }>
    {page}
  </CreatorHubLayout>
);

export default getShowcasePageLayout;
