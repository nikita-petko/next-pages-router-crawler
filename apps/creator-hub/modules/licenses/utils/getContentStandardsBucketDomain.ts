import { resolveUrl } from '@rbx/env-utils';

function getContentStandardsBucketDomain() {
  return resolveUrl('agreementsManagerUrl', process.env.targetEnvironment, process.env.buildTarget);
}

export default getContentStandardsBucketDomain;
