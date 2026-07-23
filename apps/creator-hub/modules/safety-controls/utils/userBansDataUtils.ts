import { Locale } from '@rbx/intl';
import type { V2CloudProtos } from '@rbx/open-cloud';
import type { google } from '@rbx/open-cloud/dist/v2/protos/protos';
import usersClient from '@modules/clients/users';

export type UserRestriction = V2CloudProtos.IUserRestriction;
export type UserRestrictionLog = V2CloudProtos.IUserRestrictionLog;

export const getUserIdFromUserPath = (userPath: string): number => {
  if (userPath === '') {
    throw new Error('User path cannot be the empty string');
  }

  const userPathParts = userPath.split('/');
  let userIdString;

  if (userPathParts.length === 1) {
    [userIdString] = userPathParts;
  } else if (userPathParts.length === 2 && userPathParts[0] === 'users') {
    [, userIdString] = userPathParts;
  } else {
    throw new Error(`User path is not formatted correctly: ${userPath}`);
  }

  // Checks that userIdString is a valid integer in string form
  if (!/^\d+$/.test(userIdString)) {
    throw new Error(`User ID is not a valid integer: ${userPath}`);
  }

  const userId = Number(userIdString);

  if (Number.isNaN(userId)) {
    throw new TypeError(`User ID is not a valid number: ${userPath}`);
  }
  return userId;
};

export const getExperienceIdFromQueryParams = (
  experienceIdString: string | string[] | undefined,
): number => {
  if (experienceIdString === '') {
    throw new Error('experienceId cannot be empty');
  }

  if (typeof experienceIdString !== 'string') {
    throw new TypeError('Error parsing experience ID from path');
  }

  const experienceId = Number(experienceIdString);
  if (Number.isNaN(experienceId)) {
    throw new TypeError(`Experience ID is not a valid number: ${experienceIdString}`);
  }
  return experienceId;
};

export const convertTimestampToDateStringWithTime = (
  timestamp: google.protobuf.ITimestamp,
  locale: Locale | null,
): string => {
  return new Date(Number(timestamp.seconds) * 1000).toLocaleString(locale ?? Locale.English, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const convertTimestampToDate = (timestamp: google.protobuf.ITimestamp): Date => {
  return new Date(Number(timestamp.seconds) * 1000);
};

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

export const getUsernameFromUserId = (userId: number): Promise<string> => {
  if (!getUsernameFromUserIdMemo.has(userId)) {
    getUsernameFromUserIdMemo.set(userId, fetchUsernameFromUserId(userId));
  }

  return getUsernameFromUserIdMemo.get(userId)!;
};
