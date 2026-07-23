import React, { useMemo } from 'react';
import LeftNavigationMenuV2 from '@modules/navigation/leftNavigation/components/LeftNavigationMenuV2';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useTranslation } from '@rbx/intl';
import { Divider } from '@rbx/ui';
import { usePathname } from 'next/navigation';

const FinanceRail: React.FC = () => {
  const { translate } = useTranslation();
  const group = useCurrentGroup();
  const pathname = usePathname();
  const hasGroup = Boolean(group);

  const activeKey = useMemo(() => {
    const segments = pathname.split('/');
    return segments[segments.length - 1];
  }, [pathname]);

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
    }
    topMenuItems.push({
      key: 'transactions',
      href: `${baseUrl}/transactions`,
      label: translate('Heading.Transactions'),
    });
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
  }, [hasGroup, translate]);

  return (
    <React.Fragment>
      <LeftNavigationMenuV2
        activeKey={activeKey}
        header={translate('Heading.Finances')}
        items={topItems}
      />
      <Divider sx={{ margin: '12px 0px' }} />
      <LeftNavigationMenuV2 activeKey={activeKey} items={bottomItems} />
    </React.Fragment>
  );
};

export default FinanceRail;
