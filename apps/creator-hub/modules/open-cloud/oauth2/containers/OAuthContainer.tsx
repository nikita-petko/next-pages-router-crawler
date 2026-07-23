import { useCallback, Fragment } from 'react';
import useSnackbar from '../../common/hooks/useSnackbar';
import EditOAuthAppForm from '../components/EditOAuthAppForm';
import OAuthTable from '../components/OAuthTable';
import OAuthFormMode from '../enums/OAuthFormMode';
import type OAuthFormModeState from '../interfaces/OAuthFormModeState';

interface OAuthContainerProps {
  oAuthFormModeState: OAuthFormModeState;
  setOAuthFormModeState: (mode: OAuthFormModeState) => void;
}

const OAuthContainer = ({ oAuthFormModeState, setOAuthFormModeState }: OAuthContainerProps) => {
  const isFormActive: boolean = oAuthFormModeState.mode !== OAuthFormMode.Inactive;

  const { closeSnackbar } = useSnackbar();

  const onFormModeStateChange = useCallback(
    (state: OAuthFormModeState) => {
      setOAuthFormModeState(state);
    },
    [setOAuthFormModeState],
  );

  const onHideFormHandler = useCallback(() => {
    onFormModeStateChange({ mode: OAuthFormMode.Inactive });
    closeSnackbar?.();
  }, [closeSnackbar, onFormModeStateChange]);

  return (
    <>
      {!isFormActive ? (
        <OAuthTable onShowForm={onFormModeStateChange} />
      ) : (
        <EditOAuthAppForm
          isEdit={oAuthFormModeState.mode === OAuthFormMode.Edit}
          onHideForm={onHideFormHandler}
          id={oAuthFormModeState.id}
        />
      )}
    </>
  );
};

export default OAuthContainer;
