import { useCallback, useEffect, useReducer, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  Divider,
  Typography,
  CircularProgress,
  AutorenewIcon,
  DeleteOutlinedIcon,
  useDialog,
} from '@rbx/ui';
import type {
  PartialScopeInfo,
  ApplicationResponse,
} from '@modules/clients/applicationAuthorization';
import applicationAuthorizationClient from '@modules/clients/applicationAuthorization';
import { getResponseFromError } from '@modules/clients/utils';
// TODO replace these icons with uiblox equivalent when they're available
import useSnackbar from '../../common/hooks/useSnackbar';
import EditOAuthAppFormDialogState from '../enums/EditOAuthAppFormDialogState';
import oAuthEditFormReducer, {
  initialEditFormState,
  OAuthEditActionTypes,
} from '../reducers/oAuthEditFormReducer';
import buildOAuthEditDialogConfig from '../utils/buildOAuthEditDialogConfig';
import { getErrorTranslationKey } from '../utils/getTranslationKeysUtil';
import AppVersionInfoStatusAlert from './AppVersionInfoStatusAlert';
import useEditOAuthAppFormStyles from './EditOAuthAppForm.styles';
import EditOAuthAppFormDetails from './EditOAuthAppFormDetails';
import EditOAuthAppFormHeader from './EditOAuthAppFormHeader';
import EditRedirectDialogCard from './EditRedirectDialogCard';
import PublishAppDialogCard from './PublishAppDialogCard';
import SummaryPanel from './SummaryPanel';

interface EditOAuthAppFormProps {
  id?: string;
  onHideForm: () => void;
  isEdit?: boolean;
}

const EditOAuthAppForm = ({ id, onHideForm, isEdit = false }: EditOAuthAppFormProps) => {
  const { translate } = useTranslation();
  const {
    classes: { divider, blankSection, publishStatusAlert },
  } = useEditOAuthAppFormStyles();
  const { showSnackbar, closeSnackbar } = useSnackbar();
  const { open, close, configure } = useDialog();

  const [
    {
      name,
      description,
      imageFile,
      redirectUris,
      tosUri,
      privacyPolicyUri,
      allowedScopes,
      clientId,
      updated,
      clientSecret,
      isDirty,
      isValid,
      versionInfo,
      isBanned,
      isEditActive,
      publishErrors,
      entryPointUri,
    },
    dispatch,
  ] = useReducer(oAuthEditFormReducer, {
    ...initialEditFormState,
    isEditActive: isEdit,
  });

  const [hasError, setHasError] = useState<boolean>(false);
  // Start in the loading state only when editing an existing app (there is something to fetch).
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(id));
  const [initialName, setInitialName] = useState<string>(name);
  const [imageAssetId, setImageAssetId] = useState<number | null>(null);
  const [isFirstPartyApp, setIsFirstPartyApp] = useState<boolean>(false);
  const onNameChangeHandler = useCallback((newName: string) => {
    dispatch({ type: OAuthEditActionTypes.SetName, payload: newName });
  }, []);

  const onDescriptionChangeHandler = useCallback((newDescription: string) => {
    dispatch({ type: OAuthEditActionTypes.SetDescription, payload: newDescription });
  }, []);

  const onImageFileChangeHandler = useCallback((newImageFile: File | null) => {
    dispatch({ type: OAuthEditActionTypes.SetImageFile, payload: newImageFile });
  }, []);

  const onTosUriChangeHandler = useCallback((newTosUri: string) => {
    dispatch({ type: OAuthEditActionTypes.SetTosUri, payload: newTosUri });
  }, []);

  const onPrivacyPolicyUriChangeHandler = useCallback((newPrivacyPolicyUri: string) => {
    dispatch({ type: OAuthEditActionTypes.SetPrivacyPolicyUri, payload: newPrivacyPolicyUri });
  }, []);

  const onEntryPointUriChangeHandler = useCallback((newEntryPointUri: string) => {
    dispatch({ type: OAuthEditActionTypes.SetEntryPointUri, payload: newEntryPointUri });
  }, []);

  const onAllowedScopesChangeHandler = useCallback(
    (newAllowedScopes: { [name: string]: Set<string> }, isInit: boolean) => {
      dispatch({
        type: OAuthEditActionTypes.SetAllowedScopes,
        payload: { scopes: newAllowedScopes, isInit },
      });
    },
    [],
  );

  const onIsEditActiveChangeHandler = useCallback((isEditActiveValue: boolean) => {
    dispatch({ type: OAuthEditActionTypes.SetIsEditActive, payload: isEditActiveValue });
  }, []);

  const onRedirectUrisChangeHandler = useCallback((newRedirectUris: string[]) => {
    dispatch({ type: OAuthEditActionTypes.SetRedirectUris, payload: newRedirectUris });
  }, []);

  const loadAppDetails = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      const appResponse = await applicationAuthorizationClient.getApplication({
        applicationId: id,
      });
      dispatch({
        type: OAuthEditActionTypes.SetAppDetails,
        payload: appResponse,
      });
      setInitialName(appResponse.name);
      setIsFirstPartyApp(appResponse.isFirstParty ?? false);
      const imageId = appResponse.imageAssetId ? parseInt(appResponse.imageAssetId, 10) : null;
      setImageAssetId(imageId);
    } catch {
      setHasError(true);
      console.error('Something went wrong loading your OAuth App');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Fetch-on-mount: loadAppDetails only updates state after awaiting the request, so this does
    // not synchronously setState within the effect body.
    // oxlint-disable-next-line react/react-compiler
    void loadAppDetails();
  }, [loadAppDetails]);

  const regenerateSecret = async () => {
    if (id) {
      try {
        const secretResponse = await applicationAuthorizationClient.regenerateApplicationSecret({
          applicationId: id,
        });
        dispatch({
          type: OAuthEditActionTypes.RegenerateAppSecret,
          payload: secretResponse,
        });
        close();
        showSnackbar(
          'success',
          translate('Title.OAuthSuccessTitle'),
          translate('Description.RegenerationSuccess'),
        );
      } catch {
        console.error('Something went wrong regenerating your app secret');
        close();
        showSnackbar(
          'error',
          translate('Title.OAuthError'),
          translate('Description.RegenerationFailure'),
        );
      }
    }
  };

  const openRegenerateDialog = () => {
    configure(
      <EditRedirectDialogCard
        dialogConfig={buildOAuthEditDialogConfig(
          regenerateSecret,
          close,
          EditOAuthAppFormDialogState.Regenerate,
          translate,
          <AutorenewIcon />,
        )}
      />,
    );
    open();
  };

  const deleteApp = async () => {
    if (id) {
      try {
        await applicationAuthorizationClient.deleteApplication({
          applicationId: id,
        });
        close();
        onHideForm();
        showSnackbar(
          'success',
          translate('Title.OAuthSuccessTitle'),
          translate('Description.OAuthSuccessDeleting'),
        );
      } catch {
        console.error('Something went wrong trying to delete your app');
        showSnackbar(
          'error',
          translate('Title.OAuthError'),
          translate('Description.OAuthDeleteFailure'),
        );
        close();
      }
    }
  };

  const openDeleteDialog = () => {
    configure(
      <EditRedirectDialogCard
        dialogConfig={buildOAuthEditDialogConfig(
          deleteApp,
          close,
          EditOAuthAppFormDialogState.Delete,
          translate,
          <DeleteOutlinedIcon />,
          name,
        )}
      />,
    );
    open();
  };

  const handleUpdate = async (isRedirect = false) => {
    try {
      if (id) {
        const allowedScopesRequestObject = Object.entries(allowedScopes).reduce<
          Array<PartialScopeInfo>
        >((accumulator, [scopeType, operations]) => {
          if (operations.size !== 0) {
            accumulator.push({
              scopeType,
              operations: Array.from(operations.values()),
            });
          }
          return accumulator;
        }, []);
        const cleanedRedirectUris = redirectUris.filter((uri) => uri !== '');
        const response: ApplicationResponse =
          await applicationAuthorizationClient.updateApplication({
            applicationId: id,
            applicationUpdateApplicationRequest: {
              name,
              summary: description,
              redirectUris: cleanedRedirectUris,
              allowedScopes: allowedScopesRequestObject,
              tosUri,
              privacyUri: privacyPolicyUri,
              entryPointUri,
            },
          });

        if (imageFile !== null) {
          await applicationAuthorizationClient.uploadApplicationImage({
            applicationId: response.applicationId,
            imageFile,
          });
        }

        dispatch({ type: OAuthEditActionTypes.SetAppDetails, payload: response });
        setInitialName(response.name); // update the title in the form header
        showSnackbar(
          'success',
          translate('Title.OAuthSuccessTitle'),
          translate('Description.OAuthSuccessUpdating'),
        );
        // after changes are saved transition out of the edit state
        onIsEditActiveChangeHandler(false);
        if (isRedirect) {
          onHideForm?.();
          close();
        }
      }
    } catch (e) {
      const response = getResponseFromError(e);
      const errorTranslationKey = response ? await getErrorTranslationKey(response) : undefined;
      console.warn('There was an error updating your app');

      showSnackbar(
        'error',
        translate('Title.OAuthError'),
        translate(errorTranslationKey ?? 'Description.OAuthUpdateFailure'),
      );
    }
  };

  const onHandlePublish = () => {
    const publishApp = async (): Promise<string | undefined> => {
      try {
        if (id) {
          await applicationAuthorizationClient.publishApplication({ applicationId: id });
          close();
          showSnackbar(
            'success',
            translate('Title.OAuthSuccessTitle'),
            translate('Message.AppPublishSuccessful'),
          );
          await loadAppDetails();
        }
        return undefined;
      } catch (e) {
        const response = getResponseFromError(e);
        const errorTranslationKey = response ? await getErrorTranslationKey(response) : undefined;
        return errorTranslationKey ?? 'Response.GenericPublishAppError';
      }
    };

    if (publishErrors.length !== 0) {
      showSnackbar(
        'error',
        translate('Title.PublishRequirementError'),
        <ul>
          {publishErrors.map((error) => (
            <li key={error}>{translate(error)}</li>
          ))}
        </ul>,
        true,
      );
    } else {
      closeSnackbar();
      configure(
        <PublishAppDialogCard onCancel={close} translate={translate} publishApp={publishApp} />,
      );
      open();
    }
  };

  const onSaveAndClosePromptHandler = (redirectToTable: boolean) => {
    // confirm callback for redirect dialog
    const onDialogConfirm = async () => {
      await handleUpdate(redirectToTable);
      close();
    };

    // cancel callback for redirect dialog
    const onDialogCancel = () => {
      if (redirectToTable) {
        onHideForm();
      }
      close();
    };

    // only close the whole form when the user hits '(x)'.
    if (!isDirty && redirectToTable) {
      onHideForm?.();
    } else if (!isDirty && !redirectToTable) {
      onIsEditActiveChangeHandler(false);
      close();
    } else if (isValid) {
      configure(
        <EditRedirectDialogCard
          dialogConfig={buildOAuthEditDialogConfig(
            onDialogConfirm,
            onDialogCancel,
            redirectToTable
              ? EditOAuthAppFormDialogState.ValidEdit
              : EditOAuthAppFormDialogState.ValidEditInline,
            translate,
          )}
        />,
      );
      open();
    } else {
      configure(
        <EditRedirectDialogCard
          dialogConfig={buildOAuthEditDialogConfig(
            close,
            onDialogCancel,
            redirectToTable
              ? EditOAuthAppFormDialogState.InvalidEdit
              : EditOAuthAppFormDialogState.InvalidEditInline,
            translate,
          )}
        />,
      );
      open();
    }
  };

  if (isLoading) {
    return (
      <Grid container alignItems='center' justifyContent='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (hasError) {
    return (
      <Grid
        container
        direction='column'
        className={blankSection}
        alignItems='center'
        justifyContent='center'>
        <Typography>{translate('Message.ErrorLoadingApp')}</Typography>
      </Grid>
    );
  }

  return (
    <Grid>
      <Grid classes={{ root: publishStatusAlert }}>
        <AppVersionInfoStatusAlert versionInfo={versionInfo} isBanned={isBanned} />
      </Grid>
      <Grid>
        <EditOAuthAppFormHeader
          initialName={initialName}
          onSaveAndClosePromptHandler={onSaveAndClosePromptHandler}
          openDeleteDialog={openDeleteDialog}
          handleUpdate={() => handleUpdate(false)}
          isDirty={isDirty}
          isValid={isValid}
          handlePublish={onHandlePublish}
          onEditActiveHandler={onIsEditActiveChangeHandler}
          isEditActive={isEditActive}
          versionInfo={versionInfo}
          isBanned={isBanned}
        />
        <EditOAuthAppFormDetails
          openRegenerateDialog={openRegenerateDialog}
          updated={updated}
          clientId={clientId}
          clientSecret={clientSecret}
          isBanned={isBanned}
        />
      </Grid>
      <SummaryPanel
        name={name}
        description={description}
        imageAssetId={imageAssetId}
        tosUri={tosUri}
        privacyPolicyUri={privacyPolicyUri}
        entryPointUri={entryPointUri}
        setAppNameHandler={onNameChangeHandler}
        setAppDescriptionHandler={onDescriptionChangeHandler}
        setAppImageFileHandler={onImageFileChangeHandler}
        setAppTosUriHandler={onTosUriChangeHandler}
        setAppPrivacyPolicyUriHandler={onPrivacyPolicyUriChangeHandler}
        allowedScopes={allowedScopes}
        setAllowedScopesHandler={onAllowedScopesChangeHandler}
        redirectUris={redirectUris}
        setRedirectUrisHandler={onRedirectUrisChangeHandler}
        setAppEntryPointUriHandler={onEntryPointUriChangeHandler}
        isEditActive={isEditActive}
        isFirstPartyApp={isFirstPartyApp}
      />
      <Divider className={divider} />
    </Grid>
  );
};

export default EditOAuthAppForm;
