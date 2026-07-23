import { withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { useMemo, useState } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  useRAQIAnalyticsCurrentFilterBundle,
  GenericFullAnalyticsPageLayout,
  CreatorAnalyticsEmbeddedSurfaceConfig,
  CreatorAnalyticsPageMode,
  RAQIV2SpecialLayoutType,
  CreatorAnalyticsLayout,
} from '@modules/experience-analytics-shared';
import { SingleDateType } from '@modules/charts-generic';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { RAQIV2MetricGranularity, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { CreationsGridEmptyState } from '@modules/creations/common';
import { Asset } from '@modules/miscellaneous/common';
import EventCompareChartContainer from './EventCompareChartContainer';
import useEventAnalyticsContainerStyles from './EventAnalyticsContainer.styles';
import CreateEventButton from '../common/CreateEventButton';
import { tableConfigExperienceEventHistory } from './tableConfigs';

const FILTER_DIMENSIONS = [
  RAQIV2Dimension.AgeGroup,
  RAQIV2Dimension.Gender,
  RAQIV2Dimension.Country,
  RAQIV2Dimension.Locale,
  RAQIV2Dimension.Platform,
  RAQIV2Dimension.OperatingSystem,
];

const EventAnalyticsContainer = () => {
  const {
    classes: { analyticsContainer },
  } = useEventAnalyticsContainerStyles();
  const { filters } = useRAQIAnalyticsCurrentFilterBundle(FILTER_DIMENSIONS);
  const [emptyState, setEmptyState] = useState(false);
  const { gameDetails } = useCurrentGame();
  const resource = useMemo(
    () => ({
      id: gameDetails?.id ?? 0,
      type: RAQIV2ChartResourceType.Universe,
      isLoading: false,
    }),
    [gameDetails],
  );

  const eventHistoryTableConfig: CreatorAnalyticsEmbeddedSurfaceConfig = useMemo(() => {
    return {
      mode: CreatorAnalyticsPageMode.Embedded,
      resourceTypes: [RAQIV2ChartResourceType.Universe],
      granularity: { fixed: RAQIV2MetricGranularity.None },
      breakdownDimensions: [],
      filterDimensions: [],
      timeRangeOptions: {
        type: 'singleDay',
        supportedDates: [SingleDateType.MostRecent],
        defaultDate: SingleDateType.MostRecent,
        maxEndDateOffset: 2,
      } as const satisfies AnalyticsPageConfigDateOptions,
      surfaceAnnotationOptions: {
        supportedAnnotationTypes: [],
        defaultAnnotationTypes: [],
        showAnnotationsControl: false,
      } as const satisfies AnalyticsPageConfigAnnotationOptions,
      body: [
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [tableConfigExperienceEventHistory],
        },
      ],
    };
  }, []);

  if (emptyState) {
    // Note: it's possible for the user to have no events but still have occurances saved in their history
    // table if they have deleted all of their events. In this case, we still show the empty state for the
    // entire analytics page
    return (
      <Grid marginTop='36px'>
        <CreationsGridEmptyState assetType={Asset.Event}>
          <CreateEventButton color='primary' />
        </CreationsGridEmptyState>
      </Grid>
    );
  }

  return (
    <Grid paddingTop={2}>
      <GenericFullAnalyticsPageLayout
        resource={resource}
        controls={[]}
        raqiDimensions={FILTER_DIMENSIONS}>
        <Grid container direction='column' className={analyticsContainer}>
          <Grid item direction='column'>
            <EventCompareChartContainer
              resource={resource}
              filters={filters}
              setEmptyState={setEmptyState}
            />
          </Grid>
          <CreatorAnalyticsLayout config={eventHistoryTableConfig} />
        </Grid>
      </GenericFullAnalyticsPageLayout>
    </Grid>
  );
};

export default withTranslation(EventAnalyticsContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Analytics,
]);
