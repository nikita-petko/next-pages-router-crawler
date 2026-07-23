import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useFlag } from '@rbx/flags';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Chip, CircularProgress, Grid, Typography } from '@rbx/ui';
import { isAssetAccessRequestsEnabled } from '@generated/flags/contentAccessAndInventory';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useListAllAssetPermissionRequests } from '@modules/react-query/assetPermissions/assetAccessRequestsQueries';
import ReceivedTab from './ReceivedTab';
import SentTab from './SentTab';

type RequestsTab = 'received' | 'sent';

const UniversalAccessRequestsView: FunctionComponent = () => {
  const { translateWithNamespace } = useTranslation();
  const { value: isEnabledValue } = useFlag(isAssetAccessRequestsEnabled);
  const isEnabled = isEnabledValue ?? false;

  const [activeTab, setActiveTab] = useState<RequestsTab>('received');
  const [selectedRequestIds, setSelectedRequestIds] = useState<ReadonlySet<string>>(new Set());

  const { data, isPending, isError } = useListAllAssetPermissionRequests(isEnabled);

  const requests = useMemo(() => data?.requests ?? [], [data]);
  const selectedCount = selectedRequestIds.size;

  const handleReceivedTabClick = useCallback(() => {
    setActiveTab('received');
    setSelectedRequestIds(new Set());
  }, []);

  const handleSentTabClick = useCallback(() => {
    setActiveTab('sent');
    setSelectedRequestIds(new Set());
  }, []);

  const handleSelectionChange = useCallback((requestId: string, isSelected: boolean) => {
    setSelectedRequestIds((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        next.add(requestId);
      } else {
        next.delete(requestId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (selectAll: boolean) => {
      setSelectedRequestIds(selectAll ? new Set(requests.map((r) => r.requestId)) : new Set());
    },
    [requests],
  );

  if (!isEnabled) {
    return null;
  }

  if (isPending) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (isError) {
    return (
      <Grid container justifyContent='center' padding={4}>
        <Typography variant='body1'>
          {translateWithNamespace(
            TranslationNamespace.AssetPermissions,
            'Error.LoadAccessRequests',
          )}
        </Typography>
      </Grid>
    );
  }

  // Only show count badge on Received chip when there are requests.
  const receivedLabel =
    requests.length > 0
      ? `${translateWithNamespace(TranslationNamespace.AssetPermissions, 'Label.Received')} (${requests.length})`
      : translateWithNamespace(TranslationNamespace.AssetPermissions, 'Label.Received');

  return (
    <Grid container>
      <Grid item XSmall={12} className='[margin-bottom:16px]'>
        <div className='flex flex-row items-center justify-between'>
          <div role='tablist' className='inline-flex gap-small'>
            <Chip
              color={activeTab === 'received' ? 'primary' : 'secondary'}
              label={receivedLabel}
              onClick={handleReceivedTabClick}
              role='tab'
              tabIndex={activeTab === 'received' ? 0 : -1}
              aria-selected={activeTab === 'received'}
              clickable
            />
            <Chip
              color={activeTab === 'sent' ? 'primary' : 'secondary'}
              label={translateWithNamespace(TranslationNamespace.AssetPermissions, 'Label.Sent')}
              onClick={handleSentTabClick}
              role='tab'
              tabIndex={activeTab === 'sent' ? 0 : -1}
              aria-selected={activeTab === 'sent'}
              clickable
            />
          </div>

          {selectedCount > 0 && (
            <div className='inline-flex gap-small'>
              {/* TODO: wire onClick to bulk approve mutation once API is integrated */}
              <Button color='primaryBrand' variant='contained'>
                {translateWithNamespace(TranslationNamespace.AssetPermissions, 'Action.Accept')} (
                {selectedCount})
              </Button>
              {/* TODO: wire onClick to bulk reject mutation once API is integrated */}
              <Button color='secondary' variant='outlined'>
                {translateWithNamespace(TranslationNamespace.AssetPermissions, 'Action.Decline')} (
                {selectedCount})
              </Button>
            </div>
          )}
        </div>
      </Grid>

      <Grid item XSmall={12} role='tabpanel'>
        {activeTab === 'received' && (
          <ReceivedTab
            requests={requests}
            selectedRequestIds={selectedRequestIds}
            onSelectionChange={handleSelectionChange}
            onSelectAll={handleSelectAll}
          />
        )}
        {activeTab === 'sent' && <SentTab />}
      </Grid>
    </Grid>
  );
};

export default withTranslation(UniversalAccessRequestsView, [
  TranslationNamespace.AssetPermissions,
  TranslationNamespace.Table,
]);
