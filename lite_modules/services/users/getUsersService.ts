import usersClient from '@clients/users';

interface UserLookupResult {
  displayName?: string;
  id: number;
  name: string;
}

interface GetUsersByIdsResponse {
  data: UserLookupResult[];
}

export const getUsersByIds = async (userIds: number[]): Promise<UserLookupResult[]> => {
  const response = await usersClient.post<GetUsersByIdsResponse>({
    body: {
      excludeBannedUsers: false,
      userIds,
    },
    url: '/users',
  });

  return response.data.data;
};
