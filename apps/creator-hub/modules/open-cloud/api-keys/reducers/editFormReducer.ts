import type {
  UpdateApiKeyResponse,
  GetApiKeyResponse,
  RegenerateApiKeyResponse,
  CloudAuthBadStatus,
} from '@modules/clients/cloudAuthentication';
import type CloudAuthConfiguredStateProperties from '../interfaces/CloudAuthConfiguredStateProperties';
import isValid from '../utils/formValidator';
import parseCloudAuthInfo from '../utils/parseCloudAuthInfo';

export interface EditFormState extends CloudAuthConfiguredStateProperties {
  apiKeySecretPreview: string;
  cloudAuthId?: string;
  apiRegeneratedKeySecret?: string;
  isValid: boolean;
  isDirty: boolean;
  lastGeneratedUserName?: string;
  lastGeneratedTime: Date | null;
  loadError?: string;
  nameInputActive: boolean;
  descriptionInputActive: boolean;
  statuses: CloudAuthBadStatus[];
  created: Date | null;
  updated: Date | null;
}

// the initial state object
export const initialEditFormState: EditFormState = {
  apiKeyName: '',
  apiKeyDescription: '',
  apiKeySecretPreview: '',
  acceptedIps: [],
  expirationTime: null,
  enabled: false,
  apiRegeneratedKeySecret: undefined,
  isDirty: false,
  isValid: true,
  loadError: undefined,
  lastGeneratedUserName: undefined,
  lastGeneratedTime: null,
  nameInputActive: false,
  descriptionInputActive: false,
  statuses: [],
  created: null,
  updated: null,
};

export enum EditActionTypes {
  SetName,
  SetDescription,
  SetIps,
  SetExpirationTime,
  UpdatedKey,
  SetDirty,
  InitCloudAuthDetails,
  RegenerateKey,
  SetLoadError,
  EditName,
  EditDescription,
}

type EditAction =
  | { type: EditActionTypes.SetName; payload: string }
  | { type: EditActionTypes.SetDescription; payload: string }
  | { type: EditActionTypes.SetIps; payload: string[] }
  | { type: EditActionTypes.SetExpirationTime; payload: Date | null }
  | { type: EditActionTypes.SetDirty }
  | { type: EditActionTypes.UpdatedKey; payload: UpdateApiKeyResponse }
  | {
      type: EditActionTypes.InitCloudAuthDetails;
      payload: {
        response: GetApiKeyResponse;
        userDisplayName: string;
      };
    }
  | {
      type: EditActionTypes.RegenerateKey;
      payload: {
        response: RegenerateApiKeyResponse;
        userDisplayName: string;
      };
    }
  | { type: EditActionTypes.SetLoadError; payload: string }
  | { type: EditActionTypes.EditName }
  | { type: EditActionTypes.EditDescription };

function reducer(state: EditFormState, action: EditAction): EditFormState {
  switch (action.type) {
    case EditActionTypes.SetName: {
      const { payload } = action;

      /**
       * Name is a required field. Modifying name will result in a dirty state
       */

      const newState = {
        ...state,
        acceptedIps: [...state.acceptedIps],
        apiKeyName: payload,
        isDirty: true,
      };

      return {
        ...newState,
        statuses: [...state.statuses],
        isValid: isValid(newState),
      };
    }

    case EditActionTypes.SetDescription: {
      const { payload } = action;

      /**
       * Description is an optional field, meaning it can remain empty or
       * have a value. Modifying the description input will result in a dirty state
       */

      return {
        ...state,
        acceptedIps: [...state.acceptedIps],
        statuses: [...state.statuses],
        apiKeyDescription: payload,
        isDirty: true,
      };
    }

    case EditActionTypes.SetIps: {
      const { payload } = action;

      /**
       * Ips are a required field. Modifying ips will result in a dirty state
       */

      const newState = {
        ...state,
        acceptedIps: payload,
        statuses: [...state.statuses],
        isDirty: true,
      };

      return {
        ...newState,
        isValid: isValid(newState),
      };
    }

    case EditActionTypes.SetExpirationTime: {
      const { payload } = action;
      /**
       * Expiration dates are an optional field, meaning it can remain empty or have
       *  a value. This action sets an expiration date for an API Key. Modifying expiration
       * times will result in a dirty state
       */

      return {
        ...state,
        acceptedIps: [...state.acceptedIps],
        statuses: [...state.statuses],
        expirationTime: payload,
        isDirty: true,
      };
    }

    case EditActionTypes.SetDirty: {
      /**
       *  This action type is specifically to alter only the dirty state, which is
       * passed down to the scope system form since it has its own logic for determining
       * dirty form state
       */

      return {
        ...state,
        acceptedIps: [...state.acceptedIps],
        statuses: [...state.statuses],
        isDirty: true,
      };
    }

    case EditActionTypes.UpdatedKey: {
      /**
       * This action is for setting state when a key gets updated from the edit form. Set all
       * the form input states to what gets returned by the backend response
       *
       * Upon successful update of the key, the form state also gets set to:
       * 1. isDirty = false
       * 2. Name and description inputs will be reset
       */

      const { payload } = action;

      const {
        updatedTime,
        createdTime,
        cloudAuthBadStatus,
        cloudAuthUserConfiguredProperties: {
          name,
          description,
          isEnabled,
          expirationTime,
          allowedCidrs,
        },
      } = parseCloudAuthInfo(payload.cloudAuthInfo);

      return {
        ...state,
        acceptedIps: allowedCidrs,
        expirationTime,
        apiKeyName: name,
        apiKeyDescription: description,
        isDirty: false,
        nameInputActive: false,
        descriptionInputActive: false,
        enabled: isEnabled,
        statuses: cloudAuthBadStatus,
        created: createdTime,
        updated: updatedTime,
      };
    }

    case EditActionTypes.RegenerateKey: {
      /**
       * This action is for setting state when a user requests to regenerate an API key. We
       * should update the api key regenerated secret so we can show the key preview, as well
       * as the last generated time and the user details
       *
       * Note: form state remains dirty if any changes were made to the inputs since regeneration
       * does NOT result in a submit of the form
       */

      const {
        payload: { userDisplayName, response },
      } = action;

      const { lastGeneratedTime, cloudAuthBadStatus } = parseCloudAuthInfo(response.cloudAuthInfo);
      const regeneratedSecret = response.apikeySecret;

      return {
        ...state,
        acceptedIps: [...state.acceptedIps],
        lastGeneratedUserName: userDisplayName,
        apiRegeneratedKeySecret: regeneratedSecret,
        lastGeneratedTime,
        statuses: cloudAuthBadStatus,
      };
    }

    case EditActionTypes.InitCloudAuthDetails: {
      /**
       * This action is done after the initial API request is made to get infomation about the chosen key.
       * It sets up the form state with all the inital 'seed' states of every sub-form and input.
       *
       * The only caveat here is scope infos are handled by a separate scope system state manager, and are thus
       * stored separately in a useState<> compared to the rest of the form state. This is because the backend returns scopes in the form
       * of an object, and instead of deep copying the ScopeInfo objects every time the rest of the state changes from other actions to preserve immutability,
       * I leave them in a separate state to reduce the complexity of the reducer- since scopeInfos is only used to 'seed' the scope system form anyway
       */

      const {
        payload: { response, userDisplayName },
      } = action;

      const {
        id,
        updatedTime,
        createdTime,
        cloudAuthBadStatus,
        apikeySecretPreview,
        lastGeneratedTime,
        cloudAuthUserConfiguredProperties: {
          name,
          description,
          isEnabled,
          expirationTime,
          allowedCidrs,
        },
      } = parseCloudAuthInfo(response.cloudAuthInfo);

      return {
        ...state,
        cloudAuthId: id,
        enabled: isEnabled,
        apiKeyName: name,
        apiKeyDescription: description,
        apiKeySecretPreview: apikeySecretPreview,
        acceptedIps: allowedCidrs,
        expirationTime,
        lastGeneratedTime,
        lastGeneratedUserName: userDisplayName,
        statuses: cloudAuthBadStatus,
        updated: updatedTime,
        created: createdTime,
      };
    }

    case EditActionTypes.SetLoadError: {
      /**
       * This action is done if there is a load error either from:
       *
       * 1. The getApiKeyDetails network call failing for some reason
       * 2. The scope system metadata not loading correctly (also from a network call)
       *
       * The proper error string is set here, which will get displayed instead of the form
       */

      const { payload } = action;

      return {
        ...state,
        acceptedIps: [...state.acceptedIps],
        statuses: [...state.statuses],
        loadError: payload,
      };
    }

    case EditActionTypes.EditName: {
      /**
       * When user clicks 'edit' on the name, this will activate the name input
       */

      return {
        ...state,
        acceptedIps: [...state.acceptedIps],
        statuses: [...state.statuses],
        nameInputActive: true,
      };
    }

    case EditActionTypes.EditDescription: {
      /**
       * When user clicks 'edit' on the description, this will activate the description input
       */

      return {
        ...state,
        acceptedIps: [...state.acceptedIps],
        statuses: [...state.statuses],
        descriptionInputActive: true,
      };
    }

    default: {
      return state;
    }
  }
}

export default reducer;
