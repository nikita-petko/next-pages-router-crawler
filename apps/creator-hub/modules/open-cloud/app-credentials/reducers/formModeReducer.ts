import FormMode from '@modules/open-cloud/api-keys/enums/FormMode';
import type FormModeState from '@modules/open-cloud/api-keys/interfaces/FormModeState';
import OAuthFormMode from '@modules/open-cloud/oauth2/enums/OAuthFormMode';
import type OAuthFormModeState from '@modules/open-cloud/oauth2/interfaces/OAuthFormModeState';

export interface AppFormState {
  apiKeyFormState: FormModeState;
  oAuthFormState: OAuthFormModeState;
  areTabsActive: boolean;
}

export const initialFormModeState: AppFormState = {
  apiKeyFormState: { mode: FormMode.Inactive },
  oAuthFormState: { mode: OAuthFormMode.Inactive },
  areTabsActive: true,
};

export enum FormActionTypes {
  SetApiKeyFormState,
  SetOAuthFormState,
}

type FormAction =
  | { type: FormActionTypes.SetApiKeyFormState; payload: FormModeState }
  | { type: FormActionTypes.SetOAuthFormState; payload: OAuthFormModeState };

function reducer(state: AppFormState, action: FormAction): AppFormState {
  switch (action.type) {
    case FormActionTypes.SetApiKeyFormState: {
      const { payload } = action;
      return {
        apiKeyFormState: payload,
        oAuthFormState: { mode: OAuthFormMode.Inactive },
        areTabsActive: payload.mode === FormMode.Inactive,
      };
    }

    case FormActionTypes.SetOAuthFormState: {
      const { payload } = action;
      return {
        oAuthFormState: payload,
        apiKeyFormState: { mode: FormMode.Inactive },
        areTabsActive: payload.mode === OAuthFormMode.Inactive,
      };
    }

    default: {
      return state;
    }
  }
}

export default reducer;
