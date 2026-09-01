import { GameServersApi } from '@rbx/client-server-management-service/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

export const gameObservabilityApi = new GameServersApi(
  createClientConfiguration('server-management', 'bedev2'),
);
