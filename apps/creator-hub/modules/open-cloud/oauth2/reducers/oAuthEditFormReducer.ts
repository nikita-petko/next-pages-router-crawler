import type {
  ApplicationResponse,
  ApplicationSecretResponse,
  AppVersionInfo,
} from '@modules/clients/applicationAuthorization';
import isValid, { canPublish } from '../utils/oAuthFormValidator';

export interface OAuthEditFormState {
  name: string;
  description: string;
  imageFile: File | null;
  redirectUris: string[];
  allowedScopes: { [name: string]: Set<string> };
  tosUri: string;
  privacyPolicyUri: string;
  entryPointUri: string;
  isValid: boolean;
  isDirty: boolean;
  updated: Date | null;
  clientId: string;
  clientSecret: string;
  isEditActive: boolean;
  versionInfo: AppVersionInfo;
  isBanned: boolean;
  publishErrors: string[];
}

export const initialEditFormState: OAuthEditFormState = {
  name: '',
  description: '',
  imageFile: null,
  redirectUris: [],
  allowedScopes: {},
  tosUri: '',
  privacyPolicyUri: '',
  entryPointUri: '',
  isValid: true,
  isDirty: false,
  updated: null,
  clientId: '',
  clientSecret: '',
  isEditActive: false,
  versionInfo: {
    lastApprovedVersionNumber: null,
    versionNumber: 0,
    isInReview: false,
  },
  isBanned: false,
  publishErrors: [],
};

export enum OAuthEditActionTypes {
  SetName,
  SetDescription,
  SetImageFile,
  SetRedirectUris,
  SetAllowedScopes,
  SetTosUri,
  SetPrivacyPolicyUri,
  SetAppDetails,
  RegenerateAppSecret,
  SetIsEditActive,
  SetEntryPointUri,
}

type OAuthEditAction =
  | { type: OAuthEditActionTypes.SetName; payload: string }
  | { type: OAuthEditActionTypes.SetIsEditActive; payload: boolean }
  | { type: OAuthEditActionTypes.SetDescription; payload: string }
  | { type: OAuthEditActionTypes.SetImageFile; payload: File | null }
  | { type: OAuthEditActionTypes.SetRedirectUris; payload: string[] }
  | {
      type: OAuthEditActionTypes.SetAllowedScopes;
      payload: { scopes: Record<string, Set<string>>; isInit: boolean };
    }
  | { type: OAuthEditActionTypes.SetTosUri; payload: string }
  | { type: OAuthEditActionTypes.SetPrivacyPolicyUri; payload: string }
  | { type: OAuthEditActionTypes.SetEntryPointUri; payload: string }
  | {
      type: OAuthEditActionTypes.SetAppDetails;
      payload: ApplicationResponse;
    }
  | {
      type: OAuthEditActionTypes.RegenerateAppSecret;
      payload: ApplicationSecretResponse;
    };

function reducer(state: OAuthEditFormState, action: OAuthEditAction): OAuthEditFormState {
  switch (action.type) {
    case OAuthEditActionTypes.SetName: {
      const { payload } = action;

      const newState = {
        ...state,
        redirectUris: [...state.redirectUris],
        name: payload,
        isDirty: true,
      };

      return {
        ...newState,
        isValid: isValid(newState),
      };
    }

    case OAuthEditActionTypes.SetDescription: {
      const { payload } = action;

      return {
        ...state,
        redirectUris: [...state.redirectUris],
        description: payload,
        isDirty: true,
      };
    }

    case OAuthEditActionTypes.SetImageFile: {
      const { payload } = action;

      return {
        ...state,
        redirectUris: [...state.redirectUris],
        imageFile: payload,
        isDirty: true,
      };
    }

    case OAuthEditActionTypes.SetPrivacyPolicyUri: {
      const { payload } = action;

      const newState = {
        ...state,
        redirectUris: [...state.redirectUris],
        privacyPolicyUri: payload,
        isDirty: true,
      };

      return {
        ...newState,
        isValid: isValid(newState),
      };
    }

    case OAuthEditActionTypes.SetEntryPointUri: {
      const { payload } = action;

      const newState = {
        ...state,
        redirectUris: [...state.redirectUris],
        entryPointUri: payload,
        isDirty: true,
      };

      return {
        ...newState,
        isValid: isValid(newState),
      };
    }

    case OAuthEditActionTypes.SetTosUri: {
      const { payload } = action;

      const newState = {
        ...state,
        redirectUris: [...state.redirectUris],
        tosUri: payload,
        isDirty: true,
      };

      return {
        ...newState,
        isValid: isValid(newState),
      };
    }

    case OAuthEditActionTypes.SetAllowedScopes: {
      const {
        payload: { scopes, isInit },
      } = action;

      const newState = {
        ...state,
        redirectUris: [...state.redirectUris],
        allowedScopes: scopes,
        isDirty: !isInit,
      };

      return {
        ...newState,
        isValid: isValid(newState),
      };
    }

    case OAuthEditActionTypes.SetRedirectUris: {
      const { payload } = action;

      const newState = {
        ...state,
        redirectUris: payload,
        isDirty: true,
      };

      return {
        ...newState,
        isValid: isValid(newState),
      };
    }

    case OAuthEditActionTypes.RegenerateAppSecret: {
      const { payload } = action;
      return {
        ...state,
        clientSecret: payload.applicationSecret,
      };
    }

    case OAuthEditActionTypes.SetAppDetails: {
      const { payload } = action;
      // Convert payload's allowed scopes from PartialScope objects to what the
      // scopes table component accepts
      const newAllowedScopes: { [x: string]: Set<string> } = {};
      payload.allowedScopes.forEach((partialScope) => {
        newAllowedScopes[partialScope.scopeType] = new Set(partialScope.operations);
      });

      const newState = {
        ...state,
        name: payload.name,
        description: payload.summary,
        redirectUris: payload.redirectUris,
        allowedScopes: newAllowedScopes,
        tosUri: payload.tosUri ?? '',
        privacyPolicyUri: payload.privacyUri ?? '',
        updated: payload.updatedUtc,
        clientId: payload.applicationId,
        versionInfo: payload.versionInfo,
        isBanned: payload.isBanned,
        entryPointUri: payload.entryPointUri ?? '',
        isDirty: false,
      };
      return {
        ...newState,
        publishErrors: canPublish(newState),
      };
    }

    case OAuthEditActionTypes.SetIsEditActive: {
      const { payload } = action;

      return {
        ...state,
        redirectUris: [...state.redirectUris],
        isEditActive: payload,
      };
    }

    default: {
      return state;
    }
  }
}

export default reducer;
