import { usersClient } from '@modules/clients';

const getUsernameFromUserIdMemo = new Map<number, Promise<string>>();

const fetchUsernameFromUserId = async (userId: number): Promise<string> => {
  try {
    const userDetails = await usersClient.getUserById(userId);
    const username = userDetails.name ?? userId.toString();
    return username;
  } catch {
    return userId.toString();
  }
};

const getUsernameFromUserId = (userId: number): Promise<string> => {
  if (!getUsernameFromUserIdMemo.has(userId)) {
    getUsernameFromUserIdMemo.set(userId, fetchUsernameFromUserId(userId));
  }

  return getUsernameFromUserIdMemo.get(userId)!;
};

export default getUsernameFromUserId;
