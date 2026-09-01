import type { SankeyChartData } from '@rbx/analytics-ui';
import type { CSVData } from '@rbx/core';
import { compileCSV } from '@rbx/core';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import GenericChartExporter from './GenericChartExporter';
import { escapeFileName } from './GenericCsvExporter';

class GenericSankeyExporter extends GenericChartExporter<SankeyChartData> {
  protected generateCSV(): CSVData {
    const { links } = this.chart;
    const lines: string[][] = [];

    lines.push([
      this.translate(translationKey('Label.From', TranslationNamespace.Analytics)),
      this.translate(translationKey('Label.To', TranslationNamespace.Analytics)),
      this.translate(translationKey('Label.Value', TranslationNamespace.Analytics)),
    ]);

    links.forEach((link) => {
      lines.push([link.from, link.to, `${link.weight}`]);
    });

    return compileCSV(lines);
  }

  protected getExportFilename(): string {
    const prefix = this.fileNamePrefix ? `${this.fileNamePrefix}: ` : '';
    const unescaped = `${prefix}${this.exportMetricLabel}`;

    return `${escapeFileName(unescaped)}.csv`;
  }

  get hasEmptyData(): boolean {
    return this.chart.nodes.length === 0 || this.chart.links.length === 0;
  }
}

export default GenericSankeyExporter;
