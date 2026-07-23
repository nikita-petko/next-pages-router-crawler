import type { SearchUniversesResponse } from '@rbx/client-universes-api/v1';
import type { GamesDetailsResponse, MultigetGameVotesResponse } from '@modules/clients/games';
import genericRAQIV2SeriesSummaryAdapter from '@modules/experience-analytics-shared/adapters/genericRAQIV2SeriesSummaryAdapter';
import type { RAQIV2TranslationDependencies } from '@modules/experience-analytics-shared/types/RAQIV2DimensionRenderer';
import calculateLikePercentage from '@modules/experience-analytics-shared/utils/calculateLikePercentage';
import type { ExperiencesTableMetricKeys } from '../components/experiencesTable/ExperiencesTableMetrics';
import { ExperiencesTableMetricColumnsOrder } from '../components/experiencesTable/ExperiencesTableMetrics';
import type {
  ExperiencesTableRowSpec,
  MetricValue,
} from '../components/experiencesTable/ExperiencesTableRow';
import type { ExperienceRAQIV2ColumnData } from '../components/useExperiencesColumnData';

const emptyMetrics = ExperiencesTableMetricColumnsOrder.reduce(
  (allMetrics, metric) => ({
    ...allMetrics,
    [metric]: { value: null, comparisonChipSpec: null },
  }),
  {} as Record<ExperiencesTableMetricKeys, MetricValue>,
);

const buildMetricValues = (
  universeId: number,
  columnDataByUniverseId: ExperienceRAQIV2ColumnData,
  translationDependencies: RAQIV2TranslationDependencies,
) => {
  const columnData = columnDataByUniverseId.get(universeId);
  if (!columnData) {
    return emptyMetrics;
  }

  return columnData.reduce((allMetrics, { key, data, spec, metric }) => {
    const summary = genericRAQIV2SeriesSummaryAdapter({
      responses: data,
      spec: {
        ...spec,
        metric,
        // This is a table adapter so there's no relevant time axis
        timeAxisBounds: null,
      },
      translationDependencies,
    });

    return {
      ...allMetrics,
      [key]: {
        value: summary.length ? summary[0].value : null,
        comparisonChipSpec: summary.length ? summary[0].comparisonChipSpec : null,
      },
    };
  }, emptyMetrics);
};

const experiencesRAQIV2ColumDataAdapter = ({
  mostRecentExperiencesData,
  experienceDetailsData,
  votesData,
  columnData,
  translationDependencies,
}: {
  mostRecentExperiencesData: SearchUniversesResponse | null;
  experienceDetailsData: GamesDetailsResponse | null;
  votesData: MultigetGameVotesResponse | null;
  columnData: ExperienceRAQIV2ColumnData;
  translationDependencies: RAQIV2TranslationDependencies;
}): ExperiencesTableRowSpec[] => {
  if (!mostRecentExperiencesData?.data) {
    return [];
  }

  const playingMap = new Map(
    experienceDetailsData?.data?.map((detail) => [detail.id, detail.playing]),
  );

  const votesMap = new Map(
    votesData?.data?.map((vote) => [
      vote.id,
      calculateLikePercentage(vote.upVotes, vote.downVotes),
    ]),
  );

  return mostRecentExperiencesData.data
    .filter((data) => data.id !== undefined)
    .map(({ name, id }) => {
      const universeId = id as number;
      return {
        universeId: universeId ?? 0,
        title: name ?? '',
        likeRatio: votesMap.get(universeId) ?? null,
        playing: playingMap.get(universeId) ?? null,
        metrics: buildMetricValues(universeId, columnData, translationDependencies),
      };
    });
};

export default experiencesRAQIV2ColumDataAdapter;
