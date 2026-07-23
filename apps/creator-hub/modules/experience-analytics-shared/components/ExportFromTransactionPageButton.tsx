import React, { FC, useMemo } from 'react';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { urls } from '@modules/miscellaneous/common';
import { DescriptionOutlinedIcon, IconButton, Link, Tooltip } from '@rbx/ui';
import { OwnerType } from '@modules/clients/analytics';
import useOwner from '../context/useOwner';
import useRAQIV2TranslationDependencies from '../hooks/useRAQIV2TranslationDependencies';

const ExportFromTransactionPageButton: FC = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const owner = useOwner();

  const url = useMemo(() => {
    if (!owner.isFetched) {
      return urls.www.getTransactionsUrl();
    }
    switch (owner.ownerType) {
      case OwnerType.User:
        return urls.www.getTransactionsUrl();
      case OwnerType.Group:
        return urls.www.getConfigureGroupRevenueSalesUrl(owner?.ownerId ?? 0);
      default: {
        const exhaustiveCheck: never = owner.ownerType;
        throw new Error(`Unhandled owner type ${exhaustiveCheck}`);
      }
    }
  }, [owner]);

  return (
    <Tooltip
      arrow
      title={translate(
        translationKey('Description.ExportFromTransactionPage', TranslationNamespace.Analytics),
      )}
      placement='left'
      enterTouchDelay={0}
      leaveTouchDelay={3000}>
      <Link href={url}>
        <IconButton aria-label='export' color='secondary' size='medium'>
          <DescriptionOutlinedIcon fontSize='medium' />
        </IconButton>
      </Link>
    </Tooltip>
  );
};

export default ExportFromTransactionPageButton;
