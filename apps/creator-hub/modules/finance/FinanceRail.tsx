import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { Divider } from '@rbx/ui';
import { isRevenueShareAgreementsEnabled } from '@generated/flags/creatorBusiness';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useTaxDocumentationAccess } from '@modules/devex/global/taxes/hooks/useTaxDocumentationAccess';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import LeftNavigationMenuV2 from '@modules/navigation/leftNavigation/components/LeftNavigationMenuV2';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import getFinanceActiveKey from './getFinanceActiveKey';

const FinanceRail: React.FC = () => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { value: revShareAgreementsEnabled } = useFlag(isRevenueShareAgreementsEnabled);
  const { canAccessTaxDocumentation } = useTaxDocumentationAccess();
  const group = useCurrentGroup();
  const pathname = usePathname();
  const hasGroup = Boolean(group);
  const taxesLabel = tPendingTranslation(
    'Taxes',
    'Page title / navigation label for the DevEx taxes page.',
    translationKey('Heading.Taxes', TranslationNamespace.TaxDocumentation),
  );
  const activeKey = useMemo(() => getFinanceActiveKey(pathname), [pathname]);

  const [topItems, bottomItems] = useMemo(() => {
    const topMenuItems = [];
    const bottomMenuItems = [];
    const baseUrl = '/dashboard';
    topMenuItems.push({
      key: 'devex',
      href: `${baseUrl}/devex`,
      label: translate('Label.DevEx'),
    });

    if (hasGroup) {
      topMenuItems.push({
        key: 'payouts',
        href: `${baseUrl}/group/payouts`,
        label: translate('Heading.Payouts'),
      });
      // Single "Revenue share" entry. The group's managed + group-as-recipient lists are Managed /
      // Recipient tabs inside that one page (RevShareView), so there's no separate recipient entry.
      if (revShareAgreementsEnabled) {
        topMenuItems.push({
          key: 'revenue-share-agreements',
          href: `${baseUrl}/group/revenue-share-agreements`,
          label: tPendingTranslation(
            'Revenue Share',
            'Finance nav entry for the revenue-share page.',
            translationKey('Heading.RevenueShare', TranslationNamespace.RevenueShareAgreements),
          ),
        });
      }
    }
    // User view sees only the recipient page — a solo user is only ever a recipient. When viewing as a
    // group you are the group, so nothing user-specific appears here.
    if (revShareAgreementsEnabled && !hasGroup) {
      topMenuItems.push({
        key: 'revenue-share-agreements',
        href: `${baseUrl}/revenue-share-agreements`,
        label: tPendingTranslation(
          'Revenue Share',
          'Finance nav entry for the revenue-share page.',
          translationKey('Heading.RevenueShare', TranslationNamespace.RevenueShareAgreements),
        ),
      });
    }
    topMenuItems.push({
      key: 'transactions',
      href: `${baseUrl}/transactions`,
      label: translate('Heading.Transactions'),
    });
    if (canAccessTaxDocumentation) {
      topMenuItems.push({
        key: 'taxes',
        href: `${baseUrl}/devex/taxes`,
        label: taxesLabel,
      });
    }
    bottomMenuItems.push({
      key: 'billing',
      href: `${baseUrl}/billing`,
      label: translate('Heading.Billing'),
    });
    bottomMenuItems.push({
      key: 'payments',
      href: `${baseUrl}/payments`,
      label: translate('Heading.Payments'),
    });
    bottomMenuItems.push({
      key: 'account-information',
      href: `${baseUrl}/account-information`,
      label: translate('Title.AccountInformation'),
    });

    return [topMenuItems, bottomMenuItems];
  }, [
    canAccessTaxDocumentation,
    hasGroup,
    revShareAgreementsEnabled,
    taxesLabel,
    tPendingTranslation,
    translate,
  ]);

  return (
    <>
      <LeftNavigationMenuV2
        key={canAccessTaxDocumentation ? 'tax-access-enabled' : 'tax-access-disabled'}
        activeKey={activeKey}
        header={translate('Heading.Finances')}
        items={topItems}
      />
      <Divider sx={{ margin: '12px 0px' }} />
      <LeftNavigationMenuV2 activeKey={activeKey} items={bottomItems} />
    </>
  );
};

export default FinanceRail;
