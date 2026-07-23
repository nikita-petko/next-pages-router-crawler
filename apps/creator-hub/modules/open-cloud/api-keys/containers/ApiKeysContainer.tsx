import { useCallback, useState, useEffect } from 'react';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, useMediaQuery } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import cloudAuthClient from '@modules/clients/cloudAuthentication';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import CredentialsTable from '../components/v1/CredentialsTable';
import FormMode from '../enums/FormMode';
import type FormModeState from '../interfaces/FormModeState';
import ScopesProvider from '../providers/ScopesProvider';
import ApiKeyFormContainer from './ApiKeyFormContainer';
import useApiKeysContainerStyles from './ApiKeysContainer.styles';

interface ApiKeysContainerProps {
  formModeState: FormModeState;
  setFormModeState: (mode: FormModeState) => void;
}

const ApiKeysContainer = ({ formModeState, setFormModeState }: ApiKeysContainerProps) => {
  const {
    classes: { section, credentialsTable, container },
  } = useApiKeysContainerStyles();

  // checks to see if the current creator is authorized to see API keys for a group
  const [canUserSeeGroupApiKeys, setCanUserSeeGroupApiKeys] = useState<boolean>(false);
  const isFormActive: boolean = formModeState.mode !== FormMode.Inactive;

  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();
  const { translate } = useTranslation();

  useEffect(() => {
    let didCancel = false;
    const canUseGroupApiKeys = async () => {
      const response = await cloudAuthClient.canUseApiKeys(currentGroup?.id);
      // Ignore if we started fetching something else
      if (!didCancel) {
        setCanUserSeeGroupApiKeys(response.canUseApiKeys ?? false);
      }
    };
    canUseGroupApiKeys();
    return () => {
      didCancel = true;
    }; // Remember if we start fetching something else;
  }, [currentGroup]);

  const onFormModeStateChange = useCallback(
    (state: FormModeState) => {
      setFormModeState(state);
    },
    [setFormModeState],
  );

  const onHideFormHandler = useCallback(() => {
    onFormModeStateChange({ mode: FormMode.Inactive });
  }, [onFormModeStateChange]);

  // If a group was selected, but the user is not a group owner, ui should be disabled
  if (currentGroup !== null && currentGroup !== undefined && !canUserSeeGroupApiKeys) {
    return (
      <EmptyGrid>
        <Typography>{translate('Label.InvalidGroupPermissions')}</Typography>
      </EmptyGrid>
    );
  }

  return (
    <ScopesProvider groupId={currentGroup?.id}>
      <Grid className={container} container>
        {!isFormActive ? (
          <CredentialsTable
            className={credentialsTable}
            groupId={currentGroup?.id}
            onShowForm={onFormModeStateChange}
          />
        ) : (
          <ApiKeyFormContainer
            formMode={formModeState}
            creatorType={currentGroup?.id ? SearchCreatorType.Group : SearchCreatorType.User}
            creatorTargetId={currentGroup?.id || user?.id}
            className={section}
            compact={isCompactView}
            onHideForm={onHideFormHandler}
          />
        )}
      </Grid>
    </ScopesProvider>
  );
};

export default ApiKeysContainer;
