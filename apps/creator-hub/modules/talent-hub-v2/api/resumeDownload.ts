function getFilenameFromContentDisposition(contentDisposition: string | null): string | undefined {
  if (!contentDisposition) {
    return undefined;
  }
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/"/g, ''));
  }
  const filenameMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return filenameMatch?.[1];
}

function triggerBrowserDownload(url: string, fileName: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function createMockPdfBlob(): Blob {
  const pdf = [
    '%PDF-1.4',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    'endobj',
    '4 0 obj',
    '<< /Length 77 >>',
    'stream',
    'BT /F1 18 Tf 72 720 Td (Mock resume for local Talent Hub testing.) Tj ET',
    'endstream',
    'endobj',
    '5 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000241 00000 n ',
    '0000000368 00000 n ',
    'trailer',
    '<< /Size 6 /Root 1 0 R >>',
    'startxref',
    '438',
    '%%EOF',
  ].join('\n');
  return new Blob([pdf], { type: 'application/pdf' });
}

export async function downloadResumeUrl(downloadUrl: string, fileName = 'resume'): Promise<void> {
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    const blob = await response.blob();
    const resolvedFileName =
      getFilenameFromContentDisposition(response.headers.get('content-disposition')) ?? fileName;
    const blobUrl = URL.createObjectURL(blob);
    triggerBrowserDownload(blobUrl, resolvedFileName);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
  } catch {
    // If S3 does not expose CORS headers locally, fall back to a normal browser
    // download. The backend may still force attachment via Content-Disposition.
    triggerBrowserDownload(downloadUrl, fileName);
  }
}

export function downloadMockResume(fileName = 'mock-resume'): void {
  const blob = createMockPdfBlob();
  const blobUrl = URL.createObjectURL(blob);
  triggerBrowserDownload(blobUrl, fileName);
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
}
