import type { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import {
  teamOwnershipByMetric,
  WatermarkSubjectType,
  type WatermarkQueryResourceType,
  type QuerySummary,
} from '@rbx/ownership-watermark';
import { OwnershipWatermarkRoot } from '@rbx/ownership-watermark/react';
import { isOwnershipWatermarkEnabled } from '@generated/flags/creatorAnalytics';

const warnedMissingMetrics = new Set<string>();

const hasMetricOwnershipEntry = (metricKey: string): metricKey is TRAQIV2UIMetric =>
  Object.hasOwn(teamOwnershipByMetric, metricKey);

const getTeamIdForMetric = (metricKey: string): number | undefined =>
  hasMetricOwnershipEntry(metricKey) ? teamOwnershipByMetric[metricKey] : undefined;

/**
 * Flag-gated adapter around `<OwnershipWatermark />` from
 * `@rbx/ownership-watermark`.
 *
 * Renders the watermark only when the generated creatorAnalytics
 * `isOwnershipWatermarkEnabled` flag is true and ready. While the flag query is
 * in flight we render nothing, so the watermark never flashes in before the
 * decision is made.
 *
 * Contract: the generated Barista flag runtime must be initialized at app
 * startup. Creator Hub does this in `_app`, and tests use the `@rbx/flags` mock.
 *
 * Employee override: `useFlag` consults the generated flag override store, and
 * the floating widget exposes this flag through its generated-flags bridge.
 *
 * Query ownership: RAQI chart specs encode the metric owner team, queried
 * resource, metric, and first breakdown/filter dimension. Team and conversation
 * subjects remain as fallbacks for callers without query context.
 */
type FlagGatedOwnershipWatermarkProps = {
  metricKey?: TRAQIV2UIMetric | string;
  conversationId?: string;
  query?: Omit<QuerySummary, 'metric'> & {
    metric: TRAQIV2UIMetric | string;
    resourceType: WatermarkQueryResourceType;
  };
};

const FlagGatedOwnershipWatermark: React.FC<FlagGatedOwnershipWatermarkProps> = ({
  metricKey,
  conversationId,
  query,
}) => {
  const { ready, value: isOwnershipWatermarkFlagEnabled } = useFlag(isOwnershipWatermarkEnabled);
  if (!ready) {
    return null;
  }
  if (!isOwnershipWatermarkFlagEnabled) {
    return null;
  }

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
      console.warn(`[FlagGatedOwnershipWatermark] No team ownership entry for metric: ${key}`);
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

export default FlagGatedOwnershipWatermark;
