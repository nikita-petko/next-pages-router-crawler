import { V2CloudClient } from '@rbx/open-cloud';
import { getBEDEV2ServiceBasePath } from './utils';

const basePath = getBEDEV2ServiceBasePath('user');

const openCloudSafetyClient = new V2CloudClient({ servicePath: basePath });
export default openCloudSafetyClient;
