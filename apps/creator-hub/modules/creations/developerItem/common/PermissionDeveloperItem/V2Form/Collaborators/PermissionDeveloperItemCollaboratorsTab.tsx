import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SubjectType } from '@rbx/client-asset-permissions-api/v1';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { Chip, CircularProgress, Grid } from '@rbx/ui';
import { isAssetAccessRequestsEnabled } from '@generated/flags/contentAccessAndInventory';
import type { TUser } from '@modules/authentication/types';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { EDIT_PERMISSION_ASSETS } from '../../../../constants';
import type { DeveloperItemDetails } from '../../../types';
import type { PermissionToastMessage, SharedSubjectDetails } from '../Shared/types';
import { PermissionAccessLevel } from '../Shared/types';
import useAssetPermissions from '../Shared/useAssetPermissions';
import CollaboratorAccessRequestsView from './AccessRequests/CollaboratorAccessRequestsView';
import CollaboratorAccessActiveView from './CollaboratorAccessActiveView';
import usePermissionDeveloperItemCollaboratorsTabStyles from './PermissionDeveloperItemCollaboratorsTab.styles';

export type PermissionDeveloperItemCollaboratorsTabProps = {
  developerItemDetails: DeveloperItemDetails;
  user: TUser;
  handleShowToastMessage: (messages: PermissionToastMessage[]) => void;
};

const PermissionDeveloperItemCollaboratorsTab: FunctionComponent<
  React.PropsWithChildren<PermissionDeveloperItemCollaboratorsTabProps>
> = ({ developerItemDetails, user, handleShowToastMessage }) => {
  const assetId = parseInt(developerItemDetails.id, 10);
  const { translate } = useTranslation();
  const {
    classes: { container },
  } = usePermissionDeveloperItemCollaboratorsTabStyles();
  const { value: enableAssetAccessRequests } = useFlag(isAssetAccessRequestsEnabled);

  const [collaboratorView, setCollaboratorView] = useState<'active' | 'requests'>('active');

  const {
    fetchExistingAndPotentialCollaborators,
    submitProposedCollaboratorAccess,
    removeStoredCollaboratorAccess,
  } = useAssetPermissions(developerItemDetails, user);

  const editPermissionAccessLevelEnabled = EDIT_PERMISSION_ASSETS.includes(
    developerItemDetails.type,
  );

  const [existingAndPotentialCollaborators, setExistingAndPotentialCollaborators] = useState<
    SharedSubjectDetails[]
  >([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(true);
  const [openAddPermissionsModal, setOpenAddPermissionsModal] = useState(false);

  const existingCollaborators = useMemo(() => {
    const all = existingAndPotentialCollaborators.filter(
      (collaborator) => collaborator.storedAccessLevel !== PermissionAccessLevel.NONE,
    );

    const changed = existingAndPotentialCollaborators.filter(
      (collaborator) =>
        collaborator.storedAccessLevel !== PermissionAccessLevel.NONE &&
        collaborator.storedAccessLevel !== collaborator.proposedAccessLevel,
    );

    return { all, changed };
  }, [existingAndPotentialCollaborators]);

  const potentialCollaborators = useMemo(() => {
    // Will appear in AddCollaboratorsModal table
    const proposed = existingAndPotentialCollaborators.filter(
      (collaborator) =>
        collaborator.storedAccessLevel === PermissionAccessLevel.NONE &&
        collaborator.proposedAccessLevel !== PermissionAccessLevel.NONE,
    );

    // Will appear in AddCollaboratorsModal autocomplete search
    const unproposed = existingAndPotentialCollaborators.filter(
      (collaborator) =>
        collaborator.storedAccessLevel === PermissionAccessLevel.NONE &&
        collaborator.proposedAccessLevel === PermissionAccessLevel.NONE,
    );

    return { proposed, unproposed };
  }, [existingAndPotentialCollaborators]);

  const handleOpenAddPermissions = useCallback(() => {
    setOpenAddPermissionsModal(true);
  }, []);

  const handleCloseAddPermissions = useCallback(() => {
    setOpenAddPermissionsModal(false);
  }, []);

  const handleUpdateProposedCollaboratorAccess = useCallback(
    (collaborator: SharedSubjectDetails, proposedAccessLevel: PermissionAccessLevel) => {
      setExistingAndPotentialCollaborators((prevCollaborators) =>
        prevCollaborators.map((prevCollaborator) =>
          prevCollaborator.subjectId === collaborator.subjectId &&
          prevCollaborator.subjectType === collaborator.subjectType
            ? { ...prevCollaborator, proposedAccessLevel }
            : prevCollaborator,
        ),
      );
    },
    [],
  );

  const handleRemoveProposedCollaboratorAccess = useCallback(
    (collaborator: SharedSubjectDetails) => {
      handleUpdateProposedCollaboratorAccess(collaborator, PermissionAccessLevel.NONE);
    },
    [handleUpdateProposedCollaboratorAccess],
  );

  const handleCancelProposedCollaboratorsAccess = useCallback(() => {
    setExistingAndPotentialCollaborators((prevCollaborators) =>
      prevCollaborators.map((prevCollaborator) => ({
        ...prevCollaborator,
        proposedAccessLevel: prevCollaborator.storedAccessLevel,
      })),
    );
  }, []);

  const handleUpdateStoredCollaboratorsAccess = useCallback(
    // newCollaboratorsOnly === true will only update collaborators that do not have existing access
    async (newCollaboratorsOnly = false) => {
      const changedCollaborators = newCollaboratorsOnly
        ? potentialCollaborators.proposed
        : existingCollaborators.changed;

      const { usersGrantSucceeded, groupsGrantSucceeded, toastMessages } =
        await submitProposedCollaboratorAccess(changedCollaborators);

      // This set uses stringified collaborator objects to avoid reference issues
      // We cannot use subjectId alone because users and groups can have the same id
      const successfulUpdates: Set<string> = new Set();

      changedCollaborators.forEach((collaborator) => {
        if (
          (collaborator.subjectType === SubjectType.User && usersGrantSucceeded) ||
          (collaborator.subjectType === SubjectType.Group && groupsGrantSucceeded)
        ) {
          successfulUpdates.add(JSON.stringify(collaborator));
        }
      });

      if (successfulUpdates.size > 0) {
        setExistingAndPotentialCollaborators((prevCollaborators) =>
          prevCollaborators.map((prevCollaborator) => {
            if (successfulUpdates.has(JSON.stringify(prevCollaborator))) {
              return {
                ...prevCollaborator,
                storedAccessLevel: prevCollaborator.proposedAccessLevel,
              };
            }
            return prevCollaborator;
          }),
        );
      }

      handleShowToastMessage(toastMessages);
    },
    [
      existingCollaborators.changed,
      handleShowToastMessage,
      potentialCollaborators.proposed,
      submitProposedCollaboratorAccess,
    ],
  );

  const handleRemoveStoredCollaboratorAccess = useCallback(
    async (collaborator: SharedSubjectDetails) => {
      const { succeeded, toastMessage } = await removeStoredCollaboratorAccess(collaborator);
      if (succeeded) {
        setExistingAndPotentialCollaborators((prevCollaborators) =>
          prevCollaborators.map((prevCollaborator) =>
            prevCollaborator.subjectId === collaborator.subjectId &&
            prevCollaborator.subjectType === collaborator.subjectType
              ? {
                  ...prevCollaborator,
                  proposedAccessLevel: PermissionAccessLevel.NONE,
                  storedAccessLevel: PermissionAccessLevel.NONE,
                }
              : prevCollaborator,
          ),
        );
      }
      handleShowToastMessage([toastMessage]);
    },
    [handleShowToastMessage, removeStoredCollaboratorAccess],
  );

  // Refs for each tab chip so ArrowKey navigation can move DOM focus (roving tabindex requirement).
  const chipRefs = useRef<Record<'active' | 'requests', HTMLDivElement | null>>({
    active: null,
    requests: null,
  });

  const handleTabKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      setCollaboratorView('requests');
      chipRefs.current.requests?.focus();
    } else if (e.key === 'ArrowLeft') {
      setCollaboratorView('active');
      chipRefs.current.active?.focus();
    }
  }, []);

  const renderTabChip = useCallback(
    (view: 'active' | 'requests', label: string) => (
      <Chip
        ref={(el: HTMLDivElement | null) => {
          chipRefs.current[view] = el;
        }}
        id={`collaborators-tab-${view}`}
        color={collaboratorView === view ? 'primary' : 'secondary'}
        label={label}
        clickable
        role='tab'
        tabIndex={collaboratorView === view ? 0 : -1}
        aria-selected={collaboratorView === view}
        aria-controls={`collaborators-panel-${view}`}
        onClick={collaboratorView === view ? undefined : () => setCollaboratorView(view)}
      />
    ),
    [collaboratorView],
  );

  useEffect(() => {
    const loadExistingAndPotentialCollaborators = async () => {
      setLoadingCollaborators(true);
      setExistingAndPotentialCollaborators(await fetchExistingAndPotentialCollaborators(true));
      setLoadingCollaborators(false);
    };

    // void: effect callbacks must not return promises (React treats the return value as cleanup)
    void loadExistingAndPotentialCollaborators();
  }, [fetchExistingAndPotentialCollaborators]);

  if (loadingCollaborators) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  return (
    <Grid container data-testid='collaborators-permission-tab' classes={{ root: container }}>
      {enableAssetAccessRequests && (
        <Grid item XSmall={12} style={{ marginBottom: 16 }}>
          <div
            role='tablist'
            tabIndex={-1}
            aria-label={translate('Label.CollaboratorView')}
            className='inline-flex gap-small'
            onKeyDown={handleTabKeyDown}>
            {renderTabChip('active', translate('Label.Active'))}
            {renderTabChip('requests', translate('Label.Requests'))}
          </div>
        </Grid>
      )}

      <Grid
        item
        XSmall={12}
        id={`collaborators-panel-${collaboratorView}`}
        role='tabpanel'
        aria-labelledby={`collaborators-tab-${collaboratorView}`}>
        {enableAssetAccessRequests && collaboratorView === 'requests' ? (
          <CollaboratorAccessRequestsView assetId={assetId} />
        ) : (
          <CollaboratorAccessActiveView
            editPermissionAccessLevelEnabled={editPermissionAccessLevelEnabled}
            existingCollaborators={existingCollaborators}
            potentialCollaborators={potentialCollaborators}
            openAddPermissionsModal={openAddPermissionsModal}
            handleOpenAddPermissions={handleOpenAddPermissions}
            handleCloseAddPermissions={handleCloseAddPermissions}
            handleCancelProposedCollaboratorsAccess={handleCancelProposedCollaboratorsAccess}
            handleUpdateProposedCollaboratorAccess={handleUpdateProposedCollaboratorAccess}
            handleUpdateStoredCollaboratorsAccess={handleUpdateStoredCollaboratorsAccess}
            handleRemoveStoredCollaboratorAccess={handleRemoveStoredCollaboratorAccess}
            handleRemoveProposedCollaboratorAccess={handleRemoveProposedCollaboratorAccess}
          />
        )}
      </Grid>
    </Grid>
  );
};

export default PermissionDeveloperItemCollaboratorsTab;
