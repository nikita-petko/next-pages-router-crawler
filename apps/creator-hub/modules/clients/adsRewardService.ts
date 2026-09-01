import { ValidationApi } from '@rbx/client-ads-reward-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const adsRewardServiceClient = new ValidationApi(
  createClientConfiguration('ads-reward-service', 'bedev2'),
);

export default adsRewardServiceClient;
