import React, { FunctionComponent } from 'react';
import { Button } from '@rbx/ui';
import CreatorDashboardLink from '@modules/miscellaneous/common/components/CreatorDashboardLink';
import { useRouter } from 'next/router';
import { urls, utils } from '@modules/miscellaneous/common';

type TAccountActivityStatementLinkProps = { date: Date; label: string };

const AccountActivityStatementLink: FunctionComponent<TAccountActivityStatementLinkProps> = ({
  date,
  label,
}) => {
  const { query } = useRouter();

  return (
    <CreatorDashboardLink
      href={{
        pathname: urls.creatorHub.dashboard.getBillingStatementUrl(utils.getUTCDateString(date)),
        query: {
          ...(query.groupId ? { groupId: query.groupId } : {}),
          ...(query.userIdOverride ? { userIdOverride: query.userIdOverride } : {}),
          ...(query.groupIdOverride ? { groupIdOverride: query.groupIdOverride } : {}),
        },
      }}>
      <Button size='small' color='secondary'>
        {label}
      </Button>
    </CreatorDashboardLink>
  );
};

export default React.memo(AccountActivityStatementLink);
