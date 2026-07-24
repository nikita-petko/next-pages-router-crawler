// Defines the authenticated group revenue share agreements page with feature gating and layout.
import type { FunctionComponent } from 'react';
import type { NextLayoutPage } from 'next';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { isRevenueShareAgreementsEnabled } from '@generated/flags/creatorBusiness';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import Authenticated from '@modules/authentication/Authenticated';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareGroupAgreementsContainer from '@modules/revenue-share/containers/RevShareGroupAgreementsContainer';

const ManagedRevShareAgreementsTitle: FunctionComponent = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  return (
    <>
      {tPendingTranslation(
        'Revenue Share Agreements',
        'Layout title for the managed (group) revenue share agreements page.',
        translationKey(
          'Heading.ManagedRevenueShareAgreements',
          TranslationNamespace.RevenueShareAgreements,
        ),
      )}
    </>
  );
};

const RevShareGroupPage: NextLayoutPage = () => {
  const { ready, value: isEnabled } = useFlag(isRevenueShareAgreementsEnabled);
  if (!ready) {
    return <PageLoading />;
  }
  if (!isEnabled) {
    return <PageNotFound />;
  }
  return (
    <Authenticated>
      <RevShareGroupAgreementsContainer />
    </Authenticated>
  );
};

RevShareGroupPage.getPageLayout = (page) =>
  getOrganizationLayout(page, {
    title: <ManagedRevShareAgreementsTitle />,
    financeRail: true,
  });
RevShareGroupPage.loggerConfig = { rosId: RosTeams.CreatorBusiness };

export default RevShareGroupPage;
