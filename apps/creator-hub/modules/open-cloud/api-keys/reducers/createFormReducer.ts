import type {
  CreateApiKeyResponse,
  UpdateApiKeyResponse,
  GetApiKeyResponse,
} from '@modules/clients/cloudAuthentication';
import type CloudAuthConfiguredStateProperties from '../interfaces/CloudAuthConfiguredStateProperties';
import isValid from '../utils/formValidator';
import parseCloudAuthInfo from '../utils/parseCloudAuthInfo';

export interface CreateFormState extends CloudAuthConfiguredStateProperties {
  cloudAuthId?: string;
  apiSecretString?: string;
  isValid: boolean;
  isPreCreate: boolean;
  isDirty: boolean;
  loadError?: string;
}

// the initial state objec
export const initialCreateFormState: CreateFormState = {
  apiKeyName: undefined,
  apiKeyDescription: '',
  acceptedIps: ['0.0.0.0/0'],
  expirationTime: null,
  apiSecretString: undefined,
  cloudAuthId: undefined,
  loadError: undefined,
  isValid: false,
  isPreCreate: true,
  isDirty: false,
};

export enum CreateActionTypes {
  SetName,
  SetDescription,
  SetIps,
  SetExpirationTime,
  CreatedKey,
  UpdatedKey,
  SetDirty,
  InitCloudAuthDetails,
  SetLoadError,
}

type CreateAction =
  | { type: CreateActionTypes.SetName; payload: string }
  | { type: CreateActionTypes.SetDescription; payload: string }
  | { type: CreateActionTypes.SetIps; payload: string[] }
  | { type: CreateActionTypes.SetExpirationTime; payload: Date | null }
  | { type: CreateActionTypes.SetDirty }
  | { type: CreateActionTypes.CreatedKey; payload: CreateApiKeyResponse }
  | { type: CreateActionTypes.UpdatedKey; payload: UpdateApiKeyResponse }
  | {
      type: CreateActionTypes.InitCloudAuthDetails;
      payload: {
        response: GetApiKeyResponse;
        copyTranslation: string;
      };
    }
  | { type: CreateActionTypes.SetLoadError; payload: string };

/**
 * The api key create form reducer (note scopes are stored in the scope system state manager since scopes can become trees
 * which are harder to manage immutable state for + manage efficient inserts, updates, and deletes)
 *
 * @param state The create form state (stores form input values and form state- dirty, valid, pre/post create)
 * @param action The action (w/ optional payload depending on type)
 */
function reducer(state: CreateFormState, action: CreateAction): CreateFormState {
  switch (action.type) {
    case CreateActionTypes.SetName: {
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
        isValid: isValid(newState),
      };
    }

    case CreateActionTypes.SetDescription: {
      const { payload } = action;

      /**
       * Description is an optional field, meaning it can remain empty or
       * have a value. Modifying the description input will result in a dirty state
       */

      return {
        ...state,
        acceptedIps: [...state.acceptedIps],
        apiKeyDescription: payload,
        isDirty: true,
      };
    }

    case CreateActionTypes.SetIps: {
      const { payload } = action;

      /**
       * Ips are a required field. Modifying ips will result in a dirty state
       */

      const newState = {
        ...state,
        acceptedIps: payload,
        isDirty: true,
      };

      return {
        ...newState,
        isValid: isValid(newState),
      };
    }

    case CreateActionTypes.SetExpirationTime: {
      const { payload } = action;

      /**
       * Expiration dates are an optional field, meaning it can remain empty or have
       *  a value. This action sets an expiration date for an API Key.
       */

      return {
        ...state,
        acceptedIps: [...state.acceptedIps],
        expirationTime: payload,
        isDirty: true,
      };
    }

    case CreateActionTypes.SetDirty: {
      /**
       *  This action type is specifically to alter only the dirty state, which is
       * passed down to the scope system form since it has its own logic for determining
       * dirty form state
       */

      return {
        ...state,
        acceptedIps: [...state.acceptedIps],
        isDirty: true,
      };
    }

    case CreateActionTypes.CreatedKey: {
      /**
       * This action is for setting the state once a key has been successfully created. Set all the
       * form input states to what gets returned by the backend response.
       *
       * Upon the successful creation of a key, the form state also gets set to:
       *
       * 1. isPreCreate = false, meaning we are now in partial edit mode
       * 2. isDirty = false
       */

      const { payload } = action;

      const {
        id,
        cloudAuthUserConfiguredProperties: { name, description, expirationTime, allowedCidrs },
      } = parseCloudAuthInfo(payload.cloudAuthInfo);

      return {
        ...state,
        apiSecretString: payload.apikeySecret,
        cloudAuthId: id,
        acceptedIps: allowedCidrs,
        expirationTime,
        apiKeyName: name,
        apiKeyDescription: description,
        isPreCreate: false,
        isDirty: false,
      };
    }

    case CreateActionTypes.UpdatedKey: {
      /**
       * This action is for setting state when a key gets updated from the create form. Set all
       * the form input states to what gets returned by the backend response
       *
       * Upon successful update of the key, the form state also gets set to:
       * 1. isDirty = false
       */

      const { payload } = action;

      const {
        cloudAuthUserConfiguredProperties: { name, description, expirationTime, allowedCidrs },
      } = parseCloudAuthInfo(payload.cloudAuthInfo);

      return {
        ...state,
        acceptedIps: allowedCidrs,
        expirationTime,
        apiKeyName: name,
        apiKeyDescription: description,
        isDirty: false,
      };
    }

    case CreateActionTypes.InitCloudAuthDetails: {
      /**
       * This action is done after the initial API request is made to get infomation about the chosen key to duplicate.
       * It sets up the form state with all the inital 'seed' states of every sub-form and input except for expiration date.
       *
       * Note expiration will not be carried over for key duplication
       *
       * The only caveat here is scope infos are handled by a separate scope system state manager, and are thus
       * stored separately in a useState<> compared to the rest of the form state. This is because the backend returns scopes in the form
       * of an object, and instead of deep copying the ScopeInfo objects every time the rest of the state changes from other actions to preserve immutability,
       * I leave them in a separate state to reduce the complexity of the reducer- since scopeInfos is only used to 'seed' the scope system form anyway
       */

      const {
        payload: { response, copyTranslation },
      } = action;

      const {
        cloudAuthUserConfiguredProperties: { description, allowedCidrs },
      } = parseCloudAuthInfo(response.cloudAuthInfo);

      return {
        ...state,
        apiKeyName: copyTranslation,
        apiKeyDescription: description,
        acceptedIps: allowedCidrs,
        isDirty: true,
        isValid: true,
      };
    }

    case CreateActionTypes.SetLoadError: {
      /**
       * This action is done if there is a load error from  the scope system metadata not loading correctly
       *
       * The proper error string is set here, which will get displayed instead of the form
       */

      const { payload } = action;

      return {
        ...state,
        acceptedIps: [...state.acceptedIps],
        loadError: payload,
      };
    }

    default: {
      return state;
    }
  }
}

export default reducer;
