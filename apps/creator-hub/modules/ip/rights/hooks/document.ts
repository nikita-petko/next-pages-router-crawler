import type { Document } from '@rbx/client-rights/v1';
import rightsClient from '@modules/clients/rights';

async function fetchDocument(document: Document, file: File): Promise<Response> {
  const headers = new Headers();
  if (document.request?.signedHeader) {
    Object.entries(document.request.signedHeader).forEach(([key, value]) => {
      headers.set(key, Array.isArray(value) ? value.join(',') : value);
    });
  }
  let url = document.request?.url;
  if (document.request?.url?.includes('rights-portal-docs-test')) {
    url = (document.request?.url || '').replace(
      'rights-portal-docs-test.s3.us-east-1.amazonaws.com',
      'rights-portal-docs-test.simulpong.com',
    );
  }

  return fetch(url || '', {
    method: document.request?.method,
    headers,
    body: file,
  });
}

export default async function createDocuments(docs: Array<File>): Promise<Array<string>> {
  const documentIds: Array<string> = [];
  await Promise.all(
    docs.map(async (document) => {
      const doc = await rightsClient.createDocument(encodeURI(document.name));
      documentIds.push(doc.id || '');
      return fetchDocument(doc, document);
    }),
  );

  return documentIds;
}

export async function createDocumentsFromMap(
  docs: Map<string, File>,
): Promise<Map<string, string>> {
  const keys = Array.from(docs.keys());
  const docKeysToIds = new Map<string, string>();
  await Promise.all(
    keys.map(async (key) => {
      const file = docs.get(key);
      if (!file) {
        return {};
      }
      const doc = await rightsClient.createDocument(encodeURI(file.name));
      docKeysToIds.set(key, doc.id || '');
      return fetchDocument(doc, file);
    }),
  );

  return docKeysToIds;
}

export async function createImage(imageFile: File): Promise<string> {
  const image = await rightsClient.createSearchImage();
  const headers = new Headers();
  if (image.request?.signedHeader) {
    Object.entries(image.request.signedHeader).forEach(([key, value]) => {
      headers.set(key, Array.isArray(value) ? value.join(',') : value);
    });
  }
  let url = image.request?.url;
  if (image.request?.url?.includes('rights-search-docs-test')) {
    url = (image.request?.url || '').replace(
      'rights-search-docs-test.s3.us-east-1.amazonaws.com',
      'rights-search-docs-test.simulpong.com',
    );
  }
  await fetch(url || '', {
    method: image.request?.method,
    headers,
    body: imageFile,
  });
  return image.id || '';
}
