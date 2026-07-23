import { GameServersApi, RestartsApi } from '@rbx/client-server-management-service/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const config = createClientConfiguration('server-management', 'bedev2');

export const serverManagementApi = new GameServersApi(config);
export const restartsApi = new RestartsApi(config);
