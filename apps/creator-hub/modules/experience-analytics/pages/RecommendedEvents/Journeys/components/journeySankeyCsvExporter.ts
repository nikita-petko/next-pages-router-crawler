import type { CSVData } from '@rbx/core';
import { compileCSV } from '@rbx/core';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import {
  brandUntranslatableText,
  translationKey,
} from '@modules/analytics-translations/wrapperFunctions';
import GenericChartExporter from '@modules/charts-generic/charts/exporters/GenericChartExporter';
import { escapeFileName } from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import getDimensionRenderer from '@modules/experience-analytics-shared/components/getDimensionRenderer';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { JourneyData } from '../types';

/**
 * CSV exporter for the journey Sankey chart. The chart is a bespoke
 * (NonGeneric) component, so it can't use the generic-chart exporter the
 * standard chart card wires up — but it still extends {@link GenericChartExporter}
 * so its headers are localized through the injected `translate` (matching every
 * other chart-type exporter) instead of being hardcoded English. This turns the
 * transition edges backing the diagram into a downloadable CSV so the overflow
 * "Download CSV" action behaves like every other analytics chart.
 *
 * The `chart` payload is the journey transition data; `exportMetricLabel` carries
 * the (user-supplied, untranslatable) journey name used for the filename.
 */
class JourneySankeyCsvExporter extends GenericChartExporter<JourneyData | undefined> {
  constructor(
    journeyData: JourneyData | undefined,
    journeyName: string,
    translate: TranslationKeyToFormattedText,
  ) {
    super(brandUntranslatableText(journeyName || 'journey'), journeyData, translate);
  }

  get hasEmptyData(): boolean {
    return this.chart === undefined || this.chart.edges.length === 0;
  }

  protected getExportFilename(): string {
    return `${escapeFileName(this.exportMetricLabel)}.csv`;
  }

  protected generateCSV(): CSVData {
    const rows: string[][] = [
      [
        this.translate(getDimensionRenderer(RAQIV2Dimension.FromNode).name),
        this.translate(getDimensionRenderer(RAQIV2Dimension.FromStage).name),
        this.translate(getDimensionRenderer(RAQIV2Dimension.ToNode).name),
        this.translate(getDimensionRenderer(RAQIV2Dimension.ToStage).name),
        this.translate(translationKey('Label.JourneyMetricUsers', TranslationNamespace.Analytics)),
        this.translate(
          translationKey('Label.JourneyMetricSessions', TranslationNamespace.Analytics),
        ),
      ],
    ];
    for (const edge of this.chart?.edges ?? []) {
      rows.push([
        edge.fromNode,
        String(edge.fromStage),
        edge.toNode,
        String(edge.toStage),
        String(edge.userCount),
        String(edge.transitionCount),
      ]);
    }
    return compileCSV(rows);
  }
}

export default JourneySankeyCsvExporter;
