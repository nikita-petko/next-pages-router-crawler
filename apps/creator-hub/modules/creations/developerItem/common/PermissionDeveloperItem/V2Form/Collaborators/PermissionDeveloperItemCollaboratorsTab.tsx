import { CircularProgress, Grid } from '@rbx/ui';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import type { TUser } from '@modules/authentication/types';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { SubjectType } from '@rbx/clients/assetPermissionsApi';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import { useGetAssetEligibilityStatus } from '@modules/react-query/assetPermissions';
import { EDIT_PERMISSION_ASSETS } from '../../../../constants';
import PermissionEmptyState from '../Shared/PermissionEmptyState';
import AddCollaboratorsModal from './AddModal/AddCollaboratorsModal';
import usePermissionDeveloperItemCollaboratorsTabStyles from './PermissionDeveloperItemCollaboratorsTab.styles';
import CollaboratorsTableContainer from './Table/CollaboratorsTableContainer';
import {
  PermissionAccessLevel,
  PermissionTab,
  PermissionToastMessage,
  SharedSubjectDetails,
} from '../Shared/types';
import { DeveloperItemDetails } from '../../../DeveloperItemProvider';
import useAssetPermissions from '../Shared/useAssetPermissions';
import CompositeAssetDependenciesAlert from '../../../CompositeAssetDependencies/alert/CompositeAssetDependenciesAlert';
import { DependenciesAlertType } from '../../../CompositeAssetDependencies/constants/alertTypeConstants';

export type PermissionDeveloperItemCollaboratorsTabProps = {
  developerItemDetails: DeveloperItemDetails;
  user: TUser;
  handleShowToastMessage: (messages: PermissionToastMessage[]) => void;
};

const PermissionDeveloperItemCollaboratorsTab: FunctionComponent<
  React.PropsWithChildren<PermissionDeveloperItemCollaboratorsTabProps>
> = ({ developerItemDetails, user, handleShowToastMessage }) => {
  const assetId = parseInt(developerItemDetails.id, 10);
  const {
    classes: { container },
  } = usePermissionDeveloperItemCollaboratorsTabStyles();
  const { frontendFlags } = useToolboxServiceApiProvider();
  const enableAssetEligibilityChecks =
    frontendFlags[FrontendFlagName.FrontendFlagEnableAssetEligibilityChecks];
  const enableSharingWithGroups =
    frontendFlags[FrontendFlagName.FrontendFlagEnablePermissionSharingWithGroups];

  const {
    fetchExistingAndPotentialCollaborators,
    submitProposedCollaboratorAccess,
    removeStoredCollaboratorAccess,
  } = useAssetPermissions(developerItemDetails, user);

  const { data: assetEligibility, isPending: loadingAssetEligibility } =
    useGetAssetEligibilityStatus(assetId, developerItemDetails.type, enableAssetEligibilityChecks);
  const eligibilityPending =
    enableAssetEligibilityChecks &&
    (loadingAssetEligibility || assetEligibility?.isEligibilityPending);
  const sharingDisabled =
    enableAssetEligibilityChecks &&
    !eligibilityPending &&
    !assetEligibility?.canShareWithCollaborators;

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

  useEffect(() => {
    const loadExistingAndPotentialCollaborators = async () => {
      setLoadingCollaborators(true);
      setExistingAndPotentialCollaborators(
        await fetchExistingAndPotentialCollaborators(enableSharingWithGroups),
      );
      setLoadingCollaborators(false);
    };

    if (sharingDisabled) {
      setLoadingCollaborators(false);
    } else {
      loadExistingAndPotentialCollaborators();
    }
  }, [enableSharingWithGroups, fetchExistingAndPotentialCollaborators, sharingDisabled]);

  if (loadingCollaborators || eligibilityPending) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  return (
    <Grid container data-testid='collaborators-permission-tab' classes={{ root: container }}>
      {sharingDisabled ? (
        <CompositeAssetDependenciesAlert
          alertType={DependenciesAlertType.Sharing}
          parentAssetId={assetId}
          parentCreator={developerItemDetails.creator}
        />
      ) : (
        <React.Fragment>
          {existingCollaborators.all.length === 0 ? (
            <PermissionEmptyState
              handleOpenAddPermissions={handleOpenAddPermissions}
              permissionTab={PermissionTab.COLLABORATORS}
            />
          ) : (
            <CollaboratorsTableContainer
              editPermissionAccessLevelEnabled={editPermissionAccessLevelEnabled}
              existingCollaborators={existingCollaborators}
              handleCancelProposedCollaboratorsAccess={handleCancelProposedCollaboratorsAccess}
              handleOpenAddPermissions={handleOpenAddPermissions}
              handleUpdateProposedCollaboratorAccess={handleUpdateProposedCollaboratorAccess}
              handleUpdateStoredCollaboratorsAccess={handleUpdateStoredCollaboratorsAccess}
              handleRemoveStoredCollaboratorAccess={handleRemoveStoredCollaboratorAccess}
            />
          )}
          <AddCollaboratorsModal
            editPermissionAccessLevelEnabled={editPermissionAccessLevelEnabled}
            potentialCollaborators={potentialCollaborators}
            handleCloseAddPermissions={handleCloseAddPermissions}
            handleRemoveProposedCollaboratorAccess={handleRemoveProposedCollaboratorAccess}
            handleUpdateProposedCollaboratorAccess={handleUpdateProposedCollaboratorAccess}
            handleUpdateStoredCollaboratorsAccess={handleUpdateStoredCollaboratorsAccess}
            open={openAddPermissionsModal}
          />
        </React.Fragment>
      )}
    </Grid>
  );
};

export default PermissionDeveloperItemCollaboratorsTab;
