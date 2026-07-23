import { ServiceEfficiencyApiApi } from '@rbx/client-service-efficiency-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const configuration = createClientConfiguration('service-efficiency-api', 'bedev2');

export type { ServiceEfficiencyApiApi as ServiceEfficiencyClient } from '@rbx/client-service-efficiency-api/v1';
const serviceEfficiencyClient = new ServiceEfficiencyApiApi(configuration);
export default serviceEfficiencyClient;
