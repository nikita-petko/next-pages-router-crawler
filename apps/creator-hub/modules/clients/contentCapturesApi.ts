import { ContentCapturesApi, MomentsApi } from '@rbx/client-content-captures-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const configuration = createClientConfiguration('content-captures-api', 'bedev2');

const contentCapturesApi = new ContentCapturesApi(configuration);
const momentsApi = new MomentsApi(configuration);

const contentCapturesApiClient = Object.assign(contentCapturesApi, {
  momentsGetUsersMoments: (request: Parameters<MomentsApi['momentsGetUsersMoments']>[0]) =>
    momentsApi.momentsGetUsersMoments(request),
  momentsDeleteMoment: (request: Parameters<MomentsApi['momentsDeleteMoment']>[0]) =>
    momentsApi.momentsDeleteMoment(request),
});

export default contentCapturesApiClient;
