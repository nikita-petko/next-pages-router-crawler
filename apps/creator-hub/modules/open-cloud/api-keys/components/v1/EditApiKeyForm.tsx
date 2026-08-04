import { useEffect, useState, useCallback, useReducer } from 'react';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Button, CircularProgress, Divider, Link } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import type { GetApiKeyResponse, ScopeInfo } from '@modules/clients/cloudAuthentication';
import cloudAuthClient, { CloudAuthBadStatus } from '@modules/clients/cloudAuthentication';
import gamesClient from '@modules/clients/games';
import usersClient from '@modules/clients/users';
import { getResponseFromError } from '@modules/clients/utils';
import { FormHeader, EmptyGrid } from '@modules/miscellaneous/components';
import SelectionWarningDialog from '../../../common/components/SelectionWarningDialog';
import useSnackbar from '../../../common/hooks/useSnackbar';
import { isScopeTypeWarningRequired } from '../../../common/utils/warningDialogUtil';
import {
  forgottenUserId,
  robloxAdminUserId,
  robloxAdminDisplayName,
} from '../../constants/openCloudConstants';
import EditDialogMode from '../../enums/EditDialogMode';
import TargetPartNames from '../../enums/TargetPartNames';
import useScopeFormState from '../../hooks/useScopeFormState';
import useScopeSystem from '../../hooks/useScopeSystem';
import useConfirmationDialog from '../../hooks/v1/useConfirmationDialog';
import editFormReducer, {
  EditActionTypes,
  initialEditFormState,
} from '../../reducers/editFormReducer';
import { buildEditDialogControls } from '../../utils/dialogControlBuilders';
import extractTranslationKey from '../../utils/translationKeyRegex';
import shouldShowWildcardWarning from '../../utils/wildcardWarningUtil';
import AccessPermissionsForm from '../AccessPermissionsForm';
import ApiKeyDescriptionInput from './ApiKeyDescriptionInput';
import ApiKeyEnableForm from './ApiKeyEnableForm';
import ApiKeyNameInput from './ApiKeyNameInput';
import ApiKeyStatusForm from './ApiKeyStatusForm';
import ApiKeyTimeStampDetails from './ApiKeyTimeStampDetails';
import CopySecretToClipboard from './CopySecretToClipboard';
import useEditApiKeyFormStyles from './EditApiKeyForm.styles';
import ExpirationDatePickerForm from './ExpirationDatePickerForm';
import FormAccordion from './FormAccordion';
import GroupApiKeyInfoBanner from './GroupApiKeyInfoBanner';
import IpAddressForm from './IpAddressForm';
import RegenerateApiKeyForm from './RegenerateApiKeyForm';

interface EditApiKeyFormProps {
  className: string;
  compact: boolean;
  creatorType: SearchCreatorType;
  creatorTargetId?: number;
  id?: string;
  onHideForm?: () => void;
}

const EditApiKeyForm = ({
  className,
  compact,
  id,
  creatorType,
  creatorTargetId,
  onHideForm,
}: EditApiKeyFormProps) => {
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const {
    classes: {
      controlsBlock,
      topFormBlock,
      deleteBtn,
      deleteBtnWrapper,
      lowerSaveBtn,
      bottomActionBtns,
      learnMoreLink,
    },
  } = useEditApiKeyFormStyles();

  const { showSnackbar } = useSnackbar();
  const { getValidScopeInfos } = useScopeFormState();
  const { areScopesLoaded, isScopeInfoValid, getNthSharedTargetPart, getScopeTypeProductName } =
    useScopeSystem();

  const [
    {
      apiKeyName,
      apiKeyDescription,
      apiKeySecretPreview,
      acceptedIps,
      expirationTime,
      enabled,
      apiRegeneratedKeySecret,
      isDirty,
      isValid,
      loadError,
      lastGeneratedTime,
      lastGeneratedUserName,
      nameInputActive,
      descriptionInputActive,
      statuses,
      created,
      updated,
    },
    dispatch,
  ] = useReducer(editFormReducer, initialEditFormState);

  const [initialScopeInfos, setInitialScopeInfos] = useState<ScopeInfo[] | undefined>();
  const [staleUniverseIds, setStaleUniverseIds] = useState<Set<string>>(new Set());
  const [dialogMode, setDialogMode] = useState<EditDialogMode>();
  const [loading, setIsLoading] = useState<boolean>(false); // used for the initial loading state when the form populates

  const [savedScopeTypes, setSavedScopeTypes] = useState<string[]>([]); // used to diff against added scopes to conditionally display warning
  const [luauExecutionsScopeWarningDialogOpen, setLuauExecutionsScopeWarningDialogOpen] =
    useState(false);
  const [wildcardTargetPartWarningDialogOpen, setWildcardTargetPartWarningDialogOpen] =
    useState(false);
  const [groupApiKeyWarningDialogOpen, setGroupApiKeyWarningDialogOpen] = useState(false);
  const [onWarningContinueCallback, setOnWarningContinueCallback] = useState(() => () => {});
  const [warningContinueText, setWarningContinueText] = useState<string>('');

  const checkStaleUniverses = useCallback(
    async (scopeInfos: ScopeInfo[]) => {
      if (creatorType !== SearchCreatorType.Group || creatorTargetId === undefined) {
        return;
      }
      const groupId = creatorTargetId;
      const universeIds = [
        ...new Set(
          scopeInfos
            .filter((s) => {
              const product = getScopeTypeProductName(s.scopeType ?? '');
              return getNthSharedTargetPart(product, 0) === (TargetPartNames.Universe as string);
            })
            .map((s) => s.targetParts?.[0])
            .filter((tp): tp is string => tp !== undefined && /^\d+$/.test(tp)),
        ),
      ];
      if (universeIds.length === 0) {
        setStaleUniverseIds(new Set());
        return;
      }
      const gameDetailsResponse = await gamesClient.getDetails(
        universeIds.map((uid) => parseInt(uid, 10)),
      );
      const returnedIds = new Set((gameDetailsResponse.data ?? []).map((u) => String(u.id)));
      const ownedIds = new Set(
        (gameDetailsResponse.data ?? [])
          .filter((u) => u.creator?.type === 'Group' && u.creator?.id === groupId)
          .map((u) => String(u.id)),
      );
      setStaleUniverseIds(
        new Set(universeIds.filter((uid) => returnedIds.has(uid) && !ownedIds.has(uid))),
      );
    },
    [creatorType, creatorTargetId, getScopeTypeProductName, getNthSharedTargetPart],
  );

  const getLastGeneratedUserName = useCallback(
    async (userId?: number): Promise<string> => {
      if (typeof userId === 'undefined' || userId === forgottenUserId) {
        return translate('Label.UnknownUser');
      }
      if (userId === robloxAdminUserId) {
        return robloxAdminDisplayName;
      }
      try {
        const userDetails = await usersClient.getUserById(userId);
        return userDetails.displayName ?? String(userId);
      } catch {
        console.warn(`There was an error loading the user details for user id: ${userId}`);
        return translate('Label.UnknownUser');
      }
    },
    [translate],
  );

  const onRegenerate = useCallback(async () => {
    if (typeof id === 'undefined') {
      showSnackbar(
        'error',
        translate('Heading.NetworkError'),
        translate('Message.RegenerateKeyError'),
      );
      return;
    }

    try {
      const cloudAuthResponse = await cloudAuthClient.regenerateApiKeyById(id);
      const lastGeneratedUserId = cloudAuthResponse.cloudAuthInfo?.lastGeneratedUserId ?? 0;
      const username = await getLastGeneratedUserName(lastGeneratedUserId);
      dispatch({
        type: EditActionTypes.RegenerateKey,
        payload: {
          response: cloudAuthResponse,
          userDisplayName: username,
        },
      });
      showSnackbar('success', '', translate('Message.RegenerateKeySuccess'));
    } catch {
      console.warn('There was an issue regenerating the api key');
      showSnackbar(
        'error',
        translate('Heading.NetworkError'),
        translate('Message.RegenerateKeyError'),
      );
    }
  }, [getLastGeneratedUserName, id, showSnackbar, translate]);

  /**
   * @param successMsg The toast message that appears on success
   * @param errorMsg The toast message that will appear on failure
   * @param isEnabled A boolean that indicates whether the key should be enabled or disabled
   * @param isRedirect A boolean that indicates whether or not we should redirect on successful save
   */
  const onSaveChanges = useCallback(
    async (successMsg: string, isEnabled?: boolean, isRedirect = false) => {
      // for enabling, disabling, and updating other fields of key
      const validScopeInfos = getValidScopeInfos();

      try {
        const response = await cloudAuthClient.updateApiKey(
          id,
          apiKeyName,
          apiKeyDescription,
          isEnabled,
          expirationTime?.toISOString(),
          acceptedIps,
          validScopeInfos,
        );
        setSavedScopeTypes(
          validScopeInfos.map((scopeInfo) => scopeInfo.scopeType).filter((s) => s !== undefined),
        );
        setInitialScopeInfos(validScopeInfos);
        await checkStaleUniverses(validScopeInfos);
        dispatch({ type: EditActionTypes.UpdatedKey, payload: response });
        showSnackbar('success', '', successMsg ?? '');
        if (isRedirect) {
          onHideForm?.();
        }
      } catch (e) {
        const response = getResponseFromError(e);
        const isStaleError = response?.status === 403 && staleUniverseIds.size > 0;

        if (isStaleError) {
          showSnackbar(
            'error',
            translate('Heading.StaleUniverseScope' /* TranslationNamespace.OpenCloud */),
            translate('Message.StaleUniverseScopesWarning' /* TranslationNamespace.OpenCloud */),
          );
        } else {
          const rawError: unknown = await response?.json();
          const errorMessage =
            typeof rawError === 'object' &&
            rawError !== null &&
            'message' in rawError &&
            typeof rawError.message === 'string'
              ? rawError.message
              : '';
          // Extract potential translation keys of the form "[SomeWord].[SomeWord]"
          const translationKey = extractTranslationKey(errorMessage);
          showSnackbar(
            'error',
            translate('Heading.NetworkError'),
            translationKey ? translate(translationKey) : errorMessage,
          );
          console.warn(
            `There was an unexpected error while updating the api key (${response?.status}): ${errorMessage}`,
          );
        }
      }
    },
    [
      acceptedIps,
      apiKeyDescription,
      apiKeyName,
      checkStaleUniverses,
      expirationTime,
      getValidScopeInfos,
      id,
      showSnackbar,
      staleUniverseIds,
      translate,
      onHideForm,
    ],
  );

  const onDeleteKey = useCallback(async () => {
    if (typeof id === 'undefined') {
      showSnackbar(
        'error',
        translate('Heading.NetworkError'),
        translate('Message.NetworkErrorDeleteKey', {
          apiKeyName: apiKeyName ?? '',
        }),
      );
      return;
    }

    try {
      await cloudAuthClient.deleteApiKeyById(id);
      showSnackbar(
        'success',
        '',
        translate('Message.DeleteKeySuccess', { apiKeyName: apiKeyName ?? '' }),
      );

      // a successful delete will result in an automatic exit from the form
      onHideForm?.();
    } catch {
      showSnackbar(
        'error',
        translate('Heading.NetworkError'),
        translate('Message.NetworkErrorDeleteKey', { apiKeyName: apiKeyName ?? '' }),
      );
    }
  }, [apiKeyName, onHideForm, id, showSnackbar, translate]);

  const onDialogCancel = () => {
    if (
      // These are "discard changes"
      dialogMode === EditDialogMode.ExitPageOnDirtyValid ||
      dialogMode === EditDialogMode.ExitPageOnDirtyInvalid
    ) {
      onHideForm?.();
    }
  };

  const onDialogConfirm = useCallback(async () => {
    if (
      dialogMode === EditDialogMode.RegenerateWhenOwner ||
      dialogMode === EditDialogMode.RegenerateWhenNotOwner
    ) {
      await onRegenerate();
    } else if (dialogMode === EditDialogMode.Disable) {
      await onSaveChanges(translate('Message.DisableKeySuccess'), false);
    } else if (dialogMode === EditDialogMode.Enable) {
      await onSaveChanges(translate('Message.EnableKeySuccess'), true);
    } else if (dialogMode === EditDialogMode.Delete) {
      await onDeleteKey();
    } else if (dialogMode === EditDialogMode.ExitPageOnDirtyValid) {
      // try to save, then exit the form
      await onSaveChanges(translate('Message.ApiKeyUpdateSuccess'), enabled, true);
    }
  }, [dialogMode, enabled, onDeleteKey, onRegenerate, onSaveChanges, translate]);

  const {
    openDialog,
    BuildDialogBody,
    buildDialogBodyProps,
    ConfirmDialog,
    partialConfirmDialogProps,
  } = useConfirmationDialog(onDialogConfirm, onDialogCancel);

  const openConfirmationDialog = useCallback(
    (mode: EditDialogMode) => {
      openDialog(buildEditDialogControls(mode, translate));
      setDialogMode(mode);
    },
    [openDialog, translate],
  );

  const submitHandler = useCallback(async () => {
    const submit = async () => {
      await onSaveChanges(translate('Message.ApiKeyUpdateSuccess'), enabled);
    };

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
      setWarningContinueText(translate('Button.SaveChangesToKey'));
      setOnWarningContinueCallback(() => () => {
        setWildcardTargetPartWarningDialogOpen(false);
        setLuauExecutionsScopeWarningDialogOpen(false);
        setGroupApiKeyWarningDialogOpen(false);
        void submit();
      });
    } else {
      void submit();
    }
  }, [
    getValidScopeInfos,
    onSaveChanges,
    translate,
    enabled,
    savedScopeTypes,
    getNthSharedTargetPart,
    getScopeTypeProductName,
    creatorType,
  ]);

  const onRegenerateHandler = () => {
    if (user?.name !== lastGeneratedUserName) {
      // check saved set and show warning if necessary
      if (savedScopeTypes.some(isScopeTypeWarningRequired)) {
        setWarningContinueText(translate('Button.Regenerate'));
        setLuauExecutionsScopeWarningDialogOpen(true);
        setOnWarningContinueCallback(() => () => {
          setLuauExecutionsScopeWarningDialogOpen(false);
          openConfirmationDialog(EditDialogMode.RegenerateWhenNotOwner);
        });
      } else {
        openConfirmationDialog(EditDialogMode.RegenerateWhenNotOwner);
      }
    } else {
      openConfirmationDialog(EditDialogMode.RegenerateWhenOwner);
    }
  };

  const onChecked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    if (checked) {
      openConfirmationDialog(EditDialogMode.Enable);
    } else {
      openConfirmationDialog(EditDialogMode.Disable);
    }
  };

  const onNameChangeHandler = useCallback((value: string) => {
    dispatch({ type: EditActionTypes.SetName, payload: value });
  }, []);

  const onDescriptionChangeHandler = useCallback((value: string) => {
    dispatch({ type: EditActionTypes.SetDescription, payload: value });
  }, []);

  const onIpChangeHandler = useCallback((values: string[]) => {
    dispatch({ type: EditActionTypes.SetIps, payload: values });
  }, []);

  const onExpirationDateChangeHandler = useCallback((value: Date | null) => {
    dispatch({ type: EditActionTypes.SetExpirationTime, payload: value });
  }, []);

  const setDirtyHandler = useCallback(() => {
    dispatch({ type: EditActionTypes.SetDirty });
  }, []);

  const onFormCloseHandler = useCallback(() => {
    if (!isDirty) {
      // form not dirty, key not regenerated, exit the form
      onHideForm?.();
    } else if (isDirty && isValid) {
      // form is dirty, but is valid to be saved; bring up save changes prompt
      openConfirmationDialog(EditDialogMode.ExitPageOnDirtyValid);
    } else if (isDirty && !isValid) {
      // form is dirty, but is invalid to be saved; bring up discard changes prompt
      openConfirmationDialog(EditDialogMode.ExitPageOnDirtyInvalid);
    }
  }, [isDirty, isValid, openConfirmationDialog, onHideForm]);

  useEffect(() => {
    // on initial render, read in data from passed in id and instantiate all forms (+ fetch the user display name that last generated the key)
    const getApiKeyDetails = async (
      cloudAuthId?: string,
    ): Promise<[GetApiKeyResponse, string] | null> => {
      if (typeof cloudAuthId === 'undefined') {
        // if the id is undefined for edit (indicates a potential corrupted backend response), return before making the network call
        return null;
      }

      try {
        const response = await cloudAuthClient.getApiKeyById(cloudAuthId);
        const lastGeneratedUserId = response.cloudAuthInfo?.lastGeneratedUserId;

        // try to get the user display name- if this second chained call fails, ignore it and default to the id
        const username = await getLastGeneratedUserName(lastGeneratedUserId);
        return [response, username];
      } catch {
        console.warn(`There was an error loading the cloud auth details for id: ${id}`);
        return null;
      }
    };

    const getApiKeyAndSetScopes = async () => {
      setIsLoading(true);
      // fetch cloud auth data, then fetch the user display name based of the first API call
      const apiKeyDetails = await getApiKeyDetails(id);

      const failure = () => {
        dispatch({
          type: EditActionTypes.SetLoadError,
          payload: translate('Response.ApiKeyGetError'),
        });
        setIsLoading(false);
      };

      if (apiKeyDetails === null) {
        failure();
        return;
      }

      const [getApiKeyResponse, userDisplayName] = apiKeyDetails;

      // load the array of scope infos into the scope form state tree
      let scopeInfos = getApiKeyResponse.cloudAuthInfo?.cloudAuthUserConfiguredProperties?.scopes;

      if (
        scopeInfos === undefined ||
        scopeInfos.some((scopeInfo) => scopeInfo.scopeType === undefined)
      ) {
        failure();
        return;
      }

      scopeInfos = scopeInfos.filter(
        (scopeInfo) =>
          scopeInfo.scopeType !== undefined && isScopeInfoValid(scopeInfo.scopeType, scopeInfo),
      );

      setInitialScopeInfos(scopeInfos);
      const scopeTypes =
        scopeInfos?.map((scopeInfo) => scopeInfo.scopeType).filter((s) => s !== undefined) ?? [];
      setSavedScopeTypes(scopeTypes);

      await checkStaleUniverses(scopeInfos);

      dispatch({
        type: EditActionTypes.InitCloudAuthDetails,
        payload: {
          response: getApiKeyResponse,
          userDisplayName,
        },
      });
      setIsLoading(false);
    };

    void getApiKeyAndSetScopes();
  }, [
    getLastGeneratedUserName,
    id,
    translate,
    isScopeInfoValid,
    creatorType,
    creatorTargetId,
    checkStaleUniverses,
  ]);

  useEffect(() => {
    // if the scope system did not load correctly, prompt user to refresh the page
    if (!areScopesLoaded) {
      dispatch({
        type: EditActionTypes.SetLoadError,
        payload:
          'There was an error loading the API System Configurations. Please try to reload the page',
      });
    }
  }, [areScopesLoaded]);

  // if there was an error loading the scopes or api key details, return prematurely with an error message
  let loadingOrErrorPlaceholder;
  if (typeof loadError !== 'undefined') {
    // there was an error loading the scope types or the API key information
    loadingOrErrorPlaceholder = <EmptyGrid>{loadError}</EmptyGrid>;
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
        canSubmit={isValid && isDirty}
        compact={compact}
        submitBtnMsg={translate('Button.SaveChangesToKey')}
        title={translate('Heading.EditAPIKey')}
        onClose={onFormCloseHandler}
        onSubmit={submitHandler}
      />
      {loadingOrErrorPlaceholder ?? (
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
          <Grid className={topFormBlock} container>
            {/** Left side of Top Form Container */}
            <Grid item Medium={6} XSmall={12}>
              <ApiKeyNameInput
                onChange={onNameChangeHandler}
                initialInputValue={apiKeyName}
                editProps={{
                  isInputInactive: !nameInputActive,
                  onClickEdit: () => {
                    dispatch({ type: EditActionTypes.EditName });
                  },
                }}
              />

              <ApiKeyDescriptionInput
                onChange={onDescriptionChangeHandler}
                initialInputValue={apiKeyDescription}
                editProps={{
                  isInputInactive: !descriptionInputActive,
                  onClickEdit: () => {
                    dispatch({ type: EditActionTypes.EditDescription });
                  },
                }}
              />

              <ApiKeyEnableForm className={controlsBlock} enabled={enabled} onChecked={onChecked} />
            </Grid>

            {/** Right side of top container */}
            <Grid item Medium={6} XSmall={12}>
              <Grid className={controlsBlock}>
                <ApiKeyStatusForm statuses={statuses} />
              </Grid>

              <Grid className={controlsBlock}>
                {typeof apiRegeneratedKeySecret === 'undefined' ? (
                  <RegenerateApiKeyForm
                    apiKeyPreview={apiKeySecretPreview}
                    onRegenerate={onRegenerateHandler}
                  />
                ) : (
                  <CopySecretToClipboard
                    showKeyLabel
                    apiKeySecret={apiRegeneratedKeySecret}
                    copyButtonSize='small'
                  />
                )}
              </Grid>

              <Divider />

              {lastGeneratedTime && (
                <ApiKeyTimeStampDetails
                  className={controlsBlock}
                  lastGeneratedUserName={lastGeneratedUserName}
                  label={translate('Label.LastGenerated')}
                  timestamp={lastGeneratedTime}
                />
              )}

              {updated && (
                <ApiKeyTimeStampDetails
                  className={controlsBlock}
                  label={translate('Label.Updated')}
                  timestamp={updated}
                />
              )}

              {created && (
                <ApiKeyTimeStampDetails
                  className={controlsBlock}
                  label={translate('Label.Created')}
                  timestamp={created}
                />
              )}

              <div className={deleteBtnWrapper}>
                <Button
                  className={deleteBtn}
                  size='small'
                  variant='contained'
                  onClick={() => openConfirmationDialog(EditDialogMode.Delete)}>
                  {translate('Message.ModeDelete')}
                </Button>
              </div>
            </Grid>
          </Grid>

          {staleUniverseIds.size > 0 && (
            <GroupApiKeyInfoBanner
              severity='warning'
              heading={translate('Heading.StaleUniverseScope' /* TranslationNamespace.OpenCloud */)}
              description={translate(
                'Message.StaleUniverseScopesWarning' /* TranslationNamespace.OpenCloud */,
              )}
            />
          )}
          <FormAccordion header={translate('Heading.AccessPermissions')}>
            <AccessPermissionsForm
              creatorType={creatorType}
              creatorTargetId={creatorTargetId}
              compact={compact}
              setIsDirty={setDirtyHandler}
              scopeInfos={initialScopeInfos}
              staleUniverseIds={staleUniverseIds}
            />
          </FormAccordion>

          <FormAccordion header={translate('Heading.Security')}>
            <Grid item XSmall={12}>
              <IpAddressForm onChange={onIpChangeHandler} ipValues={acceptedIps} />
              <ExpirationDatePickerForm
                onChange={onExpirationDateChangeHandler}
                isExpired={statuses.includes(CloudAuthBadStatus.Expired)}
                initialDate={expirationTime}
              />
            </Grid>
          </FormAccordion>

          <Grid className={bottomActionBtns} item XSmall={12}>
            <Button
              className={lowerSaveBtn}
              disabled={!(isValid && isDirty)}
              onClick={submitHandler}
              variant='contained'
              color='primaryBrand'>
              {translate('Button.SaveChangesToKey')}
            </Button>
          </Grid>

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
            continueText={warningContinueText}
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
        </>
      )}
    </div>
  );
};

export default EditApiKeyForm;
