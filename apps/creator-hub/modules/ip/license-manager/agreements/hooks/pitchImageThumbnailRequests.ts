import { BatchApi, type V1BatchPostRequest } from '@rbx/client-thumbnails/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

// Do not copy this file or instantiate `@rbx/client-thumbnails` BatchApi elsewhere.
// Thumbnail fetching must go through `@rbx/thumbnails`. This License Manager-only
// wrapper exists because IPH pitch images are private and need `accessContext` on
// POST /v1/batch, which `@rbx/thumbnails` cannot pass yet. Calling BatchApi here
// is a temporary exception so we do not add a second shared thumbnails client.
// TODO: After https://github.rbx.com/Roblox/grasshopper/pull/2544 is released,
// replace this with `getThumbnailsClient().getBatchThumbnails` and delete this file.
const configuration = createClientConfiguration('thumbnails', 'bedev1');
const thumbnailsBatchApi = new BatchApi(configuration);

const postPitchImageThumbnailBatch = (request: V1BatchPostRequest) =>
  thumbnailsBatchApi.v1BatchPost(request);

export default postPitchImageThumbnailBatch;
