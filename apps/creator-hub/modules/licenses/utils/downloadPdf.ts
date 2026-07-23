import { captureException } from '@sentry/nextjs';

/**
 * Downloads a PDF file with a custom filename.
 *
 * The download attribute of a simple <a> tag fails with cross-origin URLs, which our S3 bucket links are;
 * this function generates a same-origin blob URL to restore the download on-click functionality.
 *
 * @param pdfUrl - The URL of the PDF to download
 * @param fileName - Optional custom filename for the downloaded file. If not provided, uses the last part of the URL or 'document.pdf'
 * @returns A Promise that resolves when the download is complete or rejects if the download fails
 */

const downloadPdf = async (pdfUrl: string, fileName?: string): Promise<void> => {
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch PDF');
    }

    // Get the PDF content as a blob
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || pdfUrl.split('/').pop() || 'document.pdf';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    // Log the error to Sentry before falling back
    captureException(error, {
      tags: { module: 'licenses', operation: 'downloadPdf' },
      extra: { pdfUrl, fileName },
    });
    // Fallback to opening in new tab if download fails
    window.open(pdfUrl, '_blank');
  }
};

export default downloadPdf;
