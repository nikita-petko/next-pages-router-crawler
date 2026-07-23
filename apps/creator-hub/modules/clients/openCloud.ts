import { V2CloudClient } from '@rbx/open-cloud';
import { getBEDEV2ServiceBasePath } from './utils';

const basePath = getBEDEV2ServiceBasePath('user');

const openCloudV2Client = new V2CloudClient({ servicePath: basePath });

export { V2CloudProtos as V2Protos } from '@rbx/open-cloud';

export default openCloudV2Client;
