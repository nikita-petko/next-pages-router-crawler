import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
// eslint-disable-next-line no-restricted-imports -- deep import; localization root barrel removed
import TranslatorPortalContainer from '@modules/localization/translation/container/TranslatorPortalContainer';
import Authenticated from '@modules/authentication/Authenticated';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';

const getTranslatorPortalPageLayout = (page: ReactNode) => (
  <IALayoutExperiment title='Heading.Localization'>{page}</IALayoutExperiment>
);

const TranslatorPortal: NextLayoutPage = () => {
  return (
    <Authenticated>
      <TranslatorPortalContainer />
    </Authenticated>
  );
};

TranslatorPortal.getPageLayout = getTranslatorPortalPageLayout;

export default TranslatorPortal;
