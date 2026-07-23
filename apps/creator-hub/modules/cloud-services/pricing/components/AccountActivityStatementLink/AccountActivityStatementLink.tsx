import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React from 'react';
import { Button } from '@rbx/ui';
import CreatorDashboardLink from '@modules/miscellaneous/components/CreatorDashboardLink';
import { creatorHub } from '@modules/miscellaneous/urls';
import { getUTCDateString } from '@modules/miscellaneous/utils';

type TAccountActivityStatementLinkProps = { date: Date; label: string };

const AccountActivityStatementLink: FunctionComponent<TAccountActivityStatementLinkProps> = ({
  date,
  label,
}) => {
  const { query } = useRouter();

  return (
    <CreatorDashboardLink
      href={{
        pathname: creatorHub.dashboard.getBillingStatementUrl(getUTCDateString(date)),
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
