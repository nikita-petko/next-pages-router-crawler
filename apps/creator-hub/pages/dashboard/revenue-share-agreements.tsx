// Provides the recipient revenue-share agreements page entry with feature gating and recipient container mounting.
import { useMemo, type FunctionComponent } from 'react';
import type { NextLayoutPage } from 'next';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { isRevenueShareAgreementsEnabled } from '@generated/flags/creatorBusiness';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import Authenticated from '@modules/authentication/Authenticated';
import { useAuthentication } from '@modules/authentication/providers';
import getFinanceLayout from '@modules/finance/getFinanceLayout';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareRecipientContainer from '@modules/revenue-share/containers/RevShareRecipientContainer';
import {
  RevShareRecipientType,
  type RevShareRecipient,
} from '@modules/revenue-share/interface/RevShareViewModel';
import { FULL_REV_SHARE_ACCESS } from '@modules/revenue-share/utils/revSharePermissions';

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

const RecipientRevShareAgreementsContent: FunctionComponent = () => {
  const { user } = useAuthentication();
  const userId = user?.id;
  const recipient = useMemo<RevShareRecipient | undefined>(
    () =>
      userId !== undefined
        ? {
            type: RevShareRecipientType.User,
            id: String(userId),
          }
        : undefined,
    [userId],
  );

  return (
    <RevShareRecipientContainer
      recipient={recipient}
      canRespond={FULL_REV_SHARE_ACCESS.canManage}
      isReady={user !== null}
      surface='page'
    />
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
      <RecipientRevShareAgreementsContent />
    </Authenticated>
  );
};

MyRevShareAgreements.getPageLayout = (page) =>
  getFinanceLayout(page, { title: <RecipientRevShareAgreementsTitle /> });
MyRevShareAgreements.loggerConfig = { rosId: RosTeams.CreatorBusiness };

export default MyRevShareAgreements;
