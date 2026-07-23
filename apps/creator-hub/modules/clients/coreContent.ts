import { CoreContentApi } from '@rbx/client-core-content-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const defaultConfig = createClientConfiguration('core-content', 'bedev2');

export {
  CreatorEligibilityEnum,
  type CoreContentApi as CoreContentClient,
} from '@rbx/client-core-content-api/v1';
const coreContentClient = new CoreContentApi(defaultConfig);
export default coreContentClient;
