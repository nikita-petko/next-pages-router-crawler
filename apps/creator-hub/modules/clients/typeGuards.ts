import { isNonEmptyString } from '@modules/miscellaneous/common/utils';
import { User } from './users';

export type ValidatedUser = Required<User>;

/**
 * While the response type for User marks these fields as optional, the back end should ensure they are all present.
 * To satisfy the type system, this refines the type of User to ValidatedUser to avoid having to deal with optional fields.
 */
export const isValidUser = (user: User | undefined): user is ValidatedUser => {
  if (!user) {
    return false;
  }

  return (
    Number.isInteger(user.id) && isNonEmptyString(user.name) && isNonEmptyString(user.displayName)
  );
};
