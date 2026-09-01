import type { JourneyEntry } from './useJourneyConfigStorage';

const escapeStringLiteral = (value: string): string =>
  value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

const generateJourneySnippet = (entry: JourneyEntry): string => {
  const escapedJourneyName = escapeStringLiteral(entry.journeyName);
  const sortedStages = [...entry.config.stages].sort((a, b) => a.stage_index - b.stage_index);

  const lines: string[] = ['local AnalyticsService = game:GetService("AnalyticsService")', ''];

  for (const stage of sortedStages) {
    lines.push(`-- Stage ${stage.stage_index}`);
    for (const node of stage.nodes) {
      const escapedNodeName = escapeStringLiteral(node.node_name);
      lines.push(
        `AnalyticsService:LogJourneyEvent(player, "${escapedJourneyName}", "${escapedNodeName}")`,
      );
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
};

export default generateJourneySnippet;
