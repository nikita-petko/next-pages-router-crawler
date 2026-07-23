import { FunctionComponent, useState, useCallback, useContext, useEffect, useMemo } from 'react';
import { Button, FormHelperText, Grid, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Flex } from '@modules/miscellaneous/common/components';
import { useAuthentication } from '@modules/authentication/providers';
import { Creator, CreatorType, PageLoading } from '@modules/miscellaneous/common';
import { getDauLicenseLabelFromEnum } from '@modules/ip/license-manager/utils/dauEnum';
import { getMaturityRatingLabel } from '@modules/ip/license-manager/utils/maturityRating';
import {
  LicenseManagerImpressionEvent,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';
import { LicenseResponse } from '@rbx/clients/contentLicensingApi/v1';
import { useGetUsersGroupRolesV2 } from '../hooks/useGetGroupsDetails';
import ExperienceSelector from './ExperienceSelector';
import CreatorSelect from './CreatorSelect';
import SelectedExperienceContext from '../context/SelectedExperienceContext';
import useApplyToLicenseContainerStyles from '../containers/ApplyToLicenseContainer.styles';
import { GROUP_OWNER_ROLESET_RANK } from '../utils/constants';

interface SelectExperienceStepProps {
  onNext: () => void;
  onCancel: () => void;
  license: LicenseResponse;
}

/** A component that displays a step in the request license flow where the user selects an experience to apply with. */
const SelectExperienceStep: FunctionComponent<SelectExperienceStepProps> = ({
  onNext,
  onCancel,
  license,
}) => {
  const { translate } = useTranslation();
  const { classes } = useApplyToLicenseContainerStyles();
  const { selectedExperienceId, setSelectedExperienceId } = useContext(SelectedExperienceContext);
  const { user: authenticatedUser } = useAuthentication();
  const { data: groupMemberships, isPending: isGroupsPending } = useGetUsersGroupRolesV2({
    userId: authenticatedUser?.id,
  });

  const { logOnce } = useLicenseManagerLoggerLogOnce();
  logOnce(LicenseManagerImpressionEvent.SelectExperienceStepImpressionEvent);

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentCreator, setCurrentCreator] = useState<Creator>({
    creatorId: authenticatedUser?.id,
    creatorName: authenticatedUser?.name,
    creatorType: CreatorType.User,
  });

  const ownedGroups = useMemo(() => {
    const filteredGroups =
      groupMemberships?.data?.filter(
        (groupData) => groupData.role?.rank === GROUP_OWNER_ROLESET_RANK,
      ) ?? [];
    return filteredGroups.map((groupData) => ({
      id: groupData.group?.id ?? 0,
      name: groupData.group?.name ?? '',
      roleSetName: groupData.role?.name ?? '',
      createdAt: new Date(0), // Adding this field to satisfy the Group type
    }));
  }, [groupMemberships]);

  const onClickNext = useCallback(() => {
    if (selectedExperienceId === null) {
      setErrorMessage(translate('Label.ErrorExperienceNotSelected'));
      return;
    }
    onNext();
  }, [selectedExperienceId, onNext, translate]);

  const onSelectCreator = useCallback(
    (creator: Creator) => {
      if (setSelectedExperienceId !== null) {
        setSelectedExperienceId(null);
      }
      setCurrentCreator(creator);
    },
    [setSelectedExperienceId],
  );

  useEffect(() => {
    if (selectedExperienceId !== null) {
      setErrorMessage('');
    }
  }, [selectedExperienceId]);

  if (isGroupsPending || !currentCreator.creatorId) {
    return <PageLoading />;
  }

  return (
    <Grid container flexDirection='column' padding={1.5} spacing={1} alignItems='left'>
      <Grid item marginBottom={2}>
        <Typography variant='h6' color='primary'>
          {translate('Description.SelectExperience')}
        </Typography>
      </Grid>
      <Grid item container flexDirection='column'>
        <Grid item>
          <Typography variant='body2' color='secondary'>
            {translate('Label.LicenseNameValue', {
              name: license.name!,
            })}
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant='body2' color='secondary'>
            {translate('Label.MaxMaturityRatingValue', {
              maturity: translate(getMaturityRatingLabel(license.maxAgeRating)),
            })}
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant='body2' color='secondary'>
            {translate('Label.MinAvgDausValue', {
              minDau: translate(getDauLicenseLabelFromEnum(license.dau7DayThreshold)),
            })}
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant='body2' color='secondary'>
            {translate('Label.PublicExperience')}
          </Typography>
        </Grid>
        {errorMessage && (
          <Grid item>
            <FormHelperText error classes={{ root: classes.errorMessageStyle }}>
              {errorMessage}
            </FormHelperText>
          </Grid>
        )}
      </Grid>
      <Grid item container spacing={1.5} justifyContent='flex-end' alignItems='center'>
        <Grid item>
          <CreatorSelect
            authenticatedUser={authenticatedUser}
            groups={ownedGroups}
            currentCreator={currentCreator}
            setCurrentCreator={onSelectCreator}
          />
        </Grid>
      </Grid>
      <Grid item container>
        <ExperienceSelector
          licenseId={license.id!}
          creatorId={currentCreator.creatorId}
          creatorType={currentCreator.creatorType}
          loadPageSize={50}
        />
      </Grid>
      {/* TODO - aquach - remove marginTop once StickyFooter is implemented */}
      <Grid item marginTop={6}>
        <Flex flexDirection='row' gap={10}>
          <Button
            variant='text'
            color='secondary'
            onClick={onCancel}
            data-testid='apply-to-license-step-cancel'>
            {translate('Action.Cancel')}
          </Button>
          <Button
            variant='contained'
            onClick={onClickNext}
            data-testid='apply-to-license-step-next'>
            {translate('Action.Next')}
          </Button>
        </Flex>
      </Grid>
    </Grid>
  );
};

export default SelectExperienceStep;
