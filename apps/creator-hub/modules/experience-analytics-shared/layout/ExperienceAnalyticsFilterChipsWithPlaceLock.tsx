import { type FC, useMemo } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TSupportedFilterBarDimensions } from '../constants/FilterDimensionConfig';
import { useUniverseResource } from '../hooks/useChartResourceProvider';
import useForcedSinglePlaceFilterLock from '../hooks/useForcedSinglePlaceFilterLock';
import ExperienceAnalyticsFilterChips from './ExperienceAnalyticsFilterChips';

type ExperienceAnalyticsFilterChipsWithPlaceLockProps = {
  readonly dimensions: readonly TSupportedFilterBarDimensions[];
  readonly knownRAQIDimensionsShownElsewhere?: readonly TRAQIV2Dimension[];
};

const HiddenPlaceFilterChips: FC<ExperienceAnalyticsFilterChipsWithPlaceLockProps> = ({
  dimensions,
  knownRAQIDimensionsShownElsewhere,
}) => {
  const resource = useUniverseResource();
  const { hidePlaceFilter } = useForcedSinglePlaceFilterLock(resource);
  const visibleDimensions = useMemo(
    () =>
      hidePlaceFilter
        ? dimensions.filter((dimension) => dimension !== RAQIV2Dimension.Place)
        : dimensions,
    [dimensions, hidePlaceFilter],
  );
  const knownElsewhere = useMemo(
    () =>
      hidePlaceFilter
        ? [...(knownRAQIDimensionsShownElsewhere ?? []), RAQIV2Dimension.Place]
        : knownRAQIDimensionsShownElsewhere,
    [hidePlaceFilter, knownRAQIDimensionsShownElsewhere],
  );

  return (
    <ExperienceAnalyticsFilterChips
      dimensions={visibleDimensions}
      knownRAQIDimensionsShownElsewhere={knownElsewhere}
    />
  );
};

const ExperienceAnalyticsFilterChipsWithPlaceLock: FC<
  ExperienceAnalyticsFilterChipsWithPlaceLockProps
> = ({ dimensions, knownRAQIDimensionsShownElsewhere }) => {
  if (!dimensions.includes(RAQIV2Dimension.Place)) {
    return (
      <ExperienceAnalyticsFilterChips
        dimensions={dimensions}
        knownRAQIDimensionsShownElsewhere={knownRAQIDimensionsShownElsewhere}
      />
    );
  }

  return (
    <HiddenPlaceFilterChips
      dimensions={dimensions}
      knownRAQIDimensionsShownElsewhere={knownRAQIDimensionsShownElsewhere}
    />
  );
};

export default ExperienceAnalyticsFilterChipsWithPlaceLock;
