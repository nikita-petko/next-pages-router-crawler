import {
  AnalyticsQueryParams,
  analyticsExperimentsNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { ExperimentDetailsTab } from '../types/UIEnums';

const buildExperimentDetailsPageUrlWithParams = ({
  universeId,
  experimentId,
  tabOnOpen,
}: {
  universeId: number;
  experimentId: string;
  tabOnOpen?: ExperimentDetailsTab;
}) => {
  const basePath = `${buildExperienceAnalyticsUrlWithParams(
    analyticsExperimentsNavigationItem,
    {},
    universeId,
  )}/${experimentId}/experiment-details`;

  if (tabOnOpen) {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.set(AnalyticsQueryParams.ExperimentDetailsTab, tabOnOpen);
    return `${basePath}?${urlSearchParams.toString()}`;
  }

  return basePath;
};

export default buildExperimentDetailsPageUrlWithParams;
