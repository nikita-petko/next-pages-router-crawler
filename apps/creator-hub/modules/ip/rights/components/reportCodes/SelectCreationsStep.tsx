import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Grid, Button, Select, MenuItem, Typography } from '@rbx/ui';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Asset, PageLoading } from '@modules/miscellaneous/common';
import { ClaimContentContentTypeEnum } from '@rbx/clients/rightsV1';
import type { SnapshotContent } from '@rbx/clients/rightsV1';
import { getSnapshotContentKey } from './ReportCodeContainer';
import SnapshotContentTile from './SnapshotContentTile';
import ReportExperienceTile from './ReportExperienceTile';
import ReportCodeCartDrawer from './ReportCodeCartDrawer';
import EmptyStateExperienceCard from './EmptyStateExperienceCard';

import useRootPlaceIdFromUniverseId from '../../hooks/useRootPlaceIdFromUniverseId';
import useContentDetails from '../../hooks/useContentDetails';

const TILE_WIDTH = '225px';

export interface SelectCreationsStepProps {
  filterValue: string;
  onFilterChange: (value: string) => void;
  items: SnapshotContent[];
  snapshotUniverseId?: number;
  cartItems: SnapshotContent[];
  cartSize: number;
  cartHasItem: (item: SnapshotContent) => boolean;
  cartUpdate: (item: SnapshotContent) => void;
  cartIsFull: boolean;
  removeFromCart: (item: SnapshotContent) => void;
  clearCart: () => void;
  isDrawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  onReportItems: () => void;
  onReportExperienceDirectly?: (rootPlaceId: number) => void;
  onCancel: () => void;
  isSnapshotLoading?: boolean;
  snapshotLoadError?: string | null;
  onSnapshotErrorBack?: () => void;
}

const SelectCreationsStep: FunctionComponent<SelectCreationsStepProps> = ({
  filterValue,
  onFilterChange,
  items,
  snapshotUniverseId,
  cartItems,
  cartSize,
  cartHasItem,
  cartUpdate,
  cartIsFull,
  removeFromCart,
  clearCart,
  isDrawerOpen,
  onDrawerOpenChange,
  onReportItems,
  onReportExperienceDirectly,
  onCancel,
  isSnapshotLoading = false,
  snapshotLoadError = null,
  onSnapshotErrorBack,
}) => {
  const { ready, translate } = useTranslation();
  const { rootPlaceId, isLoading: isRootPlaceIdLoading } =
    useRootPlaceIdFromUniverseId(snapshotUniverseId);
  const { isPending: isExperienceDetailsPending, contentDetails: experienceDetails } =
    useContentDetails(rootPlaceId, ClaimContentContentTypeEnum.Asset);
  const hasItems = items.length > 0;

  const handleReportExperienceDirectly = useCallback(() => {
    if (rootPlaceId && onReportExperienceDirectly) {
      onReportExperienceDirectly(rootPlaceId);
    }
  }, [rootPlaceId, onReportExperienceDirectly]);

  const filteredItems = useMemo(() => {
    if (!filterValue) return items;
    return items.filter((item) => item.assetType === filterValue);
  }, [items, filterValue]);

  if (isSnapshotLoading || isRootPlaceIdLoading || !ready) return <PageLoading />;

  if (snapshotLoadError && onSnapshotErrorBack) {
    return (
      <Grid container direction='column' width='100%' spacing={2}>
        <Grid item>
          <Typography color='error'>{snapshotLoadError}</Typography>
        </Grid>
        <Grid item>
          <Button variant='contained' onClick={onSnapshotErrorBack}>
            {translate('Label.Back')}
          </Button>
        </Grid>
      </Grid>
    );
  }

  return (
    <React.Fragment>
      <Grid container direction='column' width='100%' spacing={3}>
        {hasItems && (
          <Grid item sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Select
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              displayEmpty
              renderValue={(v) => {
                if (v === Asset.Image) return translate('Label.Image');
                if (v === Asset.Video) return translate('Label.Video');
                return translate('Label.FilterBy');
              }}
              sx={{ minWidth: 160 }}
              size='small'>
              <MenuItem value=''>
                <em>{translate('Label.FilterBy')}</em>
              </MenuItem>
              <MenuItem value={Asset.Image}>{translate('Label.Image')}</MenuItem>
              <MenuItem value={Asset.Video}>{translate('Label.Video')}</MenuItem>
            </Select>
          </Grid>
        )}
        {!hasItems && (
          <Grid item>
            <FeedbackBanner severity='Info' title={translate('Title.NoReportCodeContent')} />
          </Grid>
        )}
        {hasItems ? (
          <Grid item>
            <Grid container spacing={2} alignItems='stretch'>
              {filteredItems.map((item) => (
                <Grid item key={getSnapshotContentKey(item)} sx={{ width: TILE_WIDTH }}>
                  <SnapshotContentTile
                    item={item}
                    selected={cartHasItem(item)}
                    onToggle={cartUpdate}
                    disabled={cartIsFull && !cartHasItem(item)}
                  />
                </Grid>
              ))}
              <Grid item sx={{ width: TILE_WIDTH }}>
                <ReportExperienceTile
                  rootPlaceId={rootPlaceId}
                  experienceName={experienceDetails?.contentName ?? ''}
                  isLoading={isExperienceDetailsPending}
                  onReportExperience={handleReportExperienceDirectly}
                />
              </Grid>
            </Grid>
          </Grid>
        ) : (
          <Grid item>
            <EmptyStateExperienceCard
              rootPlaceId={rootPlaceId}
              experienceName={experienceDetails?.contentName}
              creatorName={experienceDetails?.creatorName}
              isLoading={isExperienceDetailsPending}
            />
          </Grid>
        )}
      </Grid>
      <Grid
        container
        direction={{ xs: 'column-reverse', sm: 'row' }}
        alignItems='stretch'
        spacing={2}
        sx={{ mt: 2 }}>
        <Grid item XSmall='auto'>
          <Button
            variant='outlined'
            color='primary'
            size='large'
            onClick={onCancel}
            sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {translate('Label.Cancel')}
          </Button>
        </Grid>
        <Grid item sx={{ flexGrow: 1 }} />
        {!hasItems && (
          <Grid item XSmall='auto'>
            <Button
              variant='contained'
              size='medium'
              onClick={handleReportExperienceDirectly}
              disabled={!rootPlaceId}>
              {translate('Action.Report')}
            </Button>
          </Grid>
        )}
        {hasItems && (
          <Grid item XSmall='auto'>
            <Button
              variant='contained'
              size='medium'
              onClick={onReportItems}
              disabled={cartSize === 0}
              sx={{ width: { xs: '100%', sm: 'auto' } }}>
              {translate('Action.ReportItems')}
            </Button>
          </Grid>
        )}
        {hasItems && (
          <Grid item XSmall='auto'>
            <Button
              variant='outlined'
              color='secondary'
              size='medium'
              onClick={() => onDrawerOpenChange(!isDrawerOpen)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}>
              {`${translate('Label.ViewSelectedItems')} (${cartSize})`}
            </Button>
          </Grid>
        )}
      </Grid>
      {hasItems && (
        <ReportCodeCartDrawer
          open={isDrawerOpen}
          onClose={() => onDrawerOpenChange(false)}
          onSubmit={() => {
            onReportItems();
            onDrawerOpenChange(false);
          }}
          cartItems={cartItems}
          removeFromCart={removeFromCart}
          clear={clearCart}
          buttonText={translate('Action.ReportItems')}
        />
      )}
    </React.Fragment>
  );
};

export default withTranslation(SelectCreationsStep, [TranslationNamespace.RightsPortal]);
