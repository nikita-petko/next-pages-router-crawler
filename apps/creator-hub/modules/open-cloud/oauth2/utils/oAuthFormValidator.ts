import { IDENTITY_SCOPES } from '../constants/oAuthConstants';
import type { OAuthEditFormState } from '../reducers/oAuthEditFormReducer';
import { isUserAccessedLinkValid, isRedirectUriValid } from './urlValidator';

export function isNameValid(name: string) {
  return name !== '';
}

/**
 * Determines based off the OAuth form state if a user is able to publish an app. Currently,
 * - terms of service
 * - privacy Policy
 * - an application summary
 * - at least one redirect Uri
 * - at lease one scope
 * - an entry link / domain
 *
 * Are all required fields
 * @param state
 * @returns a list of error translation keys listing which fields are invalid (one key per field)
 */
export function canPublish(state: OAuthEditFormState): string[] {
  const publishErrors: string[] = [];

  if (state.redirectUris.length === 0) {
    publishErrors.push('Label.RedirectUri');
  }
  if (state.privacyPolicyUri === '') {
    publishErrors.push('Label.PrivacyTermsUrl');
  }
  if (state.tosUri === '') {
    publishErrors.push('Label.TermsOfServiceUrl');
  }
  if (state.description === '') {
    publishErrors.push('Label.Description');
  }

  if (state.entryPointUri === '') {
    publishErrors.push('Label.EntryPointUrl');
  }

  // to check if at least one scope is selected, all Sets cannot have a size of zero basically
  const isOneScopeSelected = Object.entries(state.allowedScopes).reduce<boolean>(
    (acc, [, value]) => acc || value.size !== 0,
    false,
  );

  if (!isOneScopeSelected) {
    publishErrors.push('Message.InsufficientScopeForPublish');
  }

  return publishErrors;
}

/**
 * Validator function for OAuth create and edit forms; Currently a form is valid
 * if a name is present, but this may be subject to change
 * @param state a state object defined in the OAuthFormReducer
 * @returns boolean indicating if the state is valid (true) or invalid (false) for submission
 */
export default function isValid(state: OAuthEditFormState): boolean {
  if (!isNameValid(state.name)) {
    return false;
  }

  // check all user accessed links
  if (
    !isUserAccessedLinkValid(state.tosUri) ||
    !isUserAccessedLinkValid(state.privacyPolicyUri) ||
    !isUserAccessedLinkValid(state.entryPointUri)
  ) {
    return false;
  }

  // check all redirect uri
  if (!state.redirectUris.every((uri) => isRedirectUriValid(uri))) {
    return false;
  }

  // check scopes
  const scopes = state.allowedScopes;
  return !IDENTITY_SCOPES.some((identityScope) => {
    // if an identity scope is selected and openid is not selected
    if (
      scopes.openid !== undefined &&
      scopes.openid.size === 0 &&
      scopes[identityScope] !== undefined &&
      scopes[identityScope].size !== 0
    ) {
      return true;
    }
    return false;
  });
}
