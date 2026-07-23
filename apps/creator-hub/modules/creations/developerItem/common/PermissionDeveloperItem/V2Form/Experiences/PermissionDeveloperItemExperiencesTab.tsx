import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { Grid } from '@rbx/ui';
import type { TUser } from '@modules/authentication/types';
import type { DeveloperItemDetails } from '../../../types';
import PermissionEmptyState from '../Shared/PermissionEmptyState';
import type { PermissionToastMessage, SharedSubjectDetails } from '../Shared/types';
import { PermissionAccessLevel, PermissionTab } from '../Shared/types';
import useAssetPermissions from '../Shared/useAssetPermissions';
import AddExperiencesModal from './AddModal/AddExperiencesModal';
import usePermissionDeveloperItemExperiencesTabStyles from './PermissionDeveloperItemExperiencesTab.styles';

export type PermissionDeveloperItemExperiencesTabProps = {
  developerItemDetails: DeveloperItemDetails;
  user: TUser;
  handleShowToastMessage: (messages: PermissionToastMessage[]) => void;
};

const PermissionDeveloperItemExperiencesTab: FunctionComponent<
  React.PropsWithChildren<PermissionDeveloperItemExperiencesTabProps>
> = ({ developerItemDetails, user, handleShowToastMessage }) => {
  const {
    classes: { container },
  } = usePermissionDeveloperItemExperiencesTabStyles();
  const { validateProposedExperiences, submitProposedExperienceAccess } = useAssetPermissions(
    developerItemDetails,
    user,
  );

  const [proposedExperiences, setProposedExperiences] = useState<SharedSubjectDetails[]>([]);
  const [openAddPermissionsModal, setOpenAddPermissionsModal] = useState(false);
  const [isAddingProposedExperiencesLoading, setIsAddingProposedExperiencesLoading] =
    useState<boolean>(false);
  const [proposedExperienceErrors, setProposedExperienceErrors] = useState<string[]>([]);

  const handleOpenAddPermissions = useCallback(() => {
    setOpenAddPermissionsModal(true);
  }, []);

  const handleSubmitProposedExperienceAccess = useCallback(async () => {
    const proposedExperiencesWithoutExistingAccess = proposedExperiences.filter(
      (experience) => experience.storedAccessLevel === PermissionAccessLevel.NONE,
    );

    if (proposedExperiencesWithoutExistingAccess.length > 0) {
      const { toastMessage } = await submitProposedExperienceAccess(
        proposedExperiencesWithoutExistingAccess,
      );
      handleShowToastMessage([toastMessage]);
    }

    setOpenAddPermissionsModal(false);
    setProposedExperienceErrors([]);
    setProposedExperiences([]);
  }, [handleShowToastMessage, proposedExperiences, submitProposedExperienceAccess]);

  const handleProposeExperiences = useCallback(
    async (search: string) => {
      setIsAddingProposedExperiencesLoading(true);
      const { validProposedExperiences, errors } = await validateProposedExperiences(
        search,
        proposedExperiences,
      );
      setProposedExperienceErrors(errors);
      setProposedExperiences(validProposedExperiences);
      setIsAddingProposedExperiencesLoading(false);
    },
    [proposedExperiences, validateProposedExperiences],
  );

  const handleRemoveProposedExperience = useCallback((experience: SharedSubjectDetails) => {
    setProposedExperiences((prevProposedExperiences) =>
      prevProposedExperiences.filter(
        (prevExperience) => prevExperience.subjectId !== experience.subjectId,
      ),
    );
  }, []);

  return (
    <Grid container data-testid='experiences-permission-tab' classes={{ root: container }}>
      {/* The Experiences permission tab will always show the empty state */}
      {/* Unlike with Collaborators, existing Experience permissions will not be displayed */}
      <PermissionEmptyState
        handleOpenAddPermissions={handleOpenAddPermissions}
        permissionTab={PermissionTab.EXPERIENCES}
      />
      <AddExperiencesModal
        open={openAddPermissionsModal}
        proposedExperiences={proposedExperiences}
        proposedExperienceErrors={proposedExperienceErrors}
        isAddingProposedExperiencesLoading={isAddingProposedExperiencesLoading}
        handleProposeExperiences={handleProposeExperiences}
        handleRemoveProposedExperience={handleRemoveProposedExperience}
        handleSubmitProposedExperienceAccess={handleSubmitProposedExperienceAccess}
      />
    </Grid>
  );
};

export default PermissionDeveloperItemExperiencesTab;
