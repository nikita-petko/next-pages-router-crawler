import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import TranslatorPortalContainer from '@modules/localization/translation/container/TranslatorPortalContainer';

const getTranslatorPortalPageLayout = (page: ReactNode) => (
  <CreatorHubLayout
    title={
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Localization' />
    }>
    {page}
  </CreatorHubLayout>
);

const TranslatorPortal: NextLayoutPage = () => {
  return (
    <Authenticated>
      <TranslatorPortalContainer />
    </Authenticated>
  );
};

TranslatorPortal.getPageLayout = getTranslatorPortalPageLayout;
TranslatorPortal.loggerConfig = { rosId: RosTeams.Localization };

export default TranslatorPortal;
