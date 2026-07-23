import type { FC } from 'react';
import type { InsightCardSpec } from '@modules/experience-analytics-shared/types/insights';
import { InsightTypeV2 } from '@modules/experience-analytics-shared/types/insights';
import AdsPerformanceChart from './AdsPerformanceChart';
import LowEndAndroidCrashRateChart from './LowEndAndroidCrashRateChart';
import PercentChangeChart from './PercentChangeChart';

/**
 * Component that determines which chart to render within an Insight for each insight type.
 */
const InsightChart: FC<{ spec: InsightCardSpec }> = ({ spec }) => {
  const { type: insightType } = spec;

  switch (insightType) {
    case InsightTypeV2.PercentChange: {
      return <PercentChangeChart spec={spec} />;
    }
    case InsightTypeV2.AdsPerformance7Days: {
      return <AdsPerformanceChart spec={spec} />;
    }
    case InsightTypeV2.LowEndAndroidCrashRate: {
      return <LowEndAndroidCrashRateChart spec={spec} />;
    }
    case InsightTypeV2.ExperienceQuality: {
      return null;
    }
    case InsightTypeV2.SummaryReport7Days:
    case InsightTypeV2.SummaryReport:
    case InsightTypeV2.PlayerFeedbackReport7Days:
    case InsightTypeV2.PlayerFeedbackReport28Days: {
      return null;
    }
    default: {
      const exhaustiveCheck: never = insightType;
      throw new Error(`Unhandled Insight type ${exhaustiveCheck}`);
    }
  }
};

export default InsightChart;
