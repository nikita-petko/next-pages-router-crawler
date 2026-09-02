const bytesPerKB = 1024;
const bytesPerMB = bytesPerKB * 1024;
const MAX_DOCUMENT_SIZE_MB = 20;
const ACCEPTED_DOCUMENT_EXTENSION = 'pdf';
const ACCEPTED_DOCUMENT_MIME_TYPE = 'application/pdf';

export interface DocumentValidationError {
  type: 'fileSize' | 'fileType' | 'mimeType';
  message: string;
}

/**
 * Validates a PDF document file for brand guidelines / content standards uploads.
 * Returns null if valid, or a validation error if invalid.
 *
 * Requirements:
 * - Maximum file size: 20 MB
 * - File type: *.pdf
 * - MIME type: application/pdf
 */
export const validateDocumentPdf = (file: File): DocumentValidationError | null => {
  if (file.size > MAX_DOCUMENT_SIZE_MB * bytesPerMB) {
    return {
      type: 'fileSize',
      message: 'Error.ImageFileSizeTooBig',
    };
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || fileExtension !== ACCEPTED_DOCUMENT_EXTENSION) {
    return {
      type: 'fileType',
      message: 'Error.DocumentFileTypeInvalid',
    };
  }

  if (file.type !== ACCEPTED_DOCUMENT_MIME_TYPE) {
    return {
      type: 'mimeType',
      message: 'Error.DocumentFileFormatInvalid',
    };
  }

  return null;
};
