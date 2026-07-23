import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { Button, Grid, MenuItem, Select, useMediaQuery } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { RecommendedEventType } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useNonRAQIAnalyticsCurrentFilterBundle } from '../../../context/AnalyticsCurrentFilterBundleProvider';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import useAnalyticsPageControlBarStyles from '../../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageControlBar.styles';
import {
  type FilterBarConfig,
  recommendedEventsLiveEventsFilterDimensions,
} from '../../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarConfig';
import ExperienceAnalyticsPageFilterBarControl from '../../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarControl';
import { NonRAQIUIDimension } from '../../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import LiveEventsTable from './RecommendedEventsLiveEventsTable';
import useRecommendedEventsLiveEventsTableDialogStyles from './RecommendedEventsLiveEventsTableDialog.styles';

const EventTypeToTranslationKey: Record<RecommendedEventType, TranslationKey> = {
  [RecommendedEventType.EconomyEvents]: translationKey(
    'Label.Dimension.EventType.EconomyEvents',
    TranslationNamespace.Analytics,
  ),
  [RecommendedEventType.ProgressionEvents]: translationKey(
    'Label.Dimension.EventType.ProgressionEvents',
    TranslationNamespace.Analytics,
  ),
  [RecommendedEventType.CustomEvents]: translationKey(
    'Label.Dimension.EventType.CustomEvents',
    TranslationNamespace.Analytics,
  ),
  [RecommendedEventType.Invalid]: translationKey('Label.Invalid', TranslationNamespace.Analytics),
};

const eventTypeOptions = [
  RecommendedEventType.EconomyEvents,
  RecommendedEventType.ProgressionEvents,
  RecommendedEventType.CustomEvents,
];

// Mirrors the popover anchoring used by the page-level FilterBarSingleSelector
// so the dialog's event-type dropdown opens with the same affordance as the
// URL-backed UserId/Text controls beside it.
const showMenuBelowSelector: Partial<React.ComponentProps<typeof Select>['SelectProps']> = {
  MenuProps: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    transformOrigin: { vertical: 'top', horizontal: 'center' },
  },
};

const RecommendedEventsLiveEventsTableWithFilters: FC<{
  eventType: RecommendedEventType;
  onEventTypeChange: (next: RecommendedEventType) => void;
}> = ({ eventType, onEventTypeChange }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: { dialogContent },
  } = useRecommendedEventsLiveEventsTableDialogStyles();
  const {
    classes: { filterBarFilterControl },
  } = useAnalyticsPageControlBarStyles();

  const { filters, onFiltersChange } = useNonRAQIAnalyticsCurrentFilterBundle(
    recommendedEventsLiveEventsFilterDimensions,
  );

  // Filter bar handles only the URL-backed dialog filters (UserId, Text). The
  // event-type selector is rendered as a sibling against local dialog state
  // (`eventType`/`onEventTypeChange` from the container) so the active stream
  // never bleeds into page-level filter URLs — that bleed is the bug class
  // that motivated lifting it out of NonRAQIUIDimension entirely.
  const filterBarConfig: FilterBarConfig = useMemo(() => {
    return [
      {
        type: 'numeric-text',
        dimension: NonRAQIUIDimension.UserId,
        dimensionNameKey: translationKey(
          'Label.UserIdFilterPlaceholder',
          TranslationNamespace.Analytics,
        ),
      },
      {
        type: 'text',
        dimension: NonRAQIUIDimension.Text,
        dimensionNameKey: translationKey(
          'Label.TextFilterPlaceholder',
          TranslationNamespace.Analytics,
        ),
      },
    ];
  }, []);

  const handleEventTypeChange = useCallback(
    (event: React.ChangeEvent<{ value: string }>) => {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- as close as possible to the DOM event
      onEventTypeChange(event.target.value as RecommendedEventType);
    },
    [onEventTypeChange],
  );

  const eventTypeLabel = translate(
    translationKey('Label.Dimension.EventType', TranslationNamespace.Analytics),
  );

  const clearLiveEventsFilters = useCallback(
    () =>
      onFiltersChange(
        filters.filter(
          ({ dimension }) =>
            !recommendedEventsLiveEventsFilterDimensions.some(
              (recommendedEventsDim) => recommendedEventsDim === dimension,
            ),
        ),
      ),
    [filters, onFiltersChange],
  );

  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const filterBarDirection = useMemo(() => (isCompactView ? 'column' : 'row'), [isCompactView]);

  return (
    <Grid container direction='column' className={dialogContent} spacing={3}>
      <Grid item>
        <Grid
          container
          justifyContent='space-between'
          direction={filterBarDirection}
          alignItems='stretch'
          wrap='nowrap'
          spacing={2}>
          <Grid item>
            <Grid
              container
              justifyContent='flex-start'
              direction={filterBarDirection}
              spacing={1}
              wrap='nowrap'>
              <Grid item>
                <Select
                  label={eventTypeLabel}
                  value={eventType}
                  size='small'
                  classes={{ root: filterBarFilterControl }}
                  SelectProps={{ ...showMenuBelowSelector }}
                  onChange={handleEventTypeChange}>
                  {eventTypeOptions.map((opt) => (
                    <MenuItem value={opt} key={opt}>
                      {translate(EventTypeToTranslationKey[opt])}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <ExperienceAnalyticsPageFilterBarControl
                config={filterBarConfig}
                filters={filters}
                onFiltersChange={onFiltersChange}
                showIconWithText={false}
              />
            </Grid>
          </Grid>
          <Grid item>
            <Button variant='contained' color='secondary' onClick={clearLiveEventsFilters}>
              {translate(translationKey('Action.ResetFilters', TranslationNamespace.Analytics))}
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid item>
        <LiveEventsTable />
      </Grid>
    </Grid>
  );
};

export default RecommendedEventsLiveEventsTableWithFilters;
