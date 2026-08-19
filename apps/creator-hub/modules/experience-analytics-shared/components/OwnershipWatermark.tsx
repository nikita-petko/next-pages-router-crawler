import type { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import {
  teamOwnershipByMetric,
  WatermarkSubjectType,
  type WatermarkQueryResourceType,
  type QuerySummary,
} from '@rbx/ownership-watermark';
import { OwnershipWatermarkRoot } from '@rbx/ownership-watermark/react';

const warnedMissingMetrics = new Set<string>();

const hasMetricOwnershipEntry = (metricKey: string): metricKey is TRAQIV2UIMetric =>
  Object.hasOwn(teamOwnershipByMetric, metricKey);

const getTeamIdForMetric = (metricKey: string): number | undefined =>
  hasMetricOwnershipEntry(metricKey) ? teamOwnershipByMetric[metricKey] : undefined;

/** Renders an ownership watermark for a metric, query, or assistant conversation. */
type OwnershipWatermarkProps = {
  metricKey?: TRAQIV2UIMetric | string;
  conversationId?: string;
  query?: Omit<QuerySummary, 'metric'> & {
    metric: TRAQIV2UIMetric | string;
    resourceType: WatermarkQueryResourceType;
  };
};

const OwnershipWatermark: React.FC<OwnershipWatermarkProps> = ({
  metricKey,
  conversationId,
  query,
}) => {
  const queryMetric = query?.metric;
  const metricTeamId =
    (metricKey ? getTeamIdForMetric(metricKey) : undefined) ??
    (queryMetric ? getTeamIdForMetric(queryMetric) : undefined);
  const queryTeamId = query?.teamId ?? metricTeamId;
  if (query) {
    return (
      <OwnershipWatermarkRoot
        subject={{
          type: WatermarkSubjectType.Query,
          ...query,
          teamId: queryTeamId,
        }}
      />
    );
  }

  if (metricTeamId === undefined) {
    const trimmedConversationId = conversationId?.trim();
    if (
      metricKey &&
      process.env.NODE_ENV !== 'production' &&
      !warnedMissingMetrics.has(metricKey)
    ) {
      const key = metricKey;
      warnedMissingMetrics.add(key);
      console.warn(`[OwnershipWatermark] No team ownership entry for metric: ${key}`);
    }
    if (trimmedConversationId) {
      return (
        <OwnershipWatermarkRoot
          subject={{
            type: WatermarkSubjectType.Conversation,
            conversationId: trimmedConversationId,
          }}
        />
      );
    }
    return null;
  }

  return <OwnershipWatermarkRoot teamId={metricTeamId} />;
};

export default OwnershipWatermark;
