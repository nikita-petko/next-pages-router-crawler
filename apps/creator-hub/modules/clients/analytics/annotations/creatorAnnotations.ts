import type { AnnotationsClient } from './annotations';

export const creatorAnnotationsClient: AnnotationsClient = {
  getAnnotations: () => Promise.resolve([]),
  getCustomAlertAnnotation: () => Promise.resolve([]),
};

export default creatorAnnotationsClient;
