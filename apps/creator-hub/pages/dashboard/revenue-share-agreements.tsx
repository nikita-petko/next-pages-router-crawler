import type { FunctionComponent } from 'react';
import type { NextLayoutPage } from 'next';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { isRevenueShareAgreementsEnabled } from '@generated/flags/creatorBusiness';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import Authenticated from '@modules/authentication/Authenticated';
import getFinanceLayout from '@modules/finance/getFinanceLayout';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareLandingView from '@modules/revenue-share/components/RevShareLandingView';
import type {
  ManagerAgreement,
  RecipientAgreement,
} from '@modules/revenue-share/interface/RevShareViewModel';

// Hoisted so `RevShareLandingView` receives stable array references; it feeds these into
// `useMemo` dependency arrays, and a fresh `[]` literal on every render would defeat that memoization.
const EMPTY_MANAGER_ROWS: ManagerAgreement[] = [];
const EMPTY_RECIPIENT_ROWS: RecipientAgreement[] = [];

// `Heading.RecipientRevenueShareAgreements` isn't registered in Translations Hub yet, so this
// layout title (unlike the page's in-content heading) can't use `<Translate>` directly; it needs
// its own component so the pending-translation hook can run once mounted inside the layout tree.
const RecipientRevShareAgreementsTitle: FunctionComponent = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  return (
    <>
      {tPendingTranslation(
        'Revenue Share Agreements',
        'Layout title for the recipient revenue share agreements page.',
        translationKey(
          'Heading.RecipientRevenueShareAgreements',
          TranslationNamespace.RevenueShareAgreements,
        ),
      )}
    </>
  );
};

const MyRevShareAgreements: NextLayoutPage = () => {
  const { ready, value: isEnabled } = useFlag(isRevenueShareAgreementsEnabled);
  if (!ready) {
    return <PageLoading />;
  }
  if (!isEnabled) {
    return <PageNotFound />;
  }
  return (
    <Authenticated>
      <RevShareLandingView
        managerRows={EMPTY_MANAGER_ROWS}
        recipientRows={EMPTY_RECIPIENT_ROWS}
        isUserView
      />
    </Authenticated>
  );
};

MyRevShareAgreements.getPageLayout = (page) =>
  getFinanceLayout(page, { title: <RecipientRevShareAgreementsTitle /> });
MyRevShareAgreements.loggerConfig = { rosId: RosTeams.CreatorBusiness };

export default MyRevShareAgreements;
