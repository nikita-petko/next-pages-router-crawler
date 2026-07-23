import type { FC, ReactElement } from 'react';
import { useTranslation } from '@rbx/intl';
import { makeStyles, Skeleton } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import ChartHeader from '@modules/charts-generic/charts/ChartHeader';
import type TimeSeriesChartExportButton from '@modules/charts-generic/charts/TimeSeriesChartExportButton';
import {
  useThumbnailPersonalizationFormattedDateRange,
  ThumbnailPersonalizationTableTitleKey,
} from '../hooks/useThumbnailPersonalizationFormattedDateRange';

type PersonalizedThumbnailsTableHeaderProps = {
  isDataLoading: boolean;
  startTimeUTC: Date;
  endTimeUTC: Date;
  exportButton: ReactElement<typeof TimeSeriesChartExportButton> | null;
};

const useStyles = makeStyles()(() => {
  return {
    titleDateRangeSkeleton: {
      margin: '0 8px',
    },
  };
});

const PersonalizedThumbnailsTableHeader: FC<PersonalizedThumbnailsTableHeaderProps> = ({
  isDataLoading,
  startTimeUTC,
  endTimeUTC,
  exportButton,
}) => {
  const {
    classes: { titleDateRangeSkeleton },
  } = useStyles();
  const { translateHTML } = useTranslationWrapper(useTranslation());

  const formattedDateRange = useThumbnailPersonalizationFormattedDateRange(
    startTimeUTC,
    endTimeUTC,
  );

  return (
    <ChartHeader
      title={translateHTML(ThumbnailPersonalizationTableTitleKey, null, {
        dateRange: isDataLoading ? (
          <Skeleton variant='text' width={96} animate classes={{ root: titleDateRangeSkeleton }} />
        ) : (
          formattedDateRange
        ),
      })}
      exportButton={exportButton}
    />
  );
};

export default PersonalizedThumbnailsTableHeader;
