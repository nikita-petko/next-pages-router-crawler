import { CSVData, downloadBlob } from '@rbx/core';

export const escapeFileName = (unescapedFileName: string) => {
  return unescapedFileName.replaceAll(/[\\/:*?"<>|]/g, '-');
};

abstract class GenericCsvExporter {
  protected abstract generateCSV(): CSVData;

  protected abstract getExportFilename(): string;

  abstract get hasEmptyData(): boolean;

  download({
    onError,
    onSuccess,
  }: {
    onError?: (error: unknown) => void;
    onSuccess?: () => void;
  }): void {
    try {
      const csvData = this.generateCSV();
      const filename = this.getExportFilename();
      const bytes = new TextEncoder().encode(csvData);
      const exportBlob = new Blob([bytes], {
        type: 'text/csv;charset=utf-8',
      });
      downloadBlob(exportBlob, filename);
      onSuccess?.();
    } catch (error) {
      onError?.(error);
    }
  }
}

export default GenericCsvExporter;
