import type { SingleTreemapSeries } from '@rbx/analytics-ui';
import type { CSVData } from '@rbx/core';
import { compileCSV } from '@rbx/core';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import GenericChartExporter from './GenericChartExporter';
import { escapeFileName } from './GenericCsvExporter';

type TreemapChartSpec = {
  series: SingleTreemapSeries;
};

class GenericTreemapExporter extends GenericChartExporter<TreemapChartSpec> {
  protected generateCSV(): CSVData {
    const { series } = this.chart;
    const lines: string[][] = [];

    lines.push([
      this.translate(translationKey('Label.Id', TranslationNamespace.Analytics)),
      this.translate(translationKey('Label.Name', TranslationNamespace.Analytics)),
      this.translate(translationKey('Label.Value', TranslationNamespace.Analytics)),
      this.translate(translationKey('Label.ParentId', TranslationNamespace.Analytics)),
    ]);

    series.forEach((point) => {
      lines.push([point.id, point.name, `${point.value}`, point.parent ?? '']);
    });

    return compileCSV(lines);
  }

  protected getExportFilename(): string {
    const prefix = this.fileNamePrefix ? `${this.fileNamePrefix}: ` : '';
    const unescaped = `${prefix}${this.exportMetricLabel}`;

    return `${escapeFileName(unescaped)}.csv`;
  }

  get hasEmptyData(): boolean {
    return this.chart.series.length === 0;
  }
}

export default GenericTreemapExporter;
