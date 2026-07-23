import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import type { Account } from '@rbx/client-rights/v1';
import { ClaimItemStatusEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Button, Chip, AddIcon, Select, MenuItem } from '@rbx/ui';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { PageLoading, Pagination } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useCursorPagination, { usePaginationProps } from '../../hooks/useCursorPagination';
import {
  RMCreateClaimFeatureName,
  useGetRightsFeatureTimeoutIntervention,
} from '../../hooks/useInterventions';
import useResolvedClaimItems from '../../hooks/useResolvedClaimItems';
import { CREATE_CLAIMS_HREF, REPORT_CODE_CLAIMS_HREF } from '../../urls';
import ClaimCreationRestrictionBanner from '../error/ClaimCreationRestrictionBanner';
import ClaimsByMeTable from './ClaimsByMeTable';
import EmptyClaimsView from './EmptyClaimsView';

export enum FilterOption {
  All = 1,
  Pending,
  Accepted,
  Disputed,
  AutomaticallyEscalated,
  Released,
  ReleasedAfterDispute,
  Escalated,
  Approved,
  Rejected,
}

interface StatusWithTranslation {
  status: ClaimItemStatusEnum | string;
  translationKey: string;
}

const filterOptionToStatusMap: Map<FilterOption, StatusWithTranslation> = new Map([
  [FilterOption.All, { status: '', translationKey: 'Heading.All' }],
  [
    FilterOption.Pending,
    { status: ClaimItemStatusEnum.Pending, translationKey: 'Description.Pending' },
  ],
  [
    FilterOption.Accepted,
    { status: ClaimItemStatusEnum.Accept, translationKey: 'Description.Accepted' },
  ],
  [
    FilterOption.Disputed,
    { status: ClaimItemStatusEnum.Dispute, translationKey: 'Description.Disputed' },
  ],
  [
    FilterOption.Released,
    { status: ClaimItemStatusEnum.Drop, translationKey: 'Description.Released' },
  ],
  [
    FilterOption.ReleasedAfterDispute,
    {
      status: ClaimItemStatusEnum.DropAfterDispute,
      translationKey: 'Description.ReleasedAfterDispute',
    },
  ],
  [
    FilterOption.AutomaticallyEscalated,
    { status: ClaimItemStatusEnum.Open, translationKey: 'Description.AutomaticallyEscalated' },
  ],
  [
    FilterOption.Escalated,
    { status: ClaimItemStatusEnum.Escalate, translationKey: 'Description.EscalatedToRoblox' },
  ],
  [
    FilterOption.Approved,
    { status: ClaimItemStatusEnum.Takedown, translationKey: 'Description.ApprovedByRoblox' },
  ],
  [
    FilterOption.Rejected,
    { status: ClaimItemStatusEnum.Keep, translationKey: 'Description.RejectedByRoblox' },
  ],
]);

/**
 *  ClaimsByMeContainer controls a ClaimsByMeTable, displaying actions like filtering and +new claim along with the table
 */
const ClaimsByMeContainer = ({ account }: { account: Account }) => {
  const { ready, translate } = useTranslation();
  const { onPageChange, pageToken, pagination, rowsPerPage, reset } = useCursorPagination();
  const [filterOption, setFilterOption] = useState(FilterOption.All);
  const filterStatus = useMemo(
    () => filterOptionToStatusMap.get(filterOption)?.status,
    [filterOption],
  );
  const { intervention } = useGetRightsFeatureTimeoutIntervention(
    RMCreateClaimFeatureName,
    account.id,
  );
  const isBlockedByFeatureTimeout = account && !!intervention;

  const { displayItems, nextPageToken, isPending, isPlaceholderData, error } =
    useResolvedClaimItems(account.id || '', rowsPerPage[0], pageToken || '', filterStatus);

  const { paginationProps } = usePaginationProps(
    nextPageToken,
    pagination.pageIndex,
    onPageChange,
    isPlaceholderData,
  );
  const {
    isFetched: isIXPFetched,
    params: { enableInExperienceIpReporting },
  } = useIXPParameters(IXPLayers.RightsManager, { restoreInitialValueFromCache: true });

  const menuItems: React.ReactNode[] = [];
  filterOptionToStatusMap.forEach((value, key) => {
    menuItems.push(
      <MenuItem
        key={value.status}
        value={key}
        onClick={() => {
          setFilterOption(key);
          reset();
        }}>
        {translate(value.translationKey)}
      </MenuItem>,
    );
  });

  if (isPending || !ready || !isIXPFetched) {
    return <PageLoading />;
  }

  if (displayItems.length === 0 && filterOption === FilterOption.All) {
    return (
      <>
        {isBlockedByFeatureTimeout && (
          <ClaimCreationRestrictionBanner intervention={intervention} />
        )}
        <br />
        <EmptyClaimsView disableCreateClaim={isBlockedByFeatureTimeout} />
      </>
    );
  }

  if (error) {
    return (
      <FailureView
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
      />
    );
  }

  return (
    <Grid container direction='column' spacing={3}>
      {isBlockedByFeatureTimeout && (
        <Grid item>
          <ClaimCreationRestrictionBanner intervention={intervention} />
        </Grid>
      )}
      <Grid item container spacing={1}>
        <Grid item>
          <Chip
            style={{ width: '100px' }}
            size='large'
            clickable
            variant='filled'
            label={translate('Heading.All')}
            color={filterOption === FilterOption.All ? 'primary' : 'secondary'}
            onClick={() => {
              setFilterOption(FilterOption.All);
              reset();
            }}
          />
        </Grid>
        <Grid item>
          <Chip
            style={{ width: '100px' }}
            size='large'
            clickable
            variant='filled'
            label={translate('Description.Disputed')}
            color={filterOption === FilterOption.Disputed ? 'primary' : 'secondary'}
            onClick={() => {
              setFilterOption(FilterOption.Disputed);
              reset();
            }}
          />
        </Grid>
        <Grid item>
          <Chip
            style={{ width: '100px' }}
            size='large'
            clickable
            variant='filled'
            label={translate('Heading.Escalated')}
            color={filterOption === FilterOption.Escalated ? 'primary' : 'secondary'}
            onClick={() => {
              setFilterOption(FilterOption.Escalated);
              reset();
            }}
          />
        </Grid>
      </Grid>
      <Grid item container direction='row' justifyContent='space-between'>
        <Grid item sx={{ display: 'flex', gap: '8px' }}>
          {isBlockedByFeatureTimeout ? (
            <Button variant='contained' color='primaryBrand' disabled>
              <AddIcon sx={{ marginRight: '8px' }} />
              {translate('Label.NewClaim')}
            </Button>
          ) : (
            <Link href={CREATE_CLAIMS_HREF} passHref legacyBehavior>
              <Button variant='contained' color='primaryBrand'>
                <AddIcon sx={{ marginRight: '8px' }} />
                {translate('Label.NewClaim')}
              </Button>
            </Link>
          )}
          {enableInExperienceIpReporting && (
            <Link href={REPORT_CODE_CLAIMS_HREF} passHref legacyBehavior>
              <Button variant='contained' color='secondary'>
                {translate('Label.UseReportCode')}
              </Button>
            </Link>
          )}
        </Grid>
        <Grid item>
          <Select
            label='Filter By'
            size='small'
            variant='outlined'
            value={filterOption}
            sx={{ minWidth: 80 }}>
            {menuItems}
          </Select>
        </Grid>
      </Grid>
      <Grid item container direction='column' sx={{ marginTop: '0px' }}>
        <Grid item container direction='column' spacing={3}>
          <Grid item>
            <ClaimsByMeTable claimItems={displayItems} />
          </Grid>
          <Grid item>
            <Pagination {...paginationProps} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(ClaimsByMeContainer, [
  TranslationNamespace.GameLocalizationTranslators,
  TranslationNamespace.Creations,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Error,
  TranslationNamespace.RightsPortal,
]);
