import { Fragment, useState, useCallback, useMemo, useEffect, useReducer } from 'react';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, CircularProgress, Link } from '@rbx/ui';
import type {
  CreateApiKeyResponse,
  GetApiKeyResponse,
  ScopeInfo,
} from '@modules/clients/cloudAuthentication';
import cloudAuthClient from '@modules/clients/cloudAuthentication';
import { getResponseFromError } from '@modules/clients/utils';
import { FormHeader, TooltipButton, EmptyGrid } from '@modules/miscellaneous/components';
import SelectionWarningDialog from '../../../common/components/SelectionWarningDialog';
import useSnackbar from '../../../common/hooks/useSnackbar';
import { isScopeTypeWarningRequired } from '../../../common/utils/warningDialogUtil';
import CreateDialogMode from '../../enums/CreateDialogMode';
import useScopeFormState from '../../hooks/useScopeFormState';
import useScopeSystem from '../../hooks/useScopeSystem';
import useConfirmationDialog from '../../hooks/v1/useConfirmationDialog';
import type CloudAuthResponseErrorType from '../../interfaces/CloudAuthResponseErrorType';
import createFormReducer, {
  initialCreateFormState,
  CreateActionTypes,
} from '../../reducers/createFormReducer';
import { buildCreateDialogControls } from '../../utils/dialogControlBuilders';
import extractTranslationKey from '../../utils/translationKeyRegex';
import shouldShowWildcardWarning from '../../utils/wildcardWarningUtil';
import AccessPermissionsForm from '../AccessPermissionsForm';
import ApiKeyDescriptionInput from './ApiKeyDescriptionInput';
import ApiKeyNameInput from './ApiKeyNameInput';
import CopySecretToClipboard from './CopySecretToClipboard';
import useCreateApiKeyFormStyles from './CreateApiKeyForm.styles';
import ExpirationDatePickerForm from './ExpirationDatePickerForm';
import FormAccordion from './FormAccordion';
import GroupApiKeyInfoBanner from './GroupApiKeyInfoBanner';
import IpAddressForm from './IpAddressForm';
import StepperHeading from './StepperHeading';

interface CreateApiKeyFormProps {
  className: string;
  id?: string;
  compact: boolean;
  creatorType: SearchCreatorType;
  creatorTargetId?: number;
  onHideForm?: () => void;
}

const CreateApiKeyForm = ({
  className,
  id,
  compact,
  creatorType,
  creatorTargetId,
  onHideForm,
}: CreateApiKeyFormProps) => {
  const {
    classes: { bottomActionBtns, learnMoreLink },
  } = useCreateApiKeyFormStyles();
  const { getValidScopeInfos } = useScopeFormState();
  const { translate } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const { areScopesLoaded, isScopeInfoValid, getNthSharedTargetPart, getScopeTypeProductName } =
    useScopeSystem();
  const [
    {
      apiKeyName,
      apiKeyDescription,
      acceptedIps,
      expirationTime,
      apiSecretString,
      cloudAuthId,
      loadError,
      isValid,
      isPreCreate,
      isDirty,
    },
    dispatch,
  ] = useReducer(createFormReducer, initialCreateFormState);
  const [initialScopeInfos, setInitialScopeInfos] = useState<ScopeInfo[] | undefined>();
  const [dialogMode, setDialogMode] = useState<CreateDialogMode>();
  const [loading, setIsLoading] = useState<boolean>(false); // used for the initial loading state when the form populates

  const [savedScopeTypes, setSavedScopeTypes] = useState<string[]>([]); // used to diff against added scopes to conditionally display warning
  const [onWarningContinueCallback, setOnWarningContinueCallback] = useState(() => () => {});

  const [luauExecutionsScopeWarningDialogOpen, setLuauExecutionsScopeWarningDialogOpen] =
    useState(false);
  const [wildcardTargetPartWarningDialogOpen, setWildcardTargetPartWarningDialogOpen] =
    useState(false);
  const [groupApiKeyWarningDialogOpen, setGroupApiKeyWarningDialogOpen] = useState(false);

  // handler for partial edit mode
  const updateApiKeyHandler = useCallback(
    async (isRedirect = false) => {
      // fetch the scope info array from the scope system form state
      const validScopeInfos = getValidScopeInfos();

      try {
        const response = await cloudAuthClient.updateApiKey(
          cloudAuthId,
          apiKeyName,
          apiKeyDescription,
          true, // is enabled is true by default
          expirationTime?.toISOString(),
          acceptedIps,
          validScopeInfos,
        );
        setSavedScopeTypes(
          validScopeInfos.map((scopeInfo) => scopeInfo.scopeType).filter((s) => s !== undefined),
        );
        setInitialScopeInfos(validScopeInfos);
        showSnackbar('success', '', translate('Message.ApiKeyUpdateSuccess'));
        dispatch({ type: CreateActionTypes.UpdatedKey, payload: response });
        if (isRedirect) {
          onHideForm?.();
        }
      } catch (e) {
        const response = getResponseFromError(e);
        const responseBody = (await response?.json()) as CloudAuthResponseErrorType;
        // Extract potential translation keys of the form "[SomeWord].[SomeWord]"
        const translationKey = extractTranslationKey(responseBody.message);
        showSnackbar(
          'error',
          translate('Heading.NetworkError'),
          translationKey ? translate(translationKey) : responseBody.message,
        );
        console.warn(
          `There was an unexpected error while updating the api key (${response?.status}): ${responseBody.message}`,
        );
      }
    },
    [
      acceptedIps,
      apiKeyDescription,
      apiKeyName,
      onHideForm,
      cloudAuthId,
      expirationTime,
      getValidScopeInfos,
      showSnackbar,
      translate,
    ],
  );

  // helper for the 'cancel' callback on the dialog
  const onDialogCancel = useCallback(() => {
    // These will all lead to discard changes
    onHideForm?.();
  }, [onHideForm]);

  // helper for the 'confirm' callback
  const onDialogConfirm = useCallback(async () => {
    if (dialogMode === CreateDialogMode.ExitPagePostCreateOnDirtyValid) {
      await updateApiKeyHandler(true);
    }
  }, [dialogMode, updateApiKeyHandler]);

  const {
    openDialog,
    BuildDialogBody,
    buildDialogBodyProps,
    ConfirmDialog,
    partialConfirmDialogProps,
  } = useConfirmationDialog(onDialogConfirm, onDialogCancel);

  // open the dialog, the mode will determine what the dialog displays
  const openConfirmationDialog = useCallback(
    (mode: CreateDialogMode) => {
      openDialog(buildCreateDialogControls(mode, translate));
      setDialogMode(mode);
    },
    [openDialog, translate],
  );

  // handler for initial create mode
  const createApiKeyHandler = useCallback(async () => {
    // fetch the scope info array from the scope system form state
    const validScopeInfos = getValidScopeInfos();

    try {
      const response: CreateApiKeyResponse = await cloudAuthClient.createApiKey(
        apiKeyName,
        apiKeyDescription,
        true, // is enabled is true by default
        expirationTime?.toISOString(),
        creatorType === SearchCreatorType.Group ? creatorTargetId : undefined,
        acceptedIps,
        validScopeInfos,
      );
      setSavedScopeTypes(
        validScopeInfos.map((scopeInfo) => scopeInfo.scopeType).filter((s) => s !== undefined),
      );
      setInitialScopeInfos(validScopeInfos);
      dispatch({ type: CreateActionTypes.CreatedKey, payload: response });
      showSnackbar('success', '', translate('Message.CreateKeySuccess'));
    } catch (e) {
      const response = getResponseFromError(e);
      const responseBody = (await response?.json()) as CloudAuthResponseErrorType;
      // Extract potential translation keys of the form "[SomeWord].[SomeWord]"
      const translationKey = extractTranslationKey(responseBody.message);
      showSnackbar(
        'error',
        translate('Heading.NetworkError'),
        translationKey ? translate(translationKey) : responseBody.message,
      );
      console.warn(
        `There was an unexpected error while creating the api key (${response?.status}): ${responseBody.message}`,
      );
    }
  }, [
    acceptedIps,
    apiKeyDescription,
    apiKeyName,
    creatorTargetId,
    creatorType,
    expirationTime,
    getValidScopeInfos,
    showSnackbar,
    translate,
  ]);

  // logic to determine whether to enable or disable the submit button
  const isSubmitBtnActive = useMemo(() => {
    let enableSubmit = false;

    if (isPreCreate && isValid) {
      // a pre-create valid state should activate the submit button
      enableSubmit = true;
    } else if (isDirty && isValid) {
      // a post-create dirty and valid state should activate the submit button
      enableSubmit = true;
    }

    return enableSubmit;
  }, [isValid, isPreCreate, isDirty]);

  const onFormCloseHandler = useCallback(() => {
    // Always redirect if not dirty, different modals for preCreate dirty, post create valid dirty, post create, invalid dirty
    if (isPreCreate && isDirty) {
      // if we are in pre-create mode and have made some changes, get the "unsaved key" prompt
      openConfirmationDialog(CreateDialogMode.ExitPageOnDirty);
    } else if (!isPreCreate && isDirty && isValid) {
      // we are in post-create / partial edit mode. Show if the form is valid
      openConfirmationDialog(CreateDialogMode.ExitPagePostCreateOnDirtyValid);
    } else if (!isPreCreate && isDirty && !isValid) {
      // we are in post-create / partial edit mode like above, but the form is invalid so show the invalid prompt instead
      openConfirmationDialog(CreateDialogMode.ExitPagePostCreateOnDirtyInvalid);
    } else if (!isDirty) {
      onHideForm?.();
    }
  }, [isPreCreate, isDirty, isValid, openConfirmationDialog, onHideForm]);

  const submitHandler = async () => {
    const submit = () => {
      if (isPreCreate) {
        createApiKeyHandler();
      } else {
        updateApiKeyHandler();
      }
    };

    if (isValid) {
      const validScopeInfos = getValidScopeInfos();
      const addedScopeTypes = validScopeInfos
        .map((scopeInfo) => scopeInfo.scopeType)
        .filter((s) => s !== undefined)
        .filter((scopeType) => !savedScopeTypes.includes(scopeType));

      const shouldShowWildcard = shouldShowWildcardWarning(
        validScopeInfos,
        getScopeTypeProductName,
        getNthSharedTargetPart,
      );

      const shouldShowLuauExecutionsScopeWarning = addedScopeTypes.some(isScopeTypeWarningRequired);
      const shouldShowGroupApiKeyWarning = creatorType === SearchCreatorType.Group;

      if (shouldShowWildcard) {
        setWildcardTargetPartWarningDialogOpen(true);
      }
      if (shouldShowLuauExecutionsScopeWarning) {
        setLuauExecutionsScopeWarningDialogOpen(true);
      }
      if (shouldShowGroupApiKeyWarning) {
        setGroupApiKeyWarningDialogOpen(true);
      }
      if (
        shouldShowWildcard ||
        shouldShowLuauExecutionsScopeWarning ||
        shouldShowGroupApiKeyWarning
      ) {
        setOnWarningContinueCallback(() => () => {
          setWildcardTargetPartWarningDialogOpen(false);
          setLuauExecutionsScopeWarningDialogOpen(false);
          setGroupApiKeyWarningDialogOpen(false);
          submit();
        });
      } else {
        submit();
      }
    }
  };

  const setIsDirtyHelper = useCallback(() => {
    // helper for the scope system form (events do not propagate upwards from the state naturally, so we send an event handler to the form to let us know when something changed)
    dispatch({ type: CreateActionTypes.SetDirty });
  }, []);

  useEffect(() => {
    // if the scope system did not load correctly, prompt user to refresh the page
    if (!areScopesLoaded) {
      dispatch({
        type: CreateActionTypes.SetLoadError,
        payload:
          'There was an error loading the API System Configurations. Please try to reload the page',
      });
    }
  }, [areScopesLoaded]);

  useEffect(() => {
    // Only do an initial fetch if (and when) another API key id is passed in
    // This means that the user is trying to duplicate an existing key setting
    if (id) {
      // on initial render, read in the data from the passed in id value and instantiate all the forms
      const getApiKeyDetails = async (): Promise<GetApiKeyResponse | null> => {
        setIsLoading(true);
        try {
          const response = await cloudAuthClient.getApiKeyById(id);
          return response;
        } catch {
          console.warn(`There was an error loading the cloud auth details for id: ${id}`);
          return null;
        }
      };

      const fetchAllCloudAuthDetails = async () => {
        setIsLoading(true);
        // fetch cloud auth data, then fetch the user display name based of the first API call
        const cloudAuthResponse = await getApiKeyDetails();
        if (cloudAuthResponse !== null) {
          // if this chained API call errors out, not critical, we shouldn't block the rest of the form, set to the user id
          const originalName =
            cloudAuthResponse.cloudAuthInfo?.cloudAuthUserConfiguredProperties?.name ?? '';
          dispatch({
            type: CreateActionTypes.InitCloudAuthDetails,
            payload: {
              response: cloudAuthResponse,
              copyTranslation: translate('Input.Duplicate', {
                apiKeyName: originalName,
              }),
            },
          });

          // load the array of scope infos into the scope form state tree
          let scopeInfos =
            cloudAuthResponse.cloudAuthInfo?.cloudAuthUserConfiguredProperties?.scopes ?? [];
          scopeInfos = scopeInfos.filter(
            (scopeInfo) =>
              scopeInfo.scopeType !== undefined && isScopeInfoValid(scopeInfo.scopeType, scopeInfo),
          );
          setInitialScopeInfos(scopeInfos);

          // stop the loading state
          setIsLoading(false);
        } else {
          // there was an error fetching the api key details
          dispatch({
            type: CreateActionTypes.SetLoadError,
            payload: translate('Response.ApiKeyGetError'),
          });
          setIsLoading(false);
        }
      };

      fetchAllCloudAuthDetails();
    }
  }, [id, translate, isScopeInfoValid]);

  const onNameChangeHandler = useCallback((value: string) => {
    dispatch({ type: CreateActionTypes.SetName, payload: value });
  }, []);

  const onDescriptionChangeHandler = useCallback((value: string) => {
    dispatch({ type: CreateActionTypes.SetDescription, payload: value });
  }, []);

  const onIpChangeHandler = useCallback((values: string[]) => {
    dispatch({ type: CreateActionTypes.SetIps, payload: values });
  }, []);

  const onExpirationDateChangeHandler = useCallback((value: Date | null) => {
    dispatch({ type: CreateActionTypes.SetExpirationTime, payload: value });
  }, []);

  // if there was an error loading the scopes or api key details, return prematurely with an error message
  let loadingOrErrorPlaceholder;
  if (typeof loadError !== 'undefined') {
    // there was an error loading the scope types or the API key information
    loadingOrErrorPlaceholder = (
      <EmptyGrid>
        <Typography color='secondary'>{loadError}</Typography>
      </EmptyGrid>
    );
  } else if (loading) {
    loadingOrErrorPlaceholder = (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }
  return (
    <div className={className}>
      <FormHeader
        canSubmit={isSubmitBtnActive}
        compact={compact}
        submitBtnMsg={
          isPreCreate ? translate('Button.SaveAndGenerate') : translate('Button.SaveChangesToKey')
        }
        tooltipOnDisableMsg={isPreCreate ? translate('Label.KeyCreationRequirements') : undefined}
        title={translate('Heading.NewAPIKey')}
        onSubmit={submitHandler}
        onClose={onFormCloseHandler}
      />
      {loadingOrErrorPlaceholder || (
        <>
          {creatorType === SearchCreatorType.Group && (
            <GroupApiKeyInfoBanner
              severity='warning'
              heading={translate('Heading.GroupAPIKeyWarning')}
              description={translate('Description.GroupAPIKeyWarning')}
              action={
                <Link
                  href='https://devforum.roblox.com/t/api-key-consolidation-deprecating-group-owned-api-keys/4068530'
                  target='_blank'
                  className={learnMoreLink}>
                  {translate('Label.LearnMore')}
                </Link>
              }
            />
          )}
          <FormAccordion
            header={<StepperHeading heading={translate('Heading.General')} step='1' />}>
            <Grid XSmall={12}>
              <ApiKeyNameInput onChange={onNameChangeHandler} initialInputValue={apiKeyName} />
              <ApiKeyDescriptionInput
                onChange={onDescriptionChangeHandler}
                initialInputValue={apiKeyDescription}
              />
            </Grid>
          </FormAccordion>

          <FormAccordion
            header={<StepperHeading heading={translate('Heading.AccessPermissions')} step='2' />}>
            <AccessPermissionsForm
              creatorType={creatorType}
              creatorTargetId={creatorTargetId}
              compact={compact}
              setIsDirty={setIsDirtyHelper}
              scopeInfos={initialScopeInfos}
            />
          </FormAccordion>

          <FormAccordion
            header={<StepperHeading heading={translate('Heading.Security')} step='3' />}>
            <Grid item XSmall={12}>
              <IpAddressForm onChange={onIpChangeHandler} ipValues={acceptedIps} />
              <ExpirationDatePickerForm onChange={onExpirationDateChangeHandler} />
            </Grid>
          </FormAccordion>

          {apiSecretString ? (
            <Grid item>
              <CopySecretToClipboard breakMsgContent apiKeySecret={apiSecretString} />
            </Grid>
          ) : (
            <Grid item>
              <Typography variant='body1' color='primary'>
                {translate('Label.KeyCreationRequirements')}
              </Typography>
            </Grid>
          )}

          <Grid className={bottomActionBtns} item XSmall={12}>
            <TooltipButton
              disabled={!isSubmitBtnActive}
              btnMsg={
                isPreCreate
                  ? translate('Button.SaveAndGenerate')
                  : translate('Button.SaveChangesToKey')
              }
              onClick={submitHandler}
              tooltipOnDisableMsg={
                isPreCreate ? translate('Label.KeyCreationRequirements') : undefined
              }
            />
          </Grid>
        </>
      )}
      <ConfirmDialog
        {...partialConfirmDialogProps}
        content={<BuildDialogBody {...buildDialogBodyProps} />}
      />

      <SelectionWarningDialog
        open={
          luauExecutionsScopeWarningDialogOpen ||
          wildcardTargetPartWarningDialogOpen ||
          groupApiKeyWarningDialogOpen
        }
        continueText={
          isPreCreate ? translate('Button.SaveAndGenerate') : translate('Button.SaveChangesToKey')
        }
        onClose={() => {
          setLuauExecutionsScopeWarningDialogOpen(false);
          setWildcardTargetPartWarningDialogOpen(false);
          setGroupApiKeyWarningDialogOpen(false);
        }}
        onContinue={onWarningContinueCallback}
        luauExecutionSessionsWarningEnabled={luauExecutionsScopeWarningDialogOpen}
        wildcardTargetPartWarningEnabled={wildcardTargetPartWarningDialogOpen}
        groupApiKeyWarningEnabled={groupApiKeyWarningDialogOpen}
      />
    </div>
  );
};

export default CreateApiKeyForm;
