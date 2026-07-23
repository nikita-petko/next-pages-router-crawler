import { AnnotationsClient } from './annotations';

export const creatorAnnotationsClient: AnnotationsClient = {
  getAnnotations: () => {
    return new Promise(() => {
      return [];
    });
  },
};

export default creatorAnnotationsClient;
