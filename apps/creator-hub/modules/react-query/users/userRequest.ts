import { UsersApi } from '@rbx/client-users/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const configuration = createClientConfiguration('users', 'bedev1');

const userAPI = new UsersApi(configuration);

const getUserById = (userId: number) => {
  return userAPI.v1UsersUserIdGet({ userId });
};

export default getUserById;
