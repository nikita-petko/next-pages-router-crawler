import type { JourneyEntry } from './useJourneyConfigStorage';

export type JourneyFormValues = {
  name: string;
  stages: Array<{
    nodes: Array<{ eventName: string }>;
  }>;
};

export function makeEmptyJourney(): JourneyFormValues {
  return {
    name: '',
    stages: [{ nodes: [{ eventName: '' }] }, { nodes: [{ eventName: '' }] }],
  };
}

export function entryToFormValues(entry: JourneyEntry): JourneyFormValues {
  return {
    name: entry.journeyName,
    stages: [...entry.config.stages]
      .sort((a, b) => a.stage_index - b.stage_index)
      .map((stage) => ({
        nodes: stage.nodes.map((node) => ({ eventName: node.node_name })),
      })),
  };
}

export function formValuesToEntry(values: JourneyFormValues): JourneyEntry {
  return {
    journeyName: values.name.trim(),
    config: {
      stages: values.stages.map((stage, idx) => ({
        stage_index: idx + 1,
        nodes: stage.nodes.map((node) => ({ node_name: node.eventName.trim() })),
      })),
    },
  };
}
