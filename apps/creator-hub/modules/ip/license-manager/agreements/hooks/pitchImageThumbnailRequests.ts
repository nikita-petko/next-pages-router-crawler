import { BatchApi, type V1BatchPostRequest } from '@rbx/client-thumbnails/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

// TODO: Replace this client with `getThumbnailsClient().getBatchThumbnails` after
// https://github.rbx.com/Roblox/grasshopper/pull/2544 is released and adopted here.
const configuration = createClientConfiguration('thumbnails', 'bedev1');
const thumbnailsBatchApi = new BatchApi(configuration);

const postPitchImageThumbnailBatch = (request: V1BatchPostRequest) =>
  thumbnailsBatchApi.v1BatchPost(request);

export default postPitchImageThumbnailBatch;
