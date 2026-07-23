import type { Document } from '@rbx/client-rights/v1';
import { uuidService } from '@rbx/core';
import type { Doc } from '@modules/miscellaneous/components/uploaders/components/MultiDocumentUploader/MultiDocumentUploader';
import parseUrl from './parseUrl';

const getDoc = (document: Document): Doc => {
  const documentUrl = document.request?.url || '';
  const name = document.name || '';

  if (!parseUrl(documentUrl)) {
    return { key: uuidService.generateRandomUuid(), name };
  }

  const doc: Doc = {
    // NOTE(connor-murphy, 10/20/2023): We do not have the actual file here so
    // instead of using URL.createObjectURL(file) for the key we will generate
    // a random one instead
    key: documentUrl,
    name,
  };

  return doc;
};

export default getDoc;
