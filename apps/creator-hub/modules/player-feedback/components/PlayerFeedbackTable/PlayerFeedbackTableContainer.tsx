import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Chip,
  FormControlLabel,
  Grid,
  makeStyles,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
  InfoOutlinedIcon,
  ThumbUpIcon,
  ThumbDownIcon,
  Skeleton,
} from '@rbx/ui';

import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  GenericTableV2,
  CellDataType,
  ColumnType,
  unknownDueToCursorBasedPagination,
  useChartColors,
} from '@modules/charts-generic';
import { ExperienceReview } from '@rbx/clients/playerGeneratedReviewsService';
import {
  ExperienceAnalyticsFilterDrawerButton,
  useAnalyticsCurrentDateRangeBundle,
  useExperienceAnalyticsGameDetails,
} from '@modules/experience-analytics-shared';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useSettings } from '@modules/settings';
import PlayerFeedbackTableColumnKey from './constants/PlayerFeedbackTableColumnKey';
import {
  CategoryType,
  CategoryTypeFilterLabelKey,
  CategoryTypeIconColorIndex,
  PlayerFeebackTableColumnConfigs,
  PlayerFeedbackTableConfig,
} from './constants/PlayerFeedbackTableConfigs';
import PlayerFeedbackTableRatingCell from './PlayerFeedbackTableRatingCell';
import PlayerFeedbackTableCommmentCell from './PlayerFeedbackTableCommentCell';
import ExportReport from './ExportReport';
import PlayerFeedbackFilterChips from './PlayerFeedbackFilterChips';
import { usePlayerFeedbackFilters } from './hooks/usePlayerFeedbackFilters';
import usePlayerFeedbackData from './hooks/usePlayerFeedbackData';
import { PlayerFeedbackFilterDimension } from './types/PlayerFeedbackFilters';
import usePlayerFeedbackTranslation from './hooks/usePlayerFeedbackTranslation';
import { TranslationState } from './types/types';

const useStyles = makeStyles<{ upVoteColor: string; downVoteColor: string }>()(
  (theme, { upVoteColor, downVoteColor }) => ({
    container: {
      [`& tbody td:has([data-category-type])`]: {
        borderLeft: '3px solid transparent',
        [theme.breakpoints.down('Medium')]: {
          borderRadius: 3,
        },
      },
      [`& table`]: {
        borderCollapse: 'separate',
      },
      [`& tbody td:has([data-category-type='Upvote'])`]: {
        borderLeft: `3px solid ${upVoteColor}`,
      },
      [`& tbody td:has([data-category-type='Downvote'])`]: {
        borderLeft: `3px solid ${downVoteColor}`,
      },
      [`& tbody tr:hover [data-context-menu]`]: {
        visibility: 'visible',
      },
    },
    categoryTypeFilterContainer: {
      marginTop: 28,
      marginBottom: 12,
    },
    categoryTypeFilterChip: {
      padding: '0px 3px',
    },
    commentFilterContainer: {
      marginTop: 12,
      marginBottom: 8,
    },
    infoIcon: {
      marginLeft: 6,
    },
    chipLabelClass: {
      display: 'inline-flex',
      alignItems: 'center',
    },
    chipIconClass: {
      marginRight: 4,
    },
  }),
);

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const PlayerFeedbackTableContainer = () => {
  const { settings } = useSettings();
  const { translate } = useTranslation();
  const chartColors = useChartColors();
  const upVoteColor = chartColors[CategoryTypeIconColorIndex[CategoryType.Upvote]];
  const downVoteColor = chartColors[CategoryTypeIconColorIndex[CategoryType.Downvote]];
  const {
    classes: {
      categoryTypeFilterContainer,
      categoryTypeFilterChip,
      commentFilterContainer,
      container,
      infoIcon,
      chipLabelClass,
      chipIconClass,
    },
  } = useStyles({ upVoteColor, downVoteColor });
  const isStackView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const isUnderXLargeView = useMediaQuery((theme) => theme.breakpoints.between('Large', 'XLarge'));
  const isUnderLargeView = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  const [categoryType, setCategoryType] = useState<CategoryType>(CategoryType.All);
  // Build category filters with feature flag gating
  const categoryTypeFilters = useMemo(() => {
    const base: CategoryType[] = [CategoryType.All, CategoryType.Upvote, CategoryType.Downvote];
    return settings.enablePlayerFeedbackUnrated ? [...base, CategoryType.InExperience] : base;
  }, [settings.enablePlayerFeedbackUnrated]);
  const [commentsOnly, setCommentsOnly] = useState<boolean>(false);
  const { endDate, startDate } = useAnalyticsCurrentDateRangeBundle();
  const { rootPlaceId } = useExperienceAnalyticsGameDetails();
  const { isFetched: isIXPFetched, params: ixpParams } = useIXPParameters(
    IXPLayers.CreatorDashboard,
  );

  // Initialize filter hook
  const { filterState, hasActiveFilters, updateFilter } = usePlayerFeedbackFilters();

  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const {
    data: reviewsData,
    currentPageData: filteredCurrentPageData,
    isLoading: isFetchingReviewsPending,
    isError: isFetchingReviewsError,
    hasMore,
  } = usePlayerFeedbackData({
    rootPlaceId,
    pageSize,
    pageNumber,
    startDate,
    endDate,
    categoryType,
    commentsOnly,
    filterState,
  });

  // Use translation hook to share state between rating and comment cells
  const { getTranslationState } = usePlayerFeedbackTranslation(reviewsData || []);

  // Helper function to create review row data
  const createReviewRowData = useCallback(
    (review: ExperienceReview, translationState: TranslationState) => {
      return new Map<PlayerFeedbackTableColumnKey, CellDataType>([
        [
          PlayerFeedbackTableColumnKey.Rating,
          {
            type: ColumnType.Other,
            value: (
              <PlayerFeedbackTableRatingCell
                review={review}
                renderConextMenu={isStackView}
                translationState={translationState}
              />
            ),
          },
        ],
        [
          PlayerFeedbackTableColumnKey.DeviceType,
          {
            type: ColumnType.Text,
            value: review.metadata.deviceType,
          },
        ],
        [
          PlayerFeedbackTableColumnKey.Platform,
          {
            type: ColumnType.Text,
            value: review.metadata.operatingSystemType,
          },
        ],
        [
          PlayerFeedbackTableColumnKey.Timestamp,
          {
            type: ColumnType.Timestamp,
            value: review.createdUtc,
          },
        ],
        [
          PlayerFeedbackTableColumnKey.Comment,
          {
            type: ColumnType.Other,
            value: (
              <PlayerFeedbackTableCommmentCell
                review={review}
                renderConextMenu={!isStackView}
                translationState={translationState}
              />
            ),
          },
        ],
      ]);
    },
    [isStackView],
  );

  // Reset page number when filters, category type, or page size changes
  useEffect(() => {
    setPageNumber(0);
  }, [filterState, categoryType, pageSize]);

  const pagination = {
    page: pageNumber,
    total: unknownDueToCursorBasedPagination,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    setPageSize: async (newPageSize: number) => {
      setPageSize(newPageSize);
      setPageNumber(0);
    },
    onNextPage: async () => {
      const nextPageNumber = pageNumber + 1;
      setPageNumber(nextPageNumber);
    },
    onPreviousPage: () => {
      setPageNumber(pageNumber - 1);
    },
    hasNext: hasMore,
    hasPrevious: pageNumber > 0,
  };
  const currentPageData = useMemo(() => {
    if (!filteredCurrentPageData) {
      return [];
    }

    return filteredCurrentPageData.map((review) => {
      const translationState = getTranslationState(review.id);
      return createReviewRowData(review, translationState);
    });
  }, [filteredCurrentPageData, getTranslationState, createReviewRowData]);

  const onClickCategoryType = useCallback(
    (selectedCategoryType: CategoryType) => {
      setCategoryType(selectedCategoryType);
      setPageNumber(0);
    },
    [setCategoryType, setPageNumber],
  );
  const onClickCommentsOnly = useCallback(() => {
    setCommentsOnly(!commentsOnly);
    setPageNumber(0);
  }, [commentsOnly, setCommentsOnly]);

  const playerFeedbackTableColumnConfigs = useMemo(() => {
    let commentWidthWeight = 55;
    if (isUnderXLargeView) {
      commentWidthWeight = 45;
    } else if (isUnderLargeView) {
      commentWidthWeight = 35;
    }
    return PlayerFeebackTableColumnConfigs.map((columnConfig) => {
      if (columnConfig.columnKey === PlayerFeedbackTableColumnKey.Comment) {
        return {
          ...columnConfig,
          widthWeight: commentWidthWeight,
        };
      }
      return columnConfig;
    });
  }, [isUnderXLargeView, isUnderLargeView]);

  const renderChipLabelContent = React.useCallback(
    (type: CategoryType) => {
      const translated = translate(CategoryTypeFilterLabelKey[type]);
      const isLoading = translated === CategoryTypeFilterLabelKey[type] || !translated;

      if (
        !settings.enablePlayerFeedbackUnrated &&
        (type === CategoryType.Upvote || type === CategoryType.Downvote)
      ) {
        const Icon = type === CategoryType.Upvote ? ThumbUpIcon : ThumbDownIcon;
        return (
          <span className={chipLabelClass}>
            <Icon fontSize='small' color='secondary' className={chipIconClass} />
            {isLoading ? <Skeleton animate variant='text' height={12} width='60%' /> : translated}
          </span>
        );
      }
      return isLoading ? <Skeleton animate variant='text' height={12} width='60%' /> : translated;
    },
    [translate, settings.enablePlayerFeedbackUnrated, chipLabelClass, chipIconClass],
  );

  return (
    <div className={container}>
      <Grid container alignItems='center' justifyContent='space-between'>
        <Grid item>
          <Grid container alignItems='center' wrap='nowrap'>
            <Typography variant='h5'>{translate('Heading.DetailedFeedback')}</Typography>
            {settings.enablePlayerFeedbackUnrated && (
              <Tooltip
                title={translate('Description.PlayerFeedback.UnratedTooltip')}
                placement='right'
                arrow>
                <InfoOutlinedIcon fontSize='small' color='secondary' className={infoIcon} />
              </Tooltip>
            )}
          </Grid>
        </Grid>
      </Grid>
      <Grid direction='row' container alignItems='center' justifyContent='space-between'>
        <Grid item container className={categoryTypeFilterContainer} gap={1} width='auto'>
          {categoryTypeFilters.map((type) => {
            const view = renderChipLabelContent(type);
            return (
              <Chip
                key={type}
                className={categoryTypeFilterChip}
                color={categoryType === type ? 'primary' : 'secondary'}
                label={view}
                size='medium'
                variant='filled'
                onClick={() => onClickCategoryType(type)}
                clickable
              />
            );
          })}
        </Grid>
        {settings.enablePlayerFeedbackCommentFilter && (
          <Grid item alignItems='center' className={commentFilterContainer}>
            <FormControlLabel
              control={
                <Switch
                  checked={commentsOnly}
                  onChange={onClickCommentsOnly}
                  aria-label={translate('Action.ShowPublicOnly')}
                />
              }
              label={translate('Label.OnlyShowFeedbackWithComments')}
            />
          </Grid>
        )}
        <Grid
          item
          container
          className={categoryTypeFilterContainer}
          gap={1}
          width='auto'
          justifyContent='flex-end'>
          <Grid item>
            {hasActiveFilters && (
              <PlayerFeedbackFilterChips filterState={filterState} onFilterChange={updateFilter} />
            )}
          </Grid>
          <Grid item style={{ marginBottom: -8 }}>
            {isIXPFetched && ixpParams?.enablePlayerFeedbackDetailedFilter && (
              <ExperienceAnalyticsFilterDrawerButton
                resource={{
                  type: RAQIV2ChartResourceType.Universe,
                  id: rootPlaceId,
                }}
                dimensions={[RAQIV2Dimension.OperatingSystem, RAQIV2Dimension.Platform]}
                filters={[
                  {
                    dimension: RAQIV2Dimension.OperatingSystem,
                    values: filterState[PlayerFeedbackFilterDimension.OperatingSystem],
                  },
                  {
                    dimension: RAQIV2Dimension.Platform,
                    values: filterState[PlayerFeedbackFilterDimension.DeviceType],
                  },
                ]}
                onFiltersChange={(filters) => {
                  // Convert the filters to our filter state format
                  const newFilterState = { ...filterState };

                  // Reset all filters first
                  newFilterState[PlayerFeedbackFilterDimension.OperatingSystem] = [];
                  newFilterState[PlayerFeedbackFilterDimension.DeviceType] = [];

                  // Apply new filters
                  filters.forEach((filter) => {
                    if (filter.dimension === RAQIV2Dimension.OperatingSystem) {
                      newFilterState[PlayerFeedbackFilterDimension.OperatingSystem] = filter.values;
                    } else if (filter.dimension === RAQIV2Dimension.Platform) {
                      // Map Platform to DeviceType since that's what we have in our data
                      newFilterState[PlayerFeedbackFilterDimension.DeviceType] = filter.values;
                    }
                  });

                  // Update our filter state
                  Object.entries(newFilterState).forEach(([dimension, values]) => {
                    updateFilter(dimension as PlayerFeedbackFilterDimension, values);
                  });
                }}
              />
            )}
          </Grid>
          <Grid item>
            <ExportReport
              rootPlaceId={rootPlaceId}
              pageSize={pageSize}
              categoryType={categoryType}
              commentsOnly={commentsOnly}
              startDate={startDate}
              endDate={endDate}
              deviceType={filterState[PlayerFeedbackFilterDimension.DeviceType]}
              operatingSystemType={filterState[PlayerFeedbackFilterDimension.OperatingSystem]}
            />
          </Grid>
        </Grid>
      </Grid>
      <GenericTableV2
        getRowKey={(_, index) =>
          filteredCurrentPageData?.[index]?.id.toString() ?? index.toString()
        }
        columnConfigs={playerFeedbackTableColumnConfigs}
        isDataLoading={isFetchingReviewsPending}
        isResponseFailed={isFetchingReviewsError}
        isUserForbidden={false}
        showNoDataMessage={currentPageData.length === 0}
        tableConfig={PlayerFeedbackTableConfig}
        rowData={currentPageData}
        pagination={pagination}
      />
    </div>
  );
};
export default withTranslation(PlayerFeedbackTableContainer, [
  TranslationNamespace.PlayerFeedback,
  TranslationNamespace.Analytics,
]);
