import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ClaimContentContentTypeEnum } from '@rbx/client-rights/v1';
import type { SnapshotContent } from '@rbx/client-rights/v1';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Button, Select, MenuItem, Typography } from '@rbx/ui';
import { Asset } from '@modules/miscellaneous/common';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useContentDetails from '../../hooks/useContentDetails';
import useRootPlaceIdFromUniverseId from '../../hooks/useRootPlaceIdFromUniverseId';
import EmptyStateExperienceCard from './EmptyStateExperienceCard';
import ReportCodeCartDrawer from './ReportCodeCartDrawer';
import ReportExperienceTile from './ReportExperienceTile';
import getSnapshotContentKey from './snapshotContentKeyUtils';
import SnapshotContentTile from './SnapshotContentTile';

const TILE_WIDTH = '225px';
const SUPPORTED_FILTER_VALUES = [Asset.Image, Asset.Video, Asset.Model, Asset.Mesh] as const;
type SupportedFilterValue = (typeof SUPPORTED_FILTER_VALUES)[number];
const SUPPORTED_FILTER_VALUE_SET = new Set<string>(SUPPORTED_FILTER_VALUES);

function isSupportedFilterValue(value: string): value is SupportedFilterValue {
  return SUPPORTED_FILTER_VALUE_SET.has(value);
}

function getFilterLabel(value: SupportedFilterValue, translate: (key: string) => string): string {
  if (value === Asset.Image) {
    return translate('Label.Image');
  }
  if (value === Asset.Video) {
    return translate('Label.Video');
  }
  if (value === Asset.Model) {
    return translate('Label.Model');
  }
  if (value === Asset.Mesh) {
    return translate('Label.Mesh');
  }
  return '';
}

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

  const availableFilterValues = useMemo(
    () =>
      SUPPORTED_FILTER_VALUES.filter((supportedType) =>
        items.some((item) => item.assetType === supportedType),
      ),
    [items],
  );
  const selectedFilterValue = useMemo(() => {
    if (!isSupportedFilterValue(filterValue)) {
      return '';
    }
    return availableFilterValues.includes(filterValue) ? filterValue : '';
  }, [availableFilterValues, filterValue]);
  const filteredItems = useMemo(() => {
    if (!selectedFilterValue) {
      return items;
    }
    return items.filter((item) => item.assetType === selectedFilterValue);
  }, [items, selectedFilterValue]);

  useEffect(() => {
    if (!filterValue) {
      return;
    }

    if (!isSupportedFilterValue(filterValue)) {
      onFilterChange('');
      return;
    }

    const isSelectedFilterStillAvailable = selectedFilterValue === filterValue;
    if (!isSelectedFilterStillAvailable) {
      onFilterChange('');
    }
  }, [filterValue, onFilterChange, selectedFilterValue]);

  if (isSnapshotLoading || isRootPlaceIdLoading || !ready) {
    return <PageLoading />;
  }

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
    <>
      <Grid container direction='column' width='100%' spacing={3}>
        {hasItems && (
          <Grid item sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Select
              value={selectedFilterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              displayEmpty
              renderValue={(v) => {
                const filterLabelValue = String(v);
                return isSupportedFilterValue(filterLabelValue)
                  ? getFilterLabel(filterLabelValue, translate)
                  : translate('Label.FilterBy');
              }}
              sx={{ minWidth: 160 }}
              size='small'>
              <MenuItem value=''>
                <em>{translate('Label.FilterBy')}</em>
              </MenuItem>
              {availableFilterValues.map((assetType) => (
                <MenuItem key={assetType} value={assetType}>
                  {getFilterLabel(assetType, translate)}
                </MenuItem>
              ))}
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
    </>
  );
};

export default withTranslation(SelectCreationsStep, [TranslationNamespace.RightsPortal]);
